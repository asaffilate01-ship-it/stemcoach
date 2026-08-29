import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "Invalid authentication" }, 401);
    const userId = userData.user.id;

    const body = await req.json();
    const challengeId: string = body?.challenge_id;
    const timeTaken = Number(body?.time_taken_seconds ?? 0);
    const answers: Array<{ question_id: string; answer: string }> = Array.isArray(body?.answers) ? body.answers : [];

    if (!challengeId || answers.length === 0 || answers.length > 50) {
      return json({ error: "challenge_id and answers are required" }, 400);
    }

    const { data: challenge } = await admin
      .from("daily_challenges")
      .select("id, xp_reward, question_count, date, subject, curriculum")
      .eq("id", challengeId)
      .maybeSingle();
    if (!challenge) return json({ error: "Unknown challenge" }, 400);
    const uniqueIds = new Set(answers.map((answer) => answer.question_id));
    if (answers.length !== challenge.question_count || uniqueIds.size !== challenge.question_count) {
      return json({ error: `Exactly ${challenge.question_count} unique answers are required` }, 400);
    }

    const { data: existing } = await admin
      .from("daily_challenge_attempts")
      .select("id")
      .eq("challenge_id", challengeId)
      .eq("user_id", userId)
      .maybeSingle();

    const ids = answers.map((a) => a.question_id);
    const { data: questions } = await admin
      .from("questions")
      .select("id, correct_answer, explanation")
      .in("id", ids)
      .eq("review_status", "published")
      .eq("subject", challenge.subject)
      .eq("curriculum", challenge.curriculum);
    if ((questions || []).length !== challenge.question_count) return json({ error: "Challenge questions do not match this challenge" }, 400);

    const byId = new Map((questions || []).map((q) => [q.id, q]));
    const results = answers.map((a) => {
      const q = byId.get(a.question_id);
      return {
        question_id: a.question_id,
        correct: !!q && a.answer === q.correct_answer,
        correct_answer: q?.correct_answer ?? null,
        explanation: q?.explanation ?? null,
      };
    });

    const score = results.filter((r) => r.correct).length;
    const total = results.length;
    const safeTime = Math.max(0, Math.min(Math.round(timeTaken) || 0, 86400));

    let alreadyCompleted = true;
    if (!existing) {
      alreadyCompleted = false;
      await admin.from("daily_challenge_attempts").insert({
        challenge_id: challengeId,
        user_id: userId,
        score,
        total,
        time_taken_seconds: safeTime,
      });

      // XP for the challenge, capped by the stats function's own limit.
      const xp = Math.min(Math.round(((challenge.xp_reward || 150) * score) / Math.max(total, 1)), 200);
      if (xp > 0) {
        await admin.rpc("record_answer_stats", { _user_id: userId, _correct: score > total / 2, _xp_gain: xp });
      }
    }

    return json({ score, total, already_completed: alreadyCompleted, results });
  } catch (e) {
    console.error("grade-daily-challenge error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
