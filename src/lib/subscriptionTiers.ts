export type RegionKey = "uk" | "us" | "ae" | "in" | "pk";

export interface RegionalPrice {
  price: string;
  price_id: string;
}

export interface QuestionPack {
  name: string;
  product_id: string;
  questions: number;
  features: string[];
  regional: Record<RegionKey, RegionalPrice>;
}

export const PACKS: Record<string, QuestionPack> = {
  standard: {
    name: "Ultimate Pack",
    product_id: "prod_UAj58fkEwB0P8O",
    questions: 10000,
    features: [
      "10,000 curriculum-aligned questions",
      "Choose your subjects & levels",
      "AI Tutor chat — unlimited",
      "Mock exams & certificates",
      "Streaks, XP, levels & leaderboards",
      "Detailed analytics & weak-topic drills",
      "Offline mode (PWA)",
    ],
    regional: {
      uk: { price: "£14.99", price_id: "price_1TCNddFFogsDQVs4QyDkGoa6" },
      us: { price: "$19.99", price_id: "price_1TCYoCFFogsDQVs4n5EaIpC4" },
      ae: { price: "AED 99", price_id: "price_1TCYoDFFogsDQVs4a7IAliJs" },
      in: { price: "₹899", price_id: "price_1TCYoEFFogsDQVs43ZduOOov" },
      pk: { price: "PKR 4,999", price_id: "price_1TCYoEFFogsDQVs45swS26PC" },
    },
  },
  topup: {
    name: "Top-Up Pack",
    product_id: "prod_UAj5MWyj4cFOgT",
    questions: 2000,
    features: [
      "2,000 extra questions",
      "Add more subjects anytime",
      "Stack with existing pack",
      "Instant access",
    ],
    regional: {
      uk: { price: "£4.99", price_id: "price_1TCNdeFFogsDQVs4WutIKPQw" },
      us: { price: "$7.99", price_id: "price_1TCYoFFFogsDQVs4Klbw5WCw" },
      ae: { price: "AED 39", price_id: "price_1TCYoGFFogsDQVs4ZGx96zs9" },
      in: { price: "₹399", price_id: "price_1TCYoGFFogsDQVs4MzY6cjyN" },
      pk: { price: "PKR 999", price_id: "price_1TCYoHFFogsDQVs4tHGNLjSv" },
    },
  },
} as const;

export type PackKey = keyof typeof PACKS;

// Legacy compat
export type TierKey = "free" | "standard" | "topup";

export function getTierByProductId(productId: string | null): TierKey {
  if (!productId) return "free";
  for (const [key, pack] of Object.entries(PACKS)) {
    if (pack.product_id === productId) return key as TierKey;
  }
  return "free";
}

/** Calculates how questions are distributed across subjects */
export function calculateQuestionAllocation(
  totalQuestions: number,
  subjects: string[],
  levels: string[]
): { perSubject: number; perLevel: number } {
  const subjectCount = Math.max(1, subjects.length);
  const levelCount = Math.max(1, levels.length);

  const perSubject = Math.floor(totalQuestions / subjectCount);
  const perLevel = Math.floor(perSubject / levelCount);
  return { perSubject, perLevel };
}

export const regionLabels: Record<RegionKey, string> = {
  uk: "🇬🇧 United Kingdom",
  us: "🇺🇸 United States",
  ae: "🇦🇪 UAE",
  in: "🇮🇳 India",
  pk: "🇵🇰 Pakistan",
};
