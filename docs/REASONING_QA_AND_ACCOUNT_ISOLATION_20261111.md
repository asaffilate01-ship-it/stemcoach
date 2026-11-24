# STEMCoach — next learning and Q&A release
Date: 11 November 2026

## Scope

This release builds on the previously merged 200-lesson / 1,166-self-check repository baseline.

- **12 new distinct guided lessons**, eight fully authored formative checks each (**96 Q&A**), moving the repository catalogue to **212 lessons and 1,262 formative self-checks**.
- Five primary subjects: mathematics (3), physics (3), chemistry (2), biology (2), computer science (2).
- Topics: conditional probability without replacement; rounding/error intervals; quadratic graph vertices; thinking/braking distance; impulse and force–time graphs; parallel resistors; measuring rate from graphs; galvanic cells; immune memory; reflex arcs; binary search; equivalence-partition testing.
- Every new lesson contains three explanatory sections, learning objectives, worked numerical or conceptual example, a common misconception, an exam tip, and eight interactive formative questions with hints and solutions. This is educational draft material, not a certified examination question bank.
- Updated trusted lesson-context allowlist for the server AI tutor; does not permit AI to publish marks or migrate academic content.

## Confirmed source-level issue: shared-browser practice metadata

Previously the public Q&A screen persisted bookmarks and first-attempt review history under the same browser-wide localStorage keys, regardless of which learner was signed in. This could show one user's device-only saved topics to another learner on a shared computer.

Now:
- Saved-question and history keys are scoped separately to **guest** or each authenticated user's ID; no API or database writes are added.
- QAClinic session is remounted on account switch, sign-out or guest transition. Pending local quiz state is not carried into the next account.
- The page waits for auth readiness before loading local progress to avoid a brief cross-account flash.
- Legacy unscoped v1 keys are **not automatically migrated**, because their owner is unknown. Old records may still physically exist in browser storage, accessible to somebody with control over that browser; localStorage is neither encryption nor a secure private storage vault.
- Clear English/French/German in-page notice: device-only and not automatically synchronised between devices.
- New tests validate key separation, guest data, unscoped legacy handling and source-level use of the correctly scoped keys.

## Academic and release gates

This branch changes only teaching content, browser-local UI state and a read-only lesson-ID allowlist. **No Supabase migration, billing change, production Edge Function deployment, generated question publication or new AI/MCP service is included.**

Unit tests verify correct answer keys and reject malformed or deliberately wrong submissions; content checks enforce uniqueness, explanation quality and consistent catalogue totals. These automated checks **cannot replace independent subject-expert review**, current exam-board specification mapping, diagram/notation verification or safeguarding checks.

Required release gates: TypeScript, lint, Vitest, production build, browser tests and design scan; keyboard and screen-reader review at 360, 390, 768 and 1440 px, 200% zoom and actual Android/iOS remain manual production acceptance. GitHub merge does not establish that a hosted site is deployed.

## Targets: 500 lessons and 1 million approved Q&A

Current repository stage after this PR: **212/500 lessons**, **1,262 authored formative self-checks**. The existing deterministic generator covers **1,048,576 possible numerical drafts**, not 1 million verified or independently written exam questions. The hosted approved bank remains unverified without the correct STEMCoach project and review audit.

Next phases should prioritise:
1. 212 → 250 lessons, filling GCSE/A-level reasoning, data interpretation and practical investigation gaps.
2. Qualified review tools, provenance/version checks, negative/distractor evaluation and reviewer audit events for content promotion.
3. A server-owned resumable question-generation pipeline, with distinct counters for candidates, reviewed and published records.
4. Verified institutional auth boundaries, grading receipts and quotas in a STEMCoach **staging** database before merging the separate backend draft PRs.

## Reference code and test coverage

- `src/lib/qaPractice.ts`, `src/pages/QAClinic.tsx`, `src/test/qa-account-isolation.test.ts`
- `src/data/nextReasoningExpansion.ts`, three per-domain lesson files, `src/test/next-reasoning-expansion.test.ts`
- `supabase/functions/_shared/tutorialCatalog.ts`
- Existing content-count unit and Playwright smoke tests updated to 212 / 1,262.
