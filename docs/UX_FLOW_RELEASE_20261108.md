# STEMCoach — navigation, recovery and learning-flow release (8 November 2026)

## Scope of this PR
- Keep every role-eligible page discoverable in desktop overflow and mobile More navigation; client role filtering is not security authorization.
- Permit students to skip the mascot tour and require acknowledged onboarding preference saves before advancing.
- Reject stale question-load responses after subject, curriculum, practice-mode or retry changes. Distinguish real empty content from load failures and cached display.
- Prevent repeated answer submissions within a tab, and ignore old response UI updates after a question-set change. Server attempts and quota idempotency remain a separate staging dependency.
- Remove question-only local AI-explanation caching that could accidentally show another user's personalised explanation on a shared device.
- Introduce one evidence-based next step above dashboard metrics; recent-accuracy observations are not presented as verified exam readiness.

## Deferred backend gates — do not deploy from unrelated draft PRs
- PR #20 assessment reliability and private AI grading cache: reconcile conflicts with main, run hosted RLS and cross-user cache tests.
- PR #28 mock exam: validate a durable server attempt receipt, idempotent grade, persisted deadline and concurrent quota consumption before allowing automatic recovery.
- PR #36 sponsored learner access and monthly questions: only after verified partner enrolment, course-scoped entitlements, revocation, Stripe events and RLS tests.
- No new claims of millions of verified questions or native offline graded exams.

## Acceptance scenarios
1. Mobile 360/390px: More menu reaches Q&A, study skills and correct role-specific pages, with focus and scrolling intact.
2. Desktop 1440px: role-specific top-level destinations remain accessible through More, no silent navigation truncation.
3. Onboarding: failed upsert keeps the selection, stays on curriculum step, offers retry and does not start payment.
4. Rapid subject/mode changes: previous results never replace the new subject; a network error can be retried without a false empty-bank claim.
5. Cached questions are described accurately: they display but cannot be graded offline.
6. Repeated answer tap/keyboard activation: at most one in-flight request is issued by the current tab.
7. Logging in as a different student on one device cannot reuse a question-only cached AI explanation.
8. Today dashboard shows a next action based only on measured history; weak-area recommendation does not claim board-approved readiness.
9. CI: typecheck, lint, unit tests, build, Playwright desktop/mobile; then manual keyboard, 200% zoom and real Android testing.
