/** User-selected formative revision lengths; no AI credits or formal exam grades. */
export const SPRINT_SIZES = [5, 10, 20] as const;
export type SprintSize = (typeof SPRINT_SIZES)[number];

export function sprintQuestionCount(available: number, requested: SprintSize): number {
  if (!Number.isSafeInteger(available) || available <= 0) return 0;
  return Math.min(available, requested);
}

/** A five-, ten-, or twenty-question timed sprint gets 3, 5 or 10 minutes. */
export function sprintDurationSeconds(requested: SprintSize): number {
  switch (requested) {
    case 5: return 3 * 60;
    case 10: return 5 * 60;
    case 20: return 10 * 60;
    default: throw new RangeError("Invalid sprint size");
  }
}

export function parseSprintSize(value: string): SprintSize {
  const numeric = Number(value);
  if (numeric === 5 || numeric === 10 || numeric === 20) return numeric;
  return 10;
}

/** No extra ten-minute allocation if a filter only contains a short set. */
export function effectiveSprintDurationSeconds(available: number, requested: SprintSize): number {
  const count = sprintQuestionCount(available, requested);
  if (!count) return 0;
  return sprintDurationSeconds(count <= 5 ? 5 : count <= 10 ? 10 : 20);
}
