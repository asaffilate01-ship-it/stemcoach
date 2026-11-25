import { describe, expect, it } from "vitest";
import { quadraticModel, inheritanceModel, binarySearchModel, BINARY_SEARCH_VALUES } from "@/lib/virtualLabs";

describe("additional virtual lab models", () => {
  it("checks roots, intercepts and vertex for upward and downward quadratics",()=>{
    const a=quadraticModel(1,1,-4);
    expect(a.vertex).toEqual({x:1,y:-4});
    expect(a.roots).toEqual([-1,3]);
    expect(a.yIntercept).toBe(-3);
    expect(a.opensUp).toBe(true);
    for (const root of a.roots) expect((root-1)**2-4).toBeCloseTo(0);
    expect(quadraticModel(-2,2,2).roots).toEqual([1,3]);
    expect(quadraticModel(1,0,0).roots).toEqual([0]);
    expect(quadraticModel(1,0,1).roots).toEqual([]);
    expect(a.points[0].x).toBe(-5);
    expect(a.points[a.points.length-1].x).toBe(5);
    expect(a.points.every(p=>p.y>=a.yMin&&p.y<=a.yMax)).toBe(true);
  });
  it("rejects degenerate and invalid quadratic parameters",()=>{
    expect(()=>quadraticModel(0,1,1)).toThrow();
    expect(()=>quadraticModel(0.5,1,1)).toThrow();
    expect(()=>quadraticModel(1,NaN,0)).toThrow();
  });
  it("computes all Mendelian outcomes, including symmetry across parent order",()=>{
    const m=inheritanceModel("Aa","Aa");
    expect(m.grid).toEqual([["AA","Aa"],["Aa","aa"]]);
    expect(m.counts).toEqual({AA:1,Aa:2,aa:1});
    expect(m.dominantPercent).toBe(75);
    expect(m.recessivePercent).toBe(25);
    expect(inheritanceModel("AA","aa").counts).toEqual({AA:0,Aa:4,aa:0});
    expect(inheritanceModel("aa","aa").recessivePercent).toBe(100);
    const genotypes=["AA","Aa","aa"] as const;
    for (const p1 of genotypes) for(const p2 of genotypes){
      const a=inheritanceModel(p1,p2),b=inheritanceModel(p2,p1);
      expect(a.counts).toEqual(b.counts);
      expect(a.dominantPercent+a.recessivePercent).toBe(100);
    }
    expect(()=>inheritanceModel("AX" as "Aa","aa")).toThrow();
  });
  it("finds every present target and terminates absent searches across the full input range",()=>{
    for(let target=0;target<=80;target++){
      const m=binarySearchModel(target),index=BINARY_SEARCH_VALUES.findIndex(value=>value===target);
      expect(m.foundIndex).toBe(index);
      expect(m.found).toBe(index>=0);
      expect(m.steps.length).toBeLessThanOrEqual(4);
      m.steps.forEach((s,i)=>{
        expect(s.mid).toBe(Math.floor((s.low+s.high)/2));
        expect(s.value).toBe(BINARY_SEARCH_VALUES[s.mid]);
        if(i>0)expect(s.high-s.low).toBeLessThan(m.steps[i-1].high-m.steps[i-1].low);
      });
      const last=m.steps[m.steps.length-1];
      if(m.found)expect(last.decision).toBe("found");
      else if(last.decision==="left")expect(last.mid-1).toBeLessThan(last.low);
      else expect(last.mid+1).toBeGreaterThan(last.high);
    }
    expect(()=>binarySearchModel(-1)).toThrow();
    expect(()=>binarySearchModel(2.5)).toThrow();
  });
});
