import { ComputeEngine } from "@cortex-js/compute-engine";
const engine = new ComputeEngine();
/** Bounded, univariate polynomial input. Do not accept commands, assignments or arbitrary functions. */
export function expressionEquivalent(student: string, expected: string): boolean {
  const safe = (text: string) => text.length > 0 && text.length <= 160 && /^[0-9xX+*^().\s-]+$/.test(text) && !/\^{2}|\*{2}/.test(text) && [...text.matchAll(/\^\s*(\d+)/g)].every(match => Number(match[1]) <= 8);
  if (!safe(student) || !safe(expected)) return false;
  // Keep symbolic expansion small even for hostile browser input.
  for (const text of [student, expected]) {
    if ((text.match(/\^/g) || []).length > 2 || /\^\s*[^0-8]/.test(text) || /\)\s*\^/.test(text)) return false;
    let depth = 0;
    for (const ch of text) { if (ch === "(") depth++; if (ch === ")") depth--; if (depth < 0 || depth > 4) return false; }
    if (depth !== 0) return false;
  }
  try {
    const a = engine.parse(student.toLowerCase().replace(/\*/g, "\\cdot "));
    const b = engine.parse(expected.toLowerCase().replace(/\*/g, "\\cdot "));
    return a.isValid && b.isValid && a.isEqual(b) === true;
  } catch { return false; }
}
