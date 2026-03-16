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

    // Delete all user data from all tables
    const tables = [
      "attempts", "user_stats", "user_badges", "user_preferences",
      "flashcards", "certificates", "study_goals", "notifications",
      "active_sessions", "profiles", "user_roles", "parent_links",
      "class_members", "classroom_messages", "assignment_submissions",
      "tenant_members",
    ];

    for (const table of tables) {
      const col = table === "parent_links" ? "parent_id" : 
                  table === "assignment_submissions" ? "student_id" : "user_id";
      await supabase.from(table).delete().eq(col, userId);
    }

    // Also delete parent_links where user is the child
    await supabase.from("parent_links").delete().eq("child_id", userId);

    // Delete the auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
