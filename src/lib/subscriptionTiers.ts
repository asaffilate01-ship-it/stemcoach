export type RegionKey = "uk" | "us" | "ae" | "in" | "pk";

export interface RegionalPrice {
  price: string;
  price_id: string;
}

export interface QuestionPack {
  name: string;
  product_id: string;
  questions: number;
  mock_exams: number;
  features: string[];
  regional: Record<RegionKey, RegionalPrice>;
}

export const PACKS: Record<string, QuestionPack> = {
  standard: {
    name: "Ultimate Pack",
    product_id: "prod_UAj58fkEwB0P8O",
    questions: 5000,
    mock_exams: 20,
    features: [
      "5,000 curriculum-aligned questions",
      "20 mock exams with certificates",
      "Choose your subjects, boards & levels",
      "STEMcoach coaching when you're stuck",
      "Full tutorial explanations on every answer",
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
    questions: 1000,
    mock_exams: 5,
    features: [
      "1,000 extra questions",
      "5 additional mock exams",
      "Add more subjects & levels anytime",
      "Stack with existing pack",
      "Instant access",
    ],
    regional: {
      uk: { price: "£4.99", price_id: "price_1TCNdeFFogsDQVs4WutIKPQw" },
      us: { price: "$6.99", price_id: "price_1TCZCNFFogsDQVs4dhoer5AL" },
      ae: { price: "AED 29", price_id: "price_1TCZCRFFogsDQVs4vHB63taY" },
      in: { price: "₹299", price_id: "price_1TCZCSFFogsDQVs4eBhjzG9k" },
      pk: { price: "PKR 1,999", price_id: "price_1TCZCSFFogsDQVs4hueexI5c" },
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

/** Free tier: questions per subject before paywall */
export const FREE_QUESTIONS_PER_SUBJECT = 5;
