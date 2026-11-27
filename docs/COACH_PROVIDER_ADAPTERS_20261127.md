# STEMCoach AI provider and learning workspace — 27 November 2026

## Deployment contract

The authenticated `ai-chat` endpoint now delegates to a server-side provider adapter. Existing installations continue using the Lovable gateway and existing Gemini model unless the operator explicitly changes server secrets. Do not put keys in VITE_ variables, client code, GitHub, or this document.

| Provider | Server provider value | Credential variable | Endpoint |
|---|---|---|---|
| Existing gateway | gateway (default) | LOVABLE_API_KEY | Existing gateway endpoint |
| OpenAI | openai | OPENAI_API_KEY | OpenAI Chat Completions |
| Claude | claude | ANTHROPIC_API_KEY | Native Messages API, normalised to the existing text-only client stream |
| Gemini | gemini | GEMINI_API_KEY | Google OpenAI-compatible endpoint |
| Qwen | qwen | DASHSCOPE_API_KEY | Explicit regional Model Studio compatible endpoint |

Direct providers require STEMCOACH_DIRECT_AI_ENABLED=true and STEMCOACH_AI_MODEL set to a verified compatible model identifier. Qwen additionally requires STEMCOACH_QWEN_BASE_URL from the selected region/workspace, ending in /compatible-mode/v1. URLs are server-owned, HTTPS and host/path allowlisted; redirects are rejected. No automatic cross-provider fallback. OpenAI requests specify store:false; that does not by itself establish a zero-retention contract. Existing authentication, entitlement and distributed rate limits remain in ai-chat. No new direct provider has been activated, credential added or student data sent during this change.

## Verification

Use mock transports in CI before testing real providers with a synthetic, non-personal curriculum evaluation set. Compare accuracy, teaching-mode adherence, language quality, refusal safety, response completion, cost and latency. Confirm compatible model IDs, regional endpoints, processing agreements, child/student privacy and retention before enabling a direct provider. Test Edge Function deployment separately; browser CI alone does not prove live provider connectivity. Roll back by selecting gateway after verifying its credentials and approved configuration.

## Learner experience

Responsive tutor workspace now offers mode-specific editable starter prompts. The buttons never automatically send or overwrite an existing draft. Streaming follows the newest response only while the learner is at the bottom; a jump-to-latest button returns them to the live conversation. Localised EN/DE/FR; no new dependencies or database changes.

## Reviewed references and next agentic phases

- OpenAI API: https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create
- Claude streaming: https://platform.claude.com/docs/en/build-with-claude/streaming
- Gemini compatibility: https://ai.google.dev/gemini-api/docs/openai
- Qwen region configuration: https://www.alibabacloud.com/help/en/model-studio/base-url and https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope
- OpenAI Agents SDK: https://github.com/openai/openai-agents-python
- Claude Cookbooks: https://github.com/anthropics/claude-cookbooks
- Google ADK: https://github.com/google/adk-python
- Qwen-Agent: https://github.com/QwenLM/Qwen-Agent
- Vercel AI SDK: https://github.com/vercel/ai
- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk

The adapter is deliberately small, with a single model invocation per learner turn. Later stages can add deterministic answer verification, read-only curriculum retrieval tools with strict schemas, bounded specialist agents, and redacted evaluation/tracing. Do not grant agents arbitrary SQL, shell, publishing or unrestricted external MCP access. These frameworks have been reviewed, not installed or enabled. All commercial question-bank drafts stay outside public GitHub.
