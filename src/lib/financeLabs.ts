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

export const ledgerAccounts = ["cash","receivables","loanPayable","capital","revenue","expense"] as const;
export type LedgerAccount = typeof ledgerAccounts[number];
export type JournalEntry = {id:string; debit:LedgerAccount; credit:LedgerAccount; amount:number};

/** Fictional service business, zero opening balances, five balanced journal entries.
 * All arithmetic uses integer hundredths of currency units. No VAT or inventory. */
export function bookkeepingModel(creditSales:number,collectionPercent:number,expense:number,loan:number){
  integerIn("Credit service revenue",creditSales,0,2000);
  integerIn("Collection percentage",collectionPercent,0,100);
  integerIn("Cash expense",expense,0,1000);
  integerIn("Loan received",loan,0,1000);
  const entries:JournalEntry[]=[
    {id:"capital",debit:"cash",credit:"capital",amount:100000},
    {id:"loan",debit:"cash",credit:"loanPayable",amount:loan*100},
    {id:"sale",debit:"receivables",credit:"revenue",amount:creditSales*100},
    {id:"collection",debit:"cash",credit:"receivables",amount:creditSales*collectionPercent},
    {id:"expense",debit:"expense",credit:"cash",amount:expense*100},
  ];
  const net:Record<LedgerAccount,number>={cash:0,receivables:0,loanPayable:0,capital:0,revenue:0,expense:0};
  for(const entry of entries){net[entry.debit]+=entry.amount;net[entry.credit]-=entry.amount;}
  const balances=ledgerAccounts.map(account=>({account,debit:Math.max(0,net[account])/100,credit:Math.max(0,-net[account])/100}));
  const debitTotal=balances.reduce((sum,b)=>sum+Math.round(b.debit*100),0)/100;
  const creditTotal=balances.reduce((sum,b)=>sum+Math.round(b.credit*100),0)/100;
  const assets=(net.cash+net.receivables)/100,liabilities=-net.loanPayable/100;
  const profit=(-net.revenue-net.expense)/100,equity=(-net.capital-net.revenue-net.expense)/100;
  return {entries:entries.map(e=>({...e,amount:e.amount/100})),balances,debitTotal,creditTotal,assets,liabilities,equity,profit,cash:net.cash/100,receivables:net.receivables/100};
}

/** Midpoint elasticity between two points of a fixed fictional demand curve. */
export function elasticityModel(price1:number,price2:number){
  integerIn("Initial price",price1,10,90);
  integerIn("New price",price2,10,90);
  const quantity1=200-2*price1,quantity2=200-2*price2;
  const priceChange=(price2-price1)/((price1+price2)/2);
  const quantityChange=(quantity2-quantity1)/((quantity1+quantity2)/2);
  const elasticity=priceChange===0?null:quantityChange/priceChange;
  const magnitude=elasticity===null?null:Math.abs(elasticity);
  const classification=magnitude===null?"undefined":Math.abs(magnitude-1)<1e-10?"unit":magnitude>1?"elastic":"inelastic";
  return {quantity1,quantity2,priceChange,quantityChange,elasticity,classification,revenue1:price1*quantity1,revenue2:price2*quantity2};
}
