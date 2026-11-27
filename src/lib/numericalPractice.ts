/** Bounded exact arithmetic for formative practice. No eval, network, or AI. */
type Rational = { numerator: bigint; denominator: bigint };
const MAX_INPUT = 120;
const MAX_DIGITS = 256;
const MAX_EXPONENT = 100;
const abs = (n: bigint) => n < 0n ? -n : n;

function gcd(a: bigint, b: bigint): bigint {
  a = abs(a); b = abs(b);
  while (b) { const remainder = a % b; a = b; b = remainder; }
  return a;
}

function rational(numerator: bigint, denominator: bigint): Rational {
  if (denominator === 0n) throw new Error("division-by-zero");
  if (denominator < 0n) { numerator = -numerator; denominator = -denominator; }
  const factor = gcd(numerator, denominator);
  numerator /= factor; denominator /= factor;
  if (abs(numerator).toString().length > MAX_DIGITS || denominator.toString().length > MAX_DIGITS) throw new Error("number-out-of-range");
  return { numerator, denominator };
}

const normalise = (value: string) => value.trim().replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/,/g, ".");
const decimalPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
function decimal(value: string): Rational {
  if (!decimalPattern.test(value)) throw new Error("invalid-number");
  const [mantissa, exponentText] = value.toLowerCase().split("e");
  const exponent = exponentText === undefined ? 0 : Number(exponentText);
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > MAX_EXPONENT) throw new Error("number-out-of-range");
  const negative = mantissa.startsWith("-");
  const [whole, fraction = ""] = mantissa.replace(/^[+-]/, "").split(".");
  const scale = fraction.length - exponent;
  const coefficient = BigInt((whole + fraction) || "0") * (negative ? -1n : 1n);
  return scale >= 0 ? rational(coefficient, 10n ** BigInt(scale)) : rational(coefficient * 10n ** BigInt(-scale), 1n);
}

function divide(a: Rational, b: Rational): Rational {
  return rational(a.numerator * b.denominator, a.denominator * b.numerator);
}

/** Accept a final decimal, scientific notation or a fraction, not an expression.
 * Commas are decimal separators; digit-group separators are not supported. */
export function parseNumericalLiteral(value: string): Rational | null {
  if (typeof value !== "string" || value.length > MAX_INPUT) return null;
  try {
    const parts = normalise(value).split("/").map(part => part.trim());
    if (parts.length === 1) return decimal(parts[0]);
    if (parts.length === 2) return divide(decimal(parts[0]), decimal(parts[1]));
    return null;
  } catch { return null; }
}

/** Use the authored absolute tolerance exactly; a zero tolerance never rounds
 * a nearby number into a correct answer, even for very small scientific values. */
export function numericalAnswerMatches(response: string, expected: string, tolerance = 0): boolean {
  if (!Number.isFinite(tolerance) || tolerance < 0) return false;
  const a = parseNumericalLiteral(response), b = parseNumericalLiteral(expected);
  const t = parseNumericalLiteral(String(tolerance));
  if (!a || !b || !t) return false;
  const difference = abs(a.numerator * b.denominator - b.numerator * a.denominator);
  return difference * t.denominator <= t.numerator * a.denominator * b.denominator;
}

type CalculationResult = { ok: true; exact: string } | { ok: false; reason: "invalid" | "zero" | "range" };

/** Safe expression grammar: literals, unary signs, parentheses, + - * /.
 * Returns exact reduced fractions; implicit multiplication, variables and
 * executable syntax are deliberately unsupported. */
export function calculateStudyExpression(value: string): CalculationResult {
  if (typeof value !== "string" || value.length > MAX_INPUT) return { ok: false, reason: "range" };
  const source = normalise(value);
  let pos = 0;
  const spaces = () => { while (pos < source.length && /\s/u.test(source[pos])) pos++; };
  const accept = (symbol: string) => { spaces(); if (source[pos] !== symbol) return false; pos++; return true; };
  function atom(): Rational {
    if (accept("+")) return atom();
    if (accept("-")) { const v = atom(); return rational(-v.numerator, v.denominator); }
    if (accept("(")) { const result = expression(); if (!accept(")")) throw new Error("invalid-number"); return result; }
    spaces();
    const match = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(source.slice(pos));
    if (!match) throw new Error("invalid-number");
    pos += match[0].length;
    return decimal(match[0]);
  }
  function product(): Rational {
    let value = atom();
    for (;;) {
      if (accept("*")) { const rhs = atom(); value = rational(value.numerator * rhs.numerator, value.denominator * rhs.denominator); }
      else if (accept("/")) value = divide(value, atom());
      else return value;
    }
  }
  function expression(): Rational {
    let value = product();
    for (;;) {
      const sign = accept("+") ? 1n : accept("-") ? -1n : 0n;
      if (!sign) return value;
      const rhs = product();
      value = rational(value.numerator * rhs.denominator + sign * rhs.numerator * value.denominator, value.denominator * rhs.denominator);
    }
  }
  try {
    const result = expression();
    spaces();
    if (pos !== source.length) throw new Error("invalid-number");
    return { ok: true, exact: result.denominator === 1n ? String(result.numerator) : result.numerator + "/" + result.denominator };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return { ok: false, reason: message === "division-by-zero" ? "zero" : message === "number-out-of-range" ? "range" : "invalid" };
  }
}
