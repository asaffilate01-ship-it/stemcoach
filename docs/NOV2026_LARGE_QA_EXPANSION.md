# November 2026: large Q&A expansion and truthful sprint/review metrics

## Scope
- 14 original guided formative lessons with **140 new deterministic self-check questions**, one lesson and 10 checks for each active subject. STEM: compound percentages, energy/work/power, acid-base chemistry, food webs, relational databases. Humanities: price indices/inflation, dramatic irony/stagecraft, experimental design, urbanisation, and contribution costing. Language/teaching: IELTS essay structure, CELTA concept checking, French negatives/questions, German separable verbs.
- Client catalogue: **127 → 141 lessons** and **524 → 664 checks**. Lessons feature objectives, multi-step teaching notes, worked examples, exam tips and common misunderstandings; checks have authored distractors, hints and explanatory answer keys.
- Q&A Clinic: timed sprint duration now respects the number of *available* questions, not only the selected nominal 5/10/20 setting. Revision progress shows real first-attempt accuracy from previously stored, private device counts; a solved retry does not rewrite the first-try outcome.
- Server-side validated tutorial identifier allowlist updated as **source only**. No Edge Function or Omniqora re-index deployment.
- Existing auth, tenant isolation, billing, parental roles, teacher assignments and exam grading are unchanged.

## Truth and safeguards
These 140 questions are **authored formative drafts**. They have not been independently checked against exam boards, specifications, awarding-body copyright permissions or local curricula. Do not market them as verified past-paper questions or authoritative tutoring; do not use as graded certification. The lesson and answer content is currently in English; translated interface controls do not constitute translated curricula.

## QA and launch gate
- Vitest checks all 140 canonical answer keys and wrong answers, content uniqueness, source allowlist parity, learner-summary math, timer bounds, question structures and all 14 subjects.
- Playwright desktop/mobile flows verify an authored topic, a 20-request/10-available timed sprint and the private first-attempt display.
- Require `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, desktop/mobile Playwright and tuition DB tests; check actual viewport, accessibility and optional Impeccable. Reviewer sign-off required for scientific nuance, calculations, alternatives, language spelling, accepted answers, age suitability and specification mapping.
- No Lovable credits, new dependencies, paid AI credits, database migrations, role grants or live deployments. Backend mock-exam PR #20/#28 and atomic quota receipt issue #29 remain separate staging work.
