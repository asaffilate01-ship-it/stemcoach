# STEMCoach — Language depth and review-capacity phase (2 November 2026)

## Built in this branch
- Six additional original guided language lessons, two per language (Italian regular verbs and adjective agreement; Spanish gustar and regular preterite; Modern Standard Arabic question words/places and numbers). Each lesson has one checkpoint and nine practice questions, for **60 additional original formative Q&A**.
- Client catalogue grows from 150 lessons / 754 authored Q&A to **156 lessons / 814 Q&A** across 17 subjects.
- New lesson IDs have distinct, trusted tutor-context entries. The corresponding authoring and grading tests validate all canonical and explicitly incorrect answers, unique IDs and topic coverage. UI tests cover filtered, timed practice and Arabic short answers.
- Arabic short-text grading now disregards optional Arabic vowel marks and tatweel in the answer comparison, preserving significant letters and Western accent distinctions. It is not a semantic translator: accepted-answer variants still need human authoring. This fix is limited to local formative Q&A; official server-graded examination submissions are unchanged.
- A new admin **Academic review capacity planner** appears below the truthful published question-bank progress. It accepts adjustable qualified-reviewer headcount, checks per reviewer per day, working days, approval yield and goal horizon. It calculates scenarios from actual verified published counts, never from generated drafts, and does not write learner data or trigger generation/billing.

## Examples of planning arithmetic (not a forecast)
With 24 reviewers, 60 checks per day, 20 days per month and 80% acceptance, a steady scenario yields approximately 23,040 approved items/month. Starting at zero and targeting two million would require approximately 87 months. A 24-month horizon requires approximately 83,334 approved items/month and around 87 reviewers at that assumed throughput. These are hypothetical calculations; real review speed and approval yield must be measured using first-party results.

## Boundaries
- This phase changes **no** Supabase schema, live API roles/RLS, subscription payment, annual/monthly price, partner access or paid-content entitlement. No Lovable work or paid bulk model generation.
- Existing draft PR #36, including the UniPathway, TrainDirekt and Skillfinch sponsored-access design, remains deliberately unmerged until a STEMCoach-specific Supabase staging environment, verified enrolment sources, payment provider configuration and atomic answer-usage accounting are tested.
- The two-million goal measures **academically reviewed and published questions** in PostgreSQL; 814 locally authored formative Q&A must not be included in that number without the same review and publication path.
- The new language content requires native-speaker review, exact specification mapping, academic quality checks and copyright checks before institutional claims or assessed use.

## Merge gates
Run TypeScript, ESLint, Vitest, production build, Playwright desktop/mobile, tuition compatibility and optional design source audit. Manually review Arabic bidirectional content and short-text UI on real mobile; ensure 200% zoom, keyboard focus and reduced motion are acceptable. Post-merge production deployment is independent and requires verification.
