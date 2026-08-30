import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { corsHeadersFor, grantForPrice } from "../_shared/productCatalog.ts";

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const requestBody = await req.json().catch(() => ({})) as { sessionId?: unknown };
    let sessions: Stripe.Checkout.Session[] = [];

    if (typeof requestBody.sessionId === "string" && /^cs_[A-Za-z0-9_]+$/.test(requestBody.sessionId)) {
      sessions = [await stripe.checkout.sessions.retrieve(requestBody.sessionId)];
    } else if (user.email) {
      // Backward-compatible recovery for an older success URL. New checkouts
      // always verify the exact session returned by Stripe.
      const customers = await stripe.customers.list({ email: user.email, limit: 10 });
      for (const customer of customers.data) {
        const customerSessions = await stripe.checkout.sessions.list({
          customer: customer.id,
          status: "complete",
          limit: 50,
        });
        sessions.push(...customerSessions.data);
      }
    }

    if (sessions.length === 0) {
      return new Response(JSON.stringify({ granted: false, message: "No purchases found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalNewQuestions = 0;
    let totalNewMockExams = 0;

    for (const session of sessions) {
      if (session.payment_status !== "paid") continue;
      // A completed payment belongs only to the account that created it. Email
      // matching alone is not a safe ownership boundary.
      if (session.metadata?.user_id !== user.id) continue;

      let questionsGranted = 0;
      let mockExamsGranted = 0;
      let packType: "standard" | "topup" | null = null;
      let region: string | null = null;

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
      for (const item of lineItems.data) {
        const grant = grantForPrice(item.price?.id);
        if (grant) {
          const qty = item.quantity || 1;
          questionsGranted += grant.questions * qty;
          mockExamsGranted += grant.mockExams * qty;
          packType = grant.pack;
          region = grant.region;
        }
      }

      // Unknown or mixed catalogue items never receive STEMCoach quota. The
      // database function inserts the purchase and increments quota in one
      // transaction, returning false when the session was already applied.
      if (questionsGranted > 0 && packType && region) {
        const { data: applied, error: grantError } = await supabaseClient.rpc("grant_verified_purchase", {
          _user_id: user.id,
          _stripe_session_id: session.id,
          _pack_type: packType,
          _questions_granted: questionsGranted,
          _mock_exams_granted: mockExamsGranted,
          _amount_paid: session.amount_total || 0,
          _currency: session.currency || "gbp",
          _region: region,
        });
        if (grantError) throw grantError;
        if (applied) {
          totalNewQuestions += questionsGranted;
          totalNewMockExams += mockExamsGranted;
        }
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
