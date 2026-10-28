import type { TutorialCheckpoint, TutorialQuestionFormat } from "@/data/tutorials";

export interface QuestionResponse {
  choice: string;
  choices: string[];
  freeText: string;
  order: string[];
  /** Do not count the untouched, initially displayed sequence as a submitted answer. */
  orderTouched: boolean;
  matches: Record<string, string>;
}

export const getQuestionFormat = (question: TutorialCheckpoint): TutorialQuestionFormat =>
  question.format || "single";

export function normaliseWrittenAnswer(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "").toLocaleLowerCase();
}

function parseDecimal(value: string): number {
  const text = value.trim().replace(",", ".");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) return NaN;
  return Number(text);
}

export function hasResponse(question: TutorialCheckpoint, response: QuestionResponse): boolean {
  switch (getQuestionFormat(question)) {
    case "multiple":
      return response.choices.length > 0;
    case "numeric":
    case "short-text":
      return Boolean(response.freeText.trim());
    case "ordering":
      return response.orderTouched && response.order.length === question.options.length &&
        response.order.every((value) => question.options.includes(value)) &&
        new Set(response.order).size === response.order.length;
    case "matching":
      return Boolean(question.pairs?.length) && question.pairs.every((pair) => Boolean(response.matches[pair.left]));
    case "fill-blanks":
      return Boolean(question.blanks?.length) && question.blanks.every((blank) => Boolean(response.matches[blank.id]?.trim()));
    case "diagram-label":
      return Boolean(question.diagram?.markers.length) && question.diagram.markers.every((marker) => Boolean(response.matches[marker.id]));
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
      const answer = parseDecimal(response.freeText);
      const expected = parseDecimal(question.answer);
      const tolerance = question.tolerance ?? 0;
      return Number.isFinite(answer) && Number.isFinite(expected) && Number.isFinite(tolerance) && tolerance >= 0
        && Math.abs(answer - expected) <= tolerance + 1e-9;
    }
    case "short-text":
      return [question.answer, ...(question.acceptedAnswers || [])]
        .map(normaliseWrittenAnswer)
        .includes(normaliseWrittenAnswer(response.freeText));
    case "ordering":
      return response.order.join("\u0001") === (question.answers || []).join("\u0001");
    case "matching":
      return Boolean(question.pairs?.every((pair) => response.matches[pair.left] === pair.right));
    case "fill-blanks":
      return Boolean(question.blanks?.every((blank) =>
        [blank.answer, ...(blank.acceptedAnswers || [])]
          .some((answer) => normaliseWrittenAnswer(answer) === normaliseWrittenAnswer(response.matches[blank.id] || ""))));
    case "diagram-label":
      return Boolean(question.diagram?.markers.every((marker) => response.matches[marker.id] === marker.answer));
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
    case "fill-blanks":
      return (question.blanks || []).map((blank) => blank.prompt + ": " + blank.answer).join("; ");
    case "diagram-label":
      return (question.diagram?.markers || []).map((marker) => marker.id + ": " + marker.answer).join("; ");
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
  if (format === "numeric" && (!Number.isFinite(parseDecimal(question.answer)) || !Number.isFinite(question.tolerance ?? 0) || (question.tolerance ?? 0) < 0))
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
  if (format === "fill-blanks") {
    const blanks = question.blanks || [];
    if (blanks.length < 2 || blanks.length > 5 || question.options.length !== 0 ||
      new Set(blanks.map((blank) => blank.id)).size !== blanks.length ||
      blanks.some((blank) => !/^[a-z0-9-]{1,24}$/.test(blank.id) ||
        blank.prompt.trim().length < 5 || !blank.answer.trim()))
      issues.push("fill-in answer key invalid");
  }
  if (format === "diagram-label") {
    const markers = question.diagram?.markers || [];
    if (!question.diagram || !["right-triangle", "cell", "water-cycle", "circuit"].includes(question.diagram.kind) ||
      markers.length < 2 || markers.length > 5 ||
      new Set(markers.map((marker) => marker.id)).size !== markers.length ||
      question.options.length < markers.length ||
      new Set(question.options).size !== question.options.length ||
      markers.some((marker) => !/^[A-E]$/.test(marker.id) ||
        !Number.isFinite(marker.x) || !Number.isFinite(marker.y) ||
        marker.x < 10 || marker.x > 390 || marker.y < 10 || marker.y > 210 ||
        !question.options.includes(marker.answer)))
      issues.push("diagram label key invalid");
  }
  return issues;
}

export function emptyResponse(question: TutorialCheckpoint): QuestionResponse {
  return { choice: "", choices: [], freeText: "", order: [...question.options], orderTouched: false, matches: {} };
}
