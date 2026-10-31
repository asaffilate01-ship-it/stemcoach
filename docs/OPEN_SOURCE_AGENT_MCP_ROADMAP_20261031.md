# StemCoach — open-source, agent and MCP adoption plan (31 October 2026)

Status: **evaluated candidates, not automatically installed or connected**. Treat package licence, maintenance, data-processing and threat model checks as release gates. Adopt isolated capabilities, never wholesale-copy a competing app.

## Current architecture, proven from repository

- React 18, Vite, TypeScript, Tailwind, Radix/shadcn, Framer Motion, React Query.
- Supabase auth, database, RLS migrations and Edge Functions for question generation, answer checking, tutor and mock exams.
- PWA + Capacitor Android configuration; do not promise complete offline studying or physical-device coverage until tested.
- Authored lesson library, guided knowledge checks, progress, individual tuition, parent/teacher/institution roles, adaptive mastery, Q&A, mock exams, charts and Omniqora evidence routing.
- Existing: DESIGN.md, PRODUCT.md, AGENTS.md and advisory Impeccable source audit. PR #20 proposes a stronger mathematical assessment, FSRS-inspired review and coaching-economy hardening; avoid rebuilding these in parallel.
- Content review and payment correctness are authority boundaries. Generated AI answers are drafts, not independently verified grades or board-approved syllabus statements.

## Evidence-led shortlist, prioritised for StemCoach

| Priority | Repository | Use | Adoption boundary |
| --- | --- | --- | --- |
| P0 | https://github.com/Leonxlnx/taste-skill | Distinctive teaching-first hero, coherent type hierarchy, responsive design reviews; latest `design-taste-frontend` includes redesign workflow. | Agent instruction only; no direct production dependency. Keep StemCoach identity. |
| P0 | https://github.com/pbakaus/impeccable | Source lint, UI audit/harden/polish and real rendered screen inspection. | Existing advisory source job is not proof of accessibility; include manual WCAG tests. |
| P0 | https://github.com/VoltAgent/awesome-design-md | Project-authored tokens and component rules in DESIGN.md; inspect precedent, not copy another brand. | StemCoach DESIGN.md remains canonical; no copied trademarked identity. |
| P0 | https://github.com/dequelabs/axe-core | Automated WCAG regression in CI and browser acceptance. | PR #20 already adds `@axe-core/playwright`; fix real violations, never silence assertions. |
| P1 | https://github.com/microsoft/playwright | Playwright MCP-assisted interactive UX audits, keyboard and mobile tests. | Development or staging only, test accounts and no learner PII in agent prompts. |
| P1 | https://github.com/arnog/mathlive | Accessible equation entry and virtual maths keyboard on phones. | Start with one formative expression field; validate MathJSON and mobile keyboard/zoom. |
| P1 | https://github.com/cortex-js/compute-engine | Machine-check algebraic equivalence and numerical answers; optional sandboxed compute MCP. | Deterministic bounded expressions, input limits, no arbitrary agent execution; never determine awards from an LLM alone. |
| P1 | https://github.com/promptfoo/promptfoo | Golden-set tutor QA, mark scheme adherence, prompt-injection and hallucination regression. | Curated verified answers and human-reviewed scoring; CI thresholds before model release. |
| P1 | https://github.com/langfuse/langfuse | Trace retrieval evidence, latency and evaluations. | Redact student content and identifiers; parent/tenant consent before telemetry. |
| P2 | https://github.com/openai/openai-agents-js | Explicit, bounded tutor/reviewer orchestration with tools, guardrails and handoffs. | Choose one framework after a small pilot; maintain human academic sign-off. |
| P2 | https://github.com/modelcontextprotocol/typescript-sdk | Publish restricted resource adapters for authored lesson references and verified syllabus metadata; use v2 stable packages. | Token scopes, role authorization, resource ACL, rate limits, audit logs, prompt-injection isolation. |
| P2 | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | Secondary dashboard and mobile UX reference catalog. | Do not add competing design-system authority or create an incoherent mixed style. |
| Evaluate | https://github.com/open-spaced-repetition/ts-fsrs | Review scheduling reference for spaced repetition. | PR #20 already has a local review scheduler; measure outcomes before swapping algorithms. |

Check licence/version at implementation time. The shortlist is the relevant set, not a claim to have audited every public GitHub repository.

## Proposed agent roles (back-end services with narrow delegated privileges)

1. **Curriculum-mapper:** Takes explicit awarding body, exam season, subject tier and specification version; proposes mappings with an official source link; teacher signs off.
2. **Question-author:** Generates draft questions and worked solutions, with mark allocations and misconception tags; cannot self-publish.
3. **Deterministic verifier:** Uses approved math/CAS and unit tests to check expressions, dimensional consistency, duplicate keys and numerical tolerance; no direct database write permissions.
4. **Independent reviewer:** Challenges distractors, ambiguity, accessibility, accepted alternatives, translations and citation support; escalates to a human assessor.
5. **Socratic tutor:** Uses mastered curriculum state, vetted lesson excerpts and staged hints; never shows invented citations or changes verified mastery from conversational text.
6. **Accessibility/UX auditor:** Runs keyboard, screen reader and viewport tests against staging; produces reproducible defects, not automatic route/security changes.
7. **Learning intervention agent:** Suggests revisions and next steps from approved attempts; does not modify XP, formal exam scores or learner access without authorized server actions.
8. **Institution reporting assistant:** Reads only permitted aggregate performance for a class/institution with RLS; restricts cross-tenant and minors' personal information.

## MCP boundary matrix

| Adapter | Accessible operations | Prohibited operations |
| --- | --- | --- |
| GitHub (developer only) | Read approved PRs, propose reviewed code and CI fixes. | Force push, bypass checks, access unrelated repos or leak credentials. |
| Playwright MCP (developer only) | Test staging URLs, screenshots and accessible DOM for 360/390/768/1440 plus 200% zoom. | Scrape production learner records or operate live payments. |
| Supabase staging MCP (admin supervised) | Run read-only schema/RLS audits and controlled staging tests. | Auto-run migrations on production, bypass RLS, use service key in browser. |
| Curriculum resource MCP | Retrieve official specification metadata and permitted source excerpts with version/date. | Treat third-party summaries as board-certified; redistribute copyrighted exams. |
| Maths-verifier MCP | Evaluate restricted, validated expressions in short-lived sandboxed jobs. | Arbitrary code evaluation, network or file access, unsafe tool chaining. |
| Omniqora lesson MCP | Retrieve tenant-scoped authored lessons with provenance and explicit review status. | Present `authored_unreviewed` material as verified; fabricate citations. |
| Analytics MCP | Read anonymised or explicitly authorized aggregate learner trends. | Expose other tenants' students or infer private child data. |

Do not turn MCP access on merely because a server exists. Every tool should enforce per-call JWT/session, age/safeguarding controls, scope, schema, quotas and auditability.

## Implementation sequence and release gates

**Phase 0 — protect trust:** Merge PR #23 mock-score integrity once green (done). Complete PR #20 CI, reduce contrast violations, exercise all four quadratic checkpoints, stage migration + three dependent Edge Functions; no production migration while release gates remain unresolved.

**Phase 1 — trustworthy premium UX:** Keep learner-first design, truthfully described inventory, semantic navigation, reduced motion and accessible state changes. Validate homepage, practice, mock exams, tutoring, teacher/parent dashboards, all locales and responsive breakpoints. Existing design tokens are the authority.

**Phase 2 — math correctness:** Add MathLive to one expression format and bounded Compute Engine verification. Create a gold dataset of 200+ reviewed varied questions (units, alternative forms, graph points, negative values, significant figures, partial marks, GCSE and A-level). Run adversarial answer and explanation tests across model versions.

**Phase 3 — adaptive tutor:** Ground each explanation in a permitted syllabus or reviewed material; require source/version visibility, uncertainty and a 'report an error' workflow. Separate hints from final answers. Teacher approval for assessed tasks.

**Phase 4 — multi-role and Omniqora integrations:** Consent and tenant-scoped links to SkillFinch, Ilmvero and UniPathway for assignment handoffs; do not share raw student records across platforms or organizations until contracts, lawful basis, access model and RLS are validated.

**Phase 5 — scale/operations:** Error budget, telemetry, immutable scoring receipts, cross-endpoint idempotency, provider spend limits, backups, rollback and real Android testing. Audit PWA offline claims and billing before marketing launch.

## Acceptance evidence

- CI checks: TypeScript, lint, unit, actual browser and mobile, axe WCAG and dependency audit.
- Confirmed assessment result identity; no success/score display on partial grading; exactly one receipt per attempt; replay-safe server.
- Academic gold-set: zero wrong answer keys in reviewed release candidates, provenance and independent reviews.
- UX: 360/390/768/1440, 200% zoom, keyboard-only, reduced motion, spoken assistive tech, low bandwidth, empty/loading/error states.
- Security: cross-tenant RLS, access revocations, minors' data handling, paid quotas and agent tool audit.
- Release deployment is separate from merging code. Do not claim '100% secure', 'millions of verified questions' or live AI provider integration without evidence.
