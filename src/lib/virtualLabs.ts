/** Idealised educational models only. No physical experiment instructions. */
function bounded(name: string, value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(name + " outside model range");
  return value;
}

export function circuitModel(voltage: number, r1: number, r2: number, topology: "series" | "parallel") {
  bounded("voltage", voltage, 1, 24);
  bounded("R1", r1, 10, 100);
  bounded("R2", r2, 10, 100);
  if (topology !== "series" && topology !== "parallel") throw new RangeError("Unknown circuit");
  const resistance = topology === "series" ? r1 + r2 : r1 * r2 / (r1 + r2);
  const current = voltage / resistance;
  const branch1 = topology === "series" ? current : voltage / r1;
  const branch2 = topology === "series" ? current : voltage / r2;
  const voltage1 = branch1 * r1;
  const voltage2 = branch2 * r2;
  return { resistance, current, branch1, branch2, voltage1, voltage2, power: voltage * current };
}

export function motionModel(initialVelocity: number, acceleration: number, time: number) {
  bounded("initial velocity", initialVelocity, 0, 20);
  bounded("acceleration", acceleration, 0, 5);
  bounded("time", time, 0, 10);
  const velocity = initialVelocity + acceleration * time;
  const displacement = initialVelocity * time + 0.5 * acceleration * time * time;
  const points = Array.from({ length: 21 }, (_, i) => {
    const t = time * i / 20;
    return { time: t, velocity: initialVelocity + acceleration * t, displacement: initialVelocity * t + 0.5 * acceleration * t * t };
  });
  return { velocity, displacement, points };
}

export function dilutionModel(concentration: number, sampleVolume: number, finalVolume: number) {
  bounded("concentration", concentration, 0.1, 2);
  bounded("sample volume", sampleVolume, 10, 100);
  bounded("final volume", finalVolume, 100, 500);
  if (finalVolume < sampleVolume) throw new RangeError("Final volume is less than the initial sample");
  const amount = concentration * sampleVolume / 1000;
  return { amount, concentration: amount / (finalVolume / 1000), fraction: sampleVolume / finalVolume, dilutionFactor: finalVolume / sampleVolume };
}
