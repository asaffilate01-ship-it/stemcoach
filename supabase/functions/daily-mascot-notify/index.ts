import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { requireCronOrAdmin } from "../_shared/gate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Mascot data for notification personalization
const mascotMap: Record<string, { name: string; emoji: string; image: string; cheer: string; nudge: string }> = {
  mathematics: { name: "MathMax", emoji: "🧮", image: "/assets/mathmax.png", cheer: "Your maths skills are adding up! 🎉", nudge: "Numbers are waiting! Let's solve some problems together 🧮" },
  physics: { name: "PhysiX", emoji: "⚡", image: "/assets/physix.png", cheer: "You're an unstoppable force! ⚡", nudge: "Let's get moving with some physics! ⚡" },
  chemistry: { name: "Chemi", emoji: "🧪", image: "/assets/chemi.png", cheer: "You've got perfect chemistry! 🧪", nudge: "Time for a reaction! Come practice chemistry 🧪" },
  biology: { name: "BioBee", emoji: "🐝", image: "/assets/biobee.png", cheer: "You're buzzing through biology! 🐝", nudge: "The hive misses you! Let's get buzzing 🐝" },
  "computer-science": { name: "Codey", emoji: "💻", image: "/assets/codey.png", cheer: "Your code is compiling perfectly! 💻", nudge: "Time to debug some problems! 💻" },
};
const coachStem = { name: "Coach Stem", emoji: "🧑‍🔬", image: "/assets/coach-stem.png", cheer: "The Squad is proud of you! 🌟", nudge: "The whole Squad is waiting for you! Let's study 🚀" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const denied = await requireCronOrAdmin(req, supabase, corsHeaders);
    if (denied) return denied;

    const today = new Date().toISOString().slice(0, 10);
    const todayStart = `${today}T00:00:00.000Z`;

    // Get all users who have been active in the last 14 days
    const { data: activeUsers } = await supabase
      .from("user_stats")
      .select("user_id, streak, xp, total_questions, last_active_date")
      .gte("last_active_date", new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10));

    if (!activeUsers || activeUsers.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let sentCount = 0;

    for (const userStats of activeUsers) {
      // Check if we already notified this user today (type = 'daily_mascot')
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", userStats.user_id)
        .eq("type", "daily_mascot")
        .gte("created_at", todayStart)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Get today's attempts for this user
      const { data: attempts } = await supabase
        .from("attempts")
        .select("id, correct, question_id")
        .eq("user_id", userStats.user_id)
        .gte("created_at", todayStart);

      const questionsToday = attempts?.length || 0;
      const correctToday = attempts?.filter((a) => a.correct).length || 0;
      const accuracy = questionsToday > 0 ? Math.round((correctToday / questionsToday) * 100) : 0;

      // Determine top subject studied today
      let mascot = coachStem;
      if (attempts && attempts.length > 0) {
        const qIds = [...new Set(attempts.map((a) => a.question_id))].slice(0, 20);
        const { data: questions } = await supabase
          .from("questions")
          .select("subject")
          .in("id", qIds);

        if (questions && questions.length > 0) {
          const counts = new Map<string, number>();
          questions.forEach((q) => counts.set(q.subject, (counts.get(q.subject) || 0) + 1));
          const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
          mascot = mascotMap[top] || coachStem;
        }
      }

      let title: string;
      let message: string;

      if (questionsToday === 0) {
        title = `${mascot.emoji} ${mascot.name} misses you!`;
        message = mascot.nudge;
        if (userStats.streak > 0) {
          message += ` Your ${userStats.streak}-day streak is at risk!`;
        }
      } else if (accuracy >= 80) {
        title = `🔥 ${mascot.name} is impressed!`;
        message = `${questionsToday} questions at ${accuracy}% accuracy today! ${mascot.cheer}`;
      } else if (accuracy >= 50) {
        title = `${mascot.emoji} ${mascot.name}: Good effort today!`;
        message = `${correctToday}/${questionsToday} correct (${accuracy}%). Review your mistakes to push even higher! 📈`;
      } else {
        title = `${mascot.emoji} ${mascot.name}: Keep going!`;
        message = `${questionsToday} questions tackled today — that's what counts! Check the worked solutions to improve 🧠`;
      }

      if (userStats.streak > 2 && questionsToday > 0) {
        message += ` 🔥 ${userStats.streak}-day streak!`;
      }

      await supabase.from("notifications").insert({
        user_id: userStats.user_id,
        title,
        message,
        type: "daily_mascot",
        metadata: { mascot_name: mascot.name, mascot_image: mascot.image, questions_today: questionsToday, accuracy },
      });

      sentCount++;
    }

    return new Response(JSON.stringify({ sent: sentCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
