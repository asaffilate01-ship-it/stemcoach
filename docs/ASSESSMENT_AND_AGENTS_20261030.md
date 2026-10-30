# Assessment reliability and agent roadmap — 30 October 2026

## Implemented in this branch
- Integrated PR8 tutor-policy modes, reviewed public answers and learner-private reuse; no external model credentials or MCP connections are added.
- SHA-256 fingerprints cover complete learner answers, learner identity, question text, rubric, model and grading-policy version. Essay feedback uses expiring learner-owned cache rows instead of the legacy permanent cache.
- AI grades are validated, labelled provisional and excluded from verified attempts, XP and mastery. Separate service-only feedback receipts enforce free/paid allowance without storing answers and make identical completed feedback charging idempotent.
- Shared numerical checks support a bounded unit catalogue, fractions, scientific notation, tolerances and optional significant figures. Units are case-sensitive. This is not a universal physics or chemistry parser.
- Public formative Q&A has 12 formats, adding bounded polynomial expressions, accessible graph coordinates and multi-step partial credit. Three original examples extend the 328-item bank to 331. The paid database bank has not automatically gained these formats.
- FSRS schedules public device-local self-check review; retries after revealing an answer do not train the scheduler. This does not replace verified server mastery.
- Added clear review/concept/progress navigation and a Playwright/axe accessibility check.

## Required deployment work
Apply the integrated PR8 migration to isolated staging first. It now also creates provisional_feedback_receipts and consume_provisional_feedback; deploy ai-chat, ai-tutor and check-answer with the frontend. Existing deployments that applied an earlier version of PR8 require a new forward migration, not editing migration history. Confirm actual migration history before production.
Run npm run test:feedback-db (isolated PostgreSQL fixture), npm test, npm run typecheck, npm run lint, npm run build and the full browser suite. Fixture tests do not certify the entire hosted schema.
Configure daily privileged purge_expired_coach_answers; confirm signed-in replay, account deletion, changed rubrics, subject entitlement, free/paid allowance and teacher review. Frontend-only TypeScript checks do not compile Deno Edge Functions. Browser/axe tests require a usable Chromium installation.

The existing objective-answer quota path still needs a single transactional receipt for simultaneous objective and essay submissions; these two endpoint paths are not yet globally serialised. Do not describe this branch as production ready until quota concurrency and hosted role tests pass.

## Agents and MCP recommendations
Choose one orchestrator: LangGraph for resumable workflows, or PydanticAI for typed Python agents and explicit tool approval. Do not install both by default.

| Agent | Inputs and tools | Output boundary |
|---|---|---|
| Curriculum mapper | Approved, dated board specifications; scoped retrieval | Draft topic/objective mappings; human approval |
| Question author | Approved templates and objective IDs | Draft questions only |
| Independent verifier | Question without author answer, then deterministic maths/unit checks | Disagreements quarantined; never publishes |
| Tutor | Approved lessons, learner-scoped progress, graduated hints | Formative explanations, no official grades |
| Revision planner | Own learner's topic/review evidence | Suggested plan; no calendar claim without successful connector action |
| Quality reviewer | Golden evaluation set, Playwright and axe | Evidence and defects, not self-certified academic approval |

Staff-only connections: official github/github-mcp-server, microsoft/playwright-mcp and project-scoped read-only Supabase MCP against staging. Never give these administrative tools to a student-facing model.
Student-facing candidates: narrow Omniqora approved-lesson retrieval, a bounded symbolic verifier (Compute Engine now; isolated SymPy service later), and learner-scoped progress APIs. These need not use MCP internally.
Teams/calendar/LMS connectors require the actual institution tenant and permissions; use supported official APIs when no suitable MCP exists. The modelcontextprotocol Fetch reference server may help staff ingest allowed official sources, but restrict hosts and keep fetched content untrusted. It is not curriculum approval.

Sources: https://github.com/langchain-ai/langgraph ; https://github.com/pydantic/pydantic-ai ; https://github.com/github/github-mcp-server ; https://github.com/microsoft/playwright-mcp ; https://supabase.com/docs/guides/ai-tools/mcp ; https://github.com/modelcontextprotocol/servers

## Explicit remaining work
- PR5 offboarding needs class-ownership and assignment access revocation tests. Merely rejecting tenant membership is insufficient for policies keyed to teacher_id. It was reviewed but not integrated.
- Graph drawing beyond a point, code execution, richer multi-step rubrics, MathLive input, H5P video questions and Perseus authoring remain separate integrations.
- Institutional seats/billing, live provider evaluations, teacher-certified content inventory, all board mappings, image optimisation, native distribution and full live-user acceptance remain unverified/outstanding.
- Promptfoo and a teacher-reviewed golden dataset should compare factual correctness and rubric adherence before switching models. No paid evaluation or new provider activation occurred.
