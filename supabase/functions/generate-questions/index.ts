import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") || "https://stemcoach.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Detect output language from curriculum
function getLanguageForCurriculum(curriculum: string): { lang: string; instruction: string } {
  if (curriculum?.startsWith("fr-") || curriculum === "uni-fr") {
    return { lang: "fr", instruction: "IMPORTANT: Write ALL content in FRENCH (question_text, options, explanation, worked_solution, tuition_tips, exam_tip, mark_scheme, model_answer — everything must be in French)." };
  }
  if (curriculum?.startsWith("de-") || curriculum === "uni-de") {
    return { lang: "de", instruction: "IMPORTANT: Write ALL content in GERMAN (question_text, options, explanation, worked_solution, tuition_tips, exam_tip, mark_scheme, model_answer — everything must be in German)." };
  }
  return { lang: "en", instruction: "" };
}

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

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new HttpError(500, "Question generation is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new HttpError(401, "Unauthorized");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new HttpError(401, "Unauthorized");

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
      "multi-step": "A multi-stage written problem. Include a detailed mark_scheme, complete model_answer and max_marks (4-10).",
      code: "A code-tracing question with a short code sample, exactly 4 options and one correct output.",
      "data-interpretation": "Supply a compact text table or data series in the question, exactly 4 options and one correct interpretation.",
      "assertion-reason": "Give an assertion and a reason with the four standard truth/link options and one correct answer.",
      "true-false": "A precise statement with options exactly ['True', 'False'] and one correct answer.",
      ordering: "Give 3-6 shuffled step labels in options. correct_answer must contain every label in order joined exactly with ' → '.",
      "short-answer": "A concise recall question whose correct_answer is one unambiguous key term or short phrase; do not provide options. Put harmless spelling or terminology variants in correct_answers.",
    };

    const { instruction: langInstruction } = getLanguageForCurriculum(curriculum);

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
CRITICAL: All answers must be FACTUALLY CORRECT.
${langInstruction}`,
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

    const structurallyValid = generated.questions.filter((q: any) => {
      if (typeof q.question_text !== "string" || q.question_text.trim().length < 12) return false;
      if (typeof q.explanation !== "string" || q.explanation.trim().length < 20) return false;
      if (typeof q.worked_solution !== "string" || q.worked_solution.trim().length < 20) return false;
      if (!Array.isArray(q.tuition_tips) || q.tuition_tips.length === 0) return false;
      if (["mcq", "code", "data-interpretation", "assertion-reason"].includes(question_type)) {
        if (!Array.isArray(q.options) || q.options.length < 3 || new Set(q.options).size !== q.options.length) return false;
        if (!q.options.includes(q.correct_answer)) return false;
      }
      if (question_type === "multi-select") {
        if (!Array.isArray(q.options) || !Array.isArray(q.correct_answers) || q.correct_answers.length < 2) return false;
        if (!q.correct_answers.every((answer: string) => q.options.includes(answer))) return false;
      }
      if (question_type === "true-false") {
        if (JSON.stringify(q.options) !== JSON.stringify(["True", "False"]) || !q.options.includes(q.correct_answer)) return false;
      }
      if (question_type === "ordering") {
        if (!Array.isArray(q.options) || q.options.length < 3 || typeof q.correct_answer !== "string" || !q.correct_answer.includes(" → ")) return false;
        const orderedParts = q.correct_answer.split(" → ");
        if (orderedParts.length !== q.options.length || !orderedParts.every((part: string) => q.options.includes(part))) return false;
      }
      if (question_type === "short-answer" && (typeof q.correct_answer !== "string" || q.correct_answer.trim().length < 2)) return false;
      return true;
    });

    const rows = structurallyValid.map((q: any) => ({
      subject, topic, subtopic, curriculum,
      boards: boards || [], difficulty, question_type,
      question_text: q.question_text,
      options: Array.isArray(q.options) ? q.options : null,
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
      review_status: "needs_review",
      content_origin: "ai-generated",
      specification_version: `${curriculum}:${boards?.join("|") || "all"}:2026-review-required`,
    }));

    const { data, error } = await supabase.from("questions").insert(rows).select("id");
    if (error) throw new Error(`Database insert failed: ${error.message}`);

    return new Response(JSON.stringify({
      inserted: data?.length || 0,
      message: `Generated ${data?.length || 0} draft questions for academic review before publication`
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-questions error:", e);
    const status = e instanceof HttpError ? e.status : 500;
    const message = e instanceof HttpError ? e.message : "Unable to generate questions";
    return new Response(JSON.stringify({ error: message }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
