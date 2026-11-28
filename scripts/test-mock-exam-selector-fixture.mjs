import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const db = new PGlite();
const schema = "stemcoach_selector_fixture";
const id = n => "00000000-0000-4000-8000-" + String(n).padStart(12,"0");
const fixture = await readFile(new URL("../docs/staging/mock-exam-legacy-selector-fixture.sql",import.meta.url),"utf8");
const audit = await readFile(new URL("../docs/staging/mock-exam-option-quality-audit.sql",import.meta.url),"utf8");
async function asRole(role,action) {
  assert.ok(["anon","authenticated","service_role"].includes(role));
  await db.exec("SET ROLE "+role);
  try{return await action();}finally{await db.exec("RESET ROLE");}
}
async function add(n,changes={}) {
  const q={subject:"mathematics",curriculum:"uk-gcse",boards:["AQA"],type:"mcq",status:"published",verified:true,
    stem:"Synthetic question "+n,topic:"Synthetic topic",difficulty:2,points:1,options:["Alpha","Beta"],key:"Alpha",...changes};
  await db.query("INSERT INTO "+schema+".questions VALUES ($1,$2,$3,$4,$5,$6,CASE WHEN $7::boolean THEN now() END,CASE WHEN $7::boolean THEN $8::uuid END,$9,$10,$11,$12,$13::jsonb,$14)",[
    id(n),q.subject,q.curriculum,q.boards,q.type,q.status,q.verified,id(99),q.stem,q.topic,q.difficulty,q.points,
    q.options===null?null:JSON.stringify(q.options),q.key,
  ]);
}
async function select(count=2,board="AQA",role="service_role",subject="mathematics",curriculum="uk-gcse"){
  return asRole(role,async()=>{
    const {rows}=await db.query("SELECT "+schema+".select_quality_mock_sheet($1,$2,$3,$4) AS sheet",[subject,curriculum,board,count]);
    return rows[0].sheet;
  });
}
try {
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA "+schema+";");
  await assert.rejects(()=>db.exec(fixture),/isolated selector fixture harness/);
  await db.exec("SET stemcoach.fixture_mode='isolated-selector-v1';");
  await db.exec(fixture);
  await add(1);
  await add(2,{options:'["Alpha","Beta"]',key:" beta "});
  await add(3,{options:null});
  await add(4,{options:["Alpha","ＡＬＰＨＡ"]});
  await add(5,{key:"Not in choices"});
  await add(6,{options:"not JSON"});
  await add(7,{options:["Alpha",4]});
  await add(8,{verified:false});
  await add(9,{status:"needs_review"});
  await add(10,{boards:["Edexcel"]});
  await add(11,{subject:"physics"});
  await add(12,{curriculum:"uk-alevel"});
  await add(13,{type:"essay"});
  await add(14,{options:["Alpha","\u00a0"]});
  await add(15,{difficulty:0});
  await add(16,{options:'["Alpha","\\u0000"]'});
  await add(17,{options:["Alpha","\u000b"]});
  await add(18,{options:["Alpha","beta"],key:"Beta"});
  await add(19,{options:["Alpha","Alpha "]});

  const sheet=await select(3);
  assert.deepEqual(sheet.map(q=>q.id),[id(1),id(2),id(18)]);
  assert.deepEqual(sheet[1].options,["Alpha","Beta"]);
  assert.ok(sheet.every(q=>Object.keys(q).sort().join(",")==="difficulty,id,options,points,question_text,subject,topic"));
  assert.ok(!JSON.stringify(sheet).includes("correct_answer"));
  assert.deepEqual((await select(1,"Edexcel")).map(q=>q.id),[id(10)]);
  assert.deepEqual((await select(1,"AQA","service_role","physics")).map(q=>q.id),[id(11)]);
  assert.deepEqual((await select(1,"AQA","service_role","mathematics","uk-alevel")).map(q=>q.id),[id(12)]);
  assert.equal((await select(4,null)).length,4);
  await assert.rejects(()=>select(4),/Insufficient eligible verified exam questions/);
  await assert.rejects(()=>select(1,"Unknown board"),/Insufficient eligible verified exam questions/);
  for(const bad of [0,101,null])await assert.rejects(()=>select(bad),/Invalid examination selector request/);
  for(const role of ["anon","authenticated"]){
    await assert.rejects(()=>select(1,"AQA",role),/permission denied/);
    await assert.rejects(()=>asRole(role,()=>db.query("SELECT * FROM "+schema+".questions")),/permission denied/);
  }

  // The read-only audit is tested against the same synthetic records.
  await db.exec("CREATE TABLE public.questions AS SELECT * FROM "+schema+".questions;");
  const {rows}=await db.query(audit);
  assert.equal(rows.length,1);
  const row=Object.fromEntries(Object.entries(rows[0]).map(([k,v])=>[k,k==="question_type"?v:Number(v)]));
  assert.equal(row.pool,17); // exclude draft and essay
  assert.equal(row.pool,row.invalid_shape+row.duplicate_normalised_choices+row.unmatched_key+row.structurally_eligible);
  assert.ok(row.invalid_shape>=4);
  assert.equal(row.duplicate_normalised_choices,2);
  assert.equal(row.unmatched_key,1);
  assert.equal(row.structurally_eligible-row.verification_recorded,1);
  assert.ok(!JSON.stringify(rows).includes("Alpha"));
  assert.ok(!JSON.stringify(rows).includes(id(1)));
  assert.equal(Number((await db.query("SELECT count(*) AS n FROM "+schema+".questions")).rows[0].n),19);
  console.log("Legacy selector fixture passed: nested JSONB, duplicate choices, malformed keys, board/curriculum filtering, verification and complete safe sheets.");
} finally {await db.close();}
