import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const userId = userData.user.id;

    // Fetch all user data
    const [profile, stats, attempts, badges, flashcards, certificates, preferences, studyGoals] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId),
      supabase.from("user_stats").select("*").eq("user_id", userId),
      supabase.from("attempts").select("*").eq("user_id", userId),
      supabase.from("user_badges").select("*, badges(*)").eq("user_id", userId),
      supabase.from("flashcards").select("*").eq("user_id", userId),
      supabase.from("certificates").select("*").eq("user_id", userId),
      supabase.from("user_preferences").select("*").eq("user_id", userId),
      supabase.from("study_goals").select("*").eq("user_id", userId),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user: { id: userId, email: userData.user.email },
      profile: profile.data,
      stats: stats.data,
      attempts: attempts.data,
      badges: badges.data,
      flashcards: flashcards.data,
      certificates: certificates.data,
      preferences: preferences.data,
      study_goals: studyGoals.data,
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Content-Disposition": "attachment; filename=stemcoach-data-export.json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
