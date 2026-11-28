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

### Isolated atomic receipt prototype

`mock-exam-atomic-receipt-fixture.sql` now implements an isolated PostgreSQL transaction prototype and is exercised by `npm run test:mock-exam-atomic`. It creates synthetic tables in a distinct fixture schema only, requires a fixture-mode marker, and is deliberately outside the active migration and Edge Function directories.

- Lock the learner-owned session before checking the stored receipt. Canonicalise the exact submitted UUID/answer mapping and retain its SHA-256 digest privately. An identical retry returns the original result, even after session expiry or exhausted allowance; a different payload fails closed.
- Grade only academically verified, currently published single-answer MCQs with unchanged revisions, distinct valid choices and an exact selected option. A blank is unanswered. The narrow fixture contract is **not** a drop-in replacement for the current mixed-format API. Neither formal qualification marks nor new production certificates are authorised by this prototype.
- Consume one allowance through a conditional update, then insert attempts, the synthetic certificate when appropriate, and the receipt in one database transaction. Injected certificate and receipt failures must roll back all writes.
- Use invoker privileges, explicitly restricted execution, RLS on fixture tables, schema-qualified references and a trusted server-only role. The actor argument must be derived from verified authentication at the future Edge Function boundary. The receipt returns correctness and totals but no answer keys or digest.
- The PGlite fixture checks sequential replay and rollback. The separate `Mock exam PostgreSQL contention` CI workflow uses a fresh PostgreSQL 17 service container and independent connections, observes the actual blocking backend, and asserts receipt, final-allowance, conflicting-payload, rollback and editorial-revision outcomes. These tests must pass; they are not a substitute for hosted staging tests against the real schema, authentication, notification and billing integrations. Before production, build server-owned session issuance, verify academic publication eligibility, implement the actual endpoint/client contract and privacy retention, and test independent connections in an isolated staging database. Reconcile existing certificates and parent notification triggers before switching live writes.

Reference: [Supabase database function permissions](https://supabase.com/docs/guides/database/functions#secure-a-database-function) and [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). No active migration or live database operation is part of this release.

### Isolated server-owned examination issuance

The fixture now includes a server-only `issue_mock_exam` function with a learner-scoped retry token and a separately generated session UUID. It validates bounded count, duration and curriculum parameters, selects only eligible academically verified single-answer MCQs, and snapshots question order, revision, stem, choices and a private key fingerprint. The returned sheet contains IDs, stems, options and expiry, not answer keys, fingerprints or learner identifiers. Selection is deterministic for the synthetic test harness; production must derive permitted subject/curriculum/board and exam size/duration from the authenticated learner's entitlements and an approved exam template, and use an appropriate secure sampling strategy.

An advisory transaction lock serializes new issuance per learner. Same-token retries return the same active sheet if it is unchanged, or only completed/expired status once closed. A different request cannot start a second active session. Insufficient eligible questions cause the whole issuance transaction to roll back. No allowance is consumed until grading; the issuance precheck is not a reservation or debit. Changed keys, stems or options fail closed even when the revision has not been bumped. The two independent-connection issuance cases complement the existing five submission contention cases.

The fixture deliberately permits older synthetic session seeds without snapshots. Production must require complete server-created snapshots and must not accept direct browser writes to sessions, assignments, keys or receipts. Before production, complete authenticated Edge Function session issuance and receipt recovery, confirm the actual schema and verified inventory, implement retention/expiry and cancellation policy, verify entitlements and notification triggers, and run hosted staging tests. No production schema or endpoint changes are included.

### Legacy question option audit and quality-gated selection (28 November 2026)

The read-only `mock-exam-option-quality-audit.sql` was executed through the existing STEMCoach Lovable database integration. Across 64,224 published records in the existing mock selector's supported types, 318 failed basic option shape/encoding checks, 89 additional records contained duplicate normalised choices, zero additional records had an unmatched normalised key, and 63,817 passed those structural checks. None of the structurally passing records had both academic-verification fields populated. These are disjoint aggregate counts, not a correctness or exam-board review. The audit uses database NFKC/lowercase and ordinary space trimming; its result is not proof of complete browser-equivalent Unicode handling.

`mock-exam-legacy-selector-fixture.sql` adds a separate, synthetic-schema, server-only selection prototype. It safely decodes one legacy JSON string layer, validates bounded string choices, rejects normalised duplicates and unmatched keys, checks metadata, filters subject/curriculum/board, requires published single-answer MCQs with recorded academic verification and returns precisely the requested count or fails without a partial sheet. Its learner-facing projection omits private keys and review metadata. It uses conservative UTF-8 byte limits and extended whitespace trimming; verify parity with JavaScript normalisation and production database collation. The deterministic fixture ordering is not an appropriate live exam sampler.

The existing production selector has NOT been replaced. This fixture is not imported into the atomic issuance SQL or activated by any migration. The next integration must reconcile the decoded option format with the exact-choice/frozen-key grading policy, require authenticated entitlements and verified templates, and verify the live catalogue's academically approved supply. As of the audit there is no recorded verification for the structurally eligible pool, so enabling the strict selector without academic review could deny every exam. No live question edits or availability changes are authorised by this prototype. `npm run test:publication-audit` now includes isolated synthetic selector and option-audit coverage.

## Other deferred backend work

- PR #5: teacher offboarding and tenant membership boundaries, including revoked access and overlapping institutional roles.
- PR #20: provisional AI assessment feedback, exact request identity, allowance and verified-mastery separation.
- PR #36: sponsored-course entitlement revocation, service-only permission boundaries, daily allowance and billing reconciliation.

The older draft branches diverge from main. Forward-port only the verified pieces; do not merge the stale branches wholesale. Require the appropriate isolated database and end-to-end role/transaction tests before activating a production change.
