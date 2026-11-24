import test from "node:test";
import assert from "node:assert/strict";
import { buildReviewWorklist, evaluateReviewHandoff, digestRecord, REVIEW_SCOPE } from "./private-review-handoff.mjs";
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
