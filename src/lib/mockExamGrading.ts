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


/** Current deployed endpoint contract. This is response consistency validation,
 * not a durable session receipt or proof of atomic server-side charging.
 */
export interface MockExamSubmittedAnswer {
  question_id: string;
  answer: string | null;
}
export interface ConfirmedMockExamGrade extends MockExamGradeResult {
  answer: string | null;
  correct: boolean;
}
export interface ConfirmedMockExamResult {
  score: number;
  total: number;
  percent: number;
  certificateIssued: boolean;
  byId: ReadonlyMap<string, ConfirmedMockExamGrade>;
}

/** Keep the server's judgement authoritative (including normalised answers).
 * Never reconstruct marks from displayed answer-key text. */
export function requireConfirmedMockExamResult(
  submissions: readonly MockExamSubmittedAnswer[], response: unknown,
): ConfirmedMockExamResult {
  const invalid = () => new Error("Mock exam grading returned an inconsistent result");
  if (!response || typeof response !== "object" || Array.isArray(response) ||
      !Array.isArray(submissions) || submissions.length < 1 || submissions.length > 100) throw invalid();
  const body = response as Record<string, unknown>;
  const submitted = new Map<string, string | null>();
  for (const row of submissions) {
    if (!row || typeof row.question_id !== "string" || !row.question_id ||
        submitted.has(row.question_id) || (row.answer !== null && typeof row.answer !== "string")) throw invalid();
    submitted.set(row.question_id, row.answer);
  }
  const { score, total, percent, certificate_issued, results } = body;
  if (typeof score !== "number" || !Number.isSafeInteger(score) ||
      typeof total !== "number" || total !== submitted.size ||
      score < 0 || score > total || percent !== Math.round(score / total * 100) ||
      typeof certificate_issued !== "boolean" || (certificate_issued && Number(percent) < 60) ||
      !Array.isArray(results)) throw invalid();
  const rows = requireCompleteMockExamGrades([...submitted.keys()], results);
  const byId = new Map<string, ConfirmedMockExamGrade>();
  let counted = 0;
  for (const [id, value] of rows) {
    const row = value as ConfirmedMockExamGrade;
    if (typeof row.correct !== "boolean" || row.answer !== submitted.get(id) ||
        (row.correct && (row.answer === null || !row.answer.trim())) ||
        (row.explanation !== null && typeof row.explanation !== "string") ||
        (row.worked_solution !== null && typeof row.worked_solution !== "string")) throw invalid();
    counted += Number(row.correct);
    byId.set(id, {
      question_id: id, answer: row.answer, correct: row.correct,
      correct_answer: row.correct_answer, explanation: row.explanation, worked_solution: row.worked_solution,
    });
  }
  if (score !== counted) throw invalid();
  return { score, total, percent: Number(percent), certificateIssued: certificate_issued, byId };
}
