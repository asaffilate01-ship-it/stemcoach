# Seven-day Q&A revision plan — 1 November 2026

## Shipped source changes

The public Q&A Clinic now derives an optional seven-day, five-question-per-day plan from the **existing local, formative** question-review metadata. It prioritises overdue or due items (oldest due first), then introduces unseen questions while spreading them across subjects. No question ID appears twice within the seven-day proposal. Each day's **Practise** button launches the exact suggested question IDs in the existing interactive challenge flow, with first-attempt feedback and explanations. The plan follows all current library filters, including subject and topic.

The planner uses the browser's local calendar, including daylight-saving transitions; a suggested future session is not a teacher assignment. The plan updates when the learner practises, clears history or changes their selection. Empty plans and filtered small banks are handled without inventing questions.

The screen labels are translated in English, French and German. Authored questions and worked solutions remain in English, as already disclosed to learners.

## Privacy and scope

No backend data, typed answers or question text is persisted or uploaded by the planner. Only the pre-existing, validated device-local question history is read. Planning does not change AI credit quotas, grading, teacher assignments, institutional roles, subscriptions, payments, Supabase schemas, or Omniqora ingestion. Plan outputs are **not** examination grades or evidence of verified curriculum mastery.

## Verification and remaining gates

The feature includes deterministic unit tests for due-first ordering, unseen coverage, ID uniqueness, small/empty banks, bounds and DST, plus Playwright tests for an end-to-end local session and prior missed-question prioritisation. Required before production: `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, desktop/mobile Playwright, review of colour-independent states, 200% zoom and the optional Impeccable audit. Validate on a real deployed device with disabled local storage. Do not merge staging-sensitive assessment PR #20 or #28 as part of this UI phase. The server-side quota concurrency work in issue #29 is still outstanding.
