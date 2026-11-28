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

// Catch damaged SQL quote delimiters before starting the isolated database.
for (const tag of ["fixture_guard", "fixture_policies", "choice_normalisation", "option_validation", "submit_mock_exam", "issue_mock_exam", "mock_exam_status", "cancel_mock_exam"]) {
  const delimiter = "$" + tag + "$";
  assert.equal(sql.split(delimiter).length, 3, "Unbalanced SQL delimiter: " + tag);
  assert.ok(sql.includes(delimiter + ";"), "Missing closing SQL delimiter: " + tag);
}

// Both fixtures must use identical option-validation semantics.
const selector = await readFile(new URL("../docs/staging/mock-exam-legacy-selector-fixture.sql", import.meta.url), "utf8");
function helperBlock(source, schemaName) {
  const start = source.indexOf("CREATE FUNCTION " + schemaName + ".canonical_choice");
  const tag = "$option_validation$;";
  const end = source.indexOf(tag, start);
  assert.ok(start >= 0 && end > start, "Missing quality helpers");
  return source.slice(start, end + tag.length).replaceAll(schemaName, "fixture_schema");
}
assert.equal(helperBlock(sql, schema), helperBlock(selector, "stemcoach_selector_fixture"),
  "Standalone selector and atomic issuance must agree on choice eligibility");

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
  // Test real issuance, not caller-created sessions, in a separate synthetic curriculum.
  const issuer = id(301), noQuota = id(302), retryOwner = id(303), insufficient = id(304);
  const issueQ1 = id(311), issueQ2 = id(312), invalidQ = id(313), draftQ = id(314);
  const request = id(321), request2 = id(322), request3 = id(323);
  await db.query("INSERT INTO " + schema + ".user_quotas VALUES($1,2,0),($2,0,0),($3,1,0),($4,1,0)",[issuer,noQuota,retryOwner,insufficient]);
  await addQuestion(issueQ1,{key:"Beta"});
  await addQuestion(issueQ2);
  await addQuestion(invalidQ,{options:["Alpha","Alpha"]});
  await addQuestion(draftQ,{verified:false});
  await db.query("UPDATE " + schema + ".questions SET curriculum='fixture-issuance' WHERE id=ANY($1::uuid[])",[[issueQ1,issueQ2,invalidQ,draftQ]]);
  await db.query("UPDATE " + schema + ".questions SET question_text='Synthetic issued question' WHERE id=ANY($1::uuid[])",[[issueQ1,issueQ2]]);
  async function issue(actor, token, count=2, duration=600, role="service_role", subject="mathematics", curriculum="fixture-issuance", board=null) {
    return asRole(role,async()=>{
      const {rows}=await db.query("SELECT "+schema+".issue_mock_exam($1::uuid,$2::uuid,$3,$4,$5,$6,$7) AS result",[actor,token,subject,curriculum,count,duration,board]);
      return rows[0].result;
    });
  }
  async function sessionCount(actor) {
    const {rows}=await db.query("SELECT count(*) AS n FROM "+schema+".sessions WHERE user_id=$1",[actor]);
    return Number(rows[0].n);
  }
  for(const role of ["anon","authenticated"]) await assert.rejects(()=>issue(issuer,request,2,600,role),/permission denied/);
  for(const [count,duration] of [[0,600],[101,600],[1,59],[1,10801],[null,600]]) {
    await assert.rejects(()=>issue(issuer,request,count,duration),/Invalid exam issuance request/);
  }
  await assert.rejects(()=>issue(noQuota,request),/allowance exhausted/);
  await assert.rejects(()=>issue(insufficient,request,3),/Insufficient verified exam questions/);
  assert.equal(await sessionCount(insufficient),0);
  assert.equal(await used(insufficient),0);
  const issued=await issue(issuer,request);
  assert.equal(issued.status,"active");
  assert.notEqual(issued.session_id,request);
  assert.deepEqual(issued.questions.map(q=>q.id),[issueQ1,issueQ2]);
  assert.ok(issued.questions.every(q=>Object.keys(q).sort().join(",")==="difficulty,id,options,points,question_text,subject,topic"));
  assert.ok(!JSON.stringify(issued).includes("key_digest"));
  assert.ok(!JSON.stringify(issued).includes("correct_answer"));
  assert.equal(await used(issuer),0);
  assert.equal(await sessionCount(issuer),1);
  assert.deepEqual(await issue(issuer,request),issued);
  await assert.rejects(()=>issue(issuer,request,1),/differs from existing session/);
  await assert.rejects(()=>issue(issuer,request,2,601),/differs from existing session/);
  await assert.rejects(()=>issue(issuer,request2),/active examination already exists/);
  const another=await issue(retryOwner,request);
  assert.notEqual(another.session_id,issued.session_id);
  await rejected(retryOwner,issued.session_id,[answer(issueQ1,"Beta"),answer(issueQ2,"Alpha")],/Exam session unavailable/);

  // Detect changes even if an editor neglected to increment the revision.
  await db.query("UPDATE "+schema+".questions SET correct_answer='Alpha' WHERE id=$1",[issueQ1]);
  await assert.rejects(()=>issue(issuer,request),/not gradeable/);
  await rejected(issuer,issued.session_id,[answer(issueQ1,"Beta"),answer(issueQ2,"Alpha")],/not gradeable/);
  await db.query("UPDATE "+schema+".questions SET correct_answer='Beta' WHERE id=$1",[issueQ1]);
  await db.query("UPDATE "+schema+".questions SET question_text='Changed synthetic stem' WHERE id=$1",[issueQ2]);
  await assert.rejects(()=>issue(issuer,request),/not gradeable/);
  await rejected(issuer,issued.session_id,[answer(issueQ1,"Beta"),answer(issueQ2,"Alpha")],/not gradeable/);
  await db.query("UPDATE "+schema+".questions SET question_text='Synthetic issued question' WHERE id=$1",[issueQ2]);
  const submitted=await submit(issuer,issued.session_id,[answer(issueQ1,"Beta"),answer(issueQ2,"Alpha")]);
  assert.equal(submitted.score,2);
  assert.equal(await used(issuer),1);
  assert.deepEqual(await issue(issuer,request),{session_id:issued.session_id,status:"completed"});
  const next=await issue(issuer,request2);
  await db.query("UPDATE "+schema+".sessions SET expires_at=clock_timestamp()-interval '1 minute' WHERE id=$1",[next.session_id]);
  assert.deepEqual(await issue(issuer,request2),{session_id:next.session_id,status:"expired"});
  assert.equal(await used(issuer),1);
  const fresh=await issue(issuer,request3);
  assert.notEqual(fresh.session_id,next.session_id);
  assert.equal(await used(issuer),1);
  assert.equal(await sessionCount(issuer),3);
  // End-to-end legacy decoding, board-scoped selection, frozen metadata and
  // normalised grading without permitting an answer outside the issued choices.
  const legacyActor=id(401), legacyRequest=id(402), boardActor=id(403);
  const legacyQ=id(411), wrongBoard=id(412), ambiguousQ=id(413), malformedQ=id(414), badMeta=id(415);
  await db.query("INSERT INTO "+schema+".user_quotas VALUES($1,1,0),($2,1,0)",[legacyActor,boardActor]);
  await addQuestion(legacyQ,{options:'["  Alpha  ","Ｂｅｔａ"]',key:" beta "});
  await addQuestion(wrongBoard);
  await addQuestion(ambiguousQ,{options:["Alpha","ＡＬＰＨＡ"]});
  await addQuestion(malformedQ,{options:'["Alpha","\\u0000"]'});
  await addQuestion(badMeta);
  await db.query("UPDATE "+schema+".questions SET curriculum='legacy-quality',boards=ARRAY['AQA'] WHERE id=ANY($1::uuid[])",[[legacyQ,wrongBoard,ambiguousQ,malformedQ,badMeta]]);
  await db.query("UPDATE "+schema+".questions SET boards=ARRAY['Edexcel'] WHERE id=$1",[wrongBoard]);
  await db.query("UPDATE "+schema+".questions SET points=0 WHERE id=$1",[badMeta]);
  const issueLegacy=(actor,token,count=1,board="AQA")=>issue(actor,token,count,600,"service_role","mathematics","legacy-quality",board);
  await assert.rejects(()=>issueLegacy(boardActor,legacyRequest,2),/Insufficient verified exam questions/);
  assert.equal(await sessionCount(boardActor),0);
  assert.equal(await used(boardActor),0);
  const legacy=await issueLegacy(legacyActor,legacyRequest);
  assert.deepEqual(legacy.questions,[{id:legacyQ,question_text:"Synthetic fixture question",options:["  Alpha  ","Ｂｅｔａ"],topic:"Synthetic fixture topic",subject:"mathematics",difficulty:2,points:1}]);
  assert.deepEqual(await issueLegacy(legacyActor,legacyRequest),legacy);
  await assert.rejects(()=>issueLegacy(legacyActor,legacyRequest,1,"Edexcel"),/differs from existing session/);
  // Equivalent storage re-encoding is safe; substantive edits are not.
  await db.query("UPDATE "+schema+".questions SET options=$2::jsonb WHERE id=$1",[legacyQ,JSON.stringify(["  Alpha  ","Ｂｅｔａ"])]);
  assert.deepEqual(await issueLegacy(legacyActor,legacyRequest),legacy);
  await rejected(legacyActor,legacy.session_id,[answer(legacyQ,"Beta")],/not an assigned option/);
  await db.query("UPDATE "+schema+".questions SET boards=ARRAY['Edexcel'] WHERE id=$1",[legacyQ]);
  await assert.rejects(()=>issueLegacy(legacyActor,legacyRequest),/not gradeable/);
  await rejected(legacyActor,legacy.session_id,[answer(legacyQ,"Ｂｅｔａ")],/not gradeable/);
  await db.query("UPDATE "+schema+".questions SET boards=ARRAY['AQA'],topic='Changed topic' WHERE id=$1",[legacyQ]);
  await assert.rejects(()=>issueLegacy(legacyActor,legacyRequest),/not gradeable/);
  await rejected(legacyActor,legacy.session_id,[answer(legacyQ,"Ｂｅｔａ")],/not gradeable/);
  await db.query("UPDATE "+schema+".questions SET topic='Synthetic fixture topic' WHERE id=$1",[legacyQ]);
  await db.query("UPDATE "+schema+".questions SET options=$2::jsonb WHERE id=$1",[legacyQ,JSON.stringify(["Ｂｅｔａ","  Alpha  "])]);
  await rejected(legacyActor,legacy.session_id,[answer(legacyQ,"Ｂｅｔａ")],/not gradeable/);
  await db.query("UPDATE "+schema+".questions SET options=$2::jsonb WHERE id=$1",[legacyQ,JSON.stringify(["  Alpha  ","Ｂｅｔａ"])]);
  const grade=await submit(legacyActor,legacy.session_id,[answer(legacyQ,"Ｂｅｔａ")]);
  assert.equal(grade.score,1);
  assert.equal(await used(legacyActor),1);
  assert.deepEqual(await submit(legacyActor,legacy.session_id,[answer(legacyQ,"Ｂｅｔａ")]),grade);
  assert.deepEqual(await counts(legacy.session_id),{attempts:1,certificates:1,receipts:1});
  // A status lookup recovers confirmed results without resubmitting answers.
  // Cancellation is owned by the learner and cannot overwrite a final receipt.
  async function lifecycle(method,actor,session,role="service_role"){
    assert.ok(["get_mock_exam_status","cancel_mock_exam"].includes(method));
    return asRole(role,async()=>{
      const {rows}=await db.query("SELECT "+schema+"."+method+"($1::uuid,$2::uuid) AS result",[actor,session]);
      return rows[0].result;
    });
  }
  const status=(actor,session,role)=>lifecycle("get_mock_exam_status",actor,session,role);
  const cancel=(actor,session,role)=>lifecycle("cancel_mock_exam",actor,session,role);
  for(const role of ["anon","authenticated"]){
    await assert.rejects(()=>status(issuer,fresh.session_id,role),/permission denied/);
    await assert.rejects(()=>cancel(issuer,fresh.session_id,role),/permission denied/);
  }
  for(const [actor,session] of [[retryOwner,fresh.session_id],[null,fresh.session_id],[issuer,id(999)],[issuer,null]]){
    await assert.rejects(()=>status(actor,session),/Exam session unavailable/);
    await assert.rejects(()=>cancel(actor,session),/Exam session unavailable/);
  }
  const activeStatus=await status(issuer,fresh.session_id);
  assert.deepEqual(activeStatus,{session_id:fresh.session_id,status:"active",expires_at:fresh.expires_at});
  assert.equal(await used(issuer),1);

  // A completed receipt is still recoverable after expiry and with zero credit.
  const recoveredGood={session_id:good,status:"completed",result};
  assert.deepEqual(await status(alice,good),recoveredGood);
  assert.deepEqual(await cancel(alice,good),recoveredGood);
  assert.equal(await used(alice),1);
  assert.deepEqual(await counts(good),{attempts:2,certificates:1,receipts:1});
  assert.deepEqual(await status(issuer,next.session_id),{session_id:next.session_id,status:"expired"});
  assert.deepEqual(await cancel(issuer,next.session_id),{session_id:next.session_id,status:"expired"});
  const expiredRow=(await db.query("SELECT cancelled_at FROM "+schema+".sessions WHERE id=$1",[next.session_id])).rows[0];
  assert.equal(expiredRow.cancelled_at,null);

  const cancelled=await cancel(issuer,fresh.session_id);
  assert.deepEqual(cancelled,{session_id:fresh.session_id,status:"cancelled"});
  const cancellationTime=(await db.query("SELECT cancelled_at FROM "+schema+".sessions WHERE id=$1",[fresh.session_id])).rows[0].cancelled_at;
  assert.ok(cancellationTime);
  assert.deepEqual(await cancel(issuer,fresh.session_id),cancelled);
  assert.deepEqual((await db.query("SELECT cancelled_at FROM "+schema+".sessions WHERE id=$1",[fresh.session_id])).rows[0].cancelled_at,cancellationTime);
  assert.deepEqual(await status(issuer,fresh.session_id),cancelled);
  assert.deepEqual(await issue(issuer,request3),cancelled);
  const completeAnswers=[answer(issueQ1,"Beta"),answer(issueQ2,"Alpha")];
  await rejected(issuer,fresh.session_id,completeAnswers,/Exam session cancelled/);
  assert.deepEqual(await counts(fresh.session_id),{attempts:0,certificates:0,receipts:0});
  await db.query("UPDATE "+schema+".sessions SET expires_at=clock_timestamp()-interval '1 minute' WHERE id=$1",[fresh.session_id]);
  assert.deepEqual(await status(issuer,fresh.session_id),cancelled);

  // Cancellation frees the active slot, but neither charges nor refunds.
  const replacement=await issue(issuer,id(324));
  assert.notEqual(replacement.session_id,fresh.session_id);
  assert.equal(await used(issuer),1);
  const finalGrade=await submit(issuer,replacement.session_id,completeAnswers);
  assert.deepEqual(await status(issuer,replacement.session_id),{session_id:replacement.session_id,status:"completed",result:finalGrade});
  assert.deepEqual(await cancel(issuer,replacement.session_id),{session_id:replacement.session_id,status:"completed",result:finalGrade});
  assert.equal(await used(issuer),2);
  assert.deepEqual(await counts(replacement.session_id),{attempts:2,certificates:1,receipts:1});
  assert.ok(!JSON.stringify(await status(issuer,replacement.session_id)).includes("request_hash"));
  assert.ok(!JSON.stringify(await status(issuer,replacement.session_id)).includes("correct_answer"));
  await assert.rejects(()=>issue(issuer,id(325)),/allowance exhausted/);
  console.log("Exam lifecycle passed: owned status, terminal cancellation, unchanged allowance, expiry, replacement and receipt recovery.");
  console.log("Integrated legacy quality issuance passed: decoding, board scope, frozen metadata, exact choice and normalised key grading.");
  console.log("Isolated session issuance passed: ownership, bounded selection, safe sheets, replay, expiry, rollback and frozen keys.");
  console.log("Isolated mock-exam fixture passed: ownership, role permissions, stale/revoked keys, exact receipt replay, allowance and full rollback.");
  console.log("Independent PostgreSQL connection concurrency and hosted deployment remain unverified.");
} finally {
  await db.close();
}
