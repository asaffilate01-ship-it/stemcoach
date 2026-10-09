import type { TutorialCheckpoint } from "./tutorials";

/** Authoring helpers keep answer keys structured and avoid string-splitting ambiguity. */
export const mcq = (
  question: string, options: string[], answer: string, explanation: string, hint = "",
): TutorialCheckpoint => ({ question, options, answer, explanation, hint, format: "single" });

export const trueFalse = (
  question: string, answer: boolean, explanation: string, hint = "",
): TutorialCheckpoint => ({ question, options: ["True", "False"], answer: answer ? "True" : "False", explanation, hint, format: "true-false" });

export const multi = (
  question: string, options: string[], answers: string[], explanation: string, hint = "",
): TutorialCheckpoint => ({ question, options, answer: answers.join("; "), answers, explanation, hint, format: "multiple" });

export const numeric = (
  question: string, answer: number, explanation: string, hint = "", tolerance = 0,
): TutorialCheckpoint => ({ question, options: [], answer: String(answer), explanation, tolerance, hint, format: "numeric" });

export const short = (
  question: string, answer: string, explanation: string, hint = "", acceptedAnswers: string[] = [],
): TutorialCheckpoint => ({ question, options: [], answer, explanation, acceptedAnswers, hint, format: "short-text" });

export const order = (
  question: string, answers: string[], explanation: string, hint = "",
): TutorialCheckpoint => ({
  question, options: [...answers].reverse(), answer: answers.join(" → "), answers,
  explanation, hint, format: "ordering",
});

export const match = (
  question: string, pairs: Array<[string, string]>, explanation: string, hint = "",
): TutorialCheckpoint => ({
  question,
  options: [...pairs.map((pair) => pair[1])].reverse(),
  answer: pairs.map((pair) => pair.join(" → ")).join("; "),
  pairs: pairs.map(([left, right]) => ({ left, right })),
  explanation, hint, format: "matching",
});
