# STEMCoach database release gates (Lovable Cloud)

## Environment and deployment boundary

The existing STEMCoach Lovable project has a Supabase/PostgreSQL database. Read-only aggregate queries and schema inspection have succeeded through Lovable. This is not proof of an isolated staging environment. Do not run proposed migrations, grant changes, grading tests with real users, or sample inserts against the published project's database. Do not substitute another brand's Supabase project. No credentials or private question records belong in this repository.

The audit SQL and contract in this directory are deliberately outside `supabase/migrations` and `supabase/functions`. They cannot activate a new grading path. Re-run the audit in an authorised database console, or use the existing Lovable project database integration, with read-only access. The SQL produces aggregate counts by question type, never question text, answers or learner records. `npm run test:publication-audit` exercises it against isolated synthetic PostgreSQL fixtures.

## Publication quality

- `review_status = 'published'` is a visibility state, not independent academic approval.
- A blank primary answer can be legitimate for an essay with a model answer, marking rubric and positive maximum mark, or for a multi-select question with alternative keys. The audit checks those format-specific fields rather than recommending deletion based on the primary field alone.
- Review any incomplete records in a controlled academic queue. Field presence does not establish correctness, suitability, rights or exam-board alignment. Treat recorded academic verification as metadata, not proof by itself.
- Do not use the draft generator's capacity as a live inventory figure. Retain the private authored drafts outside public source control.

## Mock examination integrity (P0, issues #24 and #29, draft PR #28)

The current repository handler writes attempts, increments allowance and issues a certificate in separate operations. The inspected database exposes a published-question selector for MCQ/code/data-interpretation/assertion-reason types, with no persistent server-owned mock session established by that selector. `user_quotas.user_id` is unique. Existing quota increment and certificate issuance functions are not executable by anon/authenticated roles. Two certificate insert triggers invoke the same parent-notification function; investigate actual duplicate side effects in staging before changing them.

The staged TypeScript contract binds a new submission to the authenticated learner, the assigned session ID, expiry, exact server-owned question set, current revision, published status, eligible question type and nonempty key. It does NOT implement persistence, academic validation, idempotency or grading.

Before activating a new endpoint:

1. Obtain a verified isolated STEMCoach staging database; compare migration history, tables, constraints, RLS, function grants and triggers. Use only synthetic learner accounts and question fixtures.
2. Issue server-owned exam sessions and freeze the ordered question IDs, curriculum and revision at session creation; keep answers inaccessible to learners before grading.
3. Define a unique learner/session receipt and deterministic canonical submission digest. In one transaction, lock the session/receipt, check for an identical replay **before expiry and quota checks**, reject different payloads, and validate the exact current question set under appropriate locks.
4. Score using authoritative, supported answer formats; atomically consume allowance once using a conditional update or lock, persist attempts and any certificate, and persist the authoritative receipt. On any error roll back every write. Restrict privileged operations to trusted server code, with explicit grants and ownership checks. Avoid changes to other brands or live users.
5. Verify concurrent submissions, stale or revoked question revisions, cross-account access, duplicate and partial submissions, exhausted quotas, expired sessions, network failure after commit, replay with modified answers and rollback after a certificate/notification failure. Verify no duplicate certificate or notification. Include signed-in browser tests.
6. Review deployment order and backwards compatibility before changing the active Edge Function and client. Do not assume that merging GitHub deploys the database or frontend.

## Other deferred backend work

- PR #5: teacher offboarding and tenant membership boundaries, including revoked access and overlapping institutional roles.
- PR #20: provisional AI assessment feedback, exact request identity, allowance and verified-mastery separation.
- PR #36: sponsored-course entitlement revocation, service-only permission boundaries, daily allowance and billing reconciliation.

The older draft branches diverge from main. Forward-port only the verified pieces; do not merge the stale branches wholesale. Require the appropriate isolated database and end-to-end role/transaction tests before activating a production change.
