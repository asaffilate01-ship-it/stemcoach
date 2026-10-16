# STEMCoach Q&A Phase 6: adaptive practice and interactive diagrams

## Authored delivery (not exam-board-verified)

- 14 new draft lessons, **one in each of 14 subjects**, with four self-checks per lesson.
- Total learning catalogue grows from **57 tutorials and 160 self-checks** to **71 tutorials and 216 self-checks**.
- Nine interactive formats: single choice, multiple select, true/false, numeric, short written answer, ordering, matching, **fill in the blanks** and **diagram labelling**.
- Four original SVG diagrams (triangle, cell, circuit, water cycle) use visual markers and labelled, keyboard-accessible dropdowns. These graphics are teaching aids, not official examination diagrams.
- Optional browser text-to-speech reads the English question where a compatible browser exposes speech synthesis; no recording, server audio, or official listening-test marking is implied.
- Device-only review counters: first-try errors, attempts, due dates and review streaks. **Answers typed by learners are not persisted.**
- Adaptive 10-question review weights due and previously missed questions more heavily and still includes unseen questions. Mixed practice remains available.
- An optional **5-minute timed challenge** counts down using wall-clock time and finishes when time expires. It is a self-check, not a formally invigilated test.
- Review metrics show how many questions have been practised, the number due for review and the strongest weak-topic signals. Learners can clear the local history.

## Constraints and cautions

- The Q&A library is transparent browser content and **not secure exam material**. Graded assessments use the separate server-verified pipeline.
- Teaching text remains authored in English; the interface controls are localised into English, French and German.
- This phase deliberately does **not** modify Supabase tables, migrations, authentication, payment limits or tenant access. It does update the \`_shared/tutorialCatalog.ts\` AI coach allowlist, which requires a later deployment of the \`ai-chat\` Edge Function.
- Progress history is local to the browser/device and **does not sync across devices**. Guest/device histories should be cleared on shared devices.
- Quality tests validate schemas, unique IDs, answer keys and basic responses; an independent subject reviewer must check the new teaching material against the relevant official syllabus before claiming exam-board accuracy.

## Pre-release acceptance

1. Build, typecheck, lint, content/unit tests and Playwright desktop/mobile journeys.
2. Test keyboard, small-screen input, label associations, colour contrast and speech synthesis controls.
3. Validate adaptive sampling, local-history clear, due dates and past error weighting.
4. Verify timed mode with a real browser clock, including tab backgrounding and expiry.
5. Publish the web frontend and the updated \`ai-chat\` function together. Confirm deployed frontend matches merged GitHub commit.
6. Recheck commercial entitlements, Q&A privacy messaging, localStorage behaviour, and offline app experience in staging.
