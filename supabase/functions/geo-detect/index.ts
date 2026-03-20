import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COUNTRY_TO_REGION: Record<string, string> = {
  GB: "uk",
  US: "us",
  AE: "ae",
  IN: "in",
  PK: "pk",
  AU: "au",
  NZ: "nz",
  CA: "ca",
  BD: "bd",
  LK: "lk",
  FR: "fr",
  PH: "ph",
  DE: "de",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const country =
      req.headers.get("x-country") ||
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-vercel-ip-country") ||
      null;

    const region = country ? COUNTRY_TO_REGION[country.toUpperCase()] || "uk" : "uk";

    return new Response(JSON.stringify({ region, country: country?.toUpperCase() || "UNKNOWN" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ region: "uk", country: "UNKNOWN" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
