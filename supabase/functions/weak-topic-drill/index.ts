import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limiter
const rateLimits = new Map<string, { count: number; resetAt: number }>();
function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's attempts with question info
    const { data: attempts } = await supabase
      .from("attempts")
      .select("correct, question_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500);

    if (!attempts || attempts.length === 0) {
      return new Response(JSON.stringify({ weak_topics: [], drill_questions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get question details for these attempts
    const questionIds = [...new Set(attempts.map(a => a.question_id))];
    const { data: questions } = await supabase
      .from("questions")
      .select("id, subject, topic, subtopic, difficulty")
      .in("id", questionIds);

    const questionMap: Record<string, any> = {};
    questions?.forEach(q => { questionMap[q.id] = q; });

    // Analyze by topic
    const topicStats: Record<string, { correct: number; total: number; subject: string }> = {};
    attempts.forEach(a => {
      const q = questionMap[a.question_id];
      if (!q) return;
      const key = `${q.subject}::${q.topic}`;
      if (!topicStats[key]) topicStats[key] = { correct: 0, total: 0, subject: q.subject };
      topicStats[key].total++;
      if (a.correct) topicStats[key].correct++;
    });

    // Find weak topics (accuracy < 60%, at least 3 attempts)
    const weakTopics = Object.entries(topicStats)
      .filter(([_, s]) => s.total >= 3 && (s.correct / s.total) < 0.6)
      .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
      .slice(0, 5)
      .map(([key, s]) => {
        const [subject, topic] = key.split("::");
        return { subject, topic, accuracy: Math.round((s.correct / s.total) * 100), attempts: s.total };
      });

    if (weakTopics.length === 0) {
      return new Response(JSON.stringify({ weak_topics: [], drill_questions: [], message: "Great job! No weak topics found." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to generate a targeted study plan
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let aiPlan = null;

    if (LOVABLE_API_KEY) {
      const topicSummary = weakTopics.map(t => `${t.subject} - ${t.topic}: ${t.accuracy}% accuracy (${t.attempts} attempts)`).join("\n");

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: "You are a STEM education expert. Provide brief, actionable study advice for weak topics. Return a JSON object with a 'plans' array where each plan has 'topic', 'subject', 'advice' (2-3 sentences), and 'focus_areas' (array of 2-3 specific subtopics to review)."
            },
            { role: "user", content: `Student's weak topics:\n${topicSummary}\n\nProvide targeted study plans.` }
          ],
          tools: [{
            type: "function",
            function: {
              name: "study_plan",
              description: "Return study plans for weak topics",
              parameters: {
                type: "object",
                properties: {
                  plans: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        topic: { type: "string" },
                        subject: { type: "string" },
                        advice: { type: "string" },
                        focus_areas: { type: "array", items: { type: "string" } }
                      },
                      required: ["topic", "subject", "advice", "focus_areas"]
                    }
                  }
                },
                required: ["plans"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "study_plan" } }
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall) {
          aiPlan = JSON.parse(toolCall.function.arguments);
        }
      }
    }

    // Fetch drill questions from weak topics
    const drillQuestions: any[] = [];
    for (const wt of weakTopics.slice(0, 3)) {
      const { data: topicQuestions } = await supabase
        .from("questions")
        .select("id, question_text, subject, topic, subtopic, difficulty, question_type, correct_answer, options, explanation")
        .eq("subject", wt.subject)
        .eq("topic", wt.topic)
        .order("difficulty", { ascending: true })
        .limit(5);

      if (topicQuestions) drillQuestions.push(...topicQuestions);
    }

    return new Response(JSON.stringify({
      weak_topics: weakTopics,
      drill_questions: drillQuestions,
      ai_plan: aiPlan,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weak-topic-drill error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
