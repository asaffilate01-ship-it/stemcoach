# Learner workspace and AI orchestration improvement — 27 November 2026

## Baseline
PR #78 merged the private 1,003,717-variant generator and multi-market academic-review workflow. All three PR workflows completed successfully. The private generator is not a count of published questions; the public guided Q&A catalogue is separate. This change deliberately focuses on the learner-facing experience rather than multiplying near-identical variants.

## Implemented
- Responsive tutor layout: compact subject selector on mobile/tablet, dedicated subject and style sidebar on desktop; larger touch targets, two-line composer, safe wrapping, visible focus, and contextual links into the Q&A clinic.
- Four coaching intents: explain, hint, quiz, check. A shared allowlist maps each intent to a fixed server instruction; arbitrary mode strings cannot become system instructions.
- Stream completion handling: UTF-8, fragmented events, CRLF, terminal markers, cancellation, bounded response size and rejection of malformed, truncated or unfinished responses. Incomplete turns restore the learner draft instead of saving a partial answer.
- Q&A quick navigation, accessible challenge progress, keyboard focus on each new question, explicit sprint exit and a stable deadline-based timer.
- English, German and French interface strings. This does not imply that every teaching item is translated.
- Unit/integration tests and mobile/tablet/desktop Playwright regression coverage. Check the PR's actual CI results before release.

## External patterns reviewed
| Reference | Adaptation or next step |
|---|---|
| [OpenAI Agents SDK](https://github.com/openai/openai-agents-python) | Fixed intents now; later use specialist handoffs, typed tools, evals and redacted tracing only when justified. |
| [Anthropic Claude Cookbooks](https://github.com/anthropics/claude-cookbooks) and [effective agents](https://www.anthropic.com/research/building-effective-agents) | Keep workflows simple and testable; separate tutor generation, evidence verification and review in subsequent releases. |
| [Google Agent Development Kit](https://github.com/google/adk-python) | Evaluate deterministic workflow orchestration and Gemini multimodal explanations against task-specific benchmarks. |
| [Qwen-Agent](https://github.com/QwenLM/Qwen-Agent) | Assess multilingual and mathematical reasoning, structured output and isolated tool execution. Never run learner-provided code on a privileged host. |
| [Vercel AI SDK](https://github.com/vercel/ai) | Evaluate a unified provider interface and streaming normalisation rather than binding the UI to a specific model. |
| [Model Context Protocol](https://github.com/modelcontextprotocol/modelcontextprotocol) | Future read-only, allowlisted curriculum tools; explicit consent, minimal context, no broad database or answer-bank access. |
| [Radix Primitives](https://github.com/radix-ui/primitives) | Preserve accessible native controls, keyboard navigation, focus and touch targets using the existing component stack. |
| [Kolibri](https://github.com/learningequality/kolibri) | Prioritise low-bandwidth formative learning and explicit offline/device-only progress. |

These are reviewed patterns, not installed dependencies or evidence that any third-party model or MCP server has been activated. No new API keys or live AI provider calls are required for this change. The existing ai-chat gateway remains configured as before.

## Next release gates
1. Add provider-neutral server adapter and explicit per-provider configuration; fail closed on missing credentials. Compare OpenAI, Claude, Gemini and Qwen using the same private evaluation set (accuracy, age-appropriate scaffolding, multilingual quality, latency, refusal accuracy, cost and privacy). No silent fallback across data regions or providers.
2. Read-only retrieval and deterministic maths/checking tools. Human review of generated assessment material; do not grant the tutor publication permissions.
3. Persist learner-selected style only with appropriate account scope; never share student transcripts through external tools without a defined lawful basis and consent where needed.
4. Audit the entire student, parent, teacher and admin navigation and responsive layouts with real role-based end-to-end sessions, including narrow viewports and reduced motion.
5. Validate deployed Edge Function, actual model behaviour, quota checks, RLS and live UI before describing the feature as production-ready.

## Release limitations
Prompt instructions are not a guarantee of correct answers or perfect refusal behaviour. The review workflow still distinguishes drafts, academically reviewed items and published content. Production Edge Function deployment and live provider evaluation are separate release steps.
