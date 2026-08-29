# STEMCoach content-bank rollout

## What this phase delivers

- A restartable generation campaign that targets 200,000 questions by default and supports 1,000–250,000 questions per campaign.
- Fourteen learner-facing subjects, eleven quiz formats, balanced difficulty levels, and curriculum-aware queue dimensions.
- Atomic worker claims, SHA-256 content deduplication, retry tracking, campaign progress, and failed-job reporting.
- A mandatory `needs_review` state for generated and imported questions. AI content is never published automatically.
- An admin academic-review screen showing the question, options, canonical answer(s), explanation, worked solution, mark scheme, model answer, specification version, source URL, and quality flags.
- Persistent STEM Coach/STEM Team selection and per-subject coaching history across pages, browser sessions, and signed-in devices.

## Important content boundary

The pipeline can produce a bank of 200,000 drafts; it does not turn generated drafts into academically approved questions. A qualified reviewer must compare every item with the exact current subject specification and official source before publication. The country/framework catalogue records provenance for the supported systems, but it is not a claim that every jurisdiction, local board, school programme, language, or specification version in the world is already covered.

University curricula are deliberately excluded from bulk generation because they are institution- and module-specific. State, provincial, territorial, and regional variants also require their own source mapping and reviewer assignment before being added.

## Deployment order

1. Back up the production database and test the migration against a staging copy.
2. Apply Supabase migrations in timestamp order. The new phase migration is `supabase/migrations/20260829223000_persistent_coach_and_quiz_formats.sql`.
3. Configure Edge Function secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`, `APP_ORIGIN`, and the existing cron/admin secrets used by `_shared/gate.ts`.
4. Deploy `batch-generate`, `generate-questions`, and `check-answer` together so the database schema and workers remain compatible.
5. Deploy the web application and smoke-test sign-in, coach selection, subject switching, conversation restoration, practice grading, admin review, and CSV import.
6. Start with a 1,000-question staging campaign. Review error, duplicate, and rejection rates before starting the 200,000-question production campaign.

## Generation and review workflow

1. An administrator opens **Admin → Generate Questions**, chooses a target, and seeds a campaign.
2. The scheduled worker atomically claims pending queue rows. Parallel workers cannot claim the same row.
3. Structurally valid questions are deduplicated and saved as `needs_review`.
4. A subject-qualified reviewer opens each full review record, checks the answer and working, checks the exact specification version and official URL, edits if needed, and publishes or rejects it.
5. Learners can receive only `published` questions through `questions_safe`; the answer checker independently fetches the published record on the server.

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
