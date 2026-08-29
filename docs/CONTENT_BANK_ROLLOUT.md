# STEMCoach content-bank rollout

## What this phase delivers

- A restartable generation campaign that targets 2,000,000 questions by default and supports 1,000–2,500,000 questions per campaign.
- Resumable queue planning in 1,000-job checkpoints, with up to 20 drafts per job, so a 2M campaign is never planned in one Edge request or truncated by API row limits.
- Fourteen learner-facing subjects, eleven quiz formats, balanced difficulty levels, and curriculum-aware queue dimensions.
- Atomic worker claims, SHA-256 content deduplication, retry tracking, campaign progress, and failed-job reporting.
- A mandatory `needs_review` state for generated and imported questions. AI content is never published automatically.
- An admin academic-review screen showing the question, options, canonical answer(s), explanation, worked solution, mark scheme, model answer, specification version, source URL, and quality flags.
- Atomic reviewer batches with one-hour claims, per-reviewer progress metrics, required rejection notes, explicit academic attestation, and a visible decision history.
- Persistent STEM Coach/STEM Team selection and per-subject coaching history across pages, browser sessions, and signed-in devices.
- Curriculum-filtered learner practice and coaching informed by recent missed topics, without exposing protected question-bank answers to the browser or tutor prompt.

## Important content boundary

The pipeline can produce a bank of 2,000,000 drafts; it does not turn generated drafts into academically approved questions. A qualified reviewer must compare every item with the exact current subject specification and official source before publication. The country/framework catalogue records provenance for the supported systems, but it is not a claim that every jurisdiction, local board, school programme, language, or specification version in the world is already covered.

At the default 20 drafts per job, a full campaign contains approximately 100,000 queue jobs. Queue planning, generation, automated checks, academic review, and publication must therefore be treated as separate resumable operations. Do not advertise two million accurate or reviewed questions until the published, independently reviewed count reaches that figure.

University curricula are deliberately excluded from bulk generation because they are institution- and module-specific. State, provincial, territorial, and regional variants also require their own source mapping and reviewer assignment before being added.

## Deployment order

1. Back up the production database and test the migration against a staging copy.
2. Apply Supabase migrations in timestamp order. This includes `supabase/migrations/20260829223000_persistent_coach_and_quiz_formats.sql`, `supabase/migrations/20260829233000_review_workflow_and_personalised_coaching.sql`, then `supabase/migrations/20260829234500_two_million_question_bank.sql`.
3. Configure Edge Function secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`, `APP_ORIGIN`, and the existing cron/admin secrets used by `_shared/gate.ts`.
4. Deploy `batch-generate`, `generate-questions`, and `check-answer` together so the database schema and workers remain compatible.
5. Deploy the web application and smoke-test sign-in, coach selection, subject switching, conversation restoration, practice grading, admin review, and CSV import.
6. Start with a 1,000-question staging campaign. Review error, duplicate, and rejection rates, then rehearse pause/resume and queue checkpoints before starting the 2,000,000-question production campaign.

## Generation and review workflow

1. An administrator opens **Admin → Generate Questions**, chooses a target, and creates a campaign. The 2M default is divided into durable 1,000-job planning checkpoints.
2. Each scheduled worker extends any incomplete plan by one checkpoint before atomically claiming pending queue rows. Parallel generation workers cannot claim the same row, and repeated planning requests are idempotent.
3. Structurally valid questions are deduplicated and saved as `needs_review`.
4. A subject-qualified reviewer claims a filtered batch. Claims expire after one hour so abandoned work returns to the available queue without allowing two active reviewers to approve the same item.
5. The reviewer opens each full record, checks the answer and working, checks the exact specification version and official URL, records notes, then publishes, rejects, returns, or releases it. Every decision is written to the review history.
6. Learners can receive only `published` questions through `questions_safe`; practice is filtered by their selected curriculum and the answer checker independently fetches the published record on the server.

Recommended reviewer assignments are by subject, jurisdiction/framework, qualification level, and language. Keep an audit sample for each reviewer and pause a campaign when its rejection or correction rate exceeds the organisation's agreed threshold.

## Monitoring

Monitor these separately:

- campaign target versus generated drafts;
- pending, processing, failed, and completed jobs;
- duplicates ignored during insertion;
- drafts awaiting review;
- reviewed and published totals;
- rejection and post-review correction rates by subject/curriculum/type;
- AI provider cost and rate-limit errors;
- coach request quotas and Edge Function errors.

A campaign with failed queue rows is marked `failed`, not `completed`. Correct the source problem, requeue only the affected jobs, and confirm counts before resuming.

## Adding another country or syllabus

1. Add the qualification identifier and learner-facing label to the curriculum catalogue.
2. Add the official authority, HTTPS source URL, scope note, and review date to `src/data/curriculumAuthorities.ts`.
3. Add exact board/specification mappings to the generation planner; do not use a generic national source where education is state, provincial, territorial, or regional.
4. Restrict the curriculum to subjects it actually assesses.
5. Add language instructions where needed.
6. Assign an academically qualified reviewer and run a small validation campaign.
7. Publish only after question-level specification verification.

## Release checks

Run before every release:

```bash
npm test
npm run lint
npm run build
npm audit --audit-level=high
git diff --check
```

Lint warnings currently predate this phase; the release gate is zero lint errors. Database migrations must also be executed on a staging Supabase project because the frontend build cannot validate PostgreSQL trigger execution.
