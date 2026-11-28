"""Real PostgreSQL contention tests. Only use a disposable GitHub Actions service.

No database URL or project credentials are accepted. Every connection goes through
docker exec into the CI-created container; no live Supabase records are involved.
"""
import json
import os
from pathlib import Path
import re
import subprocess
import time

CONTAINER = os.environ.get("STEMCOACH_EXAM_FIXTURE_CONTAINER", "")
SCHEMA = "stemcoach_exam_fixture"
DB = "stemcoach_exam_ci"
USER = "fixture_admin"
if os.environ.get("GITHUB_ACTIONS") != "true" or not re.fullmatch(r"[0-9a-f]{64}", CONTAINER):
    raise SystemExit("Use only the disposable GitHub Actions exam database service")

def command(name):
    return [
        "docker", "exec", "-i",
        "--env", "PGAPPNAME=" + name,
        "--env", "PGOPTIONS=-c statement_timeout=20000 -c lock_timeout=15000 -c idle_in_transaction_session_timeout=30000",
        CONTAINER, "psql", "-X", "-w", "-qAt", "-v", "ON_ERROR_STOP=1",
        "-U", USER, "-d", DB,
    ]

def query(sql, name="fixture_monitor"):
    proc = subprocess.run(command(name), input=sql, text=True, capture_output=True, timeout=25)
    if proc.returncode:
        raise AssertionError(proc.stderr.strip())
    return proc.stdout.strip()

def uid(n):
    return f"00000000-0000-4000-8000-{n:012d}"

def quote(value):
    # Only synthetic fixture values enter these statements.
    return "'" + str(value).replace("'", "''") + "'"

def submit(actor, session, answers):
    payload = json.dumps([{"question_id": q, "answer": a} for q, a in answers])
    return f"SELECT {SCHEMA}.submit_mock_exam({quote(actor)}::uuid,{quote(session)}::uuid,{quote(payload)}::jsonb);"

def start(name, sql):
    process = subprocess.Popen(command(name), stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE, text=True)
    process.stdin.write(sql + "\n")
    process.stdin.flush()
    return process

def wait_for(process, condition):
    until = time.monotonic() + 10
    while time.monotonic() < until:
        if process.poll() is not None:
            _, err = process.communicate()
            raise AssertionError("Connection ended before expected lock: " + err.strip())
        if query("SELECT " + condition + ";") == "t":
            return
        time.sleep(0.05)
    raise AssertionError("Timed out waiting for observed PostgreSQL lock state")

def close_input(process):
    process.stdin.close()
    process.stdin = None

def result(process, end=None, error=None):
    if end is not None:
        process.stdin.write(end + "\n")
        process.stdin.flush()
        close_input(process)
    output, err = process.communicate(timeout=25)
    if error:
        assert process.returncode != 0 and error in err, (process.returncode, err)
        return None
    assert process.returncode == 0, err
    lines = [line for line in output.splitlines() if line.strip()]
    return json.loads(lines[-1]) if lines else None

def cleanup(process):
    if process is None:
        return
    if process.stdin is not None and not process.stdin.closed:
        close_input(process)
    if process.poll() is None:
        process.terminate()
        try:
            process.communicate(timeout=3)
        except subprocess.TimeoutExpired:
            process.kill()
            process.communicate(timeout=3)

def race(label, first_sql, second_sql, first_end="COMMIT;", second_error=None, admin_first=False, first_keyword="submit_mock_exam"):
    first = second = None
    a, b = "exam_" + label + "_a", "exam_" + label + "_b"
    try:
        first = start(a, "BEGIN;\n" + ("" if admin_first else "SET LOCAL ROLE service_role;\n") + first_sql)
        wait_for(first, f"""EXISTS (SELECT 1 FROM pg_stat_activity
          WHERE application_name={quote(a)} AND state='idle in transaction'
          AND query LIKE {quote('%' + ('UPDATE' if admin_first else first_keyword) + '%')})""")
        second = start(b, "BEGIN;\nSET LOCAL ROLE service_role;\n" + second_sql + "\nCOMMIT;")
        close_input(second)
        # Prove the second connection actually waits on the first backend.
        wait_for(second, f"""EXISTS (SELECT 1 FROM pg_stat_activity waiter
          JOIN pg_stat_activity holder ON holder.application_name={quote(a)}
          WHERE waiter.application_name={quote(b)}
            AND holder.pid=ANY(pg_blocking_pids(waiter.pid)))""")
        one = result(first, end=first_end)
        two = result(second, error=second_error)
        print(label + ": observed lock contention and verified completion")
        return one, two
    finally:
        cleanup(first)
        cleanup(second)

def counts(actor):
    value = query(f"""SELECT jsonb_build_object(
      'used',(SELECT mock_exams_used FROM {SCHEMA}.user_quotas WHERE user_id={quote(actor)}),
      'attempts',(SELECT count(*) FROM {SCHEMA}.attempts WHERE user_id={quote(actor)}),
      'certificates',(SELECT count(*) FROM {SCHEMA}.certificates WHERE user_id={quote(actor)}),
      'receipts',(SELECT count(*) FROM {SCHEMA}.receipts WHERE user_id={quote(actor)}));""")
    return json.loads(value)

def seed(actor, sessions, questions):
    query(f"INSERT INTO {SCHEMA}.user_quotas VALUES ({quote(actor)},1,0);")
    for session in sessions:
        query(f"""INSERT INTO {SCHEMA}.sessions(id,user_id,subject,curriculum,expires_at)
          VALUES ({quote(session)},{quote(actor)},'mathematics','GCSE',now()+interval '1 hour');""")
        for position, question in enumerate(questions, 1):
            query(f"""INSERT INTO {SCHEMA}.session_questions(session_id,position,question_id,revision)
              VALUES ({quote(session)},{position},{quote(question)},1);""")

# Refuse to run against an existing or unexpected database.
assert query("SELECT current_database() || ':' || current_user;") == DB + ":" + USER
assert query(f"""SELECT to_regnamespace('{SCHEMA}') IS NULL AND NOT EXISTS
    (SELECT 1 FROM information_schema.tables WHERE table_schema='public');""") == "t"
fixture = Path(__file__).resolve().parents[1] / "docs/staging/mock-exam-atomic-receipt-fixture.sql"
query("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;"
      f"CREATE SCHEMA {SCHEMA}; SET stemcoach.fixture_mode='isolated-mock-exam-v1';\n"
      + fixture.read_text(encoding="utf-8"))

q1, q2, revoked = uid(11), uid(12), uid(13)
for q, key in [(q1, "Alpha"), (q2, "Beta"), (revoked, "Alpha")]:
    query(f"""INSERT INTO {SCHEMA}.questions(id,subject,curriculum,question_type,review_status,
      review_revision,academic_verified_at,academic_verified_by,options,correct_answer)
      VALUES ({quote(q)},'mathematics','GCSE','mcq','published',1,now(),{quote(uid(99))},
      '["Alpha","Beta"]'::jsonb,{quote(key)});""")

# Same receipt: the second request is reordered, but must return the exact result.
actor, session = uid(1), uid(101)
seed(actor, [session], [q1, q2])
one, two = race("same_receipt", submit(actor, session, [(q1,"Alpha"),(q2,"Beta")]),
                submit(actor, session, [(q2,"Beta"),(q1,"Alpha")]))
assert one == two and one["score"] == 2
assert counts(actor) == {"used":1,"attempts":2,"certificates":1,"receipts":1}

# Different sessions: only one may consume the final available allowance.
actor, sa, sb = uid(2), uid(102), uid(103)
seed(actor, [sa, sb], [q1])
race("last_allowance", submit(actor,sa,[(q1,"Alpha")]), submit(actor,sb,[(q1,"Alpha")]),
     second_error="allowance exhausted")
assert counts(actor) == {"used":1,"attempts":1,"certificates":1,"receipts":1}

# Same session with a different payload must fail instead of returning a receipt.
actor, session = uid(3), uid(104)
seed(actor,[session],[q1])
race("changed_payload", submit(actor,session,[(q1,"Alpha")]), submit(actor,session,[(q1,"Beta")]),
     second_error="differs from completed receipt")
assert counts(actor) == {"used":1,"attempts":1,"certificates":1,"receipts":1}

# A rollback releases the lock, so the second request may complete once.
actor, session = uid(4), uid(105)
seed(actor,[session],[q1])
one, two = race("rollback", submit(actor,session,[(q1,"Alpha")]), submit(actor,session,[(q1,"Beta")]),
                first_end="ROLLBACK;")
assert one["score"] == 1 and two["score"] == 0
assert counts(actor) == {"used":1,"attempts":1,"certificates":0,"receipts":1}

# A concurrent editorial revision commits before grading can acquire its row lock.
actor, session = uid(5), uid(106)
seed(actor,[session],[revoked])
race("question_revision", f"UPDATE {SCHEMA}.questions SET review_revision=2 WHERE id={quote(revoked)};",
     submit(actor,session,[(revoked,"Alpha")]), second_error="not gradeable", admin_first=True)
assert counts(actor) == {"used":0,"attempts":0,"certificates":0,"receipts":0}

# Concurrent issuance for the same learner is serialised by an advisory lock.
# No quota is consumed; a repeated token returns one exact active sheet.
def issue(actor, request):
    return f"""SELECT {SCHEMA}.issue_mock_exam({quote(actor)}::uuid,{quote(request)}::uuid,
        'mathematics','GCSE',1,600);"""

actor, request = uid(6), uid(201)
seed(actor, [], [])
one, two = race("same_issuance", issue(actor,request), issue(actor,request), first_keyword="issue_mock_exam")
assert one == two and one["status"] == "active"
assert len(one["questions"]) == 1
assert set(one["questions"][0]) == {"id","question_text","options","topic","subject","difficulty","points"}
assert counts(actor) == {"used":0,"attempts":0,"certificates":0,"receipts":0}
assert query(f"SELECT count(*) FROM {SCHEMA}.sessions WHERE user_id={quote(actor)};") == "1"

actor = uid(7)
seed(actor, [], [])
race("different_issuance", issue(actor,uid(202)), issue(actor,uid(203)),
     first_keyword="issue_mock_exam", second_error="active examination already exists")
assert query(f"SELECT count(*) FROM {SCHEMA}.sessions WHERE user_id={quote(actor)};") == "1"
assert counts(actor) == {"used":0,"attempts":0,"certificates":0,"receipts":0}

# A board-scoped, legacy-encoded question is issued safely, but a concurrent
# withdrawal of its board eligibility must stop grading before allowance debit.
actor, request, legacy = uid(8), uid(204), uid(14)
seed(actor, [], [])
encoded_options = json.dumps(json.dumps(["Alpha","Ｂｅｔａ"],ensure_ascii=False),ensure_ascii=False)
query(f"""INSERT INTO {SCHEMA}.questions(id,subject,curriculum,boards,question_type,
    review_status,review_revision,academic_verified_at,academic_verified_by,options,correct_answer)
    VALUES ({quote(legacy)},'mathematics','GCSE',ARRAY['AQA'],'mcq','published',1,now(),
    {quote(uid(99))},{quote(encoded_options)}::jsonb,' beta ');""")
issued = json.loads(query(f"""SET ROLE service_role;
    SELECT {SCHEMA}.issue_mock_exam({quote(actor)}::uuid,{quote(request)}::uuid,
    'mathematics','GCSE',1,600,'AQA');"""))
assert issued["questions"][0]["id"] == legacy
assert issued["questions"][0]["options"] == ["Alpha","Ｂｅｔａ"]
race("board_withdrawal",f"UPDATE {SCHEMA}.questions SET boards=ARRAY['Edexcel'] WHERE id={quote(legacy)};",
     submit(actor,issued["session_id"],[(legacy,"Ｂｅｔａ")]),
     second_error="not gradeable",admin_first=True)
assert counts(actor) == {"used":0,"attempts":0,"certificates":0,"receipts":0}
query(f"UPDATE {SCHEMA}.questions SET boards=ARRAY['AQA'] WHERE id={quote(legacy)};")
result_after_restore=json.loads(query("SET ROLE service_role;\n"+submit(actor,issued["session_id"],[(legacy,"Ｂｅｔａ")])))
assert result_after_restore["score"] == 1
assert counts(actor) == {"used":1,"attempts":1,"certificates":1,"receipts":1}

print("Eight independent-connection submission and issuance contention cases passed on disposable PostgreSQL.")
