import {describe,expect,it} from "vitest";
import {cashAccrualModel,marketEquilibriumModel} from "@/lib/financeLabs";

describe("accounting and economics teaching models",()=>{
  it("distinguishes accrual profit, cash receipts and credit receivables",()=>{
    const m=cashAccrualModel(500,2000,50,1500,100);
    expect(m.totalProfit).toBe(1200);
    expect(m.totalReceipts).toBe(5000);
    expect(m.closingCash).toBe(1000);
    expect(m.closingReceivables).toBe(1000);
    expect(m.netCashMovement).toBe(500);
    expect(m.months.map(row=>row.closingCash)).toEqual([0,500,1000]);
    expect(m.cashShortfall).toBe(0);
  });
  it("preserves revenue and profit when payment timing changes",()=>{
    const credit=cashAccrualModel(500,2000,0,1500,100),cash=cashAccrualModel(500,2000,100,1500,100);
    expect(credit.totalProfit).toBe(cash.totalProfit);
    expect(credit.closingCash).toBe(cash.closingCash-2000);
    expect(credit.closingReceivables).toBe(2000);
    expect(credit.cashShortfall).toBe(1000);
    expect(cash.closingReceivables).toBe(0);
  });
  it("changes profit but not cash when depreciation changes, preserving cent arithmetic",()=>{
    const a=cashAccrualModel(500,2001,33,1500,100),b=cashAccrualModel(500,2001,33,1500,200);
    expect(a.totalProfit-b.totalProfit).toBe(300);
    expect(a.closingCash).toBe(b.closingCash);
    expect(a.months[0].receipts).toBe(660.33);
    expect(a.closingReceivables).toBe(1340.67);
    expect(a.totalReceipts+a.closingReceivables).toBeCloseTo(6003);
  });
  it("solves equilibrium and identifies shortages and surpluses",()=>{
    const eq=marketEquilibriumModel(120,2,30);
    expect(eq).toMatchObject({equilibriumPrice:30,equilibriumQuantity:60,demand:60,supply:60,shortage:0,surplus:0});
    expect(marketEquilibriumModel(120,2,20)).toMatchObject({demand:80,supply:40,shortage:40,tradedQuantity:40});
    expect(marketEquilibriumModel(120,2,40)).toMatchObject({demand:40,supply:80,surplus:40});
    expect(marketEquilibriumModel(120,2,100).demand).toBe(0);
    for(let a=60;a<=200;a+=10)for(let b=1;b<=4;b++){
      const m=marketEquilibriumModel(a,b,0);
      expect(a-2*m.equilibriumPrice).toBeCloseTo(b*m.equilibriumPrice);
    }
  });
  it("rejects invalid inputs",()=>{
    expect(()=>cashAccrualModel(500,2000,101,1500,100)).toThrow();
    expect(()=>cashAccrualModel(-1,2000,50,1500,100)).toThrow();
    expect(()=>cashAccrualModel(500,2000,50,NaN,100)).toThrow();
    expect(()=>marketEquilibriumModel(59,2,30)).toThrow();
    expect(()=>marketEquilibriumModel(120,0,30)).toThrow();
    expect(()=>marketEquilibriumModel(120,2,30.5)).toThrow();
  });
});
