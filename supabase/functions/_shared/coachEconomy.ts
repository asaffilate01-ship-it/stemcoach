/**
 * Cost-aware STEMCoach routing, deliberately independent of provider SDKs.
 * No arbitrary MCP tools or second model calls are launched by this router.
 */
export const COACH_CACHE_VERSION = "2026-10-12-v1";
export const MAX_COACH_MESSAGES = 10;
export const MAX_COACH_MESSAGE_CHARS = 2_500;

export type CoachMessage = { role: "user" | "assistant"; content: string };
export type TutorAgent = "teacher" | "practice" | "revision" | "exam";

export function sanitiseCoachMessages(messages: unknown): CoachMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages.slice(-MAX_COACH_MESSAGES)
    .filter((message): message is Record<string, unknown> =>
      typeof message === "object" && message !== null &&
      "role" in message && "content" in message &&
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string")
    .map((message) => ({
      role: message.role as CoachMessage["role"],
      content: (message.content as string).slice(0, MAX_COACH_MESSAGE_CHARS).trim(),
    }))
    .filter((message) => message.content.length > 0);
}

/** One specialist policy per turn; these are modes, not paid background agents. */
export function chooseTutorAgent(lastQuestion: string): TutorAgent {
  const question = lastQuestion.toLowerCase();
  if (/\b(mark my|grade my|mark scheme|exam technique|examiner|past.paper)\b/.test(question)) return "exam";
  if (/\b(revis(e|ion)|flashcards?|study plan|spaced repetition|remember|recap)\b/.test(question)) return "revision";
  if (/\b(quiz me|test me|give me (a |some )?questions?|practis(e|ing)|practice|hint|don.t tell me the answer)\b/.test(question)) return "practice";
  return "teacher";
}

export const AGENT_INSTRUCTIONS: Record<TutorAgent, string> = {
  teacher: "Teach the underlying idea clearly, check for misconceptions, and use worked steps when helpful. Prefer a short clear answer before additional detail.",
  practice: "Act as a Socratic practice coach. Ask one useful question or give a graduated hint at a time; do not reveal the final answer before an attempt unless the learner asks directly.",
  revision: "Act as a revision coach. Suggest a focused active-recall exercise or a practical spaced-repetition plan; do not claim to have scheduled anything.",
  exam: "Act as an exam technique coach. Explain mark-scheme reasoning, command words and improvement opportunities. Any mark you estimate is formative, not an official grade.",
};

export function normalisePublicQuestion(question: string): string {
  return question.trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** The existing React reader understands OpenAI-compatible SSE chunks. */
export function reusedAnswerAsSse(answer: string): string {
  const event = JSON.stringify({ choices: [{ delta: { content: answer } }] });
  return "data: " + event + "\n\ndata: [DONE]\n\n";
}

export function parseTutorSseLine(line: string): { text: string; done: boolean; stopped: boolean } {
  if (!line.startsWith("data:")) return { text: "", done: false, stopped: false };
  const payload = line.slice(5).trim();
  if (payload === "[DONE]") return { text: "", done: true, stopped: false };
  try {
    const event = JSON.parse(payload);
    return {
      text: typeof event.choices?.[0]?.delta?.content === "string"
        ? event.choices[0].delta.content : "",
      done: false,
      stopped: event.choices?.[0]?.finish_reason === "stop",
    };
  } catch {
    return { text: "", done: false, stopped: false };
  }
}
