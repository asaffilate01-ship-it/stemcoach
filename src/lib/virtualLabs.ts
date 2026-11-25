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

/** Vertex form: y = a(x-h)^2+k. Integer settings keep the domain predictable. */
export function quadraticModel(a: number, h: number, k: number) {
  bounded("a", a, -3, 3);
  bounded("h", h, -3, 3);
  bounded("k", k, -4, 4);
  if (![a,h,k].every(Number.isInteger) || a === 0) throw new RangeError("Invalid quadratic parameters");
  const square = -k / a;
  const roots = square < 0 ? [] : square === 0 ? [h] : [h-Math.sqrt(square),h+Math.sqrt(square)];
  const points = Array.from({length:101},(_,i)=>{const x=-5+i/10;return {x,y:a*(x-h)**2+k};});
  return {vertex:{x:h,y:k},roots,yIntercept:a*h*h+k,opensUp:a>0,points,
    yMin:Math.min(0,k,...points.map(p=>p.y)), yMax:Math.max(0,k,...points.map(p=>p.y))};
}
export type Genotype = "AA" | "Aa" | "aa";
/** A single autosomal locus with equal gamete probabilities and complete dominance.
 * Not a model of an actual person's or organism's health or complex traits. */
export function inheritanceModel(parent1: Genotype,parent2: Genotype) {
  if (!["AA","Aa","aa"].includes(parent1)||!["AA","Aa","aa"].includes(parent2)) throw new RangeError("Invalid genotype");
  const gametes1=parent1.split(""),gametes2=parent2.split("");
  const counts:Record<Genotype,number>={AA:0,Aa:0,aa:0};
  const grid=gametes1.map(first=>gametes2.map(second=>{
    const genotype=(first===second?first+second:"Aa") as Genotype;
    counts[genotype]++;
    return genotype;
  }));
  return {gametes1,gametes2,grid,counts,dominantPercent:(counts.AA+counts.Aa)*25,recessivePercent:counts.aa*25};
}

export const BINARY_SEARCH_VALUES = [2,5,8,12,16,23,38,56,72] as const;
export function binarySearchModel(target:number) {
  bounded("target",target,0,80);
  if(!Number.isInteger(target)) throw new RangeError("Target must be an integer");
  let low=0, high=BINARY_SEARCH_VALUES.length-1, foundIndex=-1;
  const steps:{low:number;high:number;mid:number;value:number;decision:"found"|"left"|"right"}[]=[];
  while(low<=high) {
    const mid=Math.floor((low+high)/2),value=BINARY_SEARCH_VALUES[mid];
    const decision=target===value?"found":target<value?"left":"right";
    steps.push({low,high,mid,value,decision});
    if(decision==="found"){foundIndex=mid;break;}
    if(decision==="left")high=mid-1;else low=mid+1;
  }
  return {steps,foundIndex,found:foundIndex!==-1};
}
