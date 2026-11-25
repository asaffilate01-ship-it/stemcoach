import { launchCurricula, isLaunchCurriculum, launchSubjects } from "@/lib/launchDiscovery";

export interface LaunchPracticeFilters {
  curricula: string[];
  qualification: string | null;
  boards: string[];
  difficulty: number | null;
  topic?: string;
}

export function validPracticeTopic(value:unknown):value is string {
  return typeof value==="string"&&value.length>0&&value.length<=160&&value.trim()===value&&!/[\u0000-\u001f\u007f]/u.test(value);
}

export function readPracticeFilters(params: URLSearchParams): LaunchPracticeFilters | null {
  const requested = params.getAll("curriculum");
  const qualifications = params.getAll("qualification");
  const difficulties = params.getAll("difficulty");
  const topics = params.getAll("topic");
  if(topics.length>1||topics.some(topic=>!validPracticeTopic(topic)))return null;
  if (requested.some(id => !isLaunchCurriculum(id)) || qualifications.length > 1 || difficulties.length > 1) return null;
  const curricula = requested.length ? [...new Set(requested)] : launchCurricula.map(c => c.id);
  const qualification = qualifications[0] || null;
  if (qualifications.length && (!qualification || !curricula.includes(qualification))) return null;
  const boards = [...new Set(params.getAll("board"))];
  const allowedBoards = new Set(launchCurricula.filter(c => curricula.includes(c.id)).flatMap(c => c.boards));
  if (boards.some(board => !allowedBoards.has(board))) return null;
  if (difficulties.length && !/^[1-5]$/.test(difficulties[0])) return null;
  return { curricula, qualification, boards, difficulty: difficulties.length ? Number(difficulties[0]) : null, ...(topics.length?{topic:topics[0]}:{}) };
}

export function choosePracticeCurriculum(filters: LaunchPracticeFilters, savedId?: string | null): string | null {
  if (filters.qualification) return filters.qualification;
  if (filters.curricula.length === 1) return filters.curricula[0];
  if (savedId && filters.curricula.includes(savedId)) return savedId;
  return null;
}

export function buildPracticePath(subject: string, curricula: string[], boards: string[], difficulty: number | null) {
  if (!launchSubjects.some(s => s.id === subject)) throw new Error("Unknown launch subject");
  const params = new URLSearchParams();
  for (const id of curricula) params.append("curriculum", id);
  for (const board of boards) params.append("board", board);
  if (difficulty !== null) params.set("difficulty", String(difficulty));
  if (!readPracticeFilters(params)) throw new Error("Invalid launch filters");
  return "/practice/" + encodeURIComponent(subject) + "?" + params.toString();
}

/** The existing server RPC returns a bounded, curriculum-specific sample.
 * Narrow that sample without requesting a broader curriculum or making an
 * assertion about the total number of matching database questions.
 */
export function narrowPracticeSample<T extends { curriculum?: string; subject: string; boards: string[]; difficulty: number; topic?: string }>(rows: T[], subject: string, curriculum: string, filters: LaunchPracticeFilters): T[] {
  return rows.filter(row =>
    row.curriculum === curriculum && row.subject === subject &&
    (filters.topic === undefined || row.topic === filters.topic) &&
    (!filters.boards.length || (Array.isArray(row.boards) && row.boards.some(board => filters.boards.includes(board)))) &&
    (filters.difficulty === null || row.difficulty === filters.difficulty));
}

/** Only canonical, same-app launch practice paths can survive login. */
export function safePracticeReturn(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 4096 || !value.startsWith("/practice/")) return null;
  try {
    const parsed = new URL(value, "https://stemcoach.invalid");
    if (parsed.origin !== "https://stemcoach.invalid" || parsed.hash || parsed.pathname.includes("%")) return null;
    const subject = parsed.pathname.slice("/practice/".length);
    if (!launchSubjects.some(s => s.id === subject) || !readPracticeFilters(parsed.searchParams)) return null;
    const keys = new Set(["curriculum", "qualification", "board", "difficulty", "mode", "topic"]);
    if ([...parsed.searchParams.keys()].some(key => !keys.has(key))) return null;
    const modes = parsed.searchParams.getAll("mode");
    if (modes.length > 1 || modes.some(mode => !["mixed", "focus", "diagnostic"].includes(mode))) return null;
    return parsed.pathname + parsed.search;
  } catch { return null; }
}
