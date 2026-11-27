/** Staging-only contract prototype. Not imported by the live Edge Function.
 * Bind exam submission to a server-owned session, not client-selected questions.
 * This validates evidence; it does not perform transactional grading or consume allowance.
 */
export interface ExamSubmission { question_id: string; answer: string | null }
export interface SessionQuestion { id: string; revision: number }
export interface MockSession {
  id: string;
  userId: string;
  expiresAt: number;
  subject: string;
  curriculum: string;
  questions: readonly SessionQuestion[];
}
export interface PublishedQuestion {
  id: string;
  subject: string;
  curriculum: string;
  review_status: string;
  review_revision: number;
  question_type: string;
  correct_answer: string | null;
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MOCK_TYPES = new Set(["mcq", "code", "data-interpretation", "assertion-reason"]);
const validId = (id: unknown): id is string => typeof id === "string" && UUID.test(id);
const exactKeys = (value: unknown, keys: readonly string[]): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(key => Object.prototype.hasOwnProperty.call(value, key)));
const validRevision = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0;

function questionSet(session: MockSession): Map<string, SessionQuestion> {
  if (!session || !validId(session.id) || !validId(session.userId) ||
      !session.subject || !session.curriculum || !Array.isArray(session.questions) ||
      session.questions.length < 1 || session.questions.length > 100) throw new Error("Invalid server-owned exam session");
  const map = new Map<string, SessionQuestion>();
  for (const question of session.questions) {
    if (!question || !validId(question.id) || !validRevision(question.revision) ||
        map.has(question.id.toLowerCase())) throw new Error("Invalid server-owned question set");
    map.set(question.id.toLowerCase(), question);
  }
  return map;
}

/** New submissions only: replay lookup must precede expiry checks inside the transaction.
 * The authenticated identity and the session snapshot must come from trusted server storage.
 */
export function bindNewMockSubmission(
  authenticatedUserId: string, session: MockSession, body: unknown, now: number,
): ExamSubmission[] {
  const expected = questionSet(session);
  if (!validId(authenticatedUserId) || authenticatedUserId.toLowerCase() !== session.userId.toLowerCase()) {
    throw new Error("Exam session unavailable");
  }
  if (!Number.isFinite(now) || !Number.isFinite(session.expiresAt) || now >= session.expiresAt) {
    throw new Error("Exam session expired");
  }
  if (!exactKeys(body, ["exam_session_id", "submissions"]) || !validId(body.exam_session_id) ||
      body.exam_session_id.toLowerCase() !== session.id.toLowerCase() ||
      !Array.isArray(body.submissions) || body.submissions.length !== expected.size) {
    throw new Error("Submission must match the assigned exam");
  }
  const byId = new Map<string, ExamSubmission>();
  for (const entry of body.submissions) {
    if (!exactKeys(entry, ["question_id", "answer"]) || !validId(entry.question_id)) throw new Error("Invalid submission row");
    const id = entry.question_id.toLowerCase();
    if (!expected.has(id) || byId.has(id)) throw new Error("Submission must match the assigned exam");
    if (entry.answer !== null && (typeof entry.answer !== "string" || entry.answer.length > 2000 || entry.answer.includes("\u0000"))) {
      throw new Error("Invalid exam answer");
    }
    byId.set(id, { question_id: id, answer: typeof entry.answer === "string" ? entry.answer.trim() || null : null });
  }
  // Stable order for a receipt payload: client ordering is not trusted.
  return [...expected.keys()].map(id => byId.get(id)!);
}

/** Run on current rows under the transaction's locks, before attempt/quota writes.
 * Does not infer academic approval from publication status.
 */
export function requireCurrentMockKeys(session: MockSession, rows: readonly PublishedQuestion[]): Map<string, PublishedQuestion> {
  const expected = questionSet(session);
  if (!Array.isArray(rows) || rows.length !== expected.size) throw new Error("Assigned questions unavailable");
  const byId = new Map<string, PublishedQuestion>();
  for (const row of rows) {
    if (!row || !validId(row.id)) throw new Error("Assigned questions unavailable");
    const id = row.id.toLowerCase(), snapshot = expected.get(id);
    if (!snapshot || byId.has(id) || row.review_status !== "published" ||
        row.review_revision !== snapshot.revision || row.subject !== session.subject ||
        row.curriculum !== session.curriculum || !MOCK_TYPES.has(row.question_type) ||
        typeof row.correct_answer !== "string" || !row.correct_answer.trim()) {
      throw new Error("Assigned question changed or is not gradeable");
    }
    byId.set(id, row);
  }
  return byId;
}
