import {describe,expect,it} from "vitest";
import {mapScaleModel,mapScales,populationModel,confoundingModel} from "@/lib/humanitiesLabs";

describe("geography and psychology teaching models",()=>{
  it("converts distance and area using the correct scale powers",()=>{
    expect(mapScaleModel(25000,40,16)).toEqual({groundMetres:1000,groundKm:1,groundAreaKm2:1});
    expect(mapScaleModel(50000,40,16)).toEqual({groundMetres:2000,groundKm:2,groundAreaKm2:4});
    for(const scale of mapScales){
      const m=mapScaleModel(scale,100,100);
      expect(m.groundAreaKm2).toBeCloseTo(m.groundKm**2);
    }
  });
  it("separates natural change from migration and handles population decline",()=>{
    expect(populationModel(50000,600,400,800,300)).toEqual({naturalChange:200,netMigration:500,totalChange:700,endingPopulation:50700,percentageChange:1.4});
    expect(populationModel(50000,500,500,200,700)).toMatchObject({naturalChange:0,netMigration:-500,totalChange:-500,endingPopulation:49500,percentageChange:-1});
    expect(populationModel(10000,0,5000,0,5000).endingPopulation).toBe(0);
    expect(populationModel(100000,5000,0,5000,0).endingPopulation).toBe(110000);
  });
  it("demonstrates reversal of pooled rates despite higher success rates in both strata",()=>{
    const m=confoundingModel(80,20);
    expect(m.a.overall).toBe(68);
    expect(m.b.overall).toBe(42);
    expect(m.overallDifference).toBe(-26);
    expect(m.withinLowDifference).toBe(10);
    expect(m.withinHighDifference).toBe(10);
    expect(m.reversal).toBe(true);
    for(let a=10;a<=90;a+=10)for(let b=10;b<=90;b+=10){
      const m=confoundingModel(a,b);
      expect(m.a.low+m.a.high).toBe(100);
      expect(m.b.low+m.b.high).toBe(100);
      expect(m.a.overall).toBe(m.a.lowSuccess+m.a.highSuccess);
      expect(m.b.overall).toBe(m.b.lowSuccess+m.b.highSuccess);
      if(a===b)expect(m.overallDifference).toBe(10);
    }
    expect(confoundingModel(50,50).reversal).toBe(false);
  });
  it("rejects invalid scale, fractional people and unsupported group counts",()=>{
    expect(()=>mapScaleModel(50001,40,16)).toThrow();
    expect(()=>mapScaleModel(25000,0,16)).toThrow();
    expect(()=>mapScaleModel(25000,40,NaN)).toThrow();
    expect(()=>populationModel(9999,600,400,800,300)).toThrow();
    expect(()=>populationModel(50000,0.5,400,800,300)).toThrow();
    expect(()=>confoundingModel(15,20)).toThrow();
    expect(()=>confoundingModel(80,100)).toThrow();
  });
});