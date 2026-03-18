import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");
    const user = userData.user;

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find completed checkout sessions for this user
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ granted: false, message: "No purchases found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sessions = await stripe.checkout.sessions.list({
      customer: customers.data[0].id,
      status: "complete",
      limit: 50,
    });

    // Check which sessions haven't been recorded yet
    const { data: existingPurchases } = await supabaseClient
      .from("purchases")
      .select("stripe_session_id")
      .eq("user_id", user.id);

    const existingIds = new Set((existingPurchases || []).map((p: any) => p.stripe_session_id));
    let totalNewQuestions = 0;

    for (const session of sessions.data) {
      if (existingIds.has(session.id)) continue;
      if (session.payment_status !== "paid") continue;

      const questionsGranted = parseInt(session.metadata?.questions_granted || "0");
      const packType = session.metadata?.pack_type || "standard";

      if (questionsGranted > 0) {
        await supabaseClient.from("purchases").insert({
          user_id: user.id,
          stripe_session_id: session.id,
          pack_type: packType,
          questions_granted: questionsGranted,
          amount_paid: session.amount_total || 0,
          currency: session.currency || "gbp",
        });
        totalNewQuestions += questionsGranted;
      }
    }

    if (totalNewQuestions > 0) {
      // Upsert user_quotas
      const { data: existing } = await supabaseClient
        .from("user_quotas")
        .select("total_questions")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabaseClient
          .from("user_quotas")
          .update({
            total_questions: existing.total_questions + totalNewQuestions,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        await supabaseClient
          .from("user_quotas")
          .insert({
            user_id: user.id,
            total_questions: totalNewQuestions,
          });
      }
    }

    // Get current quota
    const { data: quota } = await supabaseClient
      .from("user_quotas")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    return new Response(JSON.stringify({
      granted: totalNewQuestions > 0,
      new_questions: totalNewQuestions,
      quota: quota || { total_questions: 0, used_questions: 0 },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
