import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";

/**
 * Allows a request only when it comes from the scheduled job (shared secret
 * header) or from a signed-in user holding the `admin` role.
 * Returns null when allowed, or a Response to return immediately.
 */
export async function requireCronOrAdmin(
  req: Request,
  admin: SupabaseClient,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const deny = (msg: string, status: number) =>
    new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  // 1) Scheduled job path
  const provided = req.headers.get("x-cron-secret");
  if (provided) {
    const envSecret = Deno.env.get("CRON_SECRET");
    if (envSecret && provided === envSecret) return null;
    const { data } = await admin
      .from("app_config")
      .select("value")
      .eq("key", "cron_secret")
      .maybeSingle();
    if (data?.value && provided === data.value) return null;
    return deny("Forbidden", 403);
  }

  // 2) Admin user path
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return deny("Unauthorized", 401);
  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error } = await admin.auth.getUser(token);
  if (error || !userData.user) return deny("Unauthorized", 401);

  const { data: isAdmin } = await admin.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (!isAdmin) return deny("Forbidden: admin role required", 403);
  return null;
}

export function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
}
