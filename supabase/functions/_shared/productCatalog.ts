export interface ProductGrant {
  questions: number;
  mockExams: number;
  pack: "standard" | "topup";
  region: string;
}

declare const Deno: { env: { get(name: string): string | undefined } };

/**
 * The server is the only authority for paid entitlements. Browser-supplied
 * pack names and question totals must never be used to grant quota.
 */
export const PRODUCT_GRANTS: Readonly<Record<string, ProductGrant>> = Object.freeze({
  // Ultimate Pack — 5,000 questions + 20 mock exams
  "price_1TCNddFFogsDQVs4QyDkGoa6": { questions: 5000, mockExams: 20, pack: "standard", region: "uk" },
  "price_1TCYoCFFogsDQVs4n5EaIpC4": { questions: 5000, mockExams: 20, pack: "standard", region: "us" },
  "price_1TCYoDFFogsDQVs4a7IAliJs": { questions: 5000, mockExams: 20, pack: "standard", region: "ae" },
  "price_1TCYoEFFogsDQVs43ZduOOov": { questions: 5000, mockExams: 20, pack: "standard", region: "in" },
  "price_1TCYoEFFogsDQVs45swS26PC": { questions: 5000, mockExams: 20, pack: "standard", region: "pk" },
  "price_1TCxysFFogsDQVs4yklywQ3W": { questions: 5000, mockExams: 20, pack: "standard", region: "au" },
  "price_1TCxyuFFogsDQVs4tS6qul6W": { questions: 5000, mockExams: 20, pack: "standard", region: "nz" },
  "price_1TCxywFFogsDQVs4rI3DVCmN": { questions: 5000, mockExams: 20, pack: "standard", region: "ca" },
  "price_1TCxyyFFogsDQVs43c1p47T9": { questions: 5000, mockExams: 20, pack: "standard", region: "bd" },
  "price_1TCxyzFFogsDQVs4r94WHEqY": { questions: 5000, mockExams: 20, pack: "standard", region: "lk" },
  "price_1U3wLUFFogsDQVs4xvBnXg8K": { questions: 5000, mockExams: 20, pack: "standard", region: "eu" },
  "price_1U4zEsFFogsDQVs4YqJFAlH8": { questions: 5000, mockExams: 20, pack: "standard", region: "ph" },

  // Top-Up Pack — 1,000 questions + 5 mock exams
  "price_1TCNdeFFogsDQVs4WutIKPQw": { questions: 1000, mockExams: 5, pack: "topup", region: "uk" },
  "price_1TCZCNFFogsDQVs4dhoer5AL": { questions: 1000, mockExams: 5, pack: "topup", region: "us" },
  "price_1TCZCRFFogsDQVs4vHB63taY": { questions: 1000, mockExams: 5, pack: "topup", region: "ae" },
  "price_1TCZCSFFogsDQVs4eBhjzG9k": { questions: 1000, mockExams: 5, pack: "topup", region: "in" },
  "price_1TCZCSFFogsDQVs4hueexI5c": { questions: 1000, mockExams: 5, pack: "topup", region: "pk" },
  "price_1TCxytFFogsDQVs4bGUZPFnj": { questions: 1000, mockExams: 5, pack: "topup", region: "au" },
  "price_1TCxyvFFogsDQVs4D3w5jslB": { questions: 1000, mockExams: 5, pack: "topup", region: "nz" },
  "price_1TCxyyFFogsDQVs4XlzjR3xR": { questions: 1000, mockExams: 5, pack: "topup", region: "ca" },
  "price_1TCxyyFFogsDQVs4AemajlYo": { questions: 1000, mockExams: 5, pack: "topup", region: "bd" },
  "price_1TCxz0FFogsDQVs4bwezp7QL": { questions: 1000, mockExams: 5, pack: "topup", region: "lk" },
  "price_1U3yIyFFogsDQVs4fUYgEjq2": { questions: 1000, mockExams: 5, pack: "topup", region: "eu" },
  "price_1U4zF6FFogsDQVs44UX0jPq5": { questions: 1000, mockExams: 5, pack: "topup", region: "ph" },
});

export function grantForPrice(priceId: unknown): ProductGrant | null {
  if (typeof priceId !== "string") return null;
  return PRODUCT_GRANTS[priceId] ?? null;
}

export function allowedAppOrigins(): Set<string> {
  return new Set([
    Deno.env.get("APP_ORIGIN") || "https://stemcoach.app",
    "https://stemcoach.lovable.app",
  ]);
}

export function requestAppOrigin(req: Request): string {
  const configured = Deno.env.get("APP_ORIGIN") || "https://stemcoach.app";
  const requested = req.headers.get("origin");
  return requested && allowedAppOrigins().has(requested) ? requested : configured;
}

export function corsHeadersFor(req: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": requestAppOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Vary": "Origin",
  };
}
