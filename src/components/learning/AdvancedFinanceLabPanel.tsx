import { useState } from "react";
import { Control, Metric, ModelFrame } from "./LabPrimitives";
import { bookkeepingModel, elasticityModel } from "@/lib/financeLabs";
import { financeLabLabels } from "./financeLabLabels";

const copy = {
 en:{
   reset:"Reset model",inputs:"Model controls",results:"Calculated results",experiment:"Predict, explore, explain",
   sales:"Credit service sales",collection:"Credit sales collected",expenses:"Cash operating expense",loanAmount:"Loan received",money:"CU",
   journal:"Journal entries",trial:"Trial balance",account:"Account",debit:"Debit",credit:"Credit",amount:"Amount",transaction:"Transaction",
   cash:"Cash",receivables:"Receivables",loanPayable:"Loan payable",capital:"Owner capital",revenue:"Service revenue",expense:"Operating expense",
   capitalEntry:"Owner investment",loanEntry:"Loan received",saleEntry:"Credit service sale",collectionEntry:"Customer payment",expenseEntry:"Cash expense",
   assets:"Assets",liabilities:"Liabilities",equity:"Equity",profit:"Profit or loss",total:"Total",balanced:"The trial balance balances.",
   bookTip:"Increase collections without changing credit sales. Explain why cash and receivables change while profit stays the same. Then increase the loan and compare assets, liabilities and equity.",
   bookLimit:"Fictional service business, zero opening balances, fixed owner investment of 1,000 CU. No tax, inventory, interest or depreciation. Entries with zero amounts have no financial effect; a balanced trial balance does not prove that every entry is correct.",
   first:"Initial price",second:"New price",q1:"Initial quantity demanded",q2:"New quantity demanded",r1:"Initial revenue",r2:"New revenue",pc:"Midpoint price change",qc:"Midpoint quantity change",ped:"Signed price elasticity",elastic:"Elastic demand",inelastic:"Inelastic demand",unit:"Unit elastic",undefined:"Undefined: prices are identical",units:"units",
   elasticTip:"Choose two distinct prices, then reverse their order. Explain why the midpoint elasticity is unchanged. Compare revenue at the two prices.",
   elasticLimit:"Fixed hypothetical linear demand curve Q = 200 − 2P, other factors constant. Midpoint elasticity describes this interval, not a forecast for an actual market."
 },
 de:{
   reset:"Modell zurücksetzen",inputs:"Modellparameter",results:"Berechnete Ergebnisse",experiment:"Vorhersagen, untersuchen, erklären",
   sales:"Dienstleistungsumsatz auf Ziel",collection:"Bezahlter Anteil der Zielverkäufe",expenses:"Zahlungswirksame Betriebsausgabe",loanAmount:"Darlehensaufnahme",money:"GE",
   journal:"Buchungssätze",trial:"Summen- und Saldenliste",account:"Konto",debit:"Soll",credit:"Haben",amount:"Betrag",transaction:"Geschäftsvorfall",
   cash:"Zahlungsmittel",receivables:"Forderungen",loanPayable:"Darlehensverbindlichkeiten",capital:"Eigenkapitaleinlage",revenue:"Dienstleistungsumsatz",expense:"Betriebsaufwand",
   capitalEntry:"Einlage",loanEntry:"Darlehensaufnahme",saleEntry:"Verkauf auf Ziel",collectionEntry:"Kundenzahlung",expenseEntry:"Auszahlung",
   assets:"Vermögen",liabilities:"Verbindlichkeiten",equity:"Eigenkapital",profit:"Gewinn oder Verlust",total:"Summe",balanced:"Die Soll- und Habensummen stimmen überein.",
   bookTip:"Erhöhe die Zahlungseingänge bei konstantem Umsatz. Erkläre, warum sich Zahlungsmittel und Forderungen ändern, der Gewinn jedoch gleich bleibt. Vergleiche danach die Wirkung einer Darlehensaufnahme.",
   bookLimit:"Fiktives Dienstleistungsunternehmen ohne Anfangsbestände, feste Einlage von 1.000 GE. Keine Steuern, Vorräte, Zinsen oder Abschreibung. Nullbeträge haben keine Auswirkung. Gleiche Soll- und Habensummen beweisen nicht die Richtigkeit aller Buchungen.",
   first:"Ausgangspreis",second:"Neuer Preis",q1:"Anfangsnachfragemenge",q2:"Neue Nachfragemenge",r1:"Ausgangsumsatz",r2:"Neuer Umsatz",pc:"Relative Preisänderung (Mittelwertmethode)",qc:"Relative Mengenänderung (Mittelwertmethode)",ped:"Preiselastizität mit Vorzeichen",elastic:"Elastische Nachfrage",inelastic:"Unelastische Nachfrage",unit:"Einheitselastisch",undefined:"Nicht definiert: gleiche Preise",units:"Einheiten",
   elasticTip:"Wähle zwei unterschiedliche Preise und vertausche sie. Erkläre, warum die Elastizität nach der Mittelwertmethode gleich bleibt. Vergleiche die Umsätze.",
   elasticLimit:"Fiktive lineare Nachfrage Q = 200 − 2P bei sonst konstanten Bedingungen. Die Bogenelastizität beschreibt dieses Intervall, keine Prognose für einen realen Markt."
 }
};
type Props={c:typeof copy.en;locale:string;title:string};
function Bookkeeping({c,locale,title}:Props){
  const [sales,S]=useState(1200),[collection,C]=useState(50),[expense,E]=useState(400),[loan,L]=useState(300);
  const m=bookkeepingModel(sales,collection,expense,loan);
  const fmt=(n:number)=>new Intl.NumberFormat(locale,{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  const entryNames={capital:c.capitalEntry,loan:c.loanEntry,sale:c.saleEntry,collection:c.collectionEntry,expense:c.expenseEntry};
  return <ModelFrame c={c} title={title} reset={()=>{S(1200);C(50);E(400);L(300);}} formula="Assets = liabilities + equity; debits = credits"
    inputs={<><Control label={c.sales} value={sales} min={0} max={2000} step={50} unit={c.money} change={S} locale={locale}/><Control label={c.collection} value={collection} min={0} max={100} step={5} unit="%" change={C} locale={locale}/><Control label={c.expenses} value={expense} min={0} max={1000} step={50} unit={c.money} change={E} locale={locale}/><Control label={c.loanAmount} value={loan} min={0} max={1000} step={50} unit={c.money} change={L} locale={locale}/></>}
    results={<>
      <dl className="grid gap-2 sm:grid-cols-2" aria-live="polite"><Metric label={c.assets} value={m.assets} unit={c.money} locale={locale}/><Metric label={c.liabilities} value={m.liabilities} unit={c.money} locale={locale}/><Metric label={c.equity} value={m.equity} unit={c.money} locale={locale}/><Metric label={c.profit} value={m.profit} unit={c.money} locale={locale}/></dl>
      <section className="rounded-xl border bg-background p-3" aria-label={c.journal}><h3 className="mb-2 text-sm font-semibold">{c.journal}</h3><ol className="space-y-2">{m.entries.map(e=><li key={e.id} className="rounded-lg border p-3 text-sm"><p className="font-semibold">{entryNames[e.id as keyof typeof entryNames]} · {fmt(e.amount)} {c.money}</p><dl className="mt-2 grid grid-cols-2 gap-2 text-xs"><div><dt className="text-muted-foreground">{c.debit}</dt><dd className="break-words">{c[e.debit]}</dd></div><div><dt className="text-muted-foreground">{c.credit}</dt><dd className="break-words">{c[e.credit]}</dd></div></dl></li>)}</ol></section>
      <div className="rounded-xl border bg-background p-3"><table aria-label={c.trial} className="w-full table-fixed text-left text-xs sm:text-sm"><caption className="mb-3 text-left font-semibold">{c.trial} ({c.money})</caption><thead><tr><th scope="col" className="w-[42%] break-words border-b p-1.5">{c.account}</th><th scope="col" className="break-words border-b p-1.5 text-right">{c.debit}</th><th scope="col" className="break-words border-b p-1.5 text-right">{c.credit}</th></tr></thead><tbody>{m.balances.map(b=><tr key={b.account}><th scope="row" className="break-words border-b p-1.5 font-medium">{c[b.account]}</th><td className="break-all border-b p-1.5 text-right tabular-nums">{fmt(b.debit)}</td><td className="break-all border-b p-1.5 text-right tabular-nums">{fmt(b.credit)}</td></tr>)}</tbody><tfoot><tr><th scope="row" className="p-1.5">{c.total}</th><td className="break-all p-1.5 text-right font-semibold tabular-nums">{fmt(m.debitTotal)}</td><td className="break-all p-1.5 text-right font-semibold tabular-nums">{fmt(m.creditTotal)}</td></tr></tfoot></table><p className="mt-2 text-xs text-muted-foreground">{c.balanced}</p></div>
    </>} tip={c.bookTip} limit={c.bookLimit}/>;
}
function Elasticity({c,locale,title}:Props){
  const [p1,P1]=useState(30),[p2,P2]=useState(40),m=elasticityModel(p1,p2);
  return <ModelFrame c={c} title={title} reset={()=>{P1(30);P2(40);}} formula="E = [(Q₂ − Q₁) / mean(Q)] ÷ [(P₂ − P₁) / mean(P)]"
    inputs={<><Control label={c.first} value={p1} min={10} max={90} unit={c.money} change={P1} locale={locale}/><Control label={c.second} value={p2} min={10} max={90} unit={c.money} change={P2} locale={locale}/></>}
    results={<><dl className="grid gap-2 sm:grid-cols-2" aria-live="polite"><Metric label={c.q1} value={m.quantity1} unit={c.units} locale={locale}/><Metric label={c.q2} value={m.quantity2} unit={c.units} locale={locale}/><Metric label={c.r1} value={m.revenue1} unit={c.money} locale={locale}/><Metric label={c.r2} value={m.revenue2} unit={c.money} locale={locale}/><Metric label={c.pc} value={m.priceChange*100} unit="%" locale={locale}/><Metric label={c.qc} value={m.quantityChange*100} unit="%" locale={locale}/>{m.elasticity!==null?<Metric label={c.ped} value={m.elasticity} unit="" locale={locale}/>:null}</dl><p role="status" className="rounded-xl border bg-muted/20 p-3 text-sm font-semibold">{c[m.classification as "elastic"|"inelastic"|"unit"|"undefined"]}</p></>}
    tip={c.elasticTip} limit={c.elasticLimit}/>;
}
export function AdvancedFinanceLabPanel({lab,language}:{lab:"bookkeeping"|"elasticity";language:"en"|"de"}){
  const props={c:copy[language],locale:language==="de"?"de-DE":"en-GB",title:financeLabLabels[language][lab]};
  return lab==="bookkeeping"?<Bookkeeping {...props}/>:<Elasticity {...props}/>;
}
