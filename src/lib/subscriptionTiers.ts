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
    questions: 100000,
    features: [
      "100,000 curriculum-aligned questions",
      "Choose your subjects & levels",
      "AI Tutor chat — unlimited",
      "Mock exams & certificates",
      "Streaks, XP, levels & leaderboards",
      "Detailed analytics & weak-topic drills",
      "Offline mode (PWA)",
    ],
    regional: {
      uk: { price: "£14.99", price_id: "price_1TCNddFFogsDQVs4QyDkGoa6" },
      us: { price: "$19.99", price_id: "price_1TCNdhFFogsDQVs4QJcncX1T" },
      ae: { price: "AED 99", price_id: "price_1TCNdjFFogsDQVs4VVGK1Ncx" },
      in: { price: "₹499", price_id: "price_1TCNdkFFogsDQVs4ZeZ8ikLB" },
      pk: { price: "PKR 4,999", price_id: "price_1TCNdmFFogsDQVs4WszzaaSM" },
    },
  },
  topup: {
    name: "Top-Up Pack",
    product_id: "prod_UAj5MWyj4cFOgT",
    questions: 20000,
    features: [
      "20,000 extra questions",
      "Add more subjects anytime",
      "Stack with existing pack",
      "Instant access",
    ],
    regional: {
      uk: { price: "£4.99", price_id: "price_1TCNdeFFogsDQVs4WutIKPQw" },
      us: { price: "$7.99", price_id: "price_1TCNdiFFogsDQVs4Kek0zoTb" },
      ae: { price: "AED 39", price_id: "price_1TCNdkFFogsDQVs4Xdwg4abI" },
      in: { price: "₹199", price_id: "price_1TCNdlFFogsDQVs4PSOP1So1" },
      pk: { price: "PKR 999", price_id: "price_1TCNdmFFogsDQVs4Hju7qgvO" },
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

  // 1 subject + 1 level = 200K questions (bonus)
  if (subjectCount === 1 && levelCount === 1) {
    return { perSubject: totalQuestions * 2, perLevel: totalQuestions * 2 };
  }

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
