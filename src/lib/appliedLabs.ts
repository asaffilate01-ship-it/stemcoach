/** Synthetic, deterministic learning simulations. No real student, customer or AI model data. */
function integerIn(name: string, n: number, min: number, max: number) {
  if (!Number.isSafeInteger(n) || n < min || n > max) throw new RangeError(name + " outside model range");
}

/** Population statistics for a fixed five-observation teaching dataset. */
export function statisticsModel(lastObservation: number) {
  integerIn("Observation", lastObservation, 0, 100);
  const observations = [8, 10, 12, 14, lastObservation];
  const sorted = [...observations].sort((a, b) => a - b);
  const mean = observations.reduce((a, b) => a + b, 0) / observations.length;
  const variance = observations.reduce((sum, x) => sum + (x - mean) ** 2, 0) / observations.length;
  return { observations, mean, median: sorted[2], range: sorted[4] - sorted[0], variance, standardDeviation: Math.sqrt(variance) };
}

// Each score and label is invented for a classroom exercise; scores are not calibrated probabilities.
export const CLASSIFIER_CASES = [
  { score: 95, actual: true }, { score: 85, actual: false },
  { score: 75, actual: true }, { score: 65, actual: true },
  { score: 55, actual: false }, { score: 45, actual: true },
  { score: 35, actual: false }, { score: 25, actual: false },
] as const;
export function classifierModel(threshold: number) {
  integerIn("Threshold", threshold, 0, 100);
  const cases = CLASSIFIER_CASES.map(row => ({ ...row, predicted: row.score >= threshold }));
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (const row of cases) {
    if (row.predicted && row.actual) tp++;
    else if (row.predicted) fp++;
    else if (row.actual) fn++;
    else tn++;
  }
  const ratio = (numerator: number, denominator: number) => denominator === 0 ? null : numerator / denominator;
  return { cases, tp, fp, tn, fn, accuracy: (tp + tn) / cases.length,
    precision: ratio(tp, tp + fp), recall: ratio(tp, tp + fn), f1: ratio(2 * tp, 2 * tp + fp + fn) };
}

/** All money amounts are integer teaching currency units, with no taxes or financing. */
export function breakEvenModel(fixedCost: number, price: number, variableCost: number, units: number) {
  integerIn("Fixed cost", fixedCost, 0, 10000);
  integerIn("Unit price", price, 1, 100);
  integerIn("Unit variable cost", variableCost, 0, 100);
  integerIn("Units sold", units, 0, 1000);
  const contribution = price - variableCost;
  const revenue = price * units;
  const totalCost = fixedCost + variableCost * units;
  // The smallest nonnegative integer sales volume with nonnegative profit.
  const breakEvenUnits = fixedCost === 0 ? 0 : contribution > 0 ? Math.ceil(fixedCost / contribution) : null;
  return { contribution, revenue, totalCost, profit: revenue - totalCost, breakEvenUnits };
}
