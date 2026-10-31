/** Only authored question references travel in a report URL.
 * Never include submitted answers, student identifiers or AI transcripts.
 */
const SAFE_ID = /^[a-z0-9][a-z0-9_-]{0,110}$/i;
const SAFE_QUESTION_ID = /^[a-z0-9][a-z0-9_:-]{0,110}$/i;

export interface ContentReportContext {
  questionId: string;
  tutorialId: string;
}

function validContentReference(questionId: string, tutorialId: string): boolean {
  if (!SAFE_QUESTION_ID.test(questionId) || !SAFE_ID.test(tutorialId)) return false;
  const prefix = questionId.startsWith(tutorialId + "-") ? tutorialId + "-" :
    questionId.startsWith(tutorialId + ":") ? tutorialId + ":" : null;
  return Boolean(prefix && /^\d{1,3}$/.test(questionId.slice(prefix.length)));
}

export function contentReportHref(questionId: string, tutorialId: string): string {
  if (!validContentReference(questionId, tutorialId)) {
    throw new RangeError("Invalid content reference");
  }
  const query = new URLSearchParams({ report: "content", question: questionId, tutorial: tutorialId });
  return "/support?" + query.toString();
}

export function parseContentReportParams(params: URLSearchParams): ContentReportContext | null {
  if (params.get("report") !== "content") return null;
  const questionId = params.get("question") || "";
  const tutorialId = params.get("tutorial") || "";
  return validContentReference(questionId, tutorialId) ? { questionId, tutorialId } : null;
}

export function attachContentReportReference(message: string, context: ContentReportContext | null): string {
  if (!context) return message;
  return message.trim() + "\n\nContent reference: " + context.questionId + " (lesson " + context.tutorialId + ")";
}
