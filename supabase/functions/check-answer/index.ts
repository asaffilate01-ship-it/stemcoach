import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") || "https://stemcoach.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const FREE_QUESTIONS_PER_SUBJECT = 5;

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function normalize(value: unknown): string {
  return String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function answersMatch(student: unknown, expected: unknown, numerical: boolean): boolean {
  const left = normalize(student);
  const right = normalize(expected);
  if (!left || !right) return false;
  if (!numerical) return left === right;

  const pattern = /^\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s*(.*)$/i;
  const actualMatch = left.match(pattern);
  const targetMatch = right.match(pattern);
  if (!actualMatch || !targetMatch) return left === right;
  const actual = Number(actualMatch[1]);
  const target = Number(targetMatch[1]);
  const tolerance = Math.max(1e-9, Math.abs(target) * 1e-6);
  return Number.isFinite(actual) && Math.abs(actual - target) <= tolerance && normalize(actualMatch[2]) === normalize(targetMatch[2]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new HttpError(401, "Unauthorized");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await anon.auth.getUser();
    if (authError || !user) throw new HttpError(401, "Unauthorized");
    const { data: rateAllowed, error: rateError } = await admin.rpc("consume_answer_rate_limit", {
      _user_id: user.id,
      _max_requests: 120,
      _window_seconds: 60,
    });
    if (rateError) throw new HttpError(503, "Answer service is not ready");
    if (!rateAllowed) throw new HttpError(429, "Too many submissions. Please wait a moment.");

    const body = await req.json();
    const questionId = typeof body.question_id === "string" ? body.question_id : "";
    const assignmentId = typeof body.assignment_id === "string" ? body.assignment_id : "";
    const answers = Array.isArray(body.answers) ? body.answers.slice(0, 10) : [];
    const answer = typeof body.answer === "string" ? body.answer.slice(0, 2_000) : "";
    if (!/^[0-9a-f-]{36}$/i.test(questionId)) throw new HttpError(400, "A valid question_id is required");
    if (assignmentId && !/^[0-9a-f-]{36}$/i.test(assignmentId)) throw new HttpError(400, "A valid assignment_id is required");

    let assignmentSubmissionId = "";
    if (assignmentId) {
      const { data: assignmentQuestion } = await admin.from("assignment_questions")
        .select("assignment_id").eq("assignment_id", assignmentId).eq("question_id", questionId).maybeSingle();
      if (!assignmentQuestion) throw new HttpError(403, "Question is not part of this assignment");

      const { data: assignment } = await admin.from("assignments").select("class_id").eq("id", assignmentId).maybeSingle();
      if (!assignment) throw new HttpError(404, "Assignment not found");
      const { data: membership } = await admin.from("class_members").select("id")
        .eq("class_id", assignment.class_id).eq("user_id", user.id).maybeSingle();
      if (!membership) throw new HttpError(403, "Learner is not enrolled in this class");

      const { data: submission } = await admin.from("assignment_submissions").select("id, completed_at")
        .eq("assignment_id", assignmentId).eq("student_id", user.id).maybeSingle();
      if (submission?.completed_at) throw new HttpError(409, "Assignment is already complete");
      assignmentSubmissionId = submission?.id || "";
      if (assignmentSubmissionId) {
        const { data: existingAnswer } = await admin.from("assignment_answers").select("id")
          .eq("submission_id", assignmentSubmissionId).eq("question_id", questionId).maybeSingle();
        if (existingAnswer) throw new HttpError(409, "Question has already been answered");
      }
    }

    const { data: question, error: questionError } = await admin.from("questions").select("*")
      .eq("id", questionId).eq("review_status", "published").single();
    if (questionError || !question) throw new HttpError(404, "Published question not found");

    let quota: { total_questions: number; used_questions: number; subjects: string[] | null } | null = null;
    if (!assignmentId) {
      const quotaResult = await admin.from("user_quotas").select("total_questions, used_questions, subjects")
        .eq("user_id", user.id).maybeSingle();
      quota = quotaResult.data;
      if (quota?.total_questions > 0) {
        if (quota.used_questions >= quota.total_questions) throw new HttpError(403, "Question allowance exhausted");
        if (quota.subjects?.length && !quota.subjects.includes(question.subject)) throw new HttpError(403, "Subject is not included in your plan");
      } else {
        const { count, error: countError } = await admin.from("attempts")
          .select("id, questions!inner(subject)", { count: "exact", head: true })
          .eq("user_id", user.id).eq("questions.subject", question.subject);
        if (countError) throw countError;
        if ((count || 0) >= FREE_QUESTIONS_PER_SUBJECT) throw new HttpError(403, "Free question allowance exhausted for this subject");
      }
    }

    const isMulti = question.allow_multiple_answers || question.question_type === "multi-select";
    let correct = false;
    let submittedAnswer = answer;
    if (isMulti) {
      if (!answers.length) throw new HttpError(400, "At least one answer is required");
      const expected = (question.correct_answers?.length ? question.correct_answers : [question.correct_answer]).map(normalize);
      const submitted = answers.map(normalize);
      correct = new Set(expected).size === new Set(submitted).size && expected.every((item: string) => submitted.includes(item));
      submittedAnswer = answers.map(String).join(", ").slice(0, 2_000);
    } else {
      if (!answer.trim()) throw new HttpError(400, "An answer is required");
      const acceptedAnswers = [question.correct_answer, ...(question.correct_answers || [])].filter(Boolean);
      correct = acceptedAnswers.some((expected: string) => answersMatch(answer, expected, question.question_type === "numerical"));
    }

    const timeTaken = Number.isFinite(Number(body.time_taken_seconds))
      ? Math.max(0, Math.min(86_400, Math.round(Number(body.time_taken_seconds)))) : null;
    let assignmentProgress: Record<string, unknown> | null = null;
    if (assignmentId) {
      const { data, error: assignmentError } = await admin.rpc("record_assignment_answer", {
        _user_id: user.id,
        _assignment_id: assignmentId,
        _question_id: questionId,
        _submitted_answer: submittedAnswer,
        _correct: correct,
        _time_taken_seconds: timeTaken,
      });
      if (assignmentError) {
        if (assignmentError.code === "23505") throw new HttpError(409, assignmentError.message);
        throw assignmentError;
      }
      assignmentProgress = data;
    } else {
      const { error: attemptError } = await admin.from("attempts").insert({
        user_id: user.id, question_id: questionId, answer: submittedAnswer, correct, time_taken_seconds: timeTaken,
      });
      if (attemptError) throw attemptError;
    }

    const xpGain = correct ? Math.min(200, (question.points || 1) * 10) : Math.min(50, Math.max((question.points || 1) * 2, 5));
    const { data: statsResult, error: statsError } = await admin.rpc("record_answer_stats", {
      _user_id: user.id, _correct: correct, _xp_gain: xpGain,
    });
    if (statsError) {
      if (assignmentId) console.error("assignment stats update error:", statsError.message);
      else throw statsError;
    }
    const { data: masteryResult, error: masteryError } = await admin.rpc("update_learner_topic_mastery", {
      _user_id: user.id,
      _question_id: questionId,
      _correct: correct,
      _time_taken_seconds: timeTaken,
    });
    if (masteryError) console.error("mastery update error:", masteryError.message);
    if (!assignmentId && quota?.total_questions > 0) {
      const { error } = await admin.rpc("increment_used_questions", { _user_id: user.id });
      if (error) throw error;
    }

    const { data: allBadges } = await admin.from("badges").select("id, name, icon, description");
    const newBadges: Array<Record<string, unknown>> = [];
    for (const badge of allBadges || []) {
      const { data: awarded } = await admin.rpc("award_badge", { _user_id: user.id, _badge_id: badge.id });
      if (awarded) newBadges.push(badge);
    }

    return json({
      correct, xp_gained: xpGain, stats: statsResult, mastery: masteryResult || null, new_badges: newBadges,
      assignment_progress: assignmentProgress,
      correct_answer: question.correct_answer, correct_answers: question.correct_answers,
      explanation: question.explanation, worked_solution: question.worked_solution,
      exam_tip: question.exam_tip, tuition_tips: question.tuition_tips,
      mark_scheme: question.mark_scheme, model_answer: question.model_answer,
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 400;
    const message = error instanceof Error ? error.message : "Unable to check answer";
    console.error("check-answer error:", message);
    return json({ error: message }, status);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
