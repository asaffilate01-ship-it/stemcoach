import { tutorials } from "@/data/tutorials";

/**
 * Educational Q&A sourced from the guided tutorial catalogue.
 * These are self-checks, not new exam-board-verified or independently graded attempts.
 */
export const qaEntries = tutorials.flatMap((tutorial) =>
  [tutorial.checkpoint, ...(tutorial.practice || [])].map((checkpoint, index) => ({
    id: tutorial.id + "-" + index,
    tutorialId: tutorial.id,
    subject: tutorial.subject,
    topic: tutorial.title,
    level: tutorial.level,
    question: checkpoint.question,
    options: checkpoint.options,
    answer: checkpoint.answer,
    explanation: checkpoint.explanation,
    workedExample: tutorial.workedExample,
    format: checkpoint.format || "single",
    hint: checkpoint.hint || "",
    examTip: tutorial.examTip || "",
    commonMistake: tutorial.commonMistake || "",
    checkpoint,
  })),
);

export type QAEntry = (typeof qaEntries)[number];
