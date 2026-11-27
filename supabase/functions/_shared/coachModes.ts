/** Allowlisted coaching intents. Shared by browser and Edge Function. */
export const COACH_MODES = ["explain", "hint", "quiz", "check"] as const;
export type CoachMode = typeof COACH_MODES[number];

export function normaliseCoachMode(value: unknown): CoachMode {
  return COACH_MODES.find(mode => mode === value) ?? "explain";
}

const instructions: Record<CoachMode, string> = {
  explain: "Teach the requested concept in short steps. For a calculation, show working, units and a final check. End with an optional comprehension question.",
  hint: "Use Socratic guidance. Give one actionable hint or question at a time; do not reveal the final answer unless the learner explicitly requests a full explanation. Adapt after their attempt.",
  quiz: "Ask exactly one formative question at a time, at a suitable level. Do not reveal its answer before the learner attempts it. Then give constructive feedback and ask the next question when appropriate. Never claim these are official exam questions.",
  check: "Ask for the learner's own working if missing. Check the method, identify the first substantive error, explain why, and suggest how to correct it. State uncertainty rather than claiming an unverified official grade.",
};

export function coachModeInstruction(value: unknown): string {
  return instructions[normaliseCoachMode(value)];
}
