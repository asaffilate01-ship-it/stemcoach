/**
 * Scores must never be inferred from a partial or mismatched grading response.
 * The review view reads answer keys directly, so it may render only when
 * every submitted question has exactly one confirmed answer key.
 */
export interface MockExamGradeResult {
  question_id: string;
  correct_answer: string | null;
  explanation: string | null;
  worked_solution: string | null;
}

export function requireCompleteMockExamGrades(
  questionIds: readonly string[],
  results: readonly MockExamGradeResult[] | null | undefined,
): Map<string, MockExamGradeResult> {
  if (!Array.isArray(results) || !questionIds.length || results.length !== questionIds.length) {
    throw new Error("Mock exam grading returned an incomplete result");
  }

  const expected = new Set(questionIds);
  if (expected.size !== questionIds.length) {
    throw new Error("Mock exam contains duplicate question identifiers");
  }

  const byId = new Map<string, MockExamGradeResult>();
  for (const item of results) {
    if (
      !item || typeof item.question_id !== "string" ||
      typeof item.correct_answer !== "string" ||
      !item.correct_answer.trim() ||
      !expected.has(item.question_id) ||
      byId.has(item.question_id)
    ) {
      throw new Error("Mock exam grading returned missing or unrecognised answers");
    }
    byId.set(item.question_id, item);
  }
  return byId;
}
