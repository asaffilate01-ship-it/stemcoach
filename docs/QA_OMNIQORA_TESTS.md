# Acceptance tests — evidence-grounded Q&A and GraphRAG

**Automated:** Content hash-preserving source catalog validation, 71 unique IDs, 46 editorial edges, subject-limited retrieval, two-hop traversal, empty-result honesty, remote-ID allowlist, and AI prompt grounding are unit tested. Browser tests navigate source links inside both Q&A and tutorials.

**Not yet operationally verified:** production ai-chat deploy, real student entitlement and quota access, live model citation reliability, approved Omniqora gateway, tenant-private indexes, embeddings/vector search, external LMS/official-source rights, and real-device screen-reader behavior.

**Policy:** Never describe public author-written notes as official exam-board evidence. Do not forward learner text, identities or protected answers to the remote Omniqora reranker. Build out semantic embeddings and tenant-specific RAG in a separate vetted pipeline.

**Merge condition:** CI preflight (TypeScript, ESLint, Vitest, Vite build, desktop/mobile Playwright, production npm audit) must pass before main. Deploy frontend and ai-chat together and validate the actual public site before go-live.
