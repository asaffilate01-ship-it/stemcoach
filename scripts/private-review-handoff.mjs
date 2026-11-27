import { createHash } from "node:crypto";
import { readFile, lstat, realpath, writeFile } from "node:fs/promises";
import { dirname, resolve, relative, basename, isAbsolute, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { reconcilePrivatePacks } from "./reconcile-private-bank.mjs";
import { marketProgramme } from "../src/data/threeMarketProgramme.ts";

export const REVIEW_SCOPE = "stemcoach-private-review-v1";
export const MARKET_REVIEW_SCOPE = "stemcoach-private-market-review-v2";
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
  return evaluateWorklist(buildReviewWorklist(packs),submission);
}

function evaluateWorklist(work, submission) {
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

/** Plan candidate-market work without pretending any curriculum has been mapped.
 * A question can have multiple assignments, but still counts as one original. */
export function buildMarketReviewPlan(packs) {
  return marketPlanFromWork(buildReviewWorklist(packs));
}

function marketPlanFromWork(work) {
  const summary={schemaVersion:1,scope:MARKET_REVIEW_SCOPE,valid:work.valid,uniqueOriginals:0,archivedOriginals:0,totalAssignments:0,markets:[],approvedCount:0,publishedCount:0,authenticatedReviewersVerified:false};
  if(!work.valid)return {...summary,items:[]};
  const byMarket=new Map(marketProgramme.map(m=>[m.country,{market:m.country,assignments:0,byTrack:Object.create(null)}]));
  const items=[];
  for(const row of work.items){
    for(const market of [...row.candidateMarkets].sort()){
      const group=byMarket.get(market);
      if(!group)throw Error("Unexpected candidate market");
      group.assignments++;
      group.byTrack[row.track]=(group.byTrack[row.track]??0)+1;
      items.push({questionId:row.questionId,questionDigest:row.questionDigest,pack:row.pack,row:row.row,track:row.track,language:row.language,market,status:"awaiting-curriculum-mapping"});
    }
  }
  return {...summary,uniqueOriginals:work.items.length,archivedOriginals:work.reconciliation.archived.originals,totalAssignments:items.length,markets:[...byMarket.values()],items};
}

/** Each question/market pair receives its own mapping and two independent attestations.
 * This is an offline consistency check, not verified identity or academic approval. */
export function evaluateMarketReviewHandoff(packs, submission) {
  const work=buildReviewWorklist(packs);
  const plan=marketPlanFromWork(work);
  const report={valid:false,scope:MARKET_REVIEW_SCOPE,uniqueOriginals:plan.uniqueOriginals,totalAssignments:plan.totalAssignments,pendingAssignments:plan.totalAssignments,revisionRequiredAssignments:0,rejectionRecordedAssignments:0,attestedCandidateAssignments:0,uniqueCandidateOriginals:0,markets:[],approvedCount:0,publishedCount:0,authenticatedReviewersVerified:false,errors:[],errorCount:0};
  const fail=message=>{report.errorCount++;if(report.errors.length<50)report.errors.push(message);};
  const finish=candidates=>({report:{...report,valid:report.errorCount===0},candidates:report.errorCount===0?candidates:[]});
  if(!plan.valid){fail("Reconcile source packs before reviewing.");return finish([]);}
  if(!submission || submission.schemaVersion!==1 || submission.scope!==MARKET_REVIEW_SCOPE || !Array.isArray(submission.items) || submission.items.length>plan.totalAssignments){fail("Invalid market review manifest.");return finish([]);}
  const grouped=new Map(marketProgramme.map(m=>[m.country,[]]));
  for(const [index,row] of submission.items.entries()){
    if(!grouped.has(row?.mapping?.market)){fail("Review row "+(index+1)+": invalid market.");continue;}
    grouped.get(row.mapping.market).push(row);
  }
  if(report.errorCount)return finish([]);
  const candidates=[];
  report.pendingAssignments=0;
  for(const [market,rows] of grouped){
    const eligible=work.items.filter(row=>row.candidateMarkets.includes(market));
    const result=evaluateWorklist({...work,items:eligible},{schemaVersion:1,scope:REVIEW_SCOPE,items:rows});
    if(!result.report.valid){
      report.errorCount+=result.report.errorCount;
      for(const error of result.report.errors){if(report.errors.length<50)report.errors.push(market+": "+error);}
      continue;
    }
    const q=result.report;
    report.markets.push({market,assignments:eligible.length,submitted:q.submitted,pending:q.pending,revisionRequired:q.revisionRequired,rejectionRecorded:q.rejectionRecorded,attestedCandidates:q.attestedCandidateCount});
    report.pendingAssignments+=q.pending;
    report.revisionRequiredAssignments+=q.revisionRequired;
    report.rejectionRecordedAssignments+=q.rejectionRecorded;
    report.attestedCandidateAssignments+=q.attestedCandidateCount;
    candidates.push(...result.candidates);
  }
  if(report.errorCount){
    // No partial candidate counts or assignments are returned for an invalid submission.
    Object.assign(report,{pendingAssignments:plan.totalAssignments,revisionRequiredAssignments:0,rejectionRecordedAssignments:0,attestedCandidateAssignments:0,uniqueCandidateOriginals:0,markets:[]});
    return finish([]);
  }
  report.uniqueCandidateOriginals=new Set(candidates.map(row=>row.questionId)).size;
  return finish(candidates);
}

const MAX_PRIVATE_INPUT_BYTES=64*1024*1024;
async function readPrivateJson(path){
  const stat=await lstat(path);
  if(!stat.isFile()||stat.size>MAX_PRIVATE_INPUT_BYTES)throw Error("Invalid private input");
  return JSON.parse(await readFile(path,"utf8"));
}
async function writeOutsideRepo(output,payload){
  const root=await realpath(resolve(dirname(fileURLToPath(import.meta.url)),".."));
  const target=resolve(await realpath(dirname(resolve(output))),basename(output));
  const rel=relative(root,target);
  if(isAbsolute(rel)||!(rel===".."||rel.startsWith(".."+sep)))throw Error("Private output required");
  await writeFile(target,JSON.stringify(payload,null,2)+"\n",{flag:"wx",mode:0o600});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const [command,...args]=process.argv.slice(2);
    if(command!=="--plan"&&command!=="--evaluate")throw Error("Unknown command");
    const submissionPath=command==="--evaluate"?args.shift():null;
    const output=args.shift();
    if(!output||(command==="--evaluate"&&!submissionPath)||!args.length||args.length>200||args.some(arg=>arg.startsWith("--")))throw Error("Invalid arguments");
    const empty=()=>({schemaVersion:1,items:[]});
    const packs=[];
    for(const path of args)packs.push({originals:await readPrivateJson(path),variants:empty(),quizzes:empty(),lessons:empty()});
    if(command==="--plan"){
      const plan=buildMarketReviewPlan(packs);
      if(!plan.valid)throw Error("Invalid source packs");
      await writeOutsideRepo(output,plan);
      const {items,...summary}=plan;
      console.log(JSON.stringify(summary,null,2));
    }else{
      const result=evaluateMarketReviewHandoff(packs,await readPrivateJson(submissionPath));
      if(!result.report.valid)throw Error("Invalid review submission");
      await writeOutsideRepo(output,result);
      console.log(JSON.stringify(result.report,null,2));
    }
  }catch{
    console.error("Unable to prepare private market review. Use --plan NEW_PRIVATE_OUTPUT ORIGINAL_JSON... or --evaluate SUBMISSION_JSON NEW_PRIVATE_OUTPUT ORIGINAL_JSON... . Outputs must be outside the repository. No question or answer text is logged.");
    process.exitCode=1;
  }
}
