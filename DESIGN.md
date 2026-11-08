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

## Journey contracts (keep the learner in control)
1. **Guest discovery:** choose a subject and see an accurate sample before any purchase demand. Mark unsaved progress and purchased access clearly.
2. **Enrolled learner:** resume work or start a short revision set; show due reviews, class assignments and one suggested next action before secondary analytics.
3. **Practice:** question/context → answer control → checking → confirmed result → worked explanation → next step. A failed check preserves the answer; the app must not invent a score.
4. **Mock examination:** create durable attempt → record answers → submit once → confirm server receipt → show results. With uncertain submission, display pending verification, not a fabricated grade.
5. **Teacher:** create class → assign work → identify incomplete/pending reviews and misconceptions → give feedback → reassess, with clear status and timestamp.
6. **Parent:** only authorised child summaries. Avoid showing raw answers or other learners' information.
7. **Institution and editorial:** distinct empty, loading, failed and inaccessible states; never turn failed protected queries into misleading zeroes.

## Component-level visual rules
- Primary learner actions remain prominent and predictable. Prefer one 'next step' above XP, badges and charts.
- On mobile, preserve a visible route to all role-eligible tools via a labelled More menu; do not rely on horizontal clipping or hidden desktop links.
- Primary answer tap targets aim for at least 44 by 44 CSS pixels; provide input labels, focus outlines and non-colour feedback for correct, incorrect and pending states.
- Questions and worked explanations must remain fully readable at 200% browser zoom. Display equations, units, graphs and diagram markers without cropping or horizontal page overflow.
- Prefer restrained motion. Streaks, mascots and popovers must not obstruct a question or its submit control; honour reduced-motion preferences.
- A UI status should state where data is kept: device-only, account-synced, submitted to a tutor, or officially verified. Device-only practice is not automatic cross-device sync.
- Cached questions may be displayed while offline but **graded answers, credits and verified progress still require the server** unless a separately reviewed offline-sync protocol is released.

## Localisation and accessible content
- The UI currently has English, French and German locale resources. Italian, Spanish and Modern Standard Arabic subject content is distinct from a fully translated interface.
- Before adding Arabic UI, verify RTL navigation, mixed-direction mathematical notation, numbers, keyboard controls, forms, focus, diagrams and screen-reader labels. Use direction isolation for equations rather than blindly mirroring symbols.
- Each locale requires overflow and accessibility checks at 360, 390, 768 and 1440 pixels. Never silently fall back to a different language without a visible content-language notice.
- Every question should have curriculum/specification metadata, approved key and revision provenance before being labelled reviewed. AI essay feedback remains provisional unless a verified moderation workflow explicitly says otherwise.

## Release evidence
- Onboarding save failures never advance to payment; old subject responses never replace a newly selected question set; one tab never sends duplicate requests from rapid taps.
- The browser navigation should expose all eligible routes across role combinations; URL guards and Supabase RLS, not menu visibility, enforce access.
- Make the difference between an empty database result and a network/permissions error visible to staff and students.
- CI typecheck, lint, Vitest, browser journeys, and dependency checks plus manual mobile/keyboard review are release gates. GitHub merge is not proof of production deployment.
- Backend migrations, billing/quotas, AI evaluation, cross-tenant checks and monthly partner entitlements require a separate validated staging plan.
