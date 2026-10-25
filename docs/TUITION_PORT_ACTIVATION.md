# STEMCoach: personal tuition port

Source port from UniPathway PR60, adapted independently to this repository. No learner identities, data, content-bank answers, subscriptions or secrets are copied between brands. No hosted SQL or website deployment is performed.

## What is connected

`/learning-plan` is linked from the existing signed-in workspace/navigation. It includes individual goals, tutor-authored diagnostics and practice, learner explanations/help requests, immutable independent tutor reviews, skill observations, deterministic next-task suggestions and separate guardian summaries. Failed reads hide unverified results. Uncertain submissions retain the exact request while the page remains mounted; reload requires checking history. Summary screens do not expose learner answers or tutor diagnostic/feedback text. These are formative records, never qualification grades, certificate issuance or automatic mastery.

Context boundary: current class teacher and class member, with teacher/student roles. A learner cannot review their own work even if they also hold a teaching role. Reads, writes and exact retries recheck current access.

Guardian access: existing approved parent_links; current parent role plus learner opt-in per plan. Changing relationship identity or verification clears the plan consent. Withdrawn/archived membership hides shared summaries. No blanket sharing from other brands or older consent is assumed.

## Activate later through Lovable

1. Back up the actual backend and compare its schema with the source; do not blindly replay history into a populated project. Reconcile prerequisites and then `20261025100851_personalised_tuition.sql` in isolated staging. Preserve all existing unapplied PRs; this port is based on main and does not merge their unrelated features.
2. Run Supabase security/performance advisors, regenerate types and confirm Auth/Data API function grants and RLS. Browser clients have SELECT only on tuition records and no direct access to the sharing ledger.
3. Use distinct authorised tutor, learner, peer, guardian and other-organisation/centre/class accounts. Create a plan and practice; submit an explanation/help request; review, retry unchanged requests and attempt forbidden edits; verify no official result or certificate changes.
4. Check approved relationships, explicit opt-in/revocation, relationship re-verification, removal of teaching/membership/role access, peer isolation and cross-context access. Confirm guardian payloads exclude diagnostic notes, answers and feedback.
5. Check mobile navigation, loading/empty/error states, account changes during a request, older records, and loss of acknowledgement. Refresh reconciles uncertain saves; request state is not persisted across reloads. Confirm full browser journeys against the real hosted schema and concurrent revocation.
6. Only then publish through the existing Lovable workflow. No provider email, calendar, payment, Teams session or native-store release is part of this port.

## Validation and limits

`npm run test:tuition-db` executes the migration with isolated predecessor-schema fixtures and real PostgreSQL permissions using PGlite. It is not a full hosted-history rehearsal. Frontend tests cover guidance, malformed records, exact retries, wrong receipts and late completions. TypeScript and production build are checked separately. No local Supabase server is available for live advisors; those remain an activation gate.

The port provides a tutor-authored workflow, not a complete licensed curriculum, automated diagnostic engine or parity with every competitor. Curriculum approval, production content, real-user acceptance and any existing release gates still apply. Guardian identity verification, automatic notifications, attachments to formative practice, reporting exports and continuous adaptive question generation are not added here.
