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

function validCount(value: unknown): number {
  return Number.isSafeInteger(value) && Number(value) >= 0
    ? Math.min(Number(value), 10_000)
    : 0;
}

export function parseReviewHistory(raw: string | null, validIds: ReadonlySet<string>): ReviewHistory {
  if (!raw || raw.length > 250_000) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const record = parsed as { version?: unknown; entries?: unknown };
    if (record.version !== 1 || !record.entries || typeof record.entries !== "object" || Array.isArray(record.entries)) return {};
    const history: ReviewHistory = {};
    for (const [id, val] of Object.entries(record.entries).slice(0, MAX_ENTRIES)) {
      if (!validIds.has(id) || !val || typeof val !== "object" || Array.isArray(val)) continue;
      const row = val as Partial<QuestionHistory>;
      const lastAt = Number(row.lastAt);
      const dueAt = Number(row.dueAt);
      if (!Number.isFinite(lastAt) || !Number.isFinite(dueAt) ||
        lastAt < 0 || dueAt < 0) continue;
      history[id] = {
        attempts: validCount(row.attempts),
        correctFirst: validCount(row.correctFirst),
        incorrectFirst: validCount(row.incorrectFirst),
        firstTryStreak: validCount(row.firstTryStreak),
        lastAt,
        dueAt,
      };
    }
    return history;
  } catch {
    return {};
  }
}

export function serialiseReviewHistory(history: ReviewHistory): string {
  const entries = Object.fromEntries(Object.entries(history).slice(-MAX_ENTRIES));
  return JSON.stringify({ version: 1, entries });
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
  if (!Number.isFinite(now) || now <= 0) return history;
  // A reveal followed by typing the displayed solution is not independent learning evidence.
  if (!firstAttempt && !history[id]) return history;
  const existing = history[id] || {
    attempts: 0, correctFirst: 0, incorrectFirst: 0, firstTryStreak: 0, lastAt: 0, dueAt: 0,
  };
  const streak = firstAttempt ? (correct ? existing.firstTryStreak + 1 : 0) : existing.firstTryStreak;
  const dueAt = firstAttempt
    ? correct
      ? now + Math.min(14, streak === 1 ? 1 : streak === 2 ? 3 : 7) * DAY
      : now
    : correct
      ? Math.min(existing.dueAt || now + DAY, now + DAY)
      : existing.dueAt;
  return {
    ...history,
    [id]: {
      attempts: existing.attempts + (firstAttempt ? 1 : 0),
      correctFirst: existing.correctFirst + Number(firstAttempt && correct),
      incorrectFirst: existing.incorrectFirst + Number(firstAttempt && !correct),
      firstTryStreak: streak,
      lastAt: now,
      dueAt,
    },
  };
}

export function reviewPriority(id: string, history: ReviewHistory, now: number): number {
  const item = history[id];
  if (!item || item.attempts === 0) return 5;
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
  const available = [...source];
  const selected: T[] = [];
  const bySubject = new Map<string, number>();
  const byFormat = new Map<string, number>();
  while (available.length && selected.length < Math.min(Math.max(0, count), 50)) {
    const weights = available.map((candidate) => {
      if (kind === "mixed") return 1;
      const priority = reviewPriority(candidate.id, history, now);
      return priority / (1 + (bySubject.get(candidate.subject) || 0) * 0.55 +
        (byFormat.get(candidate.format) || 0) * 0.2);
    });
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let target = Math.min(0.999999, Math.max(0, random())) * total;
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
  const practiced = source.filter((entry) => (history[entry.id]?.attempts || 0) > 0);
  const due = practiced.filter((entry) => history[entry.id].dueAt <= now).length;
  const topics = new Map<string, { topic: string; misses: number }>();
  for (const entry of practiced) {
    const misses = history[entry.id].incorrectFirst;
    if (misses <= 0) continue;
    const key = entry.subject + ":" + entry.topic;
    const current = topics.get(key);
    topics.set(key, { topic: entry.topic, misses: (current?.misses || 0) + misses });
  }
  return {
    practiced: practiced.length,
    due,
    weakTopics: [...topics.values()].sort((a, b) => b.misses - a.misses).slice(0, 3),
  };
}
