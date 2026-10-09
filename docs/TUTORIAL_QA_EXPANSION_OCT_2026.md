# STEMCoach author-drafted Q&A and tutorial expansion (October 2026)

## Delivery scope

- Increase the authored tutorial catalogue from 29 to **57 lessons** (two new lessons in each of 14 subjects).
- Increase the interactive learning self-check library from 48 to **160 questions**, including **112 newly authored** questions.
- Seven interaction formats: single-choice, multi-select, true/false, numerical answer, short written response, ordering, and matching.
- The same accessible, keyboard-usable answer engine powers the tutorials and Q&A Clinic.
- All new lessons include objectives, guided steps, a worked example, a teacher hint for every question, an exam tip and a common-mistake explanation.
- A 10-question mixed challenge includes session progress, first-try score and streaks. A reveal with no submitted response does not score. Wrong first attempts remain wrong for first-try scoring even if corrected later.
- The Q&A browser includes subject, question-format and difficulty filters, search, and incremental loading (16 cards per page).
- Correct responses to every knowledge check in a tutorial continue to use the existing authenticated Supabase lesson-completion RPC; guest progress remains local to the browser.
- All 57 lesson IDs are synchronised with the server-side context allowlist for the AI tutor.
- English, French and German UI strings are added, but **lesson teaching prose is currently English only**. Non-English users see this limitation.

## Content and safety boundaries

This is an authored revision resource, not an official examination question bank. The new content has been structurally validated, but is **not independently approved** by an awarding body or two academic reviewers. It does not affect the separately reviewed paid examination bank or claim progress towards two million published exam questions.

The self-checks and canonical answer keys are intentionally shipped in frontend code for open revision. They must not be repurposed for high-stakes secure testing, exams, licence entitlements, or payment-metered grading. The server grades real exams and assignments separately.

## Release verification

1. Unit tests validate exact lesson/question counts, unique IDs, seven format-specific schemas, grading edge cases, lesson coverage, AI coach server allowlist, and no credit for self-revealed solutions.
2. Browser tests cover answer reveals, numeric retry, filters, matching, ordering, short answers, ten-question challenge, tutor draft handoff, and guest tutorial persistence.
3. Type-check, lint, production dependency security audit and build run in the release pipeline.
4. Deploy the web frontend and the updated \`ai-chat\` Edge Function together to recognise new lessons and maintain accurate provenance wording.
5. Test on an actual mobile browser, including keyboard, screen reader and real Supabase progress persistence. No live deployment is implied by a successful GitHub CI run.

## Remaining content work

Obtain independent academic review, board-specific source mapping and syllabus revisions; review difficulty calibration, accessibility with assistive technology, translations of the teaching material, and create topic-path recommendations based on actual learning data. Future scale should use a reviewed authoring workflow rather than publishing unverified generated questions automatically.
