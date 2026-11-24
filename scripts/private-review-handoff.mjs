import { createHash } from "node:crypto";
import { reconcilePrivatePacks } from "./reconcile-private-bank.mjs";
import { marketProgramme } from "../src/data/threeMarketProgramme.ts";

export const REVIEW_SCOPE = "stemcoach-private-review-v1";
const CHECKS = ["answer", "distractors", "explanation", "curriculum", "language", "originality", "rights"];
const allowedRegions = new Map(marketProgramme.map(m => [m.country, new Set(m.regions)]));
const text = (v, max=240) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const opaqueRef = v => typeof v === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/.test(v);
const exactKeys = (v, keys) => v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v,k));
const canonical = v => Array.isArray(v) ? v.map(canonical) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k,canonical(v[k])])) : v;
export const digestRecord = v => createHash("sha256").update(JSON.stringify(canonical(v))).digest("hex");

export function buildReviewWorklist(packs) {
  const { report, reviewIndex } = reconcilePrivatePacks(packs);
  if (!report.valid) return { valid:false, reconciliation:report, items:[] };
  const items = reviewIndex.filter(r => r.kind === "originals").map(r => {
    const item = packs[r.pack-1].originals.items[r.row-1];
    return { questionId:r.id, questionDigest:digestRecord(item), pack:r.pack, row:r.row, track:r.track, language:r.language, candidateMarkets:r.candidateMarkets, status:"awaiting-review" };
  });
  return { valid:true, reconciliation:report, items };
}

function mappingValid(m, item) {
  if (!exactKeys(m, ["market","jurisdiction","authority","qualification","stage","specificationVersion","outcomeCode","sourceUrl"])) return false;
  if (!item.candidateMarkets.includes(m.market) || !allowedRegions.get(m.market)?.has(m.jurisdiction)) return false;
  if (!["authority","qualification","stage","specificationVersion","outcomeCode"].every(k => text(m[k])) || m.specificationVersion.trim().length < 5 || !text(m.sourceUrl,2048)) return false;
  try { const u=new URL(m.sourceUrl); return u.protocol==="https:" && u.hostname.includes(".") && !u.username && !u.password && !/\s/u.test(m.sourceUrl); } catch { return false; }
}

/** Offline consistency check only. Reviewer references are unverified labels,
 * not authenticated identities. No approval, publication or access grant. */
export function evaluateReviewHandoff(packs, submission) {
  const work = buildReviewWorklist(packs);
  const errors = [];
  let errorCount = 0;
  const fail = msg => { errorCount++; if (errors.length < 50) errors.push(msg); };
  const report = { valid:false, originals:work.items.length, submitted:0, pending:0, revisionRequired:0, rejectionRecorded:0, attestedCandidateCount:0, approvedCount:0, publishedCount:0, authenticatedReviewersVerified:false, errors, errorCount:0 };
  const finish = candidates => ({ report:{...report,valid:errorCount===0,errorCount}, candidates:errorCount===0?candidates:[] });
  if (!work.valid) { fail("Reconcile the source packs before reviewing."); return finish([]); }
  if (!submission || submission.schemaVersion !== 1 || submission.scope !== REVIEW_SCOPE || !Array.isArray(submission.items) || submission.items.length > work.items.length) { fail("Invalid review manifest."); return finish([]); }
  const lookup = new Map(work.items.map(row=>[row.questionId,row]));
  const seen = new Set(), candidates=[];
  for (const [i,row] of submission.items.entries()) {
    const label = "Review row "+(i+1);
    if (!exactKeys(row,["questionId","questionDigest","mapping","attestations"]) || !lookup.has(row.questionId) || seen.has(row.questionId)) { fail(label+": unknown, repeated or malformed question reference."); continue; }
    seen.add(row.questionId);
    const source = lookup.get(row.questionId);
    if (row.questionDigest !== source.questionDigest || !mappingValid(row.mapping,source)) { fail(label+": question revision or mapping is invalid."); continue; }
    const mappingDigest=digestRecord(row.mapping);
    if (!Array.isArray(row.attestations) || row.attestations.length > 2) { fail(label+": invalid attestation count."); continue; }
    let invalid=false;
    const refs=new Set(), decisions=[];
    for(const a of row.attestations) {
      if (!exactKeys(a,["reviewerRef","questionDigest","mappingDigest","decision","checks"]) ||
          !opaqueRef(a.reviewerRef) || refs.has(a.reviewerRef.toLowerCase()) ||
          a.questionDigest!==source.questionDigest || a.mappingDigest!==mappingDigest ||
          !["pass","revise","reject"].includes(a.decision) || !exactKeys(a.checks,CHECKS) ||
          !CHECKS.every(k=>typeof a.checks[k]==="boolean") || (a.decision==="pass" && !CHECKS.every(k=>a.checks[k]))) {
        invalid=true; break;
      }
      refs.add(a.reviewerRef.toLowerCase()); decisions.push(a.decision);
    }
    if(invalid) { fail(label+": inconsistent reviewer reference, digest, decision or checks."); continue; }
    report.submitted++;
    if(decisions.includes("reject")) report.rejectionRecorded++;
    else if(decisions.includes("revise")) report.revisionRequired++;
    else if(decisions.length===2 && decisions.every(d=>d==="pass")) {
      report.attestedCandidateCount++;
      candidates.push({questionId:row.questionId,questionDigest:source.questionDigest,mappingDigest,market:row.mapping.market,track:source.track,status:"candidate-awaiting-server-verification"});
    }
  }
  report.pending=report.originals-report.revisionRequired-report.rejectionRecorded-report.attestedCandidateCount;
  return finish(candidates);
}
