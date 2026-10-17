# STEMCoach education partners and revision planning — Phase 2 (17 October 2026)

This builds on the merged School & Tuition Connections hub. It is source code and a staged migration, NOT a production connection.

## Learner experience
- Seven-day, mobile-friendly study plan from the learner's own stored topic mastery.
- Review-due and low-mastery topics scheduled first; bounded 15-minute suggested tasks with optional spaced follow-up.
- Every task links to existing focus practice. No synthetic study completion, grading, AI inference or auto-transferred data.
- Private learner-initiated aggregate export from Phase 1 remains local.

## Institution and curriculum association
Migration: supabase/migrations/20261017160000_partner_course_scopes.sql, after the existing October 8 institution on-boarding, teacher invitation and class reporting migrations, in isolated staging.
- Service-only, RLS-locked education_partner_bindings, education_partner_course_maps, education_partner_learner_links and education_partner_course_proposals.
- Product keys are the current Omniqora catalogue keys: ilmvero (SchoolDash/Ilmvaro) and unipathways (UniPathway). Do not silently rename persisted records.
- Requires independently documented operator evidence for source/destination institutions, reviewed board/subject/course mapping, verified individual identity and a current partner course proposal.
- Learner preview RPC shows only verified, non-expired course mappings for the signed-in STEMCoach learner with an approved STUDENT membership in the STEMCoach institution.
- Composite FKs prevent joining a course from partner A to a learner from partner B.
- Partner course proposals are not rights to use a paid pack: no subscription, entitlement, quiz, quota or payment code consumes these tables.
- User IDs, external learner IDs, evidence, answers, chats and coursework are excluded from the preview.

## Required staging tests before applying
1. Back up and reconcile full STEMCoach migration history. Live Lovable Cloud currently has legacy tenant INSERT/ALL policies and recorded versions up to August 31; the newer October security chain requires independent verification first.
2. Attempt table INSERT/UPDATE/DELETE as anon, authenticated student, teacher and unrelated admin; deny all.
3. Prove a user in institution A cannot see B's identity or course, and that no other institution's admin can promote a membership or course mapping.
4. Reject unverified/pending/revoked/disabled/expired source links and proposals. Wrong-binding composite FK must reject.
5. Curriculum, exam board and approved content version require independent academic review. OTHM/Qualifi summative assessments remain inside UniPathway.
6. Existing direct subscriptions, quota, practice, checkout and Omniqora Evidence must operate unchanged.
7. Operator evidence, backups, staged RLS tests and explicit go-live approval precede activation.

## Later gated phases (not activated)
- Signed one-time, replay-resistant SSO with issuer/audience, strict TTL, actual source enrolment checks and destination account verification.
- Institutional seat allocation, subscription and price-plan controls (server-side only).
- Consent, guardian/legal and safeguarding checks before any learner progress data transfer.
- Tenant-bound server outbox to Omniqora with minimal event, stable idempotency, receipt validation and revocation.
- Full authenticated cross-platform staging acceptance.

No production migration, Lovable publication, payment or external data transfer occurs merely by merging Phase 2.
