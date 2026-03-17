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

    const parentId = userData.user.id;
    const { child_email } = await req.json();
    if (!child_email) throw new Error("Child email is required");

    // Look up child by email using admin API
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw new Error("Could not look up user");

    const childUser = users.users.find(u => u.email?.toLowerCase() === child_email.toLowerCase());
    if (!childUser) throw new Error("No account found with that email address");

    if (childUser.id === parentId) throw new Error("You cannot link to yourself");

    // Check for existing link
    const { data: existing } = await supabase
      .from("parent_links")
      .select("id, status")
      .eq("parent_id", parentId)
      .eq("child_id", childUser.id)
      .maybeSingle();

    if (existing) {
      if (existing.status === "approved") throw new Error("Already linked to this child");
      if (existing.status === "pending") throw new Error("A pending request already exists");
    }

    const { error: insertError } = await supabase.from("parent_links").insert({
      parent_id: parentId,
      child_id: childUser.id,
      status: "pending",
    });

    if (insertError) throw new Error(`Failed to create link: ${insertError.message}`);

    // Notify the child
    await supabase.from("notifications").insert({
      user_id: childUser.id,
      title: "Parent Link Request",
      message: `A parent wants to monitor your progress. Go to Settings to approve or reject.`,
      type: "parent_link",
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
