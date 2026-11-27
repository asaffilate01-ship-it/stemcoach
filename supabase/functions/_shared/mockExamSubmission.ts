/** Shared deterministic checks for mock exam inputs and published answer keys.
 * This module is Deno- and Node-compatible and has no service-role access.
 */
export interface MockExamSubmission {
  question_id: string;
  answer: string | null;
}

export interface PublishedMockExamQuestion {
  id: string;
  correct_answer: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_QUESTIONS = 100;
const MAX_ANSWER_LENGTH = 2000;

/** Reject duplicates rather than silently truncating extra attempts. */
export function validateMockExamSubmissions(input: unknown): MockExamSubmission[] {
  if (!Array.isArray(input) || input.length < 1 || input.length > MAX_QUESTIONS) {
    throw new Error("Mock exam must contain 1–100 submissions");
  }

  const seen = new Set<string>();
  const valid: MockExamSubmission[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("Invalid mock exam submission");
    }
    const candidate = item as Partial<MockExamSubmission>;
    if (typeof candidate.question_id !== "string" || !UUID.test(candidate.question_id)) {
      throw new Error("Invalid mock exam question identifier");
    }
    const id = candidate.question_id.toLowerCase();
    if (seen.has(id)) {
      throw new Error("Duplicate mock exam question identifier");
    }
    seen.add(id);

    if (candidate.answer !== null && typeof candidate.answer !== "string") {
      throw new Error("Invalid mock exam answer");
    }
    if (typeof candidate.answer === "string" && candidate.answer.length > MAX_ANSWER_LENGTH) {
      throw new Error("Mock exam answer too long");
    }
    valid.push({ question_id: id, answer: candidate.answer?.trim() || null });
  }
  return valid;
}

/** A single missing/unpublished answer makes the whole grade untrustworthy.
 * Run before attempts insertion, consumption of quota or certificate issuance.
 */
export function requirePublishedMockExamQuestions<T extends PublishedMockExamQuestion>(
  submissions: readonly MockExamSubmission[],
  questions: readonly T[] | null | undefined,
): Map<string, T> {
  if (!Array.isArray(questions) || questions.length !== submissions.length) {
    throw new Error("Mock exam questions are unavailable or incomplete");
  }
  const result = new Map<string, T>();
  for (const question of questions) {
    if (!question || typeof question.id !== "string" ||
        !UUID.test(question.id) || result.has(question.id.toLowerCase()) ||
        typeof question.correct_answer !== "string" || !question.correct_answer.trim()) {
      throw new Error("Mock exam has an invalid published answer");
    }
    result.set(question.id.toLowerCase(), question);
  }
  if (submissions.some(entry => !result.has(entry.question_id))) {
    throw new Error("Mock exam contains an unavailable question");
  }
  return result;
}
