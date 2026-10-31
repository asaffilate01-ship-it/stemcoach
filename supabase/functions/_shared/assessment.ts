/** Shared deterministic marking. No eval, arbitrary code or model calls. */
export interface NumericRule { absoluteTolerance?: number; relativeTolerance?: number; significantFigures?: number; }
const units: Record<string, [string, number]> = {
  m: ["length", 1], cm: ["length", .01], mm: ["length", .001], km: ["length", 1000],
  s: ["time", 1], ms: ["time", .001], min: ["time", 60], h: ["time", 3600],
  kg: ["mass", 1], g: ["mass", .001], mg: ["mass", .000001],
  "m/s": ["speed", 1], "km/h": ["speed", 1 / 3.6],
  "m/s2": ["acceleration", 1], "cm/s2": ["acceleration", .01],
  "m2": ["area", 1], "cm2": ["area", .0001],
  Pa: ["pressure", 1], kPa: ["pressure", 1000], MPa: ["pressure", 1e6],
  N: ["force", 1], kN: ["force", 1000], J: ["energy", 1], kJ: ["energy", 1000],
  W: ["power", 1], kW: ["power", 1000], MW: ["power", 1e6], mW: ["power", .001],
  V: ["voltage", 1], mV: ["voltage", .001], A: ["current", 1], mA: ["current", .001],
};
function quantity(raw: string) {
  const text = raw.normalize("NFKC").trim().replace(/−/g, "-").replace(/^(\s*[+-]?\d+),(\d+)(?=\s|$)/, "$1.$2");
  if (/^[+-]?0[xob]/i.test(text)) return null;
  const match = text.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)(?:\s*\/\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+)))?\s*([A-Za-zµμΩ°%][A-Za-z0-9µμΩ°%/^*· .-]*)?$/);
  if (!match) return null;
  const value = Number(match[1]) / (match[2] === undefined ? 1 : Number(match[2]));
  if (!Number.isFinite(value)) return null;
  const unit = (match[3] || "").trim();
  const definition = units[unit];
  return { value: value * (definition?.[1] ?? 1), unit: definition?.[0] ?? unit, literal: match[1], fraction: !!match[2] };
}
function significantFigures(literal: string): number | null {
  const base = literal.split(/[eE]/)[0].replace(/^[+-]/, "");
  // Trailing zeros in integers are ambiguous: require decimal/scientific notation.
  if (!base.includes(".") && /0$/.test(base) && !/[eE]/.test(literal)) return null;
  const digits = base.replace(".", "").replace(/^0+/, "");
  return digits.length || 1;
}
export function numericEquivalent(student: string, expected: string, rule: NumericRule = {}): boolean {
  const a = quantity(student), b = quantity(expected);
  const absolute = rule.absoluteTolerance ?? 1e-9, relative = rule.relativeTolerance ?? 1e-6;
  if (!a || !b || a.unit !== b.unit || !Number.isFinite(absolute) || !Number.isFinite(relative) || absolute < 0 || relative < 0) return false;
  if (rule.significantFigures !== undefined && (!Number.isInteger(rule.significantFigures) || rule.significantFigures < 1 || a.fraction || significantFigures(a.literal) !== rule.significantFigures)) return false;
  return Math.abs(a.value - b.value) <= Math.max(absolute, Math.abs(b.value) * relative);
}
export async function assessmentFingerprint(fields: Record<string, unknown>): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(fields));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
export function validateEssayGrade(value: unknown, maxMarks: number) {
  if (!value || typeof value !== "object") throw new Error("Invalid grading response");
  const grade = value as Record<string, unknown>;
  if (typeof grade.score !== "number" || !Number.isInteger(grade.score) || grade.score < 0 || grade.score > maxMarks || typeof grade.feedback !== "string" || !grade.feedback.trim()) throw new Error("Invalid grading response");
  for (const field of ["strengths", "improvements"]) {
    if (!Array.isArray(grade[field]) || !(grade[field] as unknown[]).every(item => typeof item === "string" && item.length <= 2000) || (grade[field] as unknown[]).length > 20) throw new Error("Invalid grading response");
  }
  if (grade.feedback.length > 5000 || (grade.tuition_tip !== undefined && (typeof grade.tuition_tip !== "string" || grade.tuition_tip.length > 2000))) throw new Error("Invalid grading response");
  return { score: grade.score, feedback: grade.feedback, strengths: grade.strengths as string[], improvements: grade.improvements as string[], tuition_tip: grade.tuition_tip as string | undefined, max_marks: maxMarks, provisional: true };
}
