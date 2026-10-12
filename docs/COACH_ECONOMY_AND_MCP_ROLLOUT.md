# STEMCoach cost-aware tutor + MCP integration roadmap

## Goal and current boundary (12 October 2026)

Make STEMCoach a high-quality tutor for individual learners and institution tenants without repeated paid model calls. This phase adds code, **not a verified live deployment or external MCP connections**. The existing stack is Vite/React, Supabase Edge Functions/Postgres and a Lovable AI gateway using Gemini. Existing AI-tutor explanations already prefer reviewed question content and use some caches.

### Decision order for ai-chat

1. Authenticate, apply distributed rate limits, verify the learner's subscription and allowed subject.
2. Collect a limited conversation window and evidence of weak topics.
3. For an exact, single-turn, editorially reviewed public question, retrieve its response from coach_approved_answer_library. Stream using the existing SSE format. **Zero model calls**.
4. Otherwise look up the complete contextual fingerprint in coach_private_answer_cache, scoped by authenticated learner and subject (7-day TTL). Stream saved answer with **zero model calls**.
5. On a miss, choose one specialist **instruction policy** locally (teaching, practice, revision or exam technique); make one model call with a 900-output-token limit. Store only a fully completed answer in the learner-private cache.
6. Retain the existing learner-owned coach_conversations, and when a thread is deleted send a request to erase the associated private response cache. Account deletion also cascades.
7. Never automatically promote student conversations or unreviewed AI output to the globally reusable library.

Only the private cache holds responses that may be learner-specific; its keys store hashes, not raw prompts. Both tables use server-only DB permissions and RLS. Errors in caching must not expose data or cause a second AI call. Specialist modes are NOT separate agents making paid requests.

### Approved-answer curation

Approved shared content must be original/licensed, academically checked, correct for its specific syllabus version and free of learner data. A reviewer ID and review timestamp are required in SQL before a record may be approved.

The SHA-256 prompt hash input is the UTF-8 string:

    coach-approved-v1|<subject-id>|<curriculum-id>|<language-id>|<normalised question>

The normalisation logic in _shared/coachEconomy.ts trims, collapses whitespace, lowercases with English locale, and only caches questions with at most 1,200 characters. The status must be approved, and all lookup dimensions must match. Invalid answers and outdated syllabus answers must be retired. Use only official exam board content where licensing permits it; do not imply STEMCoach lessons have awarding-body endorsement.

### MCP/agent gateway: future work, NOT connected yet

MCP is a communication protocol, not a free knowledge bank. Each server can incur inference, network, search, hosting, licensing and data-protection costs. Do not connect thousands of unvetted MCPs directly to a school-age learner's model. Use an allowlisted broker under Omniqora if it meets STEMCoach's privacy requirements, or a dedicated STEMCoach broker.

| Capability | Preferred low-cost path | Optional external connector |
|---|---|---|
| Curriculum | Versioned, approved lesson and syllabus index | Authorised institution document store |
| Maths, code and science | Validated formula/unit operations and deterministic checks | SymPy, Wolfram, GeoGebra or Desmos via licensed APIs |
| Questions and marking | Published question bank and deterministic grading | Sandboxed code/math verifier |
| Personal progress | Authenticated learner-scoped mastery data | No external connector necessary |
| Institution workflow | Tenant-scoped classes and assignments | Moodle, Canvas, Google Classroom, Teams for Education |
| Learning media | Cached teacher-approved transcripts and assets | Licensed videos, documents and speech |
| Parent/teacher notices | Safeguarded notification workflows | Approved email/messaging providers |
| Syllabus updates | Scheduled staff curation and academic review | Authorised exam-board feeds or curated search |

External connectors require explicit permissions, per-tenant OAuth, credential management, prompt-injection defences, audit logs and contractual checks for minors. Native APIs are acceptable when an MCP connector does not exist.

Agent execution policy:
- Fast path: approved answer, known worked solution, local math, cached approved lesson.
- Single-model path: high-quality, concise tutor with the relevant specialist instructions.
- Escalation path: more expensive reasoning or double-checking only when tests show it is worth the cost.
- High-stakes path: assessment against verified material, with student-facing marking always described as formative unless independently verified.
- Never run teaching, marking, curriculum lookup and safety critic as paid agents on every message.

### Release and credentials

The current server-side LOVABLE_API_KEY remains sufficient for the first phase. An optional COACH_AI_MODEL setting accepts google/gemini-3-flash-preview (default) or google/gemini-2.5-flash. Other providers require credentials and evaluation before enabling.

Before production:
1. Run the full release preflight, review GitHub Actions CI and staging-test the actual live model response.
2. Apply the SQL migration to staging before deploying the revised Edge Functions.
3. Deploy the ai-chat and ai-tutor functions alongside the frontend update.
4. Test approved-library reuse, exact learner-private replay, different-user isolation, deletion, expiry, OAuth authentication, subject entitlements and SSE interruptions.
5. Configure a **daily privileged scheduled call** to public.purge_expired_coach_answers(). Expired records are not returned but must also be physically purged.
6. Verify multilingual quality, maths/essay grading, child-safety policy, academic provenance, mobile keyboard accessibility and institution boundaries.
7. Update privacy notices and school data processing agreements before launch.

The previous globally addressed essay cache contained a reversible fragment of student answers; this migration deletes old grade-essay records and the code now hashes user identity, whole answer, question and mark scheme when building an essay cache key. No unreviewed content is made public.

### Cost metrics and next phases

Add a privacy-safe admin dashboard: verified-answer hit rate, private-cache hit rate, paid-call rate, provider-reported token usage (including cached input), latency and real invoices. Do not place student writing or private prompts in cross-user analytics. Compare cost per successful learning outcome, not just cost per message. Reductions are possible, not guaranteed until measured in staging and production.

Phase 2: approved-answer editorial portal, structured curriculum retrieval, provenance and cost dashboard.

Phase 3: student-scoped mastery summaries, spaced-repetition selections, approved-lesson retrieval, optional embeddings and mathematical verification.

Phase 4: school/institution MCP or API integrations with strict OAuth, tenancy, content quarantine and education-sector data protection.

Phase 5: optional OpenAI/Gemini/Anthropic provider routing, staged model escalation, budgets and circuit breakers, based on quality evaluation.

These phases are not implemented or live merely by creating this document.
