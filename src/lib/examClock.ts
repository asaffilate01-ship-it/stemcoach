/** Learner-side wall-clock deadline: elapsed time is not tied to timer callback count.
 * This only improves client display; production assessment limits still require
 * server-side enforcement and idempotent scoring.
 */
export function examDeadline(durationMinutes: number, nowMs = Date.now()): number {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 ||
      durationMinutes > 480 || !Number.isFinite(nowMs)) {
    throw new RangeError("Invalid mock exam duration");
  }
  return nowMs + durationMinutes * 60_000;
}

/** Rounds partial remaining seconds upward so the UI never ends early. */
export function secondsToExamDeadline(deadlineMs: number, nowMs = Date.now()): number {
  if (!Number.isFinite(deadlineMs) || !Number.isFinite(nowMs)) return 0;
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}
