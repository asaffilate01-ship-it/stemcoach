import test from "node:test";
import assert from "node:assert/strict";
import { buildReviewWorklist, evaluateReviewHandoff, digestRecord, REVIEW_SCOPE, buildMarketReviewPlan, evaluateMarketReviewHandoff, MARKET_REVIEW_SCOPE } from "./private-review-handoff.mjs";
const E=items=>({schemaVersion:1,items});
const item={id:"a",track:"mathematics",topic:"Synthetic example",language:"en",markets:["GB"],status:"draft",type:"mcq",text:"Synthetic question",options:["a","b","c","d"],correctAnswer:"a",explanation:"Synthetic explanation.",countsTowardApprovedTarget:false};
const pack=(items=[item],variants=[])=>({originals:E(items),variants:E(variants),quizzes:E([]),lessons:E([])});
const mapping={market:"GB",jurisdiction:"England",authority:"Synthetic authority",qualification:"Synthetic qualification",stage:"Synthetic stage",specificationVersion:"fixture-2026",outcomeCode:"fixture-1",sourceUrl:"https://example.org/test-only"};
const checks={answer:true,distractors:true,explanation:true,curriculum:true,language:true,originality:true,rights:true};
const attest=(ref,question=item,m=mapping,decision="pass")=>({reviewerRef:ref,questionDigest:digestRecord(question),mappingDigest:digestRecord(m),decision,checks:{...checks}});
const review=(attestations=[attest("reviewer-a"),attest("reviewer-b")],m=mapping,q=item)=>({questionId:q.id,questionDigest:digestRecord(q),mapping:m,attestations});
const submission=items=>({schemaVersion:1,scope:REVIEW_SCOPE,items});

test("worklist excludes variants and exposes no answers; digest covers every content field",()=>{
 const v={...item,id:"v",text:"Different synthetic variant",variant:true};
 const w=buildReviewWorklist([pack([item],[v])]);
 assert.equal(w.valid,true);assert.equal(w.items.length,1);
 assert.ok(!Object.hasOwn(w.items[0],"correctAnswer")&&!Object.hasOwn(w.items[0],"text"));
 assert.notEqual(digestRecord(item),digestRecord({...item,correctAnswer:"b"}));
 assert.equal(digestRecord(item),digestRecord(Object.fromEntries(Object.entries(item).reverse())));
});
test("two distinct complete attestations yield candidate only, never approved or published",()=>{
 const {report,candidates}=evaluateReviewHandoff([pack()],submission([review()]));
 assert.equal(report.valid,true);assert.equal(report.attestedCandidateCount,1);assert.equal(report.pending,0);
 assert.equal(report.approvedCount,0);assert.equal(report.publishedCount,0);
 assert.equal(report.authenticatedReviewersVerified,false);
 assert.equal(candidates[0].status,"candidate-awaiting-server-verification");
});
test("edited question or mapping invalidates prior review",()=>{
 const changed={...item,correctAnswer:"b"};
 assert.equal(evaluateReviewHandoff([pack([changed])],submission([review()])).report.valid,false);
 const newMapping={...mapping,outcomeCode:"fixture-2"};
 assert.equal(evaluateReviewHandoff([pack()],submission([review(undefined,newMapping)])).report.valid,false);
});
test("one attestation stays pending and revision/rejection stays separate",()=>{
 for(const [attestations,field] of [[[attest("reviewer-a")],"pending"],[[attest("reviewer-a",item,mapping,"revise")],"revisionRequired"],[[attest("reviewer-a",item,mapping,"reject")],"rejectionRecorded"]]){
  const {report}=evaluateReviewHandoff([pack()],submission([review(attestations)]));
  assert.equal(report.valid,true);assert.equal(report[field],1);assert.equal(report.attestedCandidateCount,0);
 }
});
test("reject repeated reviewer, false pass checks, duplicate rows, invalid mapping and unknown ID",()=>{
 const incomplete=attest("reviewer-a");incomplete.checks.answer=false;
 for(const rows of [[review([attest("reviewer-a"),attest("REVIEWER-A")])],[review([incomplete])],[review(),review()],[review([], {...mapping,market:"US"})],[review([], {...mapping,jurisdiction:"Bayern"})],[{...review(),questionId:"missing"}]]){
  const {report,candidates}=evaluateReviewHandoff([pack()],submission(rows));assert.equal(report.valid,false);assert.deepEqual(candidates,[]);
 }
});
test("reject review of computational variants even when structurally valid",()=>{
 const v={...item,id:"v",text:"Another synthetic variant",variant:true};
 assert.equal(evaluateReviewHandoff([pack([item],[v])],submission([review([],mapping,v)])).report.valid,false);
});

const marketSubmission=items=>({schemaVersion:1,scope:MARKET_REVIEW_SCOPE,items});
test("market plan separates unique original counts from review assignments and excludes archived Turkish",()=>{
 const q={...item,markets:["PK","GB","DE"]};
 const archived={...item,id:"tr-1",text:"Synthetic archived stem",track:"turkish",language:"tr",markets:["PK"]};
 const v={...item,id:"v",text:"Synthetic generated stem",variant:true};
 const plan=buildMarketReviewPlan([pack([q,archived],[v])]);
 assert.equal(plan.valid,true);
 assert.equal(plan.uniqueOriginals,1);
 assert.equal(plan.archivedOriginals,1);
 assert.equal(plan.totalAssignments,3);
 assert.equal(plan.approvedCount,0);
 assert.equal(plan.publishedCount,0);
 assert.deepEqual(new Set(plan.items.map(x=>x.market)),new Set(["PK","GB","DE"]));
 assert.ok(plan.items.every(x=>x.questionId==="a"&&x.status==="awaiting-curriculum-mapping"));
 assert.ok(plan.items.every(x=>!Object.hasOwn(x,"text")&&!Object.hasOwn(x,"correctAnswer")));
 assert.ok(plan.markets.every(x=>x.assignments===1&&x.byTrack.mathematics===1));
});
test("multi-market handoff preserves independent mappings and two reviewers for each market",()=>{
 const q={...item,markets:["PK","GB","DE"]};
 const pk={...mapping,market:"PK",jurisdiction:"Punjab",outcomeCode:"fixture-pk"};
 const gb={...mapping,outcomeCode:"fixture-gb"};
 const de={...mapping,market:"DE",jurisdiction:"Berlin",outcomeCode:"fixture-de"};
 const row=(m,refs=["reviewer-a","reviewer-b"])=>review(refs.map(ref=>attest(ref,q,m)),m,q);
 const result=evaluateMarketReviewHandoff([pack([q])],marketSubmission([row(pk),row(gb),row(de,["reviewer-a"])]));
 assert.equal(result.report.valid,true);
 assert.equal(result.report.uniqueOriginals,1);
 assert.equal(result.report.totalAssignments,3);
 assert.equal(result.report.pendingAssignments,1);
 assert.equal(result.report.attestedCandidateAssignments,2);
 assert.equal(result.report.uniqueCandidateOriginals,1);
 assert.equal(result.report.approvedCount,0);
 assert.equal(result.report.publishedCount,0);
 assert.equal(result.report.authenticatedReviewersVerified,false);
 assert.deepEqual(new Set(result.candidates.map(x=>x.market)),new Set(["PK","GB"]));
 assert.equal(result.report.markets.find(x=>x.market==="DE").pending,1);
});
test("market review rejects repeated assignments, unsupported market, stale digests, and invalid scopes",()=>{
 const q={...item,markets:["GB","PK"]};
 const pk={...mapping,market:"PK",jurisdiction:"Punjab"};
 const de={...mapping,market:"DE",jurisdiction:"Berlin"};
 const gb=review([attest("reviewer-a",q),attest("reviewer-b",q)],mapping,q);
 const invalidRows=[
  [gb,gb],
  [gb,review([],de,q)],
  [gb,{...review([],pk,q),questionDigest:"stale"}],
  [gb,review([],{...pk,jurisdiction:"England"},q)],
  [gb,review([],{...pk,market:"US"},q)]
 ];
 for(const rows of invalidRows){
  const result=evaluateMarketReviewHandoff([pack([q])],marketSubmission(rows));
  assert.equal(result.report.valid,false);
  assert.equal(result.report.attestedCandidateAssignments,0);
  assert.equal(result.report.uniqueCandidateOriginals,0);
  assert.deepEqual(result.candidates,[]);
 }
 const bad=evaluateMarketReviewHandoff([pack([q])],submission([gb]));
 assert.equal(bad.report.valid,false);
});
test("market plans and empty submissions retain all unresolved assignments; revised and rejected are separate",()=>{
 const q={...item,markets:["PK","GB","DE"]};
 const pk={...mapping,market:"PK",jurisdiction:"Punjab"};
 const de={...mapping,market:"DE",jurisdiction:"Berlin"};
 const empty=evaluateMarketReviewHandoff([pack([q])],marketSubmission([]));
 assert.equal(empty.report.valid,true);
 assert.equal(empty.report.pendingAssignments,3);
 const result=evaluateMarketReviewHandoff([pack([q])],marketSubmission([
  review([attest("reviewer-a",q,pk,"revise")],pk,q),
  review([attest("reviewer-a",q,de,"reject")],de,q)
 ]));
 assert.equal(result.report.valid,true);
 assert.equal(result.report.pendingAssignments,1);
 assert.equal(result.report.revisionRequiredAssignments,1);
 assert.equal(result.report.rejectionRecordedAssignments,1);
 assert.equal(result.report.attestedCandidateAssignments,0);
 assert.equal(result.report.uniqueCandidateOriginals,0);
});
