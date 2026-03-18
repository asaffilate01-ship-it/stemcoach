import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Invalid authentication");

    // Rate limit: 10 requests per minute per user (admin-only, heavy operation)
    if (!rateLimit(userData.user.id, 10, 60_000)) {
      return new Response(JSON.stringify({ error: "Too many generation requests. Please wait." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", userData.user.id).eq("role", "admin");

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Unauthorized: admin role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, topic, subtopic, curriculum, boards, difficulty, question_type, count = 10 } = await req.json();

    const typeInstructions: Record<string, string> = {
      mcq: "Multiple choice with exactly 4 options and one correct answer.",
      "multi-select": "Multiple choice with 4-6 options where 2-3 are correct. Set allow_multiple_answers to true and list all correct answers in correct_answers array.",
      essay: "Extended written response question. Include command_word, mark_scheme with bullet points, model_answer, and max_marks (4-8).",
      numerical: "Numerical calculation question. The answer should be a specific number with units.",
    };

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert ${subject} question writer for ${curriculum} exams.
Create ${count} HIGH QUALITY, EXAM-ACCURATE questions.
Subject: ${subject}, Topic: ${topic}, Subtopic: ${subtopic}
Difficulty: ${difficulty}/5, Boards: ${boards?.join(", ") || "All"}
Type: ${question_type} - ${typeInstructions[question_type] || typeInstructions.mcq}
CRITICAL: All answers must be FACTUALLY CORRECT.`,
          },
          { role: "user", content: `Generate ${count} ${question_type} questions for ${topic} > ${subtopic} at difficulty ${difficulty}.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_questions",
            description: "Submit the generated questions.",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question_text: { type: "string" },
                      options: { type: "array", items: { type: "string" } },
                      correct_answer: { type: "string" },
                      correct_answers: { type: "array", items: { type: "string" } },
                      allow_multiple_answers: { type: "boolean" },
                      explanation: { type: "string" },
                      worked_solution: { type: "string" },
                      tuition_tips: { type: "array", items: { type: "string" } },
                      exam_tip: { type: "string" },
                      formula: { type: "string" },
                      points: { type: "number" },
                      mark_scheme: { type: "string" },
                      model_answer: { type: "string" },
                      max_marks: { type: "number" },
                      command_word: { type: "string" },
                    },
                    required: ["question_text", "correct_answer", "explanation", "worked_solution", "tuition_tips", "exam_tip", "points"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["questions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_questions" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
      if (aiResponse.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`AI generation failed (${aiResponse.status})`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const generated = toolCall ? JSON.parse(toolCall.function.arguments) : { questions: [] };

    if (!generated.questions || generated.questions.length === 0) {
      return new Response(JSON.stringify({ error: "No questions generated", inserted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = generated.questions.map((q: any) => ({
      subject, topic, subtopic, curriculum,
      boards: boards || [], difficulty, question_type,
      question_text: q.question_text,
      options: q.options ? JSON.stringify(q.options) : null,
      correct_answer: q.correct_answer || '',
      correct_answers: q.correct_answers || [],
      allow_multiple_answers: q.allow_multiple_answers || false,
      explanation: q.explanation || '',
      worked_solution: q.worked_solution || '',
      tuition_tips: q.tuition_tips || [],
      exam_tip: q.exam_tip || '',
      formula: q.formula || null,
      points: q.points || 1,
      mark_scheme: q.mark_scheme || null,
      model_answer: q.model_answer || null,
      max_marks: q.max_marks || q.points || 1,
      command_word: q.command_word || null,
    }));

    const { data, error } = await supabase.from("questions").insert(rows).select("id");
    if (error) throw new Error(`Database insert failed: ${error.message}`);

    return new Response(JSON.stringify({
      inserted: data?.length || 0,
      message: `Successfully generated ${data?.length || 0} questions for ${subject} > ${topic}`
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
