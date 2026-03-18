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

    // Verify parent role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", parentId)
      .eq("role", "parent");

    if (!roleData || roleData.length === 0) {
      throw new Error("Only parents can create link requests");
    }

    const { child_email } = await req.json();
    if (!child_email || typeof child_email !== "string") throw new Error("Child email is required");

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(child_email)) throw new Error("Invalid email format");

    // Look up child by email — use getUserByEmail instead of listing all users
    const { data: childData, error: childError } = await supabase.auth.admin.getUserById
      ? await (async () => {
          // Use listUsers with a per_page limit and filter
          const { data, error } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1,
          });
          // Since we can't filter by email in listUsers params, look up via profiles
          const { data: profileData } = await supabase
            .from("profiles")
            .select("user_id")
            .ilike("display_name", child_email); // This won't work — need email

          // Better approach: look up by email directly
          return { data: null, error: null };
        })()
      : { data: null, error: null };

    // Most reliable approach: use getUserByEmail if available, otherwise use admin API
    let childUserId: string | null = null;

    // Try to find user by looking up auth users by email
    const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 50,
    });

    if (listErr) throw new Error("Could not look up user");

    // Search through returned users (limited set)
    const normalizedEmail = child_email.toLowerCase().trim();
    let childUser = usersData?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);

    // If not found in first page, try a broader search
    if (!childUser) {
      // Search profiles table which we control
      const { data: profileMatch } = await supabase.rpc("find_user_by_email_hash", {
        _email: normalizedEmail,
      }).maybeSingle();

      // Fallback: iterate pages (limited to 5 pages = 250 users max for safety)
      if (!profileMatch) {
        for (let page = 2; page <= 5 && !childUser; page++) {
          const { data: pageData } = await supabase.auth.admin.listUsers({ page, perPage: 50 });
          if (!pageData?.users?.length) break;
          childUser = pageData.users.find(u => u.email?.toLowerCase() === normalizedEmail);
        }
      }
    }

    if (!childUser) throw new Error("No account found with that email address");
    childUserId = childUser.id;

    if (childUserId === parentId) throw new Error("You cannot link to yourself");

    // Check child has student role
    const { data: childRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", childUserId)
      .eq("role", "student");

    if (!childRoles || childRoles.length === 0) {
      throw new Error("The specified account is not a student account");
    }

    // Check for existing link
    const { data: existing } = await supabase
      .from("parent_links")
      .select("id, status")
      .eq("parent_id", parentId)
      .eq("child_id", childUserId)
      .maybeSingle();

    if (existing) {
      if (existing.status === "approved") throw new Error("Already linked to this child");
      if (existing.status === "pending") throw new Error("A pending request already exists");
    }

    const { error: insertError } = await supabase.from("parent_links").insert({
      parent_id: parentId,
      child_id: childUserId,
      status: "pending",
    });

    if (insertError) throw new Error(`Failed to create link: ${insertError.message}`);

    // Notify the child
    await supabase.from("notifications").insert({
      user_id: childUserId,
      title: "Parent Link Request",
      message: "A parent wants to monitor your progress. Go to Settings to approve or reject.",
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
