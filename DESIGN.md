# StemCoach: DESIGN.md

## Product and identity
**Who:** GCSE/IGCSE, A-level and related STEM learners and their educators.

**What:** Accurate practice questions, adaptive quizzes, tutoring support and clear exam-preparation feedback.

**Existing visual system:** Keep existing indigo-blue semantic primary (HSL 226 70% 45% light / 60% dark), off-white and near-black learning surfaces and Plus Jakarta Sans typography from src/index.css.

**Specific UX constraint:** A question, notation, options, selection, submit state and explanation must remain readable without colour dependence. Support maths rendering, keyboard option selection, answer corrections, item provenance, difficulty and progress visibility without distracting animations. Never call unverified AI explanations authoritative.

## Operating design rules
- Public pages: an intentional first viewport, useful primary action, honest product descriptions, no template filler.
- SaaS dashboards: clear status, legible filters and tables, predictable forms, no data-less decorative charts.
- Respect authentication, role/safeguarding rules, real data, timestamps and student privacy. Design work must not change auth, payment or moderation policies.
- Use existing semantic tokens and components. Create a project-owned system, never duplicate third-party DESIGN.md trademarked branding.
- Test at 360, 390, 768 and 1440px, 200% zoom and with keyboard, screen reader and reduced motion. Ensure focus indicators and WCAG AA text contrast, accessible charts and no horizontal overflow.
- Review all loading/empty/error/offline/permissions states and mobile touch targets. Explicitly distinguish demo examples and actual backend outputs.

## Reference workflows
- Taste Skill: https://github.com/Leonxlnx/taste-skill (art direction, hierarchy, measured motion, real viewport review).
- Impeccable: https://github.com/pbakaus/impeccable (critique, audit, harden and polish, with source detector: `npx --yes impeccable@4.8.0 detect src/`).
- Awesome DESIGN.md: https://github.com/VoltAgent/awesome-design-md (token documentation inspiration only; original StemCoach design authority remains here).

## Done definition
Pass existing repo lint/build/tests and domain acceptance; inspect actual rendered screens at 360/768/1440 and keyboard flows, and triage detector warnings. The automated source check is advisory, not proof of accessibility or release readiness.
