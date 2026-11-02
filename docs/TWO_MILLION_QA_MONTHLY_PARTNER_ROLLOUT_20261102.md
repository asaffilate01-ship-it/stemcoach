# STEMCoach — 17 subjects, 2 million reviewed Q&A target, monthly releases and education partners
**Architecture and rollout specification — 2 November 2026**

## Verified state versus target

The previously merged authored client catalogue has 141 guided lessons and 664 Q&A. This phase adds **9 original formative language lessons and 90 local graded-by-key self-checks** (30 each in introductory Italian, Spanish and Modern Standard Arabic), giving **150 lessons and 754 authored local checks across 17 subjects**. They are not independently board-certified and are not the PostgreSQL paid/approved question-bank inventory.

The existing admin generation infrastructure can plan 2,000,000 draft questions using restartable 1,000-job checkpoints, atomic claims and mandatory academic review. **2,000,000 is the target, not the current generated, reviewed or published count**. The admin dashboard now separately reads the server's protected `get_question_bank_metrics` aggregate and measures progress using only its `published_total` value. This is not a claim of 2 million already available.

### Language rollout
- Italian: essere/avere, noun agreement/articles, travel questions.
- Spanish: ser/estar, present-tense regular verbs, travel/shopping.
- Arabic: introductory **Modern Standard Arabic**, script/pronouns, definite article, nominal sentences. Arabic is not one uniform spoken dialect.
- The three subject choices are visible within the existing EN/FR/DE interface, and practice uses language-specific speech-synthesis locale tags plus direction-aware Arabic text.
- UI text localisation into Italian, Spanish and Arabic **is not** yet complete; don't advertise full-platform language localisation. The new material's teaching notes are English with target-language examples. Teaching, pronunciation and accepted-answer variants need qualified native-speaker review.
- Fallback STEMCoach artwork is reused deliberately rather than inventing character portraits or copying existing mascots.

## Monthly new releases for paying members

**Commercial target:** create a recurring learner subscription that grants access to *newly approved question releases each month*, in addition to historical approved content as dictated by the chosen plan. Current Stripe Standard and Top-Up Packs are **one-time question-credit purchases**, not recurring subscriptions. Do **not** silently call them monthly plans or grant perpetual access until new paid subscription prices, webhooks, terms and entitlement lifetimes are configured.

Suggested workflow:
1. Content operations create a `YYYY-MM` release manifest with target curricula, board/spec versions, topics, languages and question types. Status begins `draft`.
2. Generate/import material with idempotent source/content hashes. Automated schema, content-similarity, readability, forbidden-content, answer-key and language checks flag doubtful material. Every generated/imported question remains `needs_review`.
3. Independent subject and language reviewers verify syllabus-version/source authority and mark schemes. A second review is required for high-risk or ambiguous questions. Copy/paste from official past papers requires a licence.
4. An authorised publisher freezes a release **only from `published` question IDs**. Revision history and change logs must be maintained. A withdrawn question must become unavailable without automatically releasing a replacement with an unverified key.
5. Stripe subscription events are verified by server webhooks. Active subscription, billing interval, plan price, cancellation grace, permitted curriculum and release date are checked on **every protected server query**. Avoid trusting browser plan flags or `user_metadata`.
6. Releases are scheduled for each calendar month; if review fails, publish fewer approved questions and report the actual number instead of generating fake volume. A month with zero approved questions is not advertised as a release.
7. Ensure refunds, chargebacks, failed payment grace, transfer restrictions, annual renewals and independent school seats have written terms.

**Existing paid pack holders:** keep their purchased question and mock-exam quotas unchanged until an explicitly approved migration/offer; no retroactive contractual changes.

## Free access for UniPathway, TrainDirekt and Skillfinch

**Requested benefit:** STEMCoach core question-bank access without a student payment, funded by the three named educational partners, subject to verified **active enrolment** and any agreed course scope. The intended source IDs are `unipathways` (existing internal identifier for UniPathway), `traindirekt`, and `skillfinch`.

The current `education_partner_*` tables already support operator-reviewed partner, course, learner and time-bounded proposal links; the read-only preview specifically **does not grant paid access**. Existing SQL permits only `ilmvero` and `unipathways` as source products. The new two providers and the actual granting mechanism require a **staging-tested, server-side migration**. An institutional email domain, self-selection of a school, a URL parameter, or unverified JWT/user metadata are **not** evidence of eligibility.

Required before activation:
1. Confirm each institution's legal tenant, verified API/SSO integration or signed enrolment feed, active course IDs, academic year and consent basis.
2. Extend the restricted source-product allowlist without disturbing existing `ilmvero` and `unipathways` bindings.
3. Implement an internal service-role-only check for each learner's approved member record, verified identity mapping, reviewed course scope, date window, revocation and tenant. Fail closed on any mismatch or stale source data.
4. Apply that entitlement in the server's question-fetching and grading path and reflect the same permitted course scopes in the client. Never bypass the server by hiding a paywall. Verify concurrent usage and daily fair-use limits.
5. Define whether AI tutoring and paid mock exams are included and their cost limits **separately** from free core Q&A; do not grant unbounded paid-model calls automatically.
6. Test immediate revocation, expired/changed courses, wrong-tenant IDs, refund interactions and student transfers. Enable only after successful staging and production-security review.

**This phase does not silently activate free entitlements**: automatic grants, billing and protected server release filtering are a separate gated integration, because no live authentication/billing/partner environment has been verified here.

## Quality and release gates

The 90 new checks have deterministic correct/incorrect-answer coverage, unique IDs, subject-level parity, tutorial-context allowlist parity, Arabic-direction checks and desktop/mobile browser journeys. The global question-bank target display uses a protected aggregate rather than invented counters.

Run GitHub release CI (typecheck, lint, Vitest, build, Playwright desktop/mobile), tuition compatibility and advisory design checks. Confirm new language teaching accuracy with qualified reviewers, source rights and accepted Arabic diacritic/orthographic variants. No Lovable, credentials, live database migration or paid-model bulk generation has been used.
