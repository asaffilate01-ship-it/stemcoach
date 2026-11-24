import assert from "node:assert/strict";
import test from "node:test";
import { reconcilePrivatePacks } from "./reconcile-private-bank.mjs";

const envelope = items => ({schemaVersion:1,items});
const q = (id, text, extra={}) => ({id, text, track:"mathematics", topic:"Synthetic fixture", language:"en", markets:["PK","GB","DE"], status:"draft", type:"mcq", options:["1","2","3","4"], correctAnswer:"1", explanation:"Synthetic explanation.", countsTowardApprovedTarget:false,...extra});
const pack = (originals=[], variants=[], quizzes=[], lessons=[]) => ({originals:envelope(originals),variants:envelope(variants),quizzes:envelope(quizzes),lessons:envelope(lessons)});
const resource = (extra={}) => ({id:"quiz-1",title:"Synthetic quiz",track:"mathematics",questionIds:["a"],status:"draft",...extra});

test("reconciles original and computational records separately, with hidden Turkish archived", () => {
  const a=q("a","Synthetic item A"), b=q("b","Synthetic item B",{variant:true});
  const hidden=q("c","Synthetic item C",{track:"turkish",language:"tr",markets:["PK"]});
  const {report,reviewIndex}=reconcilePrivatePacks([pack([a,hidden],[b],[resource(),resource({id:"quiz-2",track:"turkish",questionIds:["c"]})],[resource({id:"lesson",body:"Synthetic lesson text."})])]);
  assert.equal(report.valid,true);
  assert.deepEqual(report.launch,{originals:1,variants:1,quizzes:1,lessons:1,candidateMappings:0});
  assert.deepEqual(report.archived,{originals:1,variants:0,quizzes:1,lessons:0});
  assert.equal(report.approvedCount,0);assert.equal(report.publishedCount,0);
  assert.equal(report.productionImportPerformed,false);
  assert.equal(reviewIndex.length,2);
  assert.ok(reviewIndex.every(r=>r.status==="draft"&&r.requiresAcademicReview&&!Object.hasOwn(r,"correctAnswer")&&!Object.hasOwn(r,"text")));
});
test("rejects cross-pack duplicate normalised stems or IDs", () => {
  const a=q("a","Synthetic item A");
  for(const b of [q("b"," SYNTHETIC  ITEM a "),q("a","Different item")]){
    const {report,reviewIndex}=reconcilePrivatePacks([pack([a]),pack([b])]);
    assert.equal(report.valid,false);assert.equal(reviewIndex.length,0);
    assert.ok(!JSON.stringify(report).includes(a.text));
  }
});
test("rejects dangling quiz links, cross-track links, duplicate resources and wrong counts", () => {
  for(const quizzes of [[resource({questionIds:["missing"]})],[resource({track:"physics"})],[resource(),resource()],[resource({questionCount:2})],[resource({questionIds:["a","a"]})],[resource({candidateMarkets:["US"]})]]){
    const {report,reviewIndex}=reconcilePrivatePacks([pack([q("a","Synthetic fixture")],[],quizzes)]);
    assert.equal(report.valid,false);assert.deepEqual(reviewIndex,[]);
  }
});
test("rejects off-scope language or markets, conflicting aliases, or claims of approval", () => {
  for(const extra of [{track:"french",language:"fr"},{track:"urdu",language:"ur",markets:["GB"]},{track:"welsh",language:"cy",markets:["DE"]},{candidateMarkets:{}},{candidateMarkets:["PK"]},{published:true},{countsTowardApprovedTarget:true},{difficulty:0}]){
    const {report,reviewIndex}=reconcilePrivatePacks([pack([q("a","Synthetic fixture",extra)])]);
    assert.equal(report.valid,false);assert.deepEqual(reviewIndex,[]);
  }
});
test("requires correct variant classification; accepts bilingual Welsh exercises", () => {
  const welsh=q("a","Synthetic fixture",{track:"welsh",language:"en",markets:["PK","GB"]});
  assert.equal(reconcilePrivatePacks([pack([welsh])]).report.valid,true);
  assert.equal(reconcilePrivatePacks([pack([],[welsh])]).report.valid,false);
  assert.equal(reconcilePrivatePacks([pack([{...welsh,variant:true}])]).report.valid,false);
});
test("rejects resource attempts to cross the allowed market set",()=>{
  const a=q("a","Synthetic fixture",{track:"urdu",language:"ur",markets:["PK"]});
  assert.equal(reconcilePrivatePacks([pack([a],[],[resource({track:"urdu",candidateMarkets:["PK","GB"]})])]).report.valid,false);
});
