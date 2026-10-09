import type { TutorialCheckpoint, TutorialQuestionFormat } from "@/data/tutorials";

export interface QuestionResponse {
  choice: string;
  choices: string[];
  freeText: string;
  order: string[];
  matches: Record<string, string>;
}

export const getQuestionFormat = (question: TutorialCheckpoint): TutorialQuestionFormat =>
  question.format || "single";

export function normaliseWrittenAnswer(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "").toLocaleLowerCase();
}

export function hasResponse(question: TutorialCheckpoint, response: QuestionResponse): boolean {
  switch (getQuestionFormat(question)) {
    case "multiple":
      return response.choices.length > 0;
    case "numeric":
    case "short-text":
      return Boolean(response.freeText.trim());
    case "ordering":
      return response.order.length === question.options.length;
    case "matching":
      return Boolean(question.pairs?.length) && question.pairs!.every((pair) => Boolean(response.matches[pair.left]));
    default:
      return Boolean(response.choice);
  }
}

export function isCorrectResponse(question: TutorialCheckpoint, response: QuestionResponse): boolean {
  if (!hasResponse(question, response)) return false;
  switch (getQuestionFormat(question)) {
    case "multiple": {
      const expected = question.answers || [];
      return response.choices.length === expected.length
        && new Set(response.choices).size === expected.length
        && expected.every((option) => response.choices.includes(option));
    }
    case "numeric": {
      const answer = Number(response.freeText.trim().replace(",", "."));
      const expected = Number(question.answer);
      return Number.isFinite(answer) && Number.isFinite(expected)
        && Math.abs(answer - expected) <= (question.tolerance || 0) + 1e-9;
    }
    case "short-text":
      return [question.answer, ...(question.acceptedAnswers || [])]
        .map(normaliseWrittenAnswer)
        .includes(normaliseWrittenAnswer(response.freeText));
    case "ordering":
      return response.order.join("\u0001") === (question.answers || []).join("\u0001");
    case "matching":
      return Boolean(question.pairs?.every((pair) => response.matches[pair.left] === pair.right));
    default:
      return response.choice === question.answer;
  }
}

export function displayAnswer(question: TutorialCheckpoint): string {
  switch (getQuestionFormat(question)) {
    case "multiple":
      return (question.answers || []).join("; ");
    case "ordering":
      return (question.answers || []).join(" → ");
    case "matching":
      return (question.pairs || []).map((pair) => pair.left + " → " + pair.right).join("; ");
    default:
      return question.answer;
  }
}

export function inspectQuestion(question: TutorialCheckpoint): string[] {
  const issues: string[] = [];
  const format = getQuestionFormat(question);
  if (question.question.trim().length < 12) issues.push("question too short");
  if (question.explanation.trim().length < 18) issues.push("explanation too short");
  if (format === "single" || format === "true-false") {
    if (question.options.length < 2 || new Set(question.options).size !== question.options.length) issues.push("invalid options");
    if (!question.options.includes(question.answer)) issues.push("answer not in options");
  }
  if (format === "true-false" &&
      (!question.options.includes("True") || !question.options.includes("False") || question.options.length !== 2))
    issues.push("true-false options invalid");
  if (format === "multiple") {
    const answers = question.answers || [];
    if (question.options.length < 3 || answers.length < 2 || answers.length >= question.options.length ||
        new Set(question.options).size !== question.options.length ||
        new Set(answers).size !== answers.length || answers.some((answer) => !question.options.includes(answer)))
      issues.push("multiple-answer key invalid");
  }
  if (format === "numeric" && (!Number.isFinite(Number(question.answer)) || (question.tolerance || 0) < 0))
    issues.push("numeric answer invalid");
  if (format === "short-text" && question.answer.trim().length < 2) issues.push("short answer empty");
  if (format === "ordering") {
    const answer = question.answers || [];
    if (answer.length < 3 || answer.length !== question.options.length ||
      new Set(answer).size !== answer.length || answer.some((value) => !question.options.includes(value)) ||
      question.options.every((option, index) => option === answer[index])) issues.push("ordering key invalid");
  }
  if (format === "matching") {
    const pairs = question.pairs || [];
    if (pairs.length < 2 || question.options.length < pairs.length ||
      new Set(pairs.map((pair) => pair.left)).size !== pairs.length ||
      new Set(pairs.map((pair) => pair.right)).size !== pairs.length ||
      pairs.some((pair) => !question.options.includes(pair.right))) issues.push("matching key invalid");
  }
  return issues;
}

export function emptyResponse(question: TutorialCheckpoint): QuestionResponse {
  return { choice: "", choices: [], freeText: "", order: [...question.options], matches: {} };
}
