import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Submission {
  question_id: string;
  answer: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) throw new Error("Unauthorized");
    const userId = claimsData.claims.sub as string;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const submissions: Submission[] = Array.isArray(body?.submissions) ? body.submissions.slice(0, 100) : [];
    const examName = typeof body?.exam_name === "string" ? body.exam_name.slice(0, 150) : "Mock Exam";
    const subject = typeof body?.subject === "string" ? body.subject.slice(0, 100) : null;

    if (submissions.length === 0) throw new Error("No submissions provided");

    const ids = [...new Set(submissions.map((s) => String(s.question_id)))];
    const { data: questions, error: qErr } = await admin
      .from("questions")
      .select("id, correct_answer, correct_answers, explanation, worked_solution, exam_tip")
      .in("id", ids);
    if (qErr) throw qErr;

    const byId = new Map((questions || []).map((q) => [q.id, q]));

    let score = 0;
    const results = submissions.map((s) => {
      const q = byId.get(String(s.question_id));
      const answer = typeof s.answer === "string" ? s.answer : null;
      const correct = !!q && !!answer && answer === q.correct_answer;
      if (correct) score++;
      return {
        question_id: String(s.question_id),
        answer,
        correct,
        correct_answer: q?.correct_answer ?? null,
        explanation: q?.explanation ?? null,
        worked_solution: q?.worked_solution ?? null,
      };
    });

    const total = submissions.length;
    const percent = total > 0 ? Math.round((score / total) * 100) : 0;

    // Record attempts for answered questions only
    const attempts = results
      .filter((r) => r.answer !== null && byId.has(r.question_id))
      .map((r) => ({
        user_id: userId,
        question_id: r.question_id,
        answer: r.answer as string,
        correct: r.correct,
      }));
    if (attempts.length > 0) {
      await admin.from("attempts").insert(attempts);
    }

    // Consume one mock exam credit
    await admin.rpc("increment_mock_exams_used", { _user_id: userId });

    let certificate_issued = false;
    if (percent >= 60) {
      const { error: certErr } = await admin.rpc("issue_certificate", {
        _user_id: userId,
        _title: `${examName} — ${percent}%`,
        _subject: subject,
        _achievement_type: "mock_exam",
        _score_percent: percent,
      });
      certificate_issued = !certErr;
    }

    return new Response(JSON.stringify({ score, total, percent, results, certificate_issued }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("grade-mock-exam error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: message === "Unauthorized" ? 401 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
