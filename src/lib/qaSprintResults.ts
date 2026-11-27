/** A formative sprint outcome records independent first attempts, not revealed answers.
 * Retry selection uses the original ordered question IDs, never a newly randomised set. */
export function summariseSprint(
  ids: readonly string[],
  firstAttempts: Readonly<Record<string, boolean>>,
) {
  const unique = [...new Set(ids.filter(id => typeof id === "string" && id.length > 0))];
  let correct = 0, missed = 0, unattempted = 0;
  const retryIds: string[] = [];
  for (const id of unique) {
    const attempt = Object.prototype.hasOwnProperty.call(firstAttempts, id) ? firstAttempts[id] : undefined;
    if (attempt === true) correct++;
    else {
      if (attempt === false) missed++;
      else unattempted++;
      retryIds.push(id);
    }
  }
  return { total: unique.length, attempted: correct + missed, correct, missed, unattempted, retryIds };
}

export function sprintAcceptsAttempt({
  id, activeId, deadline, now,
}: {
  id: string; activeId: string | undefined; deadline: number | null; now: number;
}): boolean {
  return Boolean(activeId && id === activeId && Number.isFinite(now) &&
    (deadline === null || (Number.isFinite(deadline) && now < deadline)));
}

/** A focused retry is an ordered subset of the original sprint, independent
 * of changes to the current search, due-date, or bookmark filters. */
export function selectSprintRetryIds(
  ids: readonly string[],
  firstAttempts: Readonly<Record<string, boolean>>,
  focus: "missed" | "unattempted",
): string[] {
  return [...new Set(ids.filter(id => typeof id === "string" && id.length > 0))].filter(id => {
    const attempted = Object.prototype.hasOwnProperty.call(firstAttempts, id) ? firstAttempts[id] : undefined;
    return focus === "missed" ? attempted === false : attempted !== true && attempted !== false;
  });
}
