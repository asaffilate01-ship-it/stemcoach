/** Private-to-this-device revision metadata: no typed answers or question text stored. */
export const QA_HISTORY_KEY = "stemcoach:qa-review-v1";
export const QA_BOOKMARKS_KEY = "stemcoach:qa-bookmarks-v1";

export interface QuestionHistory {
  attempts: number;
  correctFirst: number;
  incorrectFirst: number;
  firstTryStreak: number;
  lastAt: number;
  dueAt: number;
}
export type ReviewHistory = Record<string, QuestionHistory>;

export interface ReviewCandidate {
  id: string;
  subject: string;
  format: string;
  topic: string;
}

const DAY = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 1500;
const MAX_BOOKMARKS = 500;

const MAX_ATTEMPTS_PER_QUESTION = 10_000;
const MAX_DATE_MS = 8_640_000_000_000_000;
const MAX_HISTORY_BYTES = 250_000;
const isCount = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const isTimestamp = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= MAX_DATE_MS;
const safeHistoryId = (id: string) => id.length > 0 && id.length <= 180 && !["__proto__", "prototype", "constructor"].includes(id);

/** Validate the original evidence before bounding it. Preserve a consistent
 * sample of at most 10,000 attempts rather than independently clipping counts. */
function cleanHistoryRow(value: unknown): QuestionHistory | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const row = value as Partial<QuestionHistory>;
  const { attempts, correctFirst, incorrectFirst, firstTryStreak, lastAt, dueAt } = row;
  if (!isCount(attempts) || !isCount(correctFirst) || !isCount(incorrectFirst) ||
      !isCount(firstTryStreak) || attempts === 0 || correctFirst > attempts ||
      incorrectFirst !== attempts - correctFirst || firstTryStreak > correctFirst ||
      !isTimestamp(lastAt) || !isTimestamp(dueAt)) return undefined;
  const bounded = Math.min(attempts, MAX_ATTEMPTS_PER_QUESTION);
  const correct = attempts === bounded ? correctFirst : Math.round(correctFirst / attempts * bounded);
  return {
    attempts: bounded, correctFirst: correct, incorrectFirst: bounded - correct,
    firstTryStreak: Math.min(firstTryStreak, correct), lastAt, dueAt,
  };
}

export function getQuestionHistory(history: ReviewHistory, id: string): QuestionHistory | undefined {
  if (!safeHistoryId(id) || !Object.prototype.hasOwnProperty.call(history, id)) return undefined;
  return cleanHistoryRow(history[id]);
}

/** Retain the most recently practised valid entries, with a stable tie-break. */
function boundHistory(history: ReviewHistory): ReviewHistory {
  return Object.fromEntries(Object.keys(history)
    .flatMap(id => {
      const row = getQuestionHistory(history, id);
      return row ? [[id, row] as const] : [];
    })
    .sort((a,b) => b[1].lastAt - a[1].lastAt || a[0].localeCompare(b[0]))
    .slice(0, MAX_ENTRIES));
}

export function parseReviewHistory(raw: string | null, validIds: ReadonlySet<string>): ReviewHistory {
  if (!raw || raw.length > MAX_HISTORY_BYTES) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const record = parsed as { version?: unknown; entries?: unknown };
    if (record.version !== 1 || !record.entries || typeof record.entries !== "object" || Array.isArray(record.entries)) return {};
    const entries: [string, QuestionHistory][] = [];
    for (const [id, val] of Object.entries(record.entries)) {
      if (!validIds.has(id) || !safeHistoryId(id)) continue;
      const row = cleanHistoryRow(val);
      if (row) entries.push([id,row]);
    }
    return boundHistory(Object.fromEntries(entries));
  } catch {
    return {};
  }
}

export function serialiseReviewHistory(history: ReviewHistory): string {
  const entries = Object.entries(boundHistory(history));
  let output = JSON.stringify({ version: 1, entries: Object.fromEntries(entries) });
  // Enforce the same input and output size contract, dropping oldest rows first.
  while (output.length > MAX_HISTORY_BYTES && entries.length) {
    entries.splice(Math.max(0, entries.length - 50));
    output = JSON.stringify({ version: 1, entries: Object.fromEntries(entries) });
  }
  return output;
}

/** Store only known question IDs; never save submitted free text or answer keys. */
export function parseBookmarks(raw: string | null, validIds: ReadonlySet<string>): string[] {
  if (!raw || raw.length > 40_000) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id): id is string =>
      typeof id === "string" && validIds.has(id)))].slice(0, MAX_BOOKMARKS);
  } catch {
    return [];
  }
}

export function serialiseBookmarks(ids: readonly string[]): string {
  return JSON.stringify([...new Set(ids)].slice(0, MAX_BOOKMARKS));
}

/** First-try accuracy drives review intervals; fixing a mistake doesn't erase it. */
export function recordReviewAttempt(
  history: ReviewHistory, id: string, correct: boolean, firstAttempt: boolean, now: number,
): ReviewHistory {
  if (!isTimestamp(now) || now <= 0 || !safeHistoryId(id)) return history;
  const prior = getQuestionHistory(history, id);
  // A reveal followed by typing the displayed solution is not independent learning evidence.
  if (!firstAttempt && !prior) return history;
  const existing = prior || {
    attempts: 0, correctFirst: 0, incorrectFirst: 0, firstTryStreak: 0, lastAt: 0, dueAt: 0,
  };
  const streak = firstAttempt ? (correct ? Math.min(MAX_ATTEMPTS_PER_QUESTION, existing.firstTryStreak + 1) : 0) : existing.firstTryStreak;
  const dueAt = firstAttempt
    ? correct
      ? Math.min(MAX_DATE_MS, now + (streak === 1 ? 1 : streak === 2 ? 3 : 7) * DAY)
      : now
    : correct
      ? Math.min(existing.dueAt || now + DAY, now + DAY, MAX_DATE_MS)
      : existing.dueAt;
  const next = cleanHistoryRow({
    attempts: existing.attempts + Number(firstAttempt),
    correctFirst: existing.correctFirst + Number(firstAttempt && correct),
    incorrectFirst: existing.incorrectFirst + Number(firstAttempt && !correct),
    firstTryStreak: streak,
    lastAt: now,
    dueAt,
  });
  if (!next) return history;
  return boundHistory({ ...history, [id]: next });
}

export function reviewPriority(id: string, history: ReviewHistory, now: number): number {
  const item = getQuestionHistory(history, id);
  if (!item) return 5;
  const weakness = item.incorrectFirst / Math.max(1, item.attempts);
  const isDue = item.dueAt <= now;
  // Due and previously missed material has strongest weight; fresh mastered
  // items stay eligible at lower weight for occasional mixing.
  return (isDue ? 9 : 1) + weakness * 10 + Math.min(item.incorrectFirst, 5) * 1.5;
}

/** Weighted sampling without replacement; dependency-injected RNG makes it testable. */
export function buildReviewQueue<T extends ReviewCandidate>(
  source: readonly T[], history: ReviewHistory, count: number, kind: "mixed" | "adaptive",
  now = Date.now(), random: () => number = Math.random,
): T[] {
  const available = [...new Map(source.filter(item => safeHistoryId(item.id)).map(item => [item.id, item])).values()];
  const selected: T[] = [];
  const bySubject = new Map<string, number>();
  const byFormat = new Map<string, number>();
  const limit = Number.isFinite(count) ? Math.min(Math.max(0, Math.floor(count)), 50) : 0;
  while (available.length && selected.length < limit) {
    const weights = available.map((candidate) => {
      if (kind === "mixed") return 1;
      const priority = reviewPriority(candidate.id, history, now);
      return priority / (1 + (bySubject.get(candidate.subject) || 0) * 0.55 +
        (byFormat.get(candidate.format) || 0) * 0.2);
    });
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    const draw = random();
    let target = (Number.isFinite(draw) ? Math.min(0.999999, Math.max(0, draw)) : 0) * total;
    let index = weights.length - 1;
    for (let i = 0; i < weights.length; i++) {
      target -= weights[i];
      if (target < 0) { index = i; break; }
    }
    const [picked] = available.splice(index, 1);
    selected.push(picked);
    bySubject.set(picked.subject, (bySubject.get(picked.subject) || 0) + 1);
    byFormat.set(picked.format, (byFormat.get(picked.format) || 0) + 1);
  }
  return selected;
}

export function getReviewSummary(source: readonly ReviewCandidate[], history: ReviewHistory, now = Date.now()) {
  const unique = [...new Map(source.map(entry => [entry.id, entry])).values()];
  const practiced = unique.flatMap(entry => {
    const row = getQuestionHistory(history, entry.id);
    return row ? [{ entry, row }] : [];
  });
  const due = practiced.filter(({row}) => row.dueAt <= now).length;
  const topics = new Map<string, { topic: string; misses: number }>();
  for (const {entry,row} of practiced) {
    const misses = row.incorrectFirst;
    if (misses <= 0) continue;
    const key = entry.subject + ":" + entry.topic;
    const current = topics.get(key);
    topics.set(key, { topic: entry.topic, misses: (current?.misses || 0) + misses });
  }
  const firstTryAttempts = practiced.reduce((sum, {row}) => sum + row.attempts, 0);
  const firstTryCorrect = practiced.reduce((sum, {row}) => sum + row.correctFirst, 0);
  return {
    practiced: practiced.length,
    due,
    firstTryAttempts,
    firstTryCorrect,
    firstTryAccuracy: firstTryAttempts > 0 ? Math.round(firstTryCorrect / firstTryAttempts * 100) : null,
    weakTopics: [...topics.values()].sort((a, b) => b.misses - a.misses).slice(0, 3),
  };
}
