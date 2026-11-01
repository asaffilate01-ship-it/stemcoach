# STEMCoach — November 2026 formative content and topic-practice release

**Status:** Author-drafted learning content and application code. Not independently reviewed by an examiner or verified against every examination-board specification. No production Supabase, payment or Omniqora activation is implied by this GitHub merge.

## Content released into the client catalogue

| Subject | Lesson ID | Original new checks |
|---|---|---:|
| Mathematics | `statistics-mean-median-spread` | 8 |
| Physics | `electrical-power-and-energy` | 8 |
| Chemistry | `empirical-formula-method` | 8 |
| Biology | `monohybrid-inheritance` | 8 |
| Computer Science | `sql-queries-and-keys` | 8 |
| Economics | `demand-price-elasticity` | 8 |
| English Literature | `literature-argument-and-evidence` | 8 |
| Psychology | `psychology-experiment-design` | 8 |
| Geography | `river-storm-hydrographs` | 8 |
| Business Studies | `break-even-contribution` | 8 |
| IELTS | `ielts-writing-argument-cohesion` | 8 |
| CELTA | `celta-instruction-checking-feedback` | 8 |
| French | `french-futur-proche` | 8 |
| German | `german-perfekt-auxiliaries` | 8 |
| **New total** | **14 guided lessons** | **112** |

Prior main branch inventory: **99 lessons / 328 formative checks**. New client catalogue target: **113 lessons / 440 checks**.

This expands a static authored formative catalogue; it does **not** increase production Supabase's independently two-pass-reviewed questions, grant quota, or claim official exam-board content. Every new lesson has learning objectives, concept notes, a worked example, exam technique, a common mistake, hints and rationales. The supported input formats are MCQ, multi-select, true/false, numeric, short response, ordering, matching and multi-field completion. The existing diagram format remains available elsewhere.

## Next-phase student experience

- `/tutorials?tutorial=<approved lesson id>` opens a specific lesson and its eight guided checks.
- `/qa-clinic?subject=<subject>&topic=<approved lesson id>` opens a **focused topic Q&A** using the same vetted-in-app text.
- Subject, topic, format, difficulty and review filters combine without admitting unknown topic identifiers; changing subject clears incompatible topics.
- A student may launch an eight-item adaptive or timed revision challenge from the focused topic.
- Q&A marking for this static bank remains deterministic and local; no model/API credits are consumed by these authored self-checks. The separate AI tutor still has its own entitlement checks.
- Existing per-question issue reporting links let learners submit a validated reference and an explanation without placing their answer in the URL.
- English, German and French controls for the new practice navigation are localised. *Lesson and Q&A text itself remains English* and is not advertised as translated.

## Quality / publisher acceptance gates

1. Run `npm ci`, `npm run typecheck`, `npm test`, `npm run lint`, `npm run build` and `npm run test:e2e` for desktop and mobile.
2. Validate all 112 new answer keys against `qaEngine` (correct canonical and incorrect response), inspect each structural answer, check coverage of 14 distinct subjects and unique identifiers.
3. Use reviewer sign-off for pedagogy, ambiguous distractors, acceptable alternate answers, worked-solution calculations, units, inclusive language, curriculum board/version mapping and translated language accuracy if translations are commissioned.
4. Keep authored `supabase/functions/_shared/tutorialCatalog.ts` consistent with `src/data/tutorials.ts`, and do a dry-run `npm run knowledge:preview`. Do **not** run `knowledge:sync` without scoped Omniqora ingestion credentials and reviewed source classification.
5. Test responsive reading layouts and keyboard focus at 360, 390, 768 and 1440 px, reduced motion and 200% zoom; do not remove previous review/academic access controls.
6. If institution assignments or certificates are added for these items later, use server-reviewed bank entries, immutable grading receipts and teacher workflows; never treat locally marked formative practice as certified grades.
7. Do not use copyrighted examination questions, mark schemes or passages without the appropriate rights.

## Remaining work

**Curriculum authority mapping:** For each lesson, reviewers record jurisdiction, awarding body, specification version, publication rights, tier/year group, objective codes, reviewer IDs and sign-off dates. A broad topic label (such as 'statistics' or 'IELTS') must not be treated as formal syllabus conformity.

**Data migrations:** None required for this phase. The server-side tutor allowlist has new entries in source, but its production deployment and Omniqora re-ingest remain separate gated operations.

**Future phase:** Work through draft assessment PR #20 and mock-server PR #28 on the *correct StemCoach staging Supabase*; verify server-side idempotent grading, role isolation, real quota and current curriculum provenance before a production rollout.
