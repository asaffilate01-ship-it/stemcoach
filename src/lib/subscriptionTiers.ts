export const TIERS = {
  free: {
    name: "Free",
    price: "£0",
    price_id: null,
    product_id: null,
    features: [
      "5 practice questions per day",
      "Basic progress tracking",
      "Access to 3 subjects",
    ],
  },
  pro: {
    name: "Pro",
    price: "£9.99/mo",
    price_id: "price_1TBGjfFFogsDQVs44Q1mPAM3",
    product_id: "prod_U9ZtTvGE2aOmTq",
    features: [
      "Unlimited practice questions",
      "AI Tutor chat",
      "Mock exams & certificates",
      "All subjects & curricula",
      "Detailed analytics",
      "IELTS & CELTA prep",
    ],
  },
  school: {
    name: "School",
    price: "£49.99/mo",
    price_id: "price_1TBGjgFFogsDQVs4PlLCADnH",
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
