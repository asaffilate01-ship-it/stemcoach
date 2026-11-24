import { coreSubjectTracks, marketProgramme } from "../data/threeMarketProgramme.ts";

export const LAUNCH_PLAN_SCOPE = "stemcoach-three-market-v1";
export const MAX_QUESTIONS_PER_OUTCOME = 500;
export const QUESTIONS_PER_JOB = 20;
export const MAX_JOB_WINDOW = 1000;
export const MAX_OUTCOMES = 100000;
export const launchTracks = [...coreSubjectTracks, "arabic", "urdu", "welsh", "english-literature", "psychology", "geography", "general-science"] as const;
export type LaunchMarket = typeof marketProgramme[number]["country"];
type Outcome = {
  market: LaunchMarket; jurisdiction: string; authority: string;
  qualification: string; stage: string; track: string; language: string;
  specificationVersion: string; outcomeCode: string; sourceUrl: string;
  reviewReference: string; targetQuestions: number;
};
export type PlanningJob = Outcome & {
  jobKey: string; batchIndex: number; count: number;
  status: "draft-planned"; countsTowardApprovedTarget: false;
};
type MarketSummary = { market: LaunchMarket; target: number; allocated: number; missing: number; outcomes: number; jobs: number };
export type PlanReport = {
  valid: boolean; complete: boolean; errors: string[]; errorCount: number;
  markets: MarketSummary[]; totalPlanned: number; totalJobs: number;
  approvedCount: 0; publishedCount: 0;
};

const trackSet = new Set<string>(launchTracks);
const languages = new Set(["en", "de", "ar", "ur", "cy"]);
const exactLanguage: Record<string, string> = { german: "de", "german-visa-preparation": "de", arabic: "ar", urdu: "ur", welsh: "cy", "english-language": "en", ielts: "en", "english-literature": "en" };
const normalise = (s: string) => s.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
const requiredText = ["jurisdiction", "authority", "qualification", "stage", "track", "language", "specificationVersion", "outcomeCode", "sourceUrl", "reviewReference"] as const;
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

function validateSource(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !url.hostname.includes(".") || url.username || url.password || /\s/u.test(raw)) return null;
    return url;
  } catch { return null; }
}

function outcomeIdentity(outcome: Outcome): string {
  // Same versioned outcome shared by several markets may only be allocated once.
  // This is metadata deduplication, not semantic question deduplication.
  const url = new URL(outcome.sourceUrl);
  return JSON.stringify([url.origin + url.pathname + url.search, normalise(outcome.specificationVersion), normalise(outcome.outcomeCode), normalise(outcome.track)]);
}

export function inspectLaunchPlan(input: unknown): { report: PlanReport; outcomes: Outcome[] } {
  const errors: string[] = [];
  let errorCount = 0;
  const fail = (message: string) => { errorCount++; if (errors.length < 50) errors.push(message); };
  const summaries = marketProgramme.map(m => ({ market: m.country, target: m.target as number, allocated: 0, missing: m.target as number, outcomes: 0, jobs: 0 }));
  const marketById = new Map(summaries.map(row => [row.market, row]));
  const outcomes: Outcome[] = [];
  const seen = new Set<string>();
  const data = input && typeof input === "object" ? input as Record<string, unknown> : {};
  if (data.schemaVersion !== 1 || data.scope !== LAUNCH_PLAN_SCOPE || !Array.isArray(data.outcomes) || data.outcomes.length > MAX_OUTCOMES) {
    fail("Expected a version 1 three-market outcome manifest of at most 100,000 rows.");
  } else {
    for (const [i, raw] of data.outcomes.entries()) {
      const row = i + 1;
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) { fail("Row " + row + ": expected an outcome record."); continue; }
      const record = raw as Record<string, unknown>;
      if (requiredText.some(key => typeof record[key] !== "string" || !(record[key] as string).trim() || (record[key] as string).length > (key === "sourceUrl" ? 2048 : 240))) {
        fail("Row " + row + ": missing or invalid source, curriculum or review metadata."); continue;
      }
      const market = marketById.get(record.market as LaunchMarket);
      if (!market) { fail("Row " + row + ": market outside launch scope."); continue; }
      const region = marketProgramme.find(m => m.country === market.market)!;
      const fields = Object.fromEntries(requiredText.map(key => [key, (record[key] as string).trim()]));
      const outcome = { ...fields, market: market.market, targetQuestions: record.targetQuestions } as Outcome;
      if (!(region.regions as readonly string[]).includes(outcome.jurisdiction)) { fail("Row " + row + ": unknown jurisdiction for this market."); continue; }
      if (!trackSet.has(outcome.track) || !languages.has(outcome.language)) { fail("Row " + row + ": track or language outside launch scope."); continue; }
      if ((outcome.track === "urdu" || outcome.track === "arabic") && market.market !== "PK" || outcome.track === "welsh" && market.market === "DE") {
        fail("Row " + row + ": study-language track outside configured market."); continue;
      }
      const expectedLanguage = Object.prototype.hasOwnProperty.call(exactLanguage, outcome.track) ? exactLanguage[outcome.track] : undefined;
      if (expectedLanguage ? expectedLanguage !== outcome.language : !["en", "de"].includes(outcome.language)) { fail("Row " + row + ": language does not match the study track."); continue; }
      if (outcome.specificationVersion.length < 5 || !validateSource(outcome.sourceUrl)) { fail("Row " + row + ": invalid version or HTTPS source URL."); continue; }
      if (!Number.isSafeInteger(outcome.targetQuestions) || outcome.targetQuestions < 1 || outcome.targetQuestions > MAX_QUESTIONS_PER_OUTCOME) {
        fail("Row " + row + ": draft allocation must be 1–500 per outcome."); continue;
      }
      const key = outcomeIdentity(outcome);
      if (seen.has(key)) { fail("Row " + row + ": duplicate versioned outcome across the programme."); continue; }
      seen.add(key);
      outcomes.push(outcome);
      market.allocated += outcome.targetQuestions;
      market.outcomes++;
      market.jobs += Math.ceil(outcome.targetQuestions / QUESTIONS_PER_JOB);
    }
  }
  for (const m of summaries) {
    m.missing = Math.max(0, m.target - m.allocated);
    if (m.allocated > m.target) fail(m.market + ": allocation exceeds market target.");
  }
  const valid = errorCount === 0;
  const report: PlanReport = {
    valid, complete: valid && summaries.every(m => m.allocated === m.target), errors, errorCount,
    markets: summaries, totalPlanned: summaries.reduce((n, m) => n + m.allocated, 0),
    totalJobs: summaries.reduce((n, m) => n + m.jobs, 0),
    approvedCount: 0, publishedCount: 0,
  };
  // Stable order independent of import order. Never expose unvalidated input as jobs.
  return { report, outcomes: valid ? outcomes.sort((a, b) => compare(a.market, b.market) || compare(outcomeIdentity(a), outcomeIdentity(b))) : [] };
}

export function launchJobWindow(input: unknown, cursor = 0, limit = MAX_JOB_WINDOW): { report: PlanReport; jobs: PlanningJob[]; nextCursor: number | null } {
  const { report, outcomes } = inspectLaunchPlan(input);
  if (!Number.isSafeInteger(cursor) || cursor < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > MAX_JOB_WINDOW) throw new Error("Invalid planning window.");
  if (!report.valid || cursor >= report.totalJobs) return { report, jobs: [], nextCursor: null };
  const jobs: PlanningJob[] = [];
  let position = 0;
  for (const outcome of outcomes) {
    const batches = Math.ceil(outcome.targetQuestions / QUESTIONS_PER_JOB);
    if (position + batches <= cursor) { position += batches; continue; }
    for (let batchIndex = Math.max(0, cursor - position); batchIndex < batches && jobs.length < limit; batchIndex++) {
      jobs.push({ ...outcome, jobKey: outcomeIdentity(outcome) + ":" + batchIndex, batchIndex,
        count: Math.min(QUESTIONS_PER_JOB, outcome.targetQuestions - batchIndex * QUESTIONS_PER_JOB),
        status: "draft-planned", countsTowardApprovedTarget: false });
    }
    position += batches;
    if (jobs.length === limit) break;
  }
  const next = cursor + jobs.length;
  return { report, jobs, nextCursor: next < report.totalJobs ? next : null };
}
