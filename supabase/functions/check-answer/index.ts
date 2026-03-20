import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(token);

    if (authError || !user) throw new Error("Unauthorized");

    const { question_id, answer, answers, time_taken_seconds } = await req.json();
    if (!question_id) throw new Error("question_id required");

    // Fetch full question with answers (server-side only)
    const { data: question, error: qErr } = await supabase
      .from("questions")
      .select("*")
      .eq("id", question_id)
      .single();

    if (qErr || !question) throw new Error("Question not found");

    // Determine correctness
    let correct = false;
    const isMulti = question.allow_multiple_answers || question.question_type === "multi-select";

    if (isMulti && answers) {
      const correctSet = new Set(question.correct_answers?.length ? question.correct_answers : [question.correct_answer]);
      const studentSet = new Set(answers);
      correct = correctSet.size === studentSet.size && [...correctSet].every((a: string) => studentSet.has(a));
    } else if (answer) {
      correct = answer === question.correct_answer;
    }

    // Record attempt
    await supabase.from("attempts").insert({
      user_id: user.id,
      question_id,
      answer: answer || (answers || []).join(", "),
      correct,
      time_taken_seconds: time_taken_seconds || null,
    });

    // Update stats via the secure function
    const xpGain = correct ? (question.points || 1) * 10 : Math.max((question.points || 1) * 2, 5);
    const { data: statsResult } = await supabase.rpc("record_answer_stats", {
      _user_id: user.id,
      _correct: correct,
      _xp_gain: xpGain,
    });

    // Increment used questions quota
    await supabase.rpc("increment_used_questions", { _user_id: user.id });

    // Check badges
    const { data: allBadges } = await supabase.from("badges").select("*");
    const newBadges: any[] = [];
    for (const badge of allBadges || []) {
      const { data: awarded } = await supabase.rpc("award_badge", {
        _user_id: user.id,
        _badge_id: badge.id,
      });
      if (awarded) {
        newBadges.push({ id: badge.id, name: badge.name, icon: badge.icon, description: badge.description });
      }
    }

    return new Response(JSON.stringify({
      correct,
      xp_gained: xpGain,
      stats: statsResult,
      new_badges: newBadges,
      // Send answer data back AFTER they've submitted
      correct_answer: question.correct_answer,
      correct_answers: question.correct_answers,
      explanation: question.explanation,
      worked_solution: question.worked_solution,
      exam_tip: question.exam_tip,
      tuition_tips: question.tuition_tips,
      mark_scheme: question.mark_scheme,
      model_answer: question.model_answer,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("check-answer error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
