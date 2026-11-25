import {describe,expect,it} from "vitest";
import {bookkeepingModel,elasticityModel} from "@/lib/financeLabs";

describe("advanced finance teaching models",()=>{
  it("balances every journal entry and the accounting equation",()=>{
    const m=bookkeepingModel(1200,50,400,300);
    expect(m).toMatchObject({cash:1500,receivables:600,assets:2100,liabilities:300,equity:1800,profit:800,debitTotal:2500,creditTotal:2500});
    expect(m.entries).toHaveLength(5);
    expect(m.entries.every(e=>e.debit!==e.credit&&e.amount>=0)).toBe(true);
  });
  it("conserves receivables and profit across collection percentages, and balances fractional cents exactly",()=>{
    for(let share=0;share<=100;share++){
      const m=bookkeepingModel(1201,share,499,301);
      expect(m.debitTotal).toBe(m.creditTotal);
      expect(m.assets).toBeCloseTo(m.liabilities+m.equity);
      expect(m.profit).toBe(702);
      expect(m.receivables).toBeCloseTo(1201*(100-share)/100);
      expect(m.cash+m.receivables).toBeCloseTo(2003);
    }
    expect(bookkeepingModel(0,0,1000,0).cash).toBe(0);
  });
  it("calculates symmetric midpoint elasticity, unit elasticity and undefined identical prices",()=>{
    const m=elasticityModel(30,40);
    expect(m.quantity1).toBe(140);
    expect(m.quantity2).toBe(120);
    expect(m.elasticity).toBeCloseTo(-35/65);
    expect(m.classification).toBe("inelastic");
    expect(elasticityModel(40,30).elasticity).toBeCloseTo(m.elasticity!);
    expect(elasticityModel(40,60).classification).toBe("unit");
    expect(elasticityModel(60,80).classification).toBe("elastic");
    expect(elasticityModel(50,50).elasticity).toBeNull();
    expect(elasticityModel(50,50).classification).toBe("undefined");
  });
  it("rejects fractional, invalid and out-of-domain parameters",()=>{
    expect(()=>bookkeepingModel(2001,50,400,300)).toThrow();
    expect(()=>bookkeepingModel(100,101,0,0)).toThrow();
    expect(()=>bookkeepingModel(100,50,1001,0)).toThrow();
    expect(()=>bookkeepingModel(100,50,0,NaN)).toThrow();
    expect(()=>elasticityModel(10,91)).toThrow();
    expect(()=>elasticityModel(10.5,20)).toThrow();
  });
});