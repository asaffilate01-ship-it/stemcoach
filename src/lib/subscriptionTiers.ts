export type RegionKey = "uk" | "us" | "ae" | "in" | "pk";

export interface RegionalPrice {
  price: string;
  price_id: string | null;
}

export interface Tier {
  name: string;
  product_id: string | null;
  features: string[];
  regional: Record<RegionKey, RegionalPrice>;
}

export const TIERS: Record<string, Tier> = {
  free: {
    name: "Free",
    product_id: null,
    features: [
      "5 practice questions per day",
      "Basic progress tracking",
      "Access to 3 subjects",
    ],
    regional: {
      uk: { price: "£0", price_id: null },
      us: { price: "$0", price_id: null },
      ae: { price: "AED 0", price_id: null },
      in: { price: "₹0", price_id: null },
      pk: { price: "PKR 0", price_id: null },
    },
  },
  pro: {
    name: "Pro",
    product_id: "prod_U9ZtTvGE2aOmTq",
    features: [
      "Unlimited practice questions",
      "AI Tutor chat",
      "Mock exams & certificates",
      "All subjects & curricula",
      "Detailed analytics",
      "IELTS & CELTA prep",
    ],
    regional: {
      uk: { price: "£9.99/mo", price_id: "price_1TBGjfFFogsDQVs44Q1mPAM3" },
      us: { price: "$4.99/mo", price_id: "price_1TBHxeFFogsDQVs4xC9c3mA7" },
      ae: { price: "AED 19.99/mo", price_id: "price_1TBHxfFFogsDQVs4OD3ykuzn" },
      in: { price: "₹299/mo", price_id: "price_1TBHxgFFogsDQVs4saYx4rXz" },
      pk: { price: "PKR 799/mo", price_id: "price_1TBHxgFFogsDQVs4nAQ7DBkw" },
    },
  },
  school: {
    name: "School",
    product_id: "prod_U9ZtSc5VHQnmLs",
    features: [
      "Everything in Pro",
      "Teacher dashboard & classes",
      "Parent monitoring portal",
      "White-label branding",
      "Up to 50 students",
      "Assignment management",
      "Priority support",
    ],
    regional: {
      uk: { price: "£49.99/mo", price_id: "price_1TBGjgFFogsDQVs4PlLCADnH" },
      us: { price: "$39.99/mo", price_id: "price_1TBHxhFFogsDQVs4w7FF4nhz" },
      ae: { price: "AED 149.99/mo", price_id: "price_1TBHxiFFogsDQVs4pf8VULsI" },
      in: { price: "₹2,499/mo", price_id: "price_1TBHxjFFogsDQVs4hegTA6OI" },
      pk: { price: "PKR 7,999/mo", price_id: "price_1TBHxkFFogsDQVs4oy2xKsVu" },
    },
  },
} as const;

export type TierKey = keyof typeof TIERS;

export function getTierByProductId(productId: string | null): TierKey {
  if (!productId) return "free";
  for (const [key, tier] of Object.entries(TIERS)) {
    if (tier.product_id === productId) return key as TierKey;
  }
  return "free";
}
