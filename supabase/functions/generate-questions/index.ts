import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { subject, topic, subtopic, curriculum, boards, difficulty, question_type, count = 10 } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate questions via AI
    const aiResponse = await fetch(`${SUPABASE_URL}/functions/v1/ai-tutor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        action: "generate-questions",
        subject, topic, subtopic, curriculum, boards, difficulty, question_type, count,
      }),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      throw new Error(`AI generation failed: ${err}`);
    }

    const { questions } = await aiResponse.json();
    
    if (!questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: "No questions generated", inserted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert into database
    const rows = questions.map((q: any) => ({
      subject: q.subject,
      topic: q.topic,
      subtopic: q.subtopic,
      curriculum: q.curriculum,
      boards: q.boards || [],
      difficulty: q.difficulty,
      question_type: q.question_type,
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
    
    if (error) {
      console.error("Insert error:", error);
      throw new Error(`Database insert failed: ${error.message}`);
    }

    return new Response(JSON.stringify({ 
      inserted: data?.length || 0,
      message: `Successfully generated and inserted ${data?.length || 0} questions for ${subject} > ${topic} > ${subtopic}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
