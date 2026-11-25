/** Bounded, fictional teaching models. No real financial records or forecasts. */
function integerIn(name:string,value:number,min:number,max:number){
  if(!Number.isSafeInteger(value)||value<min||value>max)throw new RangeError(name+" outside model range");
}

/** Three identical trading months: cash sales collected immediately, credit
 * sales collected in full one month later, operating costs paid immediately,
 * depreciation is noncash. Opening receivables are zero. Compute in cents. */
export function cashAccrualModel(openingCash:number,sales:number,cashPercent:number,operatingCosts:number,depreciation:number){
  integerIn("Opening cash",openingCash,0,10000);
  integerIn("Monthly sales",sales,0,10000);
  integerIn("Cash sales percentage",cashPercent,0,100);
  integerIn("Operating costs",operatingCosts,0,10000);
  integerIn("Depreciation",depreciation,0,2000);
  const immediate=sales*cashPercent,credit=sales*100-immediate;
  const expense=operatingCosts*100,monthlyProfit=(sales-operatingCosts-depreciation)*100;
  let cash=openingCash*100,receivables=0,totalReceipts=0;
  const months=Array.from({length:3},(_,i)=>{
    const receipts=immediate+receivables;
    receivables=credit;
    cash+=receipts-expense;
    totalReceipts+=receipts;
    return {month:i+1,revenue:sales,receipts:receipts/100,payments:operatingCosts,profit:monthlyProfit/100,closingCash:cash/100,receivables:receivables/100};
  });
  return {months,totalProfit:3*monthlyProfit/100,totalReceipts:totalReceipts/100,closingCash:cash/100,closingReceivables:receivables/100,netCashMovement:(cash-openingCash*100)/100,cashShortfall:Math.max(0,-Math.min(openingCash,...months.map(m=>m.closingCash)))};
}

/** Linear competitive-market teaching example, continuous quantities.
 * Demand = max(0, intercept - 2p); supply = slope * p. */
export function marketEquilibriumModel(intercept:number,slope:number,price:number){
  integerIn("Demand intercept",intercept,60,200);
  integerIn("Supply slope",slope,1,4);
  integerIn("Market price",price,0,100);
  const equilibriumPrice=intercept/(2+slope);
  const equilibriumQuantity=slope*equilibriumPrice;
  const demand=Math.max(0,intercept-2*price),supply=slope*price;
  return {equilibriumPrice,equilibriumQuantity,demand,supply,shortage:Math.max(0,demand-supply),surplus:Math.max(0,supply-demand),tradedQuantity:Math.min(demand,supply)};
}
