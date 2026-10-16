# STEMCoach + Omniqora Intelligence Knowledge Core (RAG + GraphRAG)

**Status: integrated source code and staging runbook, not a live provider claim.**

STEMCoach remains the source of truth for lessons, Q&A, students, attempted answers,
payments and institution memberships. Omniqora operates the shared, multi-tenant
intelligence/retrieval service. Its existing repository is
[Omniqora](https://github.com/asaffilate01-ship-it/seamless-comms-suite),
with an implemented Python Knowledge Core at \`services/rrci/knowledge_core\`.

## What this phase implements

1. The new \`omniqora-learning-evidence\` Supabase Edge Function authenticates
   the STEMCoach user, checks subscription/subject and distributed coach rate limit,
   resolves one existing server-approved tutorial identifier, and queries the
   scoped Omniqora Knowledge Core at \`POST /v1/query\`.
2. The function uses \`rag\` (search), \`graph\` (source-backed relationships)
   or \`hybrid\` (both) retrieval, with bounded \`top_k=6\`, graph hops=2, and
   a short timeout. Requesters cannot submit arbitrary text, tenant IDs, origin
   URLs, collections or GraphRAG seeds.
3. The Q&A and Tutorials pages include an opt-in "Explore with Omniqora
   Intelligence" source panel. Nothing is retrieved automatically. Citation
   links stay within the STEMCoach tutorial catalogue. Missing service
   configuration produces a clear, nonfatal message.
4. A revision-aware operator utility synchronises each authorised lesson's
   **public authored text only**, then indexes objective edges supported by exact
   source quotes. This is a source-supported educational concept graph, not an
   automatically fabricated knowledge graph. No learner account, typed answer,
   school membership, question history, conversation, health information or
   student identifier is sent.
5. Generated claims are displayed as *drafts* only when all citations refer to
   actual retrieved source IDs. The underlying lesson material is **not yet
   independently exam-board verified**. A correct citation identifier is not a
   semantic truth guarantee.

## Existing Omniqora runtime

The existing Knowledge Core supports:
- \`POST /v1/documents/upsert\` (revisioned document chunks)
- \`POST /v1/graph/edges/upsert\` (edges with exact supporting source quote)
- \`POST /v1/query\` (RAG, GraphRAG, hybrid)
- project + tenant + collection service-credential isolation.

Default deployment is **evidence-only BM25 lexical retrieval** and graph traversal
over SQLite, not a running large language model. The optional Ollama provider
and fixed embedding model can enable vector retrieval + cited AI draft generation,
and optional Neo4j can perform native graph queries. Do not claim embedding
search, model inference or Neo4j is active until independently verified.

Omniqora AI Factory admission rules, verified-model pricing, budget reservations,
provider accounts and runtime entitlements must be checked before offering paid
generation in production. RAG/GraphRAG is a retrieval capability, not an excuse
to bypass the Factory's approval or spending controls.

## Activation checklist (staging first)

1. Deploy the existing Omniqora Knowledge Core to a reviewed **HTTPS** host;
   enable network/TLS logs without logging raw lesson answers or secrets.
2. Provision **two different service credentials** in the core's private
   \`KNOWLEDGE_CREDENTIALS\` configuration:
   - Project \`stemcoach\`, tenant \`stemcoach-public\`, collection
     \`stemcoach-lessons\`, capabilities \`["ingest"]\` for the operator importer.
   - Same exact scope, capabilities \`["query"]\` for the STEMCoach Edge Function.
   Store only the SHA-256 hashes of those bearer tokens in Knowledge Core.
   Keep the raw tokens in separate managed server-side secret stores.
3. On an operator machine, run \`npm ci\` then \`npm run knowledge:preview\`.
   Verify the lesson count, all 14 subject categories and objective-edge count
   before synchronising any material. The importer contains no student records.
4. Set \`OMNIQORA_KNOWLEDGE_URL\`, \`OMNIQORA_STEMCOACH_INGEST_TOKEN\` and
   \`OMNIQORA_STEMCOACH_COLLECTION=stemcoach-lessons\` **only on the operator
   machine**. Run \`npm run knowledge:sync\` against staging. Keep and back up
   the operator's local \`var/omniqora-stemcoach-revisions.json\` state file;
   source edits require their real previous revision, not blind overwrites.
5. In the correct STEMCoach Supabase project, configure Edge secrets
   \`OMNIQORA_KNOWLEDGE_URL\`, \`OMNIQORA_STEMCOACH_QUERY_TOKEN\`,
   \`OMNIQORA_STEMCOACH_COLLECTION=stemcoach-lessons\`, and \`APP_ORIGIN\`.
   Deploy the new Edge Function, retaining your **existing** JWT/quotas and
   \`consume_coach_rate_limit\` migration. No browser receives the token.
6. Confirm STEMCoach public Q&A works even when Omniqora is unavailable.
   After sign-in with an eligible pack, test one lesson in \`rag\`, \`graph\`
   and \`hybrid\` modes. Verify citations, source revision and links.
7. Negative tests: anonymous access, wrong subject pack, missing rate-limit RPC,
   exhausted limit, foreign source URI, unknown tutorial ID, oversized input,
   wrong scope/tenant token, revoked token, stale revision, injection in
   source text, network timeouts, no evidence and a model citing unknown IDs.
8. After tests, independently validate provider-region/data-policy/price
   approvals, audit logs and generation quality before enabling a model.
   Keep the system evidence-only until then.

**No production Supabase migrations, account provisioning, provider activation or
model deployment are performed by merging this code.**

## Next integration work

- Author/educator academic approval UI for curated lesson sources and
  independent official board/specification provenance.
- A trusted, authenticated Omniqora AI Factory execution adapter with worker
  receipts and real spending data; no guessed model savings.
- Per-institution private collections only after school-specific entitlements,
  safeguarding review, individual school-to-tenant binding and isolation tests.
- Subject-qualified evaluation sets covering STEM fact correctness, GraphRAG
  reasoning, accessibility and learner comprehension, not just citation shape.
