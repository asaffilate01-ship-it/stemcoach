import { useState } from "react";
import { Control, Metric, ModelFrame } from "./LabPrimitives";
import { cashAccrualModel, marketEquilibriumModel } from "@/lib/financeLabs";
import { financeLabLabels } from "./financeLabLabels";

const copy={
  en:{
    reset:"Reset model",inputs:"Model controls",results:"Calculated results",experiment:"Predict, explore, explain",
    opening:"Opening cash",sales:"Monthly recognised sales",share:"Sales collected immediately",costs:"Monthly cash operating costs",depreciation:"Monthly depreciation",
    profit:"Three-month accrual profit",cash:"Closing cash",receivables:"Closing receivables",movement:"Net cash movement",shortfall:"Maximum month-end cash shortfall",
    month:"Month",receipts:"Cash receipts",payments:"Payments",monthProfit:"Profit",monthCash:"Closing cash",ledger:"Three-month schedule",money:"CU",
    cashTip:"Change the immediate-collection percentage without changing sales or costs. Compare profit, cash and receivables. Then change depreciation: it affects profit but not cash receipts or payments.",
    cashLimit:"Fictional currency units (CU). Three identical trading months, zero opening receivables, credit collected in full next month, all operating costs paid immediately. No taxes, inventory, financing or new capital purchases; a negative cash balance represents a funding gap, not an actual overdraft.",
    intercept:"Demand intercept",slope:"Supply sensitivity",price:"Chosen market price",equilibriumPrice:"Equilibrium price",equilibriumQuantity:"Equilibrium quantity",demand:"Quantity demanded",supply:"Quantity supplied",shortage:"Shortage",surplus:"Surplus",units:"units",graph:"Supply and demand graph",demandCurve:"Demand curve",supplyCurve:"Supply curve",equilibrium:"Equilibrium",chosen:"Chosen price",
    marketTip:"Move the chosen price below and above equilibrium. Explain why a shortage occurs below the clearing price and a surplus above it. Shift the demand intercept while keeping the supply sensitivity constant.",
    marketLimit:"A fictional competitive market with linear supply, downward-sloping demand truncated at zero, continuous quantities and other factors fixed. No real prices, trading, taxes or investment advice.",
  },
  de:{
    reset:"Modell zurücksetzen",inputs:"Modellparameter",results:"Berechnete Ergebnisse",experiment:"Vorhersagen, untersuchen, erklären",
    opening:"Anfangsbestand an Zahlungsmitteln",sales:"Monatlich erfasste Umsätze",share:"Sofort bezahlter Umsatzanteil",costs:"Monatliche zahlungswirksame Betriebskosten",depreciation:"Monatliche Abschreibung",
    profit:"Periodengewinn über drei Monate",cash:"Endbestand an Zahlungsmitteln",receivables:"Offene Forderungen am Ende",movement:"Nettozahlungsmittelveränderung",shortfall:"Größte monatliche Finanzierungslücke",
    month:"Monat",receipts:"Einzahlungen",payments:"Auszahlungen",monthProfit:"Gewinn",monthCash:"Endbestand",ledger:"Dreimonatsübersicht",money:"GE",
    cashTip:"Ändere den sofort bezahlten Umsatzanteil bei konstantem Umsatz und konstanten Kosten. Vergleiche Gewinn, Zahlungsmittel und Forderungen. Ändere danach die Abschreibung: Sie beeinflusst den Gewinn, aber nicht die Ein- und Auszahlungen.",
    cashLimit:"Fiktive Geldeinheiten (GE). Drei gleiche Monate, keine Anfangsforderungen, vollständige Zahlung der Kreditverkäufe im Folgemonat, sofortige Zahlung aller Betriebskosten. Keine Steuern, Vorräte, Finanzierung oder neuen Investitionen. Ein negativer Bestand zeigt eine Finanzierungslücke, keinen tatsächlichen Kredit.",
    intercept:"Achsenabschnitt der Nachfrage",slope:"Angebotsreaktion",price:"Gewählter Marktpreis",equilibriumPrice:"Gleichgewichtspreis",equilibriumQuantity:"Gleichgewichtsmenge",demand:"Nachfragemenge",supply:"Angebotsmenge",shortage:"Nachfrageüberschuss",surplus:"Angebotsüberschuss",units:"Einheiten",graph:"Angebots- und Nachfragekurven",demandCurve:"Nachfragekurve",supplyCurve:"Angebotskurve",equilibrium:"Gleichgewicht",chosen:"Gewählter Preis",
    marketTip:"Wähle einen Preis unterhalb und oberhalb des Gleichgewichtspreises. Erkläre den Nachfrage- bzw. Angebotsüberschuss. Ändere danach den Achsenabschnitt der Nachfrage bei konstanter Angebotsreaktion.",
    marketLimit:"Fiktiver Wettbewerbsmarkt mit linearem Angebot, fallender Nachfrage mit Untergrenze null, stetigen Mengen und sonst konstanten Bedingungen. Keine realen Preise, Geschäfte, Steuern oder Anlageberatung.",
  }
};
type Copy=typeof copy.en;
type Props={c:Copy;locale:string;title:string};
function CashLab({c,locale,title}:Props){
  const [opening,O]=useState(500),[sales,S]=useState(2000),[share,H]=useState(50),[costs,C]=useState(1500),[depreciation,D]=useState(100);
  const m=cashAccrualModel(opening,sales,share,costs,depreciation);
  const fmt=(v:number)=>new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(v);
  return <ModelFrame c={c} title={title} reset={()=>{O(500);S(2000);H(50);C(1500);D(100);}} formula="Profit = recognised sales − operating costs − depreciation"
    inputs={<><Control label={c.opening} value={opening} min={0} max={10000} step={100} unit={c.money} change={O} locale={locale}/><Control label={c.sales} value={sales} min={0} max={10000} step={100} unit={c.money} change={S} locale={locale}/><Control label={c.share} value={share} min={0} max={100} step={5} unit="%" change={H} locale={locale}/><Control label={c.costs} value={costs} min={0} max={10000} step={100} unit={c.money} change={C} locale={locale}/><Control label={c.depreciation} value={depreciation} min={0} max={2000} step={100} unit={c.money} change={D} locale={locale}/></>}
    results={<><dl className="grid gap-2 sm:grid-cols-2" aria-live="polite"><Metric label={c.profit} value={m.totalProfit} unit={c.money} locale={locale}/><Metric label={c.cash} value={m.closingCash} unit={c.money} locale={locale}/><Metric label={c.receivables} value={m.closingReceivables} unit={c.money} locale={locale}/><Metric label={c.movement} value={m.netCashMovement} unit={c.money} locale={locale}/><Metric label={c.shortfall} value={m.cashShortfall} unit={c.money} locale={locale}/></dl>
    <section aria-label={c.ledger} className="rounded-xl border bg-background p-3"><h3 className="text-sm font-semibold">{c.ledger}</h3><div className="mt-3 grid gap-2 xl:grid-cols-3">{m.months.map(row=><div key={row.month} className="min-w-0 rounded-lg border p-3"><h4 className="mb-2 text-sm font-semibold">{c.month} {row.month}</h4><dl className="space-y-2 text-xs">{([[c.receipts,row.receipts],[c.payments,row.payments],[c.monthProfit,row.profit],[c.monthCash,row.closingCash]] as const).map(([label,value])=><div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="break-words font-semibold tabular-nums">{fmt(value)} {c.money}</dd></div>)}</dl></div>)}</div></section></>} tip={c.cashTip} limit={c.cashLimit}/>;
}
function MarketLab({c,locale,title}:Props){
  const [intercept,I]=useState(120),[slope,S]=useState(2),[price,P]=useState(30);
  const m=marketEquilibriumModel(intercept,slope,price);
  const x=(q:number)=>40+q*0.65,y=(p:number)=>155-p*1.25;
  const fmt=(v:number)=>new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(v);
  return <ModelFrame c={c} title={title} reset={()=>{I(120);S(2);P(30);}} formula="Qd = max(0, A − 2P); Qs = bP"
    inputs={<><Control label={c.intercept} value={intercept} min={60} max={200} step={10} unit={c.units} change={I} locale={locale}/><Control label={c.slope} value={slope} min={1} max={4} unit="" change={S} locale={locale}/><Control label={c.price} value={price} min={0} max={100} unit={c.money} change={P} locale={locale}/></>}
    results={<><dl className="grid gap-2 sm:grid-cols-2" aria-live="polite"><Metric label={c.equilibriumPrice} value={m.equilibriumPrice} unit={c.money} locale={locale}/><Metric label={c.equilibriumQuantity} value={m.equilibriumQuantity} unit={c.units} locale={locale}/><Metric label={c.demand} value={m.demand} unit={c.units} locale={locale}/><Metric label={c.supply} value={m.supply} unit={c.units} locale={locale}/><Metric label={c.shortage} value={m.shortage} unit={c.units} locale={locale}/><Metric label={c.surplus} value={m.surplus} unit={c.units} locale={locale}/></dl>
    <figure className="rounded-xl border bg-background p-3"><figcaption className="text-sm font-semibold">{c.graph}</figcaption><svg viewBox="0 0 330 190" className="mt-2 h-auto w-full max-w-lg" role="img" aria-label={c.graph+": "+c.equilibriumPrice+" "+fmt(m.equilibriumPrice)+", "+c.equilibriumQuantity+" "+fmt(m.equilibriumQuantity)}>
      <g fill="none" stroke="currentColor" opacity=".35"><path d="M40 25V155H305"/>{[25,50,75,100].map(p=><path key={p} d={`M40 ${y(p)}H300`} strokeDasharray="2 5"/>)}</g>
      <g fontSize="10" fill="currentColor"><text x="7" y="18">P</text>{[0,50,100].map(p=><text key={p} x="10" y={y(p)+3}>{p}</text>)}{[0,100,200,300,400].map(q=><text key={q} x={x(q)-4} y="174">{q}</text>)}<text x="314" y="174">Q</text></g>
      <path d={`M${x(0)} ${y(intercept/2)}L${x(intercept)} ${y(0)}`} stroke="hsl(var(--primary))" strokeWidth="3" fill="none"/><path d={`M40 155L${x(slope*100)} ${y(100)}`} stroke="currentColor" strokeWidth="2" strokeDasharray="7 4" fill="none"/>
      <path d={`M40 ${y(price)}H300`} stroke="currentColor" strokeDasharray="2 4" opacity=".6"/><circle cx={x(m.equilibriumQuantity)} cy={y(m.equilibriumPrice)} r="4.5" fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="1.5"/>
    </svg><div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span className="w-5 border-t-2 border-primary"/>{c.demandCurve}</span><span className="flex items-center gap-2"><span className="w-5 border-t-2 border-dashed border-foreground"/>{c.supplyCurve}</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary"/>{c.equilibrium}</span><span className="flex items-center gap-2"><span className="w-5 border-t-2 border-dotted border-muted-foreground"/>{c.chosen}</span></div></figure></>}
    tip={c.marketTip} limit={c.marketLimit}/>;
}
export function FinanceLabPanel({lab,language}:{lab:"cashAccrual"|"marketEquilibrium";language:"en"|"de"}){
  const props={c:copy[language],locale:language==="de"?"de-DE":"en-GB",title:financeLabLabels[language][lab]};
  return lab==="cashAccrual"?<CashLab {...props}/>:<MarketLab {...props}/>;
}
