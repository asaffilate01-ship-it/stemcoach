import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map of valid price IDs to their grants for server-side validation
const VALID_PRICES: Record<string, { questions: number; mock_exams: number; pack: string }> = {
  // Standard pack (Ultimate Pack) — 5,000 questions + 20 mock exams
  "price_1TCNddFFogsDQVs4QyDkGoa6": { questions: 5000, mock_exams: 20, pack: "standard" }, // GBP
  "price_1TCYoCFFogsDQVs4n5EaIpC4": { questions: 5000, mock_exams: 20, pack: "standard" }, // USD
  "price_1TCYoDFFogsDQVs4a7IAliJs": { questions: 5000, mock_exams: 20, pack: "standard" }, // AED
  "price_1TCYoEFFogsDQVs43ZduOOov": { questions: 5000, mock_exams: 20, pack: "standard" }, // INR
  "price_1TCYoEFFogsDQVs45swS26PC": { questions: 5000, mock_exams: 20, pack: "standard" }, // PKR
  "price_1TCxysFFogsDQVs4yklywQ3W": { questions: 5000, mock_exams: 20, pack: "standard" }, // AUD
  "price_1TCxyuFFogsDQVs4tS6qul6W": { questions: 5000, mock_exams: 20, pack: "standard" }, // NZD
  "price_1TCxywFFogsDQVs4rI3DVCmN": { questions: 5000, mock_exams: 20, pack: "standard" }, // CAD
  "price_1TCxyyFFogsDQVs43c1p47T9": { questions: 5000, mock_exams: 20, pack: "standard" }, // BDT
  "price_1TCxyzFFogsDQVs4r94WHEqY": { questions: 5000, mock_exams: 20, pack: "standard" }, // LKR
  "price_fr_standard": { questions: 5000, mock_exams: 20, pack: "standard" }, // EUR (France)
  "price_ph_standard": { questions: 5000, mock_exams: 20, pack: "standard" }, // PHP (Philippines)
  // Top-up pack — 1,000 questions + 5 mock exams
  "price_1TCNdeFFogsDQVs4WutIKPQw": { questions: 1000, mock_exams: 5, pack: "topup" }, // GBP
  "price_1TCZCNFFogsDQVs4dhoer5AL": { questions: 1000, mock_exams: 5, pack: "topup" }, // USD
  "price_1TCZCRFFogsDQVs4vHB63taY": { questions: 1000, mock_exams: 5, pack: "topup" }, // AED
  "price_1TCZCSFFogsDQVs4eBhjzG9k": { questions: 1000, mock_exams: 5, pack: "topup" }, // INR
  "price_1TCZCSFFogsDQVs4hueexI5c": { questions: 1000, mock_exams: 5, pack: "topup" }, // PKR
  "price_1TCxytFFogsDQVs4bGUZPFnj": { questions: 1000, mock_exams: 5, pack: "topup" }, // AUD
  "price_1TCxyvFFogsDQVs4D3w5jslB": { questions: 1000, mock_exams: 5, pack: "topup" }, // NZD
  "price_1TCxyyFFogsDQVs4XlzjR3xR": { questions: 1000, mock_exams: 5, pack: "topup" }, // CAD
  "price_1TCxyyFFogsDQVs4AemajlYo": { questions: 1000, mock_exams: 5, pack: "topup" }, // BDT
  "price_1TCxz0FFogsDQVs4bwezp7QL": { questions: 1000, mock_exams: 5, pack: "topup" }, // LKR
  "price_fr_topup": { questions: 1000, mock_exams: 5, pack: "topup" }, // EUR (France)
  "price_ph_topup": { questions: 1000, mock_exams: 5, pack: "topup" }, // PHP (Philippines)
};

function currencyToRegion(currency: string | null): string {
  switch (currency?.toLowerCase()) {
    case "gbp": return "uk";
    case "usd": return "us";
    case "aed": return "ae";
    case "inr": return "in";
    case "pkr": return "pk";
    case "aud": return "au";
    case "nzd": return "nz";
    case "cad": return "ca";
    case "bdt": return "bd";
    case "lkr": return "lk";
    case "eur": return "fr";
    case "php": return "ph";
    default: return "uk";
  }
}

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

    const { data: existingPurchases } = await supabaseClient
      .from("purchases")
      .select("stripe_session_id")
      .eq("user_id", user.id);

    const existingIds = new Set((existingPurchases || []).map((p: any) => p.stripe_session_id));
    let totalNewQuestions = 0;
    let totalNewMockExams = 0;

    for (const session of sessions.data) {
      if (existingIds.has(session.id)) continue;
      if (session.payment_status !== "paid") continue;

      let questionsGranted = 0;
      let mockExamsGranted = 0;
      let packType = "standard";
      const region = currencyToRegion(session.currency);

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
      for (const item of lineItems.data) {
        const priceId = item.price?.id;
        if (priceId && VALID_PRICES[priceId]) {
          const qty = item.quantity || 1;
          questionsGranted += VALID_PRICES[priceId].questions * qty;
          mockExamsGranted += VALID_PRICES[priceId].mock_exams * qty;
          packType = VALID_PRICES[priceId].pack;
        }
      }

      // Fallback for legacy sessions
      if (questionsGranted === 0) {
        const metaQuestions = parseInt(session.metadata?.questions_granted || "0");
        const metaPack = session.metadata?.pack_type || "standard";
        if (metaQuestions === 5000) {
          questionsGranted = 5000;
          mockExamsGranted = 20;
          packType = metaPack;
        } else if (metaQuestions === 1000) {
          questionsGranted = 1000;
          mockExamsGranted = 5;
          packType = metaPack;
        }
      }

      if (questionsGranted > 0) {
        await supabaseClient.from("purchases").insert({
          user_id: user.id,
          stripe_session_id: session.id,
          pack_type: packType,
          questions_granted: questionsGranted,
          amount_paid: session.amount_total || 0,
          currency: session.currency || "gbp",
          region: region,
        });
        totalNewQuestions += questionsGranted;
        totalNewMockExams += mockExamsGranted;
      }
    }

    if (totalNewQuestions > 0) {
      const { data: existing } = await supabaseClient
        .from("user_quotas")
        .select("total_questions, mock_exams_total")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabaseClient
          .from("user_quotas")
          .update({
            total_questions: existing.total_questions + totalNewQuestions,
            mock_exams_total: (existing.mock_exams_total || 0) + totalNewMockExams,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        await supabaseClient
          .from("user_quotas")
          .insert({
            user_id: user.id,
            total_questions: totalNewQuestions,
            mock_exams_total: totalNewMockExams,
          });
      }
    }

    const { data: quota } = await supabaseClient
      .from("user_quotas")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    return new Response(JSON.stringify({
      granted: totalNewQuestions > 0,
      new_questions: totalNewQuestions,
      new_mock_exams: totalNewMockExams,
      quota: quota || { total_questions: 0, used_questions: 0, mock_exams_total: 0, mock_exams_used: 0 },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
