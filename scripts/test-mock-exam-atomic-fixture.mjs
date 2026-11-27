import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const db = new PGlite();
const schema = "stemcoach_exam_fixture";
const id = n => "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
const alice = id(1), bob = id(2), reviewer = id(3);
const q1 = id(11), q2 = id(12), q3 = id(13), q4 = id(14), q5 = id(15), q6 = id(16), q7 = id(17);
const good = id(101), exhausted = id(102), blank = id(103), stale = id(104), badOptions = id(105),
  unverified = id(106), archived = id(107), unsupported = id(108), expired = id(109), rollback = id(110);
const sql = await readFile(new URL("../docs/staging/mock-exam-atomic-receipt-fixture.sql", import.meta.url), "utf8");

async function asRole(role, action) {
  assert.ok(["anon", "authenticated", "service_role"].includes(role));
  await db.exec("SET ROLE " + role);
  try { return await action(); }
  finally { await db.exec("RESET ROLE"); }
}
async function submit(actor, session, answers, role = "service_role") {
  return asRole(role, async () => {
    const { rows } = await db.query("SELECT " + schema + ".submit_mock_exam($1::uuid,$2::uuid,$3::jsonb) AS result", [
      actor, session, JSON.stringify(answers),
    ]);
    return rows[0].result;
  });
}
const answer = (question_id, value) => ({question_id, answer:value});
async function addQuestion(q, opts={}) {
  await db.query("INSERT INTO " + schema + ".questions(id,subject,curriculum,question_type,review_status,review_revision,academic_verified_at,academic_verified_by,options,correct_answer) VALUES($1,'mathematics','GCSE',$2,$3,$4,CASE WHEN $5::boolean THEN now() ELSE NULL END,CASE WHEN $5::boolean THEN $6::uuid ELSE NULL END,$7::jsonb,$8)", [
    q, opts.type ?? "mcq", opts.status ?? "published", opts.revision ?? 1, opts.verified ?? true,
    reviewer, JSON.stringify(opts.options ?? ["Alpha","Beta"]), opts.key ?? "Alpha",
  ]);
}
async function addSession(session, user, questions, isExpired=false) {
  await db.query("INSERT INTO " + schema + ".sessions(id,user_id,subject,curriculum,expires_at) VALUES($1,$2,'mathematics','GCSE',clock_timestamp()+CASE WHEN $3::boolean THEN interval '-1 hour' ELSE interval '1 hour' END)", [session,user,isExpired]);
  for (const [index, item] of questions.entries()) {
    await db.query("INSERT INTO " + schema + ".session_questions(session_id,position,question_id,revision) VALUES($1,$2,$3,$4)", [session,index+1,item[0],item[1]]);
  }
}
async function used(user) {
  const {rows} = await db.query("SELECT mock_exams_used FROM " + schema + ".user_quotas WHERE user_id=$1",[user]);
  return Number(rows[0].mock_exams_used);
}
async function counts(session) {
  const {rows} = await db.query("SELECT (SELECT count(*) FROM " + schema + ".attempts WHERE session_id=$1) AS attempts,(SELECT count(*) FROM " + schema + ".certificates WHERE session_id=$1) AS certificates,(SELECT count(*) FROM " + schema + ".receipts WHERE session_id=$1) AS receipts",[session]);
  return Object.fromEntries(Object.entries(rows[0]).map(([k,v])=>[k,Number(v)]));
}
async function rejected(actor, session, payload, pattern) {
  const previous = await used(actor), before = await counts(session);
  await assert.rejects(() => submit(actor, session, payload), pattern);
  assert.equal(await used(actor), previous);
  assert.deepEqual(await counts(session), before);
}

try {
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA " + schema + ";");
  await assert.rejects(() => db.exec(sql), /isolated mock exam test harness/);
  await db.exec("SET stemcoach.fixture_mode = 'isolated-mock-exam-v1';");
  await db.exec(sql);
  await db.query("INSERT INTO " + schema + ".user_quotas VALUES($1,1,0),($2,2,0)", [alice,bob]);
  await addQuestion(q1); await addQuestion(q2,{key:"Beta"});
  await addQuestion(q3,{revision:2});
  await addQuestion(q4,{options:["Alpha","Alpha"]});
  await addQuestion(q5,{verified:false});
  await addQuestion(q6,{status:"archived"});
  await addQuestion(q7,{type:"essay"});

  await addSession(good,alice,[[q2,1],[q1,1]]);
  await addSession(exhausted,alice,[[q2,1]]);
  await addSession(blank,bob,[[q1,1],[q2,1]]);
  for (const [session,q] of [[stale,q3],[badOptions,q4],[unverified,q5],[archived,q6],[unsupported,q7],[rollback,q2]]) {
    await addSession(session,bob,[[q,1]]);
  }
  await addSession(expired,bob,[[q2,1]],true);
  const correct = [answer(q1,"Alpha"),answer(q2,"Beta")];

  for (const role of ["anon","authenticated"]) {
    await assert.rejects(() => submit(alice,good,correct,role), /permission denied/);
    await assert.rejects(() => asRole(role,()=>db.query("SELECT * FROM " + schema + ".questions")), /permission denied/);
  }
  await rejected(bob,good,correct,/Exam session unavailable/);
  await rejected(alice,good,[correct[0],correct[0]],/Duplicate question/);
  await rejected(alice,good,[correct[0]],/does not match assigned questions/);
  await rejected(alice,good,[correct[0],answer(q3,"Alpha")],/does not match assigned questions/);
  await rejected(alice,good,[{...correct[0],correct:true},correct[1]],/Invalid submission row/);
  await rejected(alice,good,[answer(q1,"Unassigned answer"),correct[1]],/not an assigned option/);
  await rejected(bob,stale,[answer(q3,"Alpha")],/not gradeable/);
  await rejected(bob,badOptions,[answer(q4,"Alpha")],/Invalid assigned answer choices/);
  await rejected(bob,unverified,[answer(q5,"Alpha")],/not gradeable/);
  await rejected(bob,archived,[answer(q6,"Alpha")],/not gradeable/);
  await rejected(bob,unsupported,[answer(q7,"Alpha")],/not gradeable/);
  await rejected(bob,expired,[answer(q2,"Beta")],/Exam session expired/);
  assert.equal(await used(alice),0);
  assert.equal(await used(bob),0);

  const result = await submit(alice,good,correct);
  assert.deepEqual(result,{
    score:2,total:2,percent:100,certificate_issued:true,
    results:[{question_id:q2,correct:true},{question_id:q1,correct:true}],
  });
  assert.equal(await used(alice),1);
  assert.deepEqual(await counts(good),{attempts:2,certificates:1,receipts:1});
  assert.ok(!JSON.stringify(result).includes("Alpha"));
  assert.ok(!JSON.stringify(result).includes("request_hash"));
  await rejected(alice,exhausted,[answer(q2,"Beta")],/allowance exhausted/);

  // Lost response: an exact retry survives expiry, exhausted allowance and later key revocation.
  await db.query("UPDATE " + schema + ".sessions SET expires_at=clock_timestamp()-interval '1 hour' WHERE id=$1",[good]);
  await db.query("UPDATE " + schema + ".questions SET review_status='archived' WHERE id=$1",[q1]);
  assert.deepEqual(await submit(alice,good,[answer(q2," Beta "),correct[0]]),result);
  await rejected(alice,good,[answer(q1,"Beta"),correct[1]],/differs from completed receipt/);
  assert.equal(await used(alice),1);
  assert.deepEqual(await counts(good),{attempts:2,certificates:1,receipts:1});
  await db.query("UPDATE " + schema + ".questions SET review_status='published' WHERE id=$1",[q1]);

  const skipped = await submit(bob,blank,[answer(q1,"Alpha"),answer(q2,null)]);
  assert.equal(skipped.percent,50);
  assert.equal(skipped.certificate_issued,false);
  assert.deepEqual(await counts(blank),{attempts:1,certificates:0,receipts:1});
  assert.equal(await used(bob),1);

  // Inject failures after the quota debit and attempt writes, then after certificate insertion.
  await db.exec("CREATE FUNCTION " + schema + ".fixture_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetic write failure'; END; $$;");
  await db.exec("CREATE TRIGGER fixture_fail_certificate BEFORE INSERT ON " + schema + ".certificates FOR EACH ROW EXECUTE FUNCTION " + schema + ".fixture_fail();");
  await rejected(bob,rollback,[answer(q2,"Beta")],/Synthetic write failure/);
  await db.exec("DROP TRIGGER fixture_fail_certificate ON " + schema + ".certificates;");
  await db.exec("CREATE TRIGGER fixture_fail_receipt BEFORE INSERT ON " + schema + ".receipts FOR EACH ROW EXECUTE FUNCTION " + schema + ".fixture_fail();");
  await rejected(bob,rollback,[answer(q2,"Beta")],/Synthetic write failure/);
  await db.exec("DROP TRIGGER fixture_fail_receipt ON " + schema + ".receipts;");
  assert.equal(await used(bob),1);
  assert.deepEqual(await counts(rollback),{attempts:0,certificates:0,receipts:0});
  const recovered = await submit(bob,rollback,[answer(q2,"Beta")]);
  assert.equal(recovered.percent,100);
  assert.equal(await used(bob),2);
  assert.deepEqual(await counts(rollback),{attempts:1,certificates:1,receipts:1});
  assert.deepEqual(await submit(bob,rollback,[answer(q2,"Beta")]),recovered);
  assert.equal(await used(bob),2);
  console.log("Isolated mock-exam fixture passed: ownership, role permissions, stale/revoked keys, exact receipt replay, allowance and full rollback.");
  console.log("Independent PostgreSQL connection concurrency and hosted deployment remain unverified.");
} finally {
  await db.close();
}
