import { describe, expect, it } from "vitest";
import { circuitModel, motionModel, dilutionModel } from "@/lib/virtualLabs";

describe("idealised virtual science models", () => {
  it("computes series resistance, current, voltage drops and total power", () => {
    const m = circuitModel(12,30,60,"series");
    expect(m.resistance).toBe(90);
    expect(m.current).toBeCloseTo(12/90);
    expect(m.branch1).toBeCloseTo(m.current);
    expect(m.branch2).toBeCloseTo(m.current);
    expect(m.voltage1+m.voltage2).toBeCloseTo(12);
    expect(m.power).toBeCloseTo(144/90);
  });
  it("computes parallel current conservation at fixed supply voltage", () => {
    const m = circuitModel(12,30,60,"parallel");
    expect(m.resistance).toBe(20);
    expect(m.current).toBeCloseTo(0.6);
    expect(m.branch1+m.branch2).toBeCloseTo(m.current);
    expect(m.voltage1).toBeCloseTo(12);
    expect(m.voltage2).toBeCloseTo(12);
    expect(m.resistance).toBeLessThan(30);
  });
  it("returns correct constant acceleration results and graph endpoints", () => {
    const m=motionModel(3,2,5);
    expect(m.velocity).toBe(13);
    expect(m.displacement).toBe(40);
    expect(m.points).toHaveLength(21);
    expect(m.points[0]).toEqual({time:0,velocity:3,displacement:0});
    expect(m.points[20]).toEqual({time:5,velocity:13,displacement:40});
    expect(motionModel(0,2,10).displacement).toBe(motionModel(0,2,5).displacement*4);
    expect(motionModel(0,0,0).displacement).toBe(0);
  });
  it("conserves the amount of solute while reducing concentration", () => {
    const a=dilutionModel(1,50,250),b=dilutionModel(1,50,500);
    expect(a.amount).toBeCloseTo(0.05);
    expect(a.concentration).toBeCloseTo(0.2);
    expect(a.dilutionFactor).toBe(5);
    expect(b.amount).toBeCloseTo(a.amount);
    expect(b.concentration).toBeCloseTo(a.concentration/2);
    expect(dilutionModel(2,100,100).concentration).toBe(2);
  });
  it("rejects non-finite or out-of-domain values", () => {
    expect(()=>circuitModel(12,0,60,"series")).toThrow();
    expect(()=>circuitModel(Infinity,30,60,"series")).toThrow();
    expect(()=>circuitModel(12,30,60,"invalid" as "series")).toThrow();
    expect(()=>motionModel(0,2,11)).toThrow();
    expect(()=>motionModel(0,NaN,5)).toThrow();
    expect(()=>dilutionModel(1,50,0)).toThrow();
  });
});
