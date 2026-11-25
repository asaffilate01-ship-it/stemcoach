import { describe, expect, it } from "vitest";
import { statisticsModel, classifierModel, breakEvenModel, CLASSIFIER_CASES } from "@/lib/appliedLabs";

describe("applied learning simulation calculations",()=>{
  it("computes population statistics and the effect of an outlier",()=>{
    const m=statisticsModel(16);
    expect(m.mean).toBe(12);
    expect(m.median).toBe(12);
    expect(m.range).toBe(8);
    expect(m.variance).toBe(8);
    expect(m.standardDeviation).toBeCloseTo(Math.sqrt(8));
    const outlier=statisticsModel(100);
    expect(outlier.mean).toBe(28.8);
    expect(outlier.median).toBe(12);
    expect(outlier.range).toBe(92);
    expect(statisticsModel(0).median).toBe(10);
  });
  it("computes confusion counts and metrics from an inclusive threshold",()=>{
    const m=classifierModel(65);
    expect([m.tp,m.fp,m.tn,m.fn]).toEqual([3,1,3,1]);
    expect(m.precision).toBe(0.75);expect(m.recall).toBe(0.75);
    expect(m.accuracy).toBe(0.75);expect(m.f1).toBe(0.75);
    expect(classifierModel(100).precision).toBeNull();
    expect(classifierModel(100).recall).toBe(0);
    expect(classifierModel(0).recall).toBe(1);
    let last=classifierModel(0);
    for(let n=1;n<=100;n++){
      const m=classifierModel(n);
      expect(m.tp+m.fp+m.tn+m.fn).toBe(CLASSIFIER_CASES.length);
      expect(m.fp).toBeLessThanOrEqual(last.fp);
      expect(m.fn).toBeGreaterThanOrEqual(last.fn);
      last=m;
    }
  });
  it("rounds break-even volume up and identifies zero and negative margins",()=>{
    const m=breakEvenModel(1000,20,12,150);
    expect(m.contribution).toBe(8);expect(m.revenue).toBe(3000);
    expect(m.totalCost).toBe(2800);expect(m.profit).toBe(200);expect(m.breakEvenUnits).toBe(125);
    const volume=breakEvenModel(1000,19,12,0).breakEvenUnits!;
    expect(volume).toBe(143);
    expect(breakEvenModel(1000,19,12,volume-1).profit).toBeLessThan(0);
    expect(breakEvenModel(1000,19,12,volume).profit).toBeGreaterThanOrEqual(0);
    expect(breakEvenModel(1000,12,12,1000).breakEvenUnits).toBeNull();
    expect(breakEvenModel(1000,10,12,1000).breakEvenUnits).toBeNull();
    expect(breakEvenModel(0,10,12,0).breakEvenUnits).toBe(0);
  });
  it("rejects out-of-domain, non-integer or non-finite inputs",()=>{
    for(const n of [-1,101,0.5,NaN,Infinity]){
      expect(()=>statisticsModel(n)).toThrow();expect(()=>classifierModel(n)).toThrow();
    }
    expect(()=>breakEvenModel(1000,0,12,150)).toThrow();
    expect(()=>breakEvenModel(1000,20,12,1001)).toThrow();
    expect(()=>breakEvenModel(1000,20,-1,150)).toThrow();
  });
});