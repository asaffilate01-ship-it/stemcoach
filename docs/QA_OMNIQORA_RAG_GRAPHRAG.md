# STEMCoach — Omniqora Intelligence: RAG and GraphRAG for learning

## Implemented

- RAG corpus: exactly 71 public authored STEMCoach tutorials, indexed from their summaries, first two lesson steps and worked examples. Excerpts have stable IDs and draft-content provenance.
- Retrieval: deterministic subject-filtered lexical relevance ranking with focused-lesson boost and at most three cited excerpts for AI tutoring. This is RAG, but it is not yet vector/embedding search.
- GraphRAG: 46 curated concept connections, one-hop and two-hop discovery, with rationales and links to actual tutorial pages. Graph connections suggest learning pathways, not evidence that a claim is true.
- AI Tutor: current authenticated ai-chat adds the retrieved excerpts and graph links to the existing language-model prompt at no extra required model call. The existing Lovable AI gateway remains the current model provider.
- Learner experience: collapsible source and concept panels on questions and tutorials, with English, French and German interface strings and transparent non-accredited content notices.
- Omniqora Intelligence adapter: a server-side optional educational source reranking integration. It is disabled by default and falls back to local ranking if the real endpoint or response contract is unavailable.

## Integrating a verified Omniqora gateway

Server-side environment keys, not browser keys:

- OMNIQORA_INTELLIGENCE_RERANK_ENABLED = true
- OMNIQORA_INTELLIGENCE_RERANK_URL = approved real HTTPS endpoint
- OMNIQORA_INTELLIGENCE_API_KEY = approved server-only token

Proposed versioned interface (not an assertion that an Omniqora deployment already supports it):

Request: {contract:'omniqora.education.source-rerank.v1', corpus:'stemcoach-public-tutorials', classification:'public-education-draft', subject:'mathematics', curriculum:'uk-alevel', candidates:[{id,title,excerpt}]}
Response: {contract:'omniqora.education.source-rerank.v1', rankedIds:['quadratic-equations']}

The gateway receives only public authored lesson IDs, titles and excerpts. It never receives names, user IDs, e-mail addresses, messages, tokens, teacher data, private student history, institutions, payment data or protected exam-bank answers. The response is an ID-only rerank over a local allowlist; unknown IDs and response text are discarded. Failures automatically fall back to local search. External calls are off until an approved endpoint and contractual/security validation exist.

## Review and production deployment

1. Run type checking, linting, unit/source-integrity tests, build, and desktop/mobile end-to-end tests.
2. Deploy the web frontend and ai-chat Edge Function together; verify deployed release SHA rather than equating a GitHub merge with a live release.
3. Test authentic students with active question-pack entitlements and the existing per-user request limit.
4. Validate reference links and the absence of cross-subject leakage or invented citations.
5. Test any real Omniqora gateway in staging first. Confirm the contract, retry/timeout, transmitted fields, spending limits, data controller responsibilities and UK child-data rules.
6. Obtain independent academic/editorial reviews and add exact official board specification references before claiming examination correctness.

## Future expansion

- Semantic/vector search and pgvector after a genuine embedding/indexing provider, rights-cleared source documents and model contract are available.
- Hybrid semantic + keyword retrieval, confidence calibration, graph link review, multilingual content, per-tenant document isolation enforced by backend permissions, audit logging and cost analytics.
- No use of publicly visible authored self-check keys for secure graded exams. Those retain the separate server-checked assessment pipeline.

Known limitation: the Omniqora GitHub backend and confirmed gateway contract were not accessible to this work session. A working local grounded knowledge layer is delivered, but a live Omniqora reranker is not claimed.
