import {describe,expect,it} from "vitest";
import {buoyancyModel,thermalEnergyModel} from "@/lib/scienceLabs";
import {readingPassages} from "@/lib/closeReading";
describe("science and literature learning models",()=>{
  it("distinguishes floating, neutral and sinking objects",()=>{
    const m=buoyancyModel(600,1000);
    expect(m).toMatchObject({density:0.6,state:"floats",displacedCm3:600,submergedPercent:60});
    expect(m.weight).toBeCloseTo(m.buoyantForce);
    expect(buoyancyModel(1000,1000)).toMatchObject({state:"neutral",submergedPercent:100});
    const s=buoyancyModel(1500,1000);
    expect(s).toMatchObject({state:"sinks",submergedPercent:100,density:1.5});
    expect(s.weight).toBeGreaterThan(s.buoyantForce);
  });
  it("converts grams to kilograms and compares thermal energies",()=>{
    expect(thermalEnergyModel("water",1000,10)).toEqual({specificHeat:4180,energyJ:41800,energyKJ:41.8});
    expect(thermalEnergyModel("iron",1000,10).energyKJ).toBe(4.5);
    expect(thermalEnergyModel("aluminium",500,20).energyJ).toBe(9000);
    expect(thermalEnergyModel("water",2000,0).energyJ).toBe(0);
  });
  it("rejects invalid model parameters",()=>{
    expect(()=>buoyancyModel(0,1000)).toThrow();
    expect(()=>buoyancyModel(600,0)).toThrow();
    expect(()=>buoyancyModel(600.5,1000)).toThrow();
    expect(()=>thermalEnergyModel("water",1000,41)).toThrow();
    expect(()=>thermalEnergyModel("water",NaN,10)).toThrow();
    expect(()=>thermalEnergyModel("invalid" as "water",1000,10)).toThrow();
  });
  it("grounds each commentary in the original passage",()=>{
    const ids=new Set(readingPassages.map(p=>p.id));
    expect(ids.size).toBe(readingPassages.length);
    for(const p of readingPassages) for(const o of p.observations){
      expect(p.text.toLowerCase()).toContain(o.quote.toLowerCase());
      expect(o.explanation.trim()).not.toBe("");
      expect(o.explanationDe.trim()).not.toBe("");
    }
  });
});