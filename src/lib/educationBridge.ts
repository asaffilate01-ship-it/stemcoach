/**
 * STEMCoach Education Bridge v1.
 *
 * The learner's own progress can be shown or downloaded locally. No names,
 * account IDs, raw answers, tokens or school identifiers enter the digest.
 * This is NOT a remote grade-sync/SSO implementation.
 */
export interface MasteryEvidence {
  curriculum: string;
  subject: string;
  topic: string;
  mastery_score: number;
  confidence_score: number;
  attempts: number;
  correct_attempts: number;
  next_review_at: string | null;
}

export interface RevisionPriority {
  subject: string;
  topic: string;
  mastery: number;
  attempts: number;
  due: boolean;
  practicePath: string;
}

export interface SharedSubjectDigest {
  curriculum: string;
  subject: string;
  topics: number;
  averageMastery: number;
  dueTopics: number;
  attempts: number;
}

export interface LearnerProgressDigest {
  version: "stemcoach.learning-summary.v1";
  generatedAt: string;
  topicsReviewed: number;
  totalAttempts: number;
  subjects: SharedSubjectDigest[];
}

function allowed(row: MasteryEvidence): boolean {
  return /^[a-z0-9-]{1,64}$/.test(row.subject) &&
    /^[a-z0-9_-]{2,80}$/i.test(row.curriculum) &&
    row.topic.trim().length > 0 &&
    row.topic.length <= 160 &&
    Number.isFinite(row.mastery_score) &&
    row.mastery_score >= 0 && row.mastery_score <= 100 &&
    Number.isSafeInteger(row.attempts) && row.attempts >= 0 &&
    Number.isSafeInteger(row.correct_attempts) &&
    row.correct_attempts >= 0 && row.correct_attempts <= row.attempts;
}

function canonicalRows(rows: MasteryEvidence[]): MasteryEvidence[] {
  // Bounded and deterministic even if a server response is unexpectedly large.
  return rows.filter(allowed).slice(0, 500);
}

/** Prioritise review due now, then low mastery, then subjects with less practice. */
export function revisionPriorities(
  rows: MasteryEvidence[],
  now: Date,
  limit = 6,
): RevisionPriority[] {
  const cutoff = now.getTime();
  if (!Number.isFinite(cutoff)) return [];
  return canonicalRows(rows)
    .map((row) => ({
      subject: row.subject,
      topic: row.topic,
      mastery: Math.round(row.mastery_score),
      attempts: row.attempts,
      due: row.next_review_at != null &&
        Number.isFinite(Date.parse(row.next_review_at)) &&
        Date.parse(row.next_review_at) <= cutoff,
      practicePath: "/practice/" + encodeURIComponent(row.subject) + "?mode=focus",
    }))
    .sort((a, b) => Number(b.due) - Number(a.due) ||
      a.mastery - b.mastery || a.attempts - b.attempts ||
      a.subject.localeCompare(b.subject) || a.topic.localeCompare(b.topic))
    .slice(0, Math.max(0, Math.min(10, Math.floor(limit))));
}

/**
 * On-device, learner-initiated export ONLY. Intentionally excludes topic names
 * as well as user IDs, other personal details, chat, submissions, answers and grades.
 */
export function safeLearnerProgressDigest(rows: MasteryEvidence[], now: Date): LearnerProgressDigest {
  if (!Number.isFinite(now.getTime())) throw new Error("Invalid report date");
  const included = canonicalRows(rows);
  const grouped = new Map<string, { curriculum: string; subject: string; scores: number[]; due: number; attempts: number }>();
  for (const row of included) {
    const key = row.curriculum + ":" + row.subject;
    if (!grouped.has(key)) {
      grouped.set(key, { curriculum: row.curriculum, subject: row.subject, scores: [], due: 0, attempts: 0 });
    }
    const entry = grouped.get(key)!;
    entry.scores.push(row.mastery_score);
    entry.attempts += row.attempts;
    if (row.next_review_at && Number.isFinite(Date.parse(row.next_review_at)) &&
      Date.parse(row.next_review_at) <= now.getTime()) entry.due += 1;
  }
  const subjects = [...grouped.values()]
    .sort((a, b) => a.curriculum.localeCompare(b.curriculum) || a.subject.localeCompare(b.subject))
    .slice(0, 30)
    .map((row) => ({
      curriculum: row.curriculum,
      subject: row.subject,
      topics: row.scores.length,
      averageMastery: Math.round(row.scores.reduce((sum, score) => sum + score, 0) / row.scores.length),
      dueTopics: row.due,
      attempts: row.attempts,
    }));
  return {
    version: "stemcoach.learning-summary.v1",
    generatedAt: now.toISOString(),
    topicsReviewed: subjects.reduce((total, item) => total + item.topics, 0),
    totalAttempts: subjects.reduce((total, item) => total + item.attempts, 0),
    subjects,
  };
}
