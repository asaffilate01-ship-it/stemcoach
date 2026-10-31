/** Calendar keys must follow the learner's local day, not UTC midnight. */
export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface StudyCalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
}

/** Monday-first, full-week calendar with local date keys across DST changes. */
export function getMonthDays(year: number, month: number): StudyCalendarDay[] {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) {
    throw new RangeError("Invalid calendar month");
  }
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const monthLength = new Date(year, month + 1, 0).getDate();
  const slotCount = Math.ceil((firstWeekday + monthLength) / 7) * 7;

  return Array.from({ length: slotCount }, (_, index) => {
    const date = new Date(year, month, 1 + index - firstWeekday);
    return {
      date: localDateKey(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month && date.getFullYear() === year,
    };
  });
}

interface StudyActivity {
  completed_questions: number | null;
}

/** A day counts for the activity streak only when questions were completed.
 * Today may still be in progress; yesterday then starts the streak.
 * Returns at most maxDays from the bounded activity query.
 */
export function calculateStudyStreak(
  byDate: Readonly<Record<string, StudyActivity | undefined>>,
  today: Date = new Date(),
  maxDays = 400,
): number {
  if (!Number.isInteger(maxDays) || maxDays < 1) return 0;
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let streak = 0;

  for (let checked = 0; checked < maxDays; checked++) {
    const completed = byDate[localDateKey(date)]?.completed_questions ?? 0;
    if (Number.isFinite(completed) && completed > 0) {
      streak++;
    } else if (checked !== 0) {
      break;
    }
    date.setDate(date.getDate() - 1);
  }
  return streak;
}

export function studyGoalPercent(completed: number | null, target: number | null): number {
  if (!Number.isFinite(completed) || !Number.isFinite(target) || !target || target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((Math.max(0, completed ?? 0) / target) * 100)));
}

export function validStudyTargets(questions: number, minutes: number): boolean {
  return Number.isInteger(questions) && questions >= 1 && questions <= 100 &&
    Number.isInteger(minutes) && minutes >= 5 && minutes <= 300;
}
