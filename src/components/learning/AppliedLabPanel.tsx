import { useState } from "react";
import { Control, Metric, ModelFrame } from "./LabPrimitives";
import { statisticsModel, classifierModel, breakEvenModel } from "@/lib/appliedLabs";

export const appliedLabLabels = {
  en: { statistics:"Statistics and outliers", classifier:"AI classification thresholds", breakEven:"Business break-even", "business-studies":"Business" },
  de: { statistics:"Statistik und Ausreißer", classifier:"KI-Klassifikationsschwellen", breakEven:"Gewinnschwelle", "business-studies":"Wirtschaft" },
};
const copy = {
  en: {
    reset:"Reset model",inputs:"Model controls",results:"Calculated results",experiment:"Predict, explore, explain",
    observation:"Fifth observation",mean:"Mean",median:"Median",range:"Range",sd:"Population standard deviation",data:"Five observations", statsTip:"Change the last value from 16 to 100. Compare the mean and median. Which is more affected by the outlier?",statsLimit:"Five synthetic observations treated as the entire population. This is not a sample-standard-deviation estimate.",
    threshold:"Positive classification threshold",tp:"True positives",fp:"False positives",tn:"True negatives",fn:"False negatives",accuracy:"Accuracy",precision:"Precision",recall:"Recall",f1:"F1 score",undefined:"Undefined",score:"Score",actual:"Actual class",predicted:"Predicted class",positive:"Positive",negative:"Negative",cases:"Synthetic classification cases",aiTip:"Increase the threshold. Compare false positives and false negatives. Why is precision undefined when no cases are predicted positive?",aiLimit:"Eight invented scores and labels; scores are not calibrated probabilities. This illustrates threshold selection, not the performance of a real AI system.",
    fixed:"Fixed cost",price:"Selling price per unit",variable:"Variable cost per unit",units:"Units sold",contribution:"Contribution per unit",revenue:"Revenue",cost:"Total cost",profit:"Profit or loss",be:"Minimum units for nonnegative profit",unreachable:"Not attainable",money:"CU",unit:"units",businessTip:"Change price until it equals variable cost. With positive fixed costs, explain why selling more units cannot recover them.",businessLimit:"Fictional currency units (CU), one product, constant costs, all units sold. The result is a simplified planning example, not financial advice.",
  },
  de: {
    reset:"Modell zurücksetzen",inputs:"Modellparameter",results:"Berechnete Ergebnisse",experiment:"Vorhersagen, untersuchen, erklären",
    observation:"Fünfter Messwert",mean:"Arithmetisches Mittel",median:"Median",range:"Spannweite",sd:"Standardabweichung der Grundgesamtheit",data:"Fünf Messwerte",statsTip:"Ändere den letzten Wert von 16 auf 100. Vergleiche Mittelwert und Median. Welcher reagiert stärker auf den Ausreißer?",statsLimit:"Fünf künstliche Werte als gesamte Grundgesamtheit. Keine Schätzung der Stichprobenstandardabweichung.",
    threshold:"Schwellenwert für positive Klassifikation",tp:"Richtig positiv",fp:"Falsch positiv",tn:"Richtig negativ",fn:"Falsch negativ",accuracy:"Genauigkeit",precision:"Präzision",recall:"Sensitivität",f1:"F1-Wert",undefined:"Nicht definiert",score:"Score",actual:"Tatsächliche Klasse",predicted:"Vorhergesagte Klasse",positive:"Positiv",negative:"Negativ",cases:"Künstliche Klassifikationsfälle",aiTip:"Erhöhe den Schwellenwert. Vergleiche falsch positive und falsch negative Fälle. Warum ist die Präzision ohne positive Vorhersagen nicht definiert?",aiLimit:"Acht erfundene Scores und Klassen; keine kalibrierten Wahrscheinlichkeiten. Veranschaulicht die Schwellenwertwahl, nicht die Leistung eines realen KI-Systems.",
    fixed:"Fixkosten",price:"Verkaufspreis je Stück",variable:"Variable Kosten je Stück",units:"Verkaufte Stückzahl",contribution:"Deckungsbeitrag je Stück",revenue:"Umsatz",cost:"Gesamtkosten",profit:"Gewinn oder Verlust",be:"Mindeststückzahl für nichtnegativen Gewinn",unreachable:"Nicht erreichbar",money:"GE",unit:"Stück",businessTip:"Senke den Preis auf die variablen Stückkosten. Erkläre, warum bei positiven Fixkosten mehr Verkäufe die Fixkosten nicht decken.",businessLimit:"Fiktive Geldeinheiten (GE), ein Produkt, konstante Kosten und vollständiger Absatz. Vereinfachtes Rechenbeispiel, keine Finanzberatung.",
  },
};
type Copy=typeof copy.en;
type Props={c:Copy;locale:string;title:string};
function StatLab({c,locale,title}:Props){
  const [last,setLast]=useState(16);
  const m=statisticsModel(last);
  return <ModelFrame title={title} c={c} reset={()=>setLast(16)} formula="μ = Σx / N; σ = √(Σ(x − μ)² / N)"
    inputs={<Control label={c.observation} min={0} max={100} value={last} change={setLast} unit="" locale={locale}/>}
    results={<>
      <dl className="grid gap-2 sm:grid-cols-2" aria-live="polite"><Metric label={c.mean} value={m.mean} unit="" locale={locale}/><Metric label={c.median} value={m.median} unit="" locale={locale}/><Metric label={c.range} value={m.range} unit="" locale={locale}/><Metric label={c.sd} value={m.standardDeviation} unit="" locale={locale}/></dl>
      <figure className="rounded-xl border bg-background p-3"><figcaption className="mb-3 text-sm font-semibold">{c.data}</figcaption><ol className="space-y-2">{m.observations.map((v,i)=><li key={i} className="grid grid-cols-[2rem_minmax(0,1fr)_3rem] items-center gap-2 text-xs"><span>{i+1}</span><span className="h-4 rounded bg-muted"><span className="block h-full rounded bg-primary" style={{width:v+"%"}}/></span><span className="text-right font-semibold tabular-nums">{v}</span></li>)}</ol></figure>
    </>} tip={c.statsTip} limit={c.statsLimit}/>;
}
function AILab({c,locale,title}:Props){
  const [threshold,setThreshold]=useState(60);
  const m=classifierModel(threshold);
  const metrics=[[c.accuracy,m.accuracy],[c.precision,m.precision],[c.recall,m.recall],[c.f1,m.f1]] as const;
  return <ModelFrame title={title} c={c} reset={()=>setThreshold(60)} formula="Precision = TP / (TP + FP); Recall = TP / (TP + FN)"
    inputs={<Control label={c.threshold} min={0} max={100} value={threshold} change={setThreshold} unit="" locale={locale}/>}
    results={<>
      <dl className="grid grid-cols-2 gap-2" aria-live="polite">{([[c.tp,m.tp],[c.fp,m.fp],[c.tn,m.tn],[c.fn,m.fn]] as const).map(([label,n])=><Metric key={label} label={label} value={n} unit="" locale={locale}/>)}</dl>
      <dl className="grid grid-cols-2 gap-2" aria-live="polite">{metrics.map(([label,n])=>n===null?<div key={label} className="min-w-0 rounded-xl border bg-background p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-semibold">{c.undefined}</dd></div>:<Metric key={label} label={label} value={100*n} unit="%" locale={locale}/>)}</dl>
      <div className="rounded-xl border bg-background p-3"><table aria-label={c.cases} className="w-full table-fixed text-left text-xs sm:text-sm"><caption className="mb-2 text-left font-semibold">{c.cases}</caption><thead><tr>{[c.score,c.actual,c.predicted].map(h=><th key={h} scope="col" className="break-words border-b p-2">{h}</th>)}</tr></thead><tbody>{m.cases.map(row=><tr key={row.score} className="border-b last:border-0"><td className="p-2 tabular-nums">{row.score}</td><td className="break-words p-2">{row.actual?c.positive:c.negative}</td><td className="break-words p-2">{row.predicted?c.positive:c.negative}</td></tr>)}</tbody></table></div>
    </>} tip={c.aiTip} limit={c.aiLimit}/>;
}
function BusinessLab({c,locale,title}:Props){
  const [fixed,F]=useState(1000),[price,P]=useState(20),[variable,V]=useState(12),[units,U]=useState(150);
  const m=breakEvenModel(fixed,price,variable,units);
  return <ModelFrame title={title} c={c} reset={()=>{F(1000);P(20);V(12);U(150);}} formula="Profit = Q × (P − V) − F"
    inputs={<><Control label={c.fixed} min={0} max={10000} step={100} value={fixed} change={F} unit={c.money} locale={locale}/><Control label={c.price} min={1} max={100} value={price} change={P} unit={c.money} locale={locale}/><Control label={c.variable} min={0} max={100} value={variable} change={V} unit={c.money} locale={locale}/><Control label={c.units} min={0} max={1000} step={10} value={units} change={U} unit={c.unit} locale={locale}/></>}
    results={<dl className="grid gap-2 sm:grid-cols-2" aria-live="polite">
      <Metric label={c.contribution} value={m.contribution} unit={c.money} locale={locale}/><Metric label={c.revenue} value={m.revenue} unit={c.money} locale={locale}/><Metric label={c.cost} value={m.totalCost} unit={c.money} locale={locale}/><Metric label={c.profit} value={m.profit} unit={c.money} locale={locale}/>
      {m.breakEvenUnits===null?<div className="min-w-0 rounded-xl border bg-background p-3"><dt className="text-xs text-muted-foreground">{c.be}</dt><dd className="mt-1 break-words font-semibold">{c.unreachable}</dd></div>:<Metric label={c.be} value={m.breakEvenUnits} unit={c.unit} locale={locale}/>}
    </dl>} tip={c.businessTip} limit={c.businessLimit}/>;
}
export function AppliedLabPanel({lab,language}:{lab:"statistics"|"classifier"|"breakEven";language:"en"|"de"}){
  const props={c:copy[language],locale:language==="de"?"de-DE":"en-GB",title:appliedLabLabels[language][lab]};
  return lab==="statistics"?<StatLab {...props}/>:lab==="classifier"?<AILab {...props}/>:<BusinessLab {...props}/>;
}
