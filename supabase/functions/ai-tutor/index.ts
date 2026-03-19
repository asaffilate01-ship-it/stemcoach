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

async function verifyAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Unauthorized");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("Invalid authentication");
  return data.user;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await verifyAuth(req);

    // Rate limit: 30 requests per minute per user
    if (!rateLimit(user.id, 30, 60_000)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "30" },
      });
    }

    const { action, ...params } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (action === "grade-essay") {
      return await gradeEssay(params, LOVABLE_API_KEY);
    } else if (action === "generate-questions") {
      return await generateQuestions(params, LOVABLE_API_KEY);
    } else if (action === "explain") {
      return await explainQuestion(params, LOVABLE_API_KEY);
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "Unauthorized" || msg === "Invalid authentication" ? 401 : 500;
    console.error("ai-tutor error:", e);
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function callAI(messages: any[], LOVABLE_API_KEY: string, tools?: any[], tool_choice?: any) {
  const body: any = {
    model: "google/gemini-3-flash-preview",
    messages,
  };
  if (tools) {
    body.tools = tools;
    body.tool_choice = tool_choice;
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (response.status === 429) {
    return { error: "Rate limit exceeded. Please try again in a moment.", status: 429 };
  }
  if (response.status === 402) {
    return { error: "AI credits exhausted. Please add funds.", status: 402 };
  }
  if (!response.ok) {
    const t = await response.text();
    console.error("AI error:", response.status, t);
    return { error: "AI service unavailable", status: 500 };
  }

  const data = await response.json();
  return { data };
}

async function gradeEssay(params: any, apiKey: string) {
  const { question_text, student_answer, mark_scheme, model_answer, max_marks, subject, topic } = params;

  if (!question_text || !student_answer) {
    return new Response(JSON.stringify({ error: "question_text and student_answer are required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const systemPrompt = `You are an expert ${subject || "STEM"} examiner marking a student's essay/extended answer. 
You must grade ACCURATELY against the mark scheme. Be fair but rigorous.
Subject: ${subject || "General"}
Topic: ${topic || "General"}

Mark scheme: ${mark_scheme || "Award marks for correct scientific/mathematical content, clear explanation, and proper terminology."}

Model answer for reference: ${model_answer || "Not provided - use your expertise."}

Maximum marks available: ${max_marks || 6}`;

  const tools = [{
    type: "function",
    function: {
      name: "grade_response",
      description: "Grade the student's answer and provide detailed feedback.",
      parameters: {
        type: "object",
        properties: {
          score: { type: "number", description: "Marks awarded out of maximum" },
          max_marks: { type: "number", description: "Maximum marks available" },
          feedback: { type: "string", description: "Detailed feedback on the answer" },
          strengths: { type: "array", items: { type: "string" }, description: "What the student did well" },
          improvements: { type: "array", items: { type: "string" }, description: "Areas for improvement" },
          missing_points: { type: "array", items: { type: "string" }, description: "Key points the student missed" },
          tuition_tip: { type: "string", description: "A coaching tip for this topic" },
          corrected_answer: { type: "string", description: "A model answer showing ideal response" },
        },
        required: ["score", "max_marks", "feedback", "strengths", "improvements", "missing_points", "tuition_tip", "corrected_answer"],
        additionalProperties: false,
      },
    },
  }];

  const result = await callAI(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Question: ${question_text}\n\nStudent's answer:\n${student_answer.slice(0, 5000)}` },
    ],
    apiKey,
    tools,
    { type: "function", function: { name: "grade_response" } }
  );

  if (result.error) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: result.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const toolCall = result.data.choices[0]?.message?.tool_calls?.[0];
  const grading = toolCall ? JSON.parse(toolCall.function.arguments) : null;

  return new Response(JSON.stringify({ grading }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function generateQuestions(params: any, apiKey: string) {
  const { subject, topic, subtopic, curriculum, boards, difficulty, question_type, count = 5 } = params;

  const safeCount = Math.min(Math.max(1, Number(count) || 5), 20);

  const typeInstructions: Record<string, string> = {
    mcq: "Multiple choice with exactly 4 options and one correct answer.",
    "multi-select": "Multiple choice with 4-6 options where 2-3 are correct. Set allow_multiple_answers to true and list all correct answers in correct_answers array.",
    essay: "Extended written response question. Include command_word (explain/evaluate/discuss/compare), mark_scheme with bullet points for marks, model_answer, and max_marks (4-8).",
    numerical: "Numerical calculation question. The answer should be a specific number with units.",
  };

  const systemPrompt = `You are an expert ${subject} question writer for ${curriculum} exams.
Create ${safeCount} HIGH QUALITY, EXAM-ACCURATE questions.
Subject: ${subject}, Topic: ${topic}, Subtopic: ${subtopic}
Difficulty: ${difficulty}/5, Boards: ${boards?.join(", ") || "All"}
Type: ${question_type} - ${typeInstructions[question_type] || typeInstructions.mcq}

CRITICAL: All answers must be FACTUALLY CORRECT. Double-check every answer.
Include detailed tuition tips and exam technique advice with every question.`;

  const tools = [{
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
  }];

  const result = await callAI(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Generate ${safeCount} ${question_type} questions for ${topic} > ${subtopic} at difficulty ${difficulty}.` },
    ],
    apiKey,
    tools,
    { type: "function", function: { name: "submit_questions" } }
  );

  if (result.error) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: result.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const toolCall = result.data.choices[0]?.message?.tool_calls?.[0];
  const generated = toolCall ? JSON.parse(toolCall.function.arguments) : { questions: [] };

  // Attach metadata to each question
  const questions = generated.questions.map((q: any) => ({
    ...q,
    subject,
    topic,
    subtopic,
    curriculum,
    boards: boards || [],
    difficulty,
    question_type,
  }));

  return new Response(JSON.stringify({ questions }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function explainQuestion(params: any, apiKey: string) {
  const { question_text, correct_answer, student_answer, subject, topic, question_id } = params;

  if (!question_text) {
    return new Response(JSON.stringify({ error: "question_text is required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check cache first
  if (question_id) {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    const { data: cached } = await supabase
      .from("coaching_cache")
      .select("response_text")
      .eq("question_id", question_id)
      .eq("action", "explain")
      .maybeSingle();

    if (cached) {
      // Increment hit count in background
      supabase.from("coaching_cache").update({ hit_count: cached.hit_count + 1 } as any).eq("question_id", question_id).eq("action", "explain").then(() => {});
      return new Response(JSON.stringify({ explanation: cached.response_text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const systemPrompt = `You are a friendly, expert ${subject || "STEM"} tutor explaining a concept to a 16-18 year old student.
Be clear, use analogies, and break complex ideas into simple steps. 
Include relevant formulas and exam technique tips.
Topic: ${topic || "General"}`;

  const result = await callAI(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: `I got this question wrong. Please explain it to me step by step.

Question: ${question_text}
Correct answer: ${correct_answer || "Not specified"}
My answer: ${student_answer || "I didn't know"}

Please explain why the correct answer is right and help me understand the concept.` },
    ],
    apiKey
  );

  if (result.error) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: result.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const explanation = result.data.choices[0]?.message?.content || "Unable to generate explanation.";

  // Cache the response for future use
  if (question_id) {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    await supabase.from("coaching_cache").upsert({
      question_id,
      action: "explain",
      response_text: explanation,
    } as any, { onConflict: "question_id,action" }).then(() => {});
  }

  return new Response(JSON.stringify({ explanation }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
