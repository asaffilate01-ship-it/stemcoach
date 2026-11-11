/**
 * Deterministic, ephemeral question-variant drafts.
 *
 * 16 independent numerical skills × 256 × 256 input combinations =
 * 1,048,576 distinct reproducible formative Q&A pairs. These are NOT 1M
 * independently written/reviewed questions, not published assessment-bank
 * records and NOT part of a paid subscription or certified mock exam.
 *
 * The caller must not auto-publish these into Supabase. Use the existing
 * qualified reviewer, curriculum mapping and approval workflow first.
 */
export const DRAFT_VARIANT_SKILLS = [
  "signed-integer-arithmetic",
  "linear-equation",
  "multiplication-fluency",
  "sharing-ratios",
  "arithmetic-sequence",
  "rectangle-area",
  "percentage-of-quantity",
  "mean-of-two-numbers",
  "resultant-force",
  "kinetic-energy",
  "ohms-law",
  "wave-speed",
  "molar-mass",
  "limiting-reactant",
  "microscope-magnification",
  "program-loop-tracing",
] as const;

export type DraftVariantSkill = typeof DRAFT_VARIANT_SKILLS[number];
export type DraftVariantSubject = "mathematics" | "physics" | "chemistry" | "biology" | "computer-science";
export interface DraftQuestionVariant {
  id: string;
  skill: DraftVariantSkill;
  subject: DraftVariantSubject;
  question: string;
  answer: string;
  workedSolution: string;
  /** Explicitly unapproved: never treat preview-only content as published exam material. */
  reviewStatus: "draft";
  curriculumCandidate: "uk-gcse";
}
export const VARIANTS_PER_SKILL = 256 * 256;
export const DRAFT_VARIANT_CAPACITY = DRAFT_VARIANT_SKILLS.length * VARIANTS_PER_SKILL;
export const MAX_PREVIEW_BATCH = 100;

function integer(value: number): boolean {
  return Number.isSafeInteger(value);
}

/**
 * Stable bijective indexing over a bounded draft space.
 * Returns null for invalid input instead of wrapping, silently clamping or
 * reading user-specific data. All numerical answers are exact integers.
 */
export function draftVariantAt(index: number): DraftQuestionVariant | null {
  if (!integer(index) || index < 0 || index >= DRAFT_VARIANT_CAPACITY) return null;
  const family = Math.floor(index / VARIANTS_PER_SKILL);
  const offset = index % VARIANTS_PER_SKILL;
  const a = Math.floor(offset / 256) + 1;
  const b = (offset % 256) + 1;
  const skill = DRAFT_VARIANT_SKILLS[family];

  let subject: DraftVariantSubject = "mathematics";
  let question = "";
  let answer = 0;
  let workedSolution = "";
  switch (skill) {
    case "signed-integer-arithmetic":
      question = "Calculate (" + -a + ") + " + b + ".";
      answer = b - a;
      workedSolution = "Begin at -" + a + " and move " + b + " units right: " + b + " - " + a + " = " + answer + ".";
      break;
    case "linear-equation":
      question = "Solve x + " + a + " = " + (a + b) + " for x.";
      answer = b;
      workedSolution = "Subtract " + a + " from both sides, so x = " + (a + b) + " - " + a + " = " + b + ".";
      break;
    case "multiplication-fluency":
      question = "Calculate " + a + " × " + b + ".";
      answer = a * b;
      workedSolution = a + " groups of " + b + " contain " + (a * b) + " in total.";
      break;
    case "sharing-ratios":
      question = "Share " + (10 * (a + b)) + " counters in the ratio " + a + ":" + b + ". How many go to the first person?";
      answer = 10 * a;
      workedSolution = "There are " + (a + b) + " equal parts; one part is 10 counters, giving " + a + " × 10 = " + answer + " counters to the first person.";
      break;
    case "arithmetic-sequence":
      question = "An arithmetic sequence starts at " + a + " and rises by " + b + " each step. What is its sixth term?";
      answer = a + 5 * b;
      workedSolution = "The sixth term is the first term plus five differences: " + a + " + 5 × " + b + " = " + answer + ".";
      break;
    case "rectangle-area":
      question = "A rectangle measures " + a + " cm by " + b + " cm. Find its area in cm².";
      answer = a * b;
      workedSolution = "Area = length × width = " + a + " × " + b + " = " + answer + " cm².";
      break;
    case "percentage-of-quantity":
      question = "What is " + a + "% of " + (100 * b) + "?";
      answer = a * b;
      workedSolution = "Divide " + (100 * b) + " by 100, then multiply by " + a + ": " + b + " × " + a + " = " + answer + ".";
      break;
    case "mean-of-two-numbers":
      question = "Find the arithmetic mean of " + (2 * a) + " and " + (2 * b) + ".";
      answer = a + b;
      workedSolution = "Add the values and divide by two: (" + (2 * a) + " + " + (2 * b) + ") / 2 = " + answer + ".";
      break;
    case "resultant-force":
      subject = "physics";
      question = "A trolley has " + a + " N acting right and " + b + " N acting left. Find the signed resultant in N (right positive).";
      answer = a - b;
      workedSolution = "With right defined positive, resultant = " + a + " - " + b + " = " + answer + " N. A negative sign means left.";
      break;
    case "kinetic-energy":
      subject = "physics";
      question = "A mass of " + (2 * a) + " kg moves at " + b + " m/s. What is its kinetic energy in joules?";
      answer = a * b * b;
      workedSolution = "E = 1/2 mv² = 1/2 × " + (2 * a) + " × " + b + "² = " + answer + " J.";
      break;
    case "ohms-law":
      subject = "physics";
      question = "An ohmic resistor has resistance " + a + " Ω and current " + b + " A. Calculate the potential difference in volts.";
      answer = a * b;
      workedSolution = "Use V = IR: " + b + " × " + a + " = " + answer + " V, assuming a constant ohmic resistance.";
      break;
    case "wave-speed":
      subject = "physics";
      question = "A wave has frequency " + a + " Hz and wavelength " + b + " m. Calculate its speed in m/s.";
      answer = a * b;
      workedSolution = "Use v = fλ = " + a + " × " + b + " = " + answer + " m/s.";
      break;
    case "molar-mass":
      subject = "chemistry";
      question = "A hypothetical substance has molar mass " + a + " g/mol. What mass in grams is " + b + " mol?";
      answer = a * b;
      workedSolution = "Mass = amount × molar mass = " + b + " mol × " + a + " g/mol = " + answer + " g.";
      break;
    case "limiting-reactant":
      subject = "chemistry";
      question = "For the hypothetical reaction 2A + B → 2C, " + a + " mol A reacts with " + b + " mol B. What is the maximum whole number of moles of C formed?";
      answer = Math.min(a, 2 * b);
      workedSolution = "Every 2 mol A makes 2 mol C, and every 1 mol B can make 2 mol C. The smaller capacity is min(" + a + ", " + (2 * b) + ") = " + answer + " mol C.";
      break;
    case "microscope-magnification":
      subject = "biology";
      question = "A microscopic object is " + a + " µm long but measures " + (a * b) + " µm in an image. What is the magnification?";
      answer = b;
      workedSolution = "Magnification = image size / actual size = " + (a * b) + " µm / " + a + " µm = ×" + b + ".";
      break;
    case "program-loop-tracing":
      subject = "computer-science";
      question = "In Python, how many integers appear in list(range(" + a + ", " + (a + b) + "))?";
      answer = b;
      workedSolution = "Python range includes its start but excludes its stop. The count is " + (a + b) + " - " + a + " = " + b + ".";
      break;
  }
  return {
    id: "draft-v1-" + skill + "-" + a + "-" + b,
    skill, subject, question, answer: String(answer), workedSolution,
    reviewStatus: "draft", curriculumCandidate: "uk-gcse",
  };
}

/** Bounded pagination prevents allocating a million records in a browser tab. */
export function previewDraftVariants(start: number, limit: number): DraftQuestionVariant[] {
  if (!integer(start) || !integer(limit) || start < 0 || limit < 1 || limit > MAX_PREVIEW_BATCH) return [];
  const end = Math.min(start + limit, DRAFT_VARIANT_CAPACITY);
  const items: DraftQuestionVariant[] = [];
  for (let index = start; index < end; index++) {
    const item = draftVariantAt(index);
    if (item) items.push(item);
  }
  return items;
}
