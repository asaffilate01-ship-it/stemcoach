import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUBJECTS = [
  { id: "mathematics", topics: ["Algebra", "Calculus", "Trigonometry", "Statistics", "Geometry", "Vectors", "Matrices", "Differential Equations"] },
  { id: "physics", topics: ["Mechanics", "Electricity", "Waves", "Thermodynamics", "Magnetism", "Nuclear Physics", "Quantum Physics", "Optics"] },
  { id: "chemistry", topics: ["Atomic Structure", "Bonding", "Stoichiometry", "Organic Chemistry", "Thermochemistry", "Kinetics", "Equilibrium", "Electrochemistry"] },
  { id: "biology", topics: ["Cell Biology", "Genetics", "Evolution", "Human Physiology", "Plant Biology", "Ecology", "Biotechnology", "Microbiology"] },
  { id: "computer-science", topics: ["Programming", "Algorithms", "Data Structures", "Databases", "Networking", "Cybersecurity", "Operating Systems", "AI"] },
  { id: "ielts", topics: ["Reading Comprehension", "Writing Task 1", "Writing Task 2", "Listening", "Speaking Part 1", "Speaking Part 2", "Speaking Part 3", "Academic Vocabulary", "Grammar for IELTS"] },
  { id: "celta", topics: ["Language Analysis", "Teaching Methodology", "Classroom Management", "Lesson Planning", "Phonology", "Grammar Teaching", "Skills Teaching", "Error Correction"] },
];

const CURRICULA = [
  { id: "uk-gcse", boards: ["AQA", "Edexcel", "OCR"] },
  { id: "uk-alevel", boards: ["AQA", "Edexcel", "OCR"] },
  { id: "uk-btec", boards: ["Pearson BTEC"] },
  { id: "uk-scottish-nat5", boards: ["SQA"] },
  { id: "uk-scottish-higher", boards: ["SQA"] },
  { id: "uk-igcse", boards: ["Cambridge", "Edexcel International"] },
  { id: "uk-ial", boards: ["Edexcel IAL", "Cambridge"] },
  { id: "uk-olevel", boards: ["Cambridge"] },
  { id: "ib-myp", boards: ["IB MYP"] },
  { id: "ib-dp-sl", boards: ["IB SL"] },
  { id: "ib-dp-hl", boards: ["IB HL"] },
  { id: "us-middle", boards: ["Common Core", "NGSS"] },
  { id: "us-highschool", boards: ["Common Core", "NGSS"] },
  { id: "us-ap", boards: ["College Board AP"] },
  { id: "us-sat", boards: ["College Board SAT"] },
  { id: "us-act", boards: ["ACT"] },
  { id: "india-cbse-10", boards: ["CBSE"] },
  { id: "india-cbse-12", boards: ["CBSE"] },
  { id: "india-icse-10", boards: ["ICSE"] },
  { id: "india-isc-12", boards: ["ISC"] },
  { id: "india-state", boards: ["Maharashtra", "Karnataka", "Tamil Nadu"] },
  { id: "india-jee", boards: ["JEE Main", "JEE Advanced"] },
  { id: "india-neet", boards: ["NEET UG"] },
  { id: "india-olympiad", boards: ["NSEP", "RMO"] },
  { id: "pakistan-matric", boards: ["Punjab Board", "Federal Board"] },
  { id: "pakistan-fsc", boards: ["Punjab Board", "Federal Board"] },
  { id: "pakistan-olevel", boards: ["Cambridge"] },
  { id: "pakistan-alevel", boards: ["Cambridge", "Edexcel IAL"] },
  { id: "pakistan-ecat-mdcat", boards: ["ECAT", "MDCAT"] },
  { id: "ielts-academic", boards: ["British Council", "IDP"] },
  { id: "ielts-general", boards: ["British Council", "IDP"] },
  { id: "celta", boards: ["Cambridge CELTA"] },
];

const QUESTION_TYPES = ["mcq", "multi-select", "essay", "numerical"];
const DIFFICULTIES = [1, 2, 3, 4, 5];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const action = body.action || "process";

    if (action === "seed") {
      console.log("[BATCH] Seeding generation queue...");

      const { count: existingCount } = await supabase
        .from("generation_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if ((existingCount || 0) > 1000) {
        return new Response(JSON.stringify({ message: "Queue already has pending items", pending: existingCount }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const rows: any[] = [];
      for (const subject of SUBJECTS) {
        for (const topic of subject.topics) {
          for (const curr of CURRICULA) {
            for (const qType of QUESTION_TYPES) {
              for (const diff of DIFFICULTIES) {
                const count = qType === "essay" ? 5 : qType === "numerical" ? 10 : 15;
                rows.push({
                  subject: subject.id, topic, subtopic: topic,
                  curriculum: curr.id, boards: curr.boards,
                  difficulty: diff, question_type: qType,
                  count, status: "pending",
                });
              }
            }
          }
        }
      }

      let inserted = 0;
      for (let i = 0; i < rows.length; i += 500) {
        const batch = rows.slice(i, i + 500);
        const { error } = await supabase.from("generation_queue").insert(batch);
        if (error) console.error("[BATCH] Insert error:", error.message);
        else inserted += batch.length;
      }

      const pendingCount = rows.length;
      const estimatedQuestions = rows.reduce((sum, r) => sum + r.count, 0);

      return new Response(JSON.stringify({
        message: "Queue seeded", total_combinations: rows.length,
        pending: pendingCount, estimated_questions: estimatedQuestions,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "status") {
      const [pending, done, total] = await Promise.all([
        supabase.from("generation_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("generation_queue").select("*", { count: "exact", head: true }).eq("status", "done"),
        supabase.from("questions").select("*", { count: "exact", head: true }),
      ]);

      return new Response(JSON.stringify({
        queue_pending: pending.count || 0, queue_done: done.count || 0,
        total_questions: total.count || 0, target: 1000000,
        progress_pct: Math.round(((total.count || 0) / 1000000) * 100 * 10) / 10,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Process: pick next pending items and generate
    const BATCH_SIZE = 3;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { data: pendingItems } = await supabase
      .from("generation_queue").select("*")
      .eq("status", "pending").order("created_at", { ascending: true }).limit(BATCH_SIZE);

    if (!pendingItems || pendingItems.length === 0) {
      return new Response(JSON.stringify({ message: "No pending items in queue" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalInserted = 0;
    const results: any[] = [];

    for (const item of pendingItems) {
      await supabase.from("generation_queue").update({ status: "processing" }).eq("id", item.id);

      try {
        const typeInstructions: Record<string, string> = {
          mcq: "Multiple choice with exactly 4 options and one correct answer.",
          "multi-select": "Multiple choice with 4-6 options where 2-3 are correct. Set allow_multiple_answers to true.",
          essay: "Extended written response. Include command_word, mark_scheme, model_answer, max_marks (4-8).",
          numerical: "Numerical calculation question. Answer should be a specific number with units.",
        };

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `You are an expert ${item.subject} question writer for ${item.curriculum} exams.
Create ${item.count} HIGH QUALITY questions. Subject: ${item.subject}, Topic: ${item.topic}
Difficulty: ${item.difficulty}/5, Boards: ${item.boards.join(", ")}
Type: ${item.question_type} - ${typeInstructions[item.question_type] || typeInstructions.mcq}
CRITICAL: All answers must be FACTUALLY CORRECT.`,
              },
              { role: "user", content: `Generate ${item.count} ${item.question_type} questions for ${item.topic} at difficulty ${item.difficulty}.` },
            ],
            tools: [{
              type: "function",
              function: {
                name: "submit_questions",
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
          console.error(`[BATCH] AI error for ${item.subject}/${item.topic}: ${aiResponse.status} ${errText}`);
          if (aiResponse.status === 429) {
            await supabase.from("generation_queue").update({ status: "pending" }).eq("id", item.id);
            results.push({ id: item.id, status: "rate_limited" });
            break;
          }
          await supabase.from("generation_queue").update({ status: "failed" }).eq("id", item.id);
          results.push({ id: item.id, status: "ai_error", error: aiResponse.status });
          continue;
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        const generated = toolCall ? JSON.parse(toolCall.function.arguments) : { questions: [] };

        if (!generated.questions || generated.questions.length === 0) {
          await supabase.from("generation_queue").update({ status: "failed" }).eq("id", item.id);
          results.push({ id: item.id, status: "no_questions" });
          continue;
        }

        const rows = generated.questions.map((q: any) => ({
          subject: item.subject, topic: item.topic, subtopic: item.subtopic,
          curriculum: item.curriculum, boards: item.boards,
          difficulty: item.difficulty, question_type: item.question_type,
          question_text: q.question_text,
          options: q.options ? JSON.stringify(q.options) : null,
          correct_answer: q.correct_answer || "",
          correct_answers: q.correct_answers || [],
          allow_multiple_answers: q.allow_multiple_answers || false,
          explanation: q.explanation || "",
          worked_solution: q.worked_solution || "",
          tuition_tips: q.tuition_tips || [],
          exam_tip: q.exam_tip || "",
          formula: q.formula || null,
          points: q.points || 1,
          mark_scheme: q.mark_scheme || null,
          model_answer: q.model_answer || null,
          max_marks: q.max_marks || q.points || 1,
          command_word: q.command_word || null,
        }));

        const { data: inserted, error: insertError } = await supabase.from("questions").insert(rows).select("id");
        if (insertError) {
          console.error(`[BATCH] DB insert error: ${insertError.message}`);
          await supabase.from("generation_queue").update({ status: "failed" }).eq("id", item.id);
          results.push({ id: item.id, status: "db_error", error: insertError.message });
          continue;
        }

        const count = inserted?.length || 0;
        totalInserted += count;
        await supabase.from("generation_queue").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", item.id);
        results.push({ id: item.id, status: "done", inserted: count, subject: item.subject, topic: item.topic });

        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        console.error(`[BATCH] Error processing ${item.id}:`, e);
        await supabase.from("generation_queue").update({ status: "failed" }).eq("id", item.id);
        results.push({ id: item.id, status: "error", error: (e as Error).message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, inserted: totalInserted, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[BATCH] Fatal error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
