import { fsrs, createEmptyCard, Rating, type Card } from "ts-fsrs";
export type StoredCard = Omit<Card, "due" | "last_review"> & { due: number; last_review?: number };
const scheduler = fsrs({ enable_fuzz: false, maximum_interval: 30 });
export function readCard(value: unknown): StoredCard | undefined {
  if (!value || typeof value !== "object") return;
  const row = value as StoredCard;
  const fields = ["due", "stability", "difficulty", "scheduled_days", "learning_steps", "reps", "lapses", "state"] as const;
  if (!fields.every(key => typeof row[key] === "number" && Number.isFinite(row[key]) && row[key] >= 0)) return;
  if (row.difficulty > 10 || row.stability > 36500 || row.state > 3 || !Number.isInteger(row.state) || row.reps > 10000 || row.lapses > row.reps || (row.last_review !== undefined && (!Number.isFinite(row.last_review) || row.last_review < 0))) return;
  return Object.fromEntries([...fields.map(key => [key,row[key]]), ...(row.last_review !== undefined ? [["last_review",row.last_review]] : [])]) as unknown as StoredCard;
}
export function scheduleReview(previous: StoredCard | undefined, correct: boolean, now: number): StoredCard {
  const valid = readCard(previous);
  const card: Card = valid ? { ...valid, due: new Date(valid.due), last_review: valid.last_review === undefined ? undefined : new Date(valid.last_review) } : createEmptyCard(new Date(now));
  const next = scheduler.next(card, new Date(now), correct ? Rating.Good : Rating.Again).card;
  return { ...next, due: next.due.getTime(), last_review: next.last_review?.getTime() };
}
