/** Pure helpers for a targeted review session. No learner data is persisted or shared. */
export interface DrillQuestionIdentity {
  id: string;
  subject: string;
  topic: string;
}

export interface DrillFocus {
  subject: string;
  topic: string;
}

export interface DrillTopic extends DrillFocus {
  questionCount: number;
}

export function parseDrillOptions(input: unknown): string[] {
  let parsed = input;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((option): option is string => typeof option === "string" && option.trim().length > 0).slice(0, 12);
}

/** De-duplicate by question ID; never mix subjects sharing the same topic name. */
export function selectDrillQuestions<T extends DrillQuestionIdentity>(
  questions: readonly T[],
  focus?: DrillFocus | null,
): T[] {
  const seen = new Set<string>();
  return questions.filter((question) => {
    if (!question.id || seen.has(question.id)) return false;
    if (focus && (question.subject !== focus.subject || question.topic !== focus.topic)) return false;
    seen.add(question.id);
    return true;
  });
}

export function listDrillTopics<T extends DrillQuestionIdentity>(questions: readonly T[]): DrillTopic[] {
  const grouped = new Map<string, DrillTopic>();
  for (const question of selectDrillQuestions(questions)) {
    const key = JSON.stringify([question.subject, question.topic]);
    const found = grouped.get(key);
    if (found) found.questionCount++;
    else grouped.set(key, { subject: question.subject, topic: question.topic, questionCount: 1 });
  }
  return [...grouped.values()].sort((a, b) =>
    b.questionCount - a.questionCount || a.subject.localeCompare(b.subject) || a.topic.localeCompare(b.topic)
  );
}
