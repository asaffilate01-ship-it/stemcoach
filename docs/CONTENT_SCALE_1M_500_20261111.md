# STEMCoach content programme — 1,000,000 questions and 500 lessons
Date: 11 November 2026

## What is real, and what is not
| Measure | Before this branch | Included in this branch | Target | Status |
| --- | ---: | ---: | ---: | --- |
| Substantive guided lessons | 156 | 176 | 500 | 324 more needed |
| Written formative self-check Q&A | 814 | 974 | eventual 1,000,000 approved bank items | Authored lesson checks, **not** exam-board-approved |
| On-demand parameterised numerical **draft variants** | 0 | 1,048,576 possible | ability to scale draft production | 16 skill families × 256 × 256 combinations; not 1M independently written or approved items |
| Publicly approved examination questions | Unknown without the correct hosted database | Unchanged | 1,000,000 after governed review | Never infer from generated draft capacity |

This release adds **20 full lessons and 160 unique self-checks** for mathematics, physics, chemistry, biology and computer science. Every lesson includes objectives, explanatory material, a worked example, eight practice items, hints, marking keys, exam tips and common misconceptions. Existing learner Q&A automatically lists them. The tutor-side allowlist is updated in the same order.

The on-demand `draftVariantAt(index)` API generates one numerically keyed, completely reproducible **draft** for a bounded index. The accompanying admin-only interface previews five at a time. It **does not** persist or publish records, grant paid access, confer board approval, use an external AI provider or put a million objects into a bundle or browser tab.

## Curriculum mapping
Before publishing any new question into the exam/review database, an academic reviewer must add:
- curriculum level and specification version, specific learning outcome and evidence link;
- question format, marks, working, unit assumptions, distractor analysis where relevant;
- answer-key validation (including negative, boundary and ambiguous-answer cases);
- duplicate and near-duplicate checks across templates, seeds and other subjects;
- a distinct review decision and reviewer identity, audit timestamps and revocation path.

Relevant official reference frameworks:
- Department for Education: [GCSE combined science](https://www.gov.uk/government/publications/gcse-combined-science)
- Department for Education: [GCSE computer science](https://www.gov.uk/government/publications/gcse-computer-science/gcse-subject-content-for-computer-science)
- Department for Education: [National curriculum mathematics](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study)
- [AQA GCSE Mathematics subject content](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/subject-content)

The subject matter above is a starting point for mapping, **not** a claim that a specific item is authorised or matches every board's exact current specification.

## How to reach 500 substantive lessons
1. **176 → 250**: one foundational and one intermediate progression path per high-priority skill; independently checked worked examples, accessible diagrams and 8–15 varied questions per lesson.
2. **250 → 350**: GCSE and IGCSE breadth, with separate higher-tier and cross-topic reasoning. Subject coverage must be measured by curriculum outcomes, not just total lesson count.
3. **350 → 425**: A-level depth, extended-response marking rubrics and explicit specification differences.
4. **425 → 500**: practical investigations, data analysis, cross-disciplinary problem solving, accessibility/localisation and teacher-authored remediations.

Do not count repeated numeric values or multiple question versions as *additional lessons*. Each distinct lesson requires a new demonstrable educational objective, worked explanation and moderated checks.

## How to reach a million **approved** question records
- Maintain separate metrics: potential variations, generated candidate drafts, schema-valid drafts, academically reviewed items, published questions, active board-mapped questions and learner usage.
- Create versioned blueprints with bounded parameter ranges and subject/curriculum tags; mathematical generator coverage is not equivalent to diverse understanding.
- Use independent property-based tests of correct numeric answers, ambiguity tests for free text, and negative/distractor tests for multiple choice.
- Bulk-generate only into a controlled **draft queue**, in resumable checkpoints with quota/cost controls, rather than deploying an unbounded Edge Function or a front-end million-row array.
- Apply duplicate/semantic similarity review and expert approval, require evidence and audit events; reject unverifiable items.
- Expose *published* inventory only via authorised backend metrics; the UI never adds the 1,048,576 potential variants to published totals.
- Use staged RLS and tenant isolation tests, marking idempotency, versioned curriculum approvals and publication rollback before production.

## Near-term product work
- Mobile and desktop: tighter topic filters, formula input, responsive marking feedback, explain-your-error remediation and accessible diagrams.
- Teachers: controlled lesson authoring, review queues, assignments, feedback and class-level coverage; no raw peer records.
- AI tutor: verified-context retrieval, cost limits, user-scoped context and provisional AI explanations; no unsupervised release or hidden student-data exchange via MCP.
- Production release needs verified Supabase staging, complete release CI, browser and real-device walkthrough, independent review of a representative content sample and rollout monitoring.

## Acceptance checks in this PR
- `tutorials` and `TUTORIAL_CONTEXTS` match for all 176 lessons.
- 160 new checks have unambiguous, deterministic local answer keys and valid interaction formats.
- No duplicate tutorial titles, IDs or new lesson question stems.
- 16 draft families each enumerate 65,536 distinct, reproducible prompts and IDs without calling an AI model.
- Draft generator preview refuses invalid or excessive index ranges and shows a clear unreviewed label.

**Scope boundary:** merging this GitHub branch does not automatically deploy hosting, write to a hosted database, create certified exam records or complete professional academic review.
