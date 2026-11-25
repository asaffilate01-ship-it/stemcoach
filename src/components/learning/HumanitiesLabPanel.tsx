import { useState } from "react";
import { Control, Metric, ModelFrame } from "./LabPrimitives";
import { mapScaleModel, mapScales, populationModel, confoundingModel } from "@/lib/humanitiesLabs";
import { humanitiesLabLabels } from "./humanitiesLabLabels";

const copy={
  en:{
    reset:"Reset model",inputs:"Model controls",results:"Calculated results",experiment:"Predict, explore, explain",
    scale:"Map scale",distance:"Map distance",area:"Map area",ground:"Ground distance",groundArea:"Ground area",
    mapTip:"Keep the map measurements fixed and double the scale denominator. Compare the ground distance and area. Why does the area increase by a factor of four?",
    mapLimit:"An ideal flat map with a uniform representative fraction. No GPS, real maps, route calculation or projection distortion.",
    start:"Starting population",births:"Births",deaths:"Deaths",arrivals:"Arrivals",departures:"Departures",natural:"Natural change",migration:"Net migration",change:"Total change",ending:"Ending population",percent:"Percentage change",people:"people",
    populationTip:"Choose equal birth and death counts. Change the number arriving and departing. Explain how migration can still increase or decrease the population.",
    populationLimit:"A fictional closed accounting period with recorded births, deaths, arrivals and departures. This is not a real population estimate or forecast.",
    highA:"Higher-familiarity cases in A",highB:"Higher-familiarity cases in B",a:"Group A",b:"Group B",low:"Lower familiarity",high:"Higher familiarity",overall:"Pooled success rate",table:"Synthetic study comparison",stratum:"Baseline familiarity",size:"Cases",rate:"Success rate",difference:"Pooled B minus A",withinLow:"Within lower familiarity: B minus A",withinHigh:"Within higher familiarity: B minus A",points:"pp",
    reversal:"Reversal: B has a higher success rate in both strata but a lower pooled rate.",noReversal:"No pooled reversal in this setting. Check the within-stratum comparisons.",
    studyTip:"Set A to 80 higher-familiarity cases and B to 20. Compare pooled and stratified results. Then balance the two groups and explain why the pooled comparison changes.",
    studyLimit:"Two invented groups of 100 cases, fixed success rates and a single baseline variable. This illustrates confounding and aggregation, not psychological diagnosis, personal assessment or evidence of a causal treatment effect."
  },
  de:{
    reset:"Modell zurücksetzen",inputs:"Modellparameter",results:"Berechnete Ergebnisse",experiment:"Vorhersagen, untersuchen, erklären",
    scale:"Kartenmaßstab",distance:"Kartenstrecke",area:"Kartenfläche",ground:"Entfernung in der Wirklichkeit",groundArea:"Fläche in der Wirklichkeit",
    mapTip:"Halte die Kartenmesswerte konstant und verdopple die Maßstabszahl. Vergleiche die Entfernung und Fläche in der Wirklichkeit. Warum vervierfacht sich die Fläche?",
    mapLimit:"Ideale ebene Karte mit einheitlichem Maßstab. Kein GPS, keine echten Karten, Routenberechnung oder Projektionsverzerrung.",
    start:"Anfangsbevölkerung",births:"Geburten",deaths:"Sterbefälle",arrivals:"Zuzüge",departures:"Fortzüge",natural:"Natürliche Bevölkerungsveränderung",migration:"Wanderungssaldo",change:"Gesamtveränderung",ending:"Endbevölkerung",percent:"Prozentuale Veränderung",people:"Personen",
    populationTip:"Wähle gleich viele Geburten und Sterbefälle. Verändere Zu- und Fortzüge. Erkläre, warum Wanderung die Bevölkerungszahl trotzdem verändern kann.",
    populationLimit:"Fiktiver Bilanzzeitraum mit erfassten Geburten, Sterbefällen, Zu- und Fortzügen. Keine reale Bevölkerungsschätzung oder Prognose.",
    highA:"Fälle mit höherer Vorerfahrung in A",highB:"Fälle mit höherer Vorerfahrung in B",a:"Gruppe A",b:"Gruppe B",low:"Geringere Vorerfahrung",high:"Höhere Vorerfahrung",overall:"Erfolgsquote insgesamt",table:"Fiktiver Studienvergleich",stratum:"Vorerfahrung",size:"Fälle",rate:"Erfolgsquote",difference:"Gesamtdifferenz B minus A",withinLow:"Geringere Vorerfahrung: B minus A",withinHigh:"Höhere Vorerfahrung: B minus A",points:"Pp.",
    reversal:"Umkehrung: B erzielt in beiden Teilgruppen eine höhere, insgesamt jedoch eine niedrigere Erfolgsquote.",noReversal:"Bei diesen Einstellungen keine Umkehrung. Prüfe die Vergleiche innerhalb der Teilgruppen.",
    studyTip:"Wähle in A 80 und in B 20 Fälle mit höherer Vorerfahrung. Vergleiche Gesamt- und Teilgruppenquoten. Gleiche anschließend die Gruppen an und erkläre die Änderung.",
    studyLimit:"Zwei erfundene Gruppen mit je 100 Fällen, festen Erfolgsquoten und einer Ausgangsvariable. Veranschaulicht Konfundierung und Aggregation; keine psychologische Diagnose, persönliche Bewertung oder kausale Wirksamkeitsprüfung."
  }
};
type Props={c:typeof copy.en;locale:string;title:string};
function MapLab({c,locale,title}:Props){
  const [scale,S]=useState<number>(25000),[distance,D]=useState(40),[area,A]=useState(16);
  const m=mapScaleModel(scale,distance,area);
  const fmt=(n:number)=>new Intl.NumberFormat(locale).format(n);
  return <ModelFrame c={c} title={title} reset={()=>{S(25000);D(40);A(16);}} formula="Ground distance = map distance × scale; ground area = map area × scale²"
    inputs={<><label className="block rounded-xl border bg-background p-3 text-sm font-medium">{c.scale}<select aria-label={c.scale} value={scale} onChange={e=>S(Number(e.target.value))} className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3 focus-visible:ring-2 focus-visible:ring-ring">{mapScales.map(v=><option key={v} value={v}>1 : {fmt(v)}</option>)}</select></label><Control label={c.distance} value={distance} min={10} max={200} unit="mm" change={D} locale={locale}/><Control label={c.area} value={area} min={1} max={100} unit="cm²" change={A} locale={locale}/></>}
    results={<dl className="grid gap-2 sm:grid-cols-2" aria-live="polite"><Metric label={c.ground} value={m.groundKm} unit="km" locale={locale}/><Metric label={c.groundArea} value={m.groundAreaKm2} unit="km²" locale={locale}/></dl>}
    tip={c.mapTip} limit={c.mapLimit}/>;
}
function PopulationLab({c,locale,title}:Props){
  const [start,S]=useState(50000),[births,B]=useState(600),[deaths,D]=useState(400),[arrivals,A]=useState(800),[departures,L]=useState(300);
  const m=populationModel(start,births,deaths,arrivals,departures);
  return <ModelFrame c={c} title={title} reset={()=>{S(50000);B(600);D(400);A(800);L(300);}} formula="P₂ = P₁ + births − deaths + arrivals − departures"
    inputs={<><Control label={c.start} value={start} min={10000} max={100000} step={1000} unit={c.people} change={S} locale={locale}/>{([[c.births,births,B],[c.deaths,deaths,D],[c.arrivals,arrivals,A],[c.departures,departures,L]] as const).map(([label,value,change])=><Control key={label} label={label} value={value} min={0} max={5000} step={100} unit={c.people} change={change} locale={locale}/>)}</>}
    results={<dl className="grid gap-2 sm:grid-cols-2" aria-live="polite"><Metric label={c.natural} value={m.naturalChange} unit={c.people} locale={locale}/><Metric label={c.migration} value={m.netMigration} unit={c.people} locale={locale}/><Metric label={c.change} value={m.totalChange} unit={c.people} locale={locale}/><Metric label={c.ending} value={m.endingPopulation} unit={c.people} locale={locale}/><Metric label={c.percent} value={m.percentageChange} unit="%" locale={locale}/></dl>}
    tip={c.populationTip} limit={c.populationLimit}/>;
}
function ConfoundingLab({c,locale,title}:Props){
  const [a,A]=useState(80),[b,B]=useState(20),m=confoundingModel(a,b);
  return <ModelFrame c={c} title={title} reset={()=>{A(80);B(20);}} formula="Pooled success rate = total successes / total cases"
    inputs={<><Control label={c.highA} value={a} min={10} max={90} step={10} unit="" change={A} locale={locale}/><Control label={c.highB} value={b} min={10} max={90} step={10} unit="" change={B} locale={locale}/></>}
    results={<>
      <div className="grid gap-2 sm:grid-cols-2" aria-live="polite">{([[c.a,m.a],[c.b,m.b]] as const).map(([label,group])=><section key={label} aria-label={label} className="min-w-0 rounded-xl border bg-background p-3"><h4 className="text-sm font-semibold">{label}</h4><dl className="mt-2 space-y-2">{([[c.low,group.low,group.lowRate],[c.high,group.high,group.highRate]] as const).map(([stratum,size,rate])=><div key={stratum} className="rounded-lg bg-muted/30 p-2 text-xs"><dt className="font-medium">{stratum}</dt><dd>{c.size}: {size} · {c.rate}: {rate}%</dd></div>)}<Metric label={c.overall} value={group.overall} unit="%" locale={locale}/></dl></section>)}</div>
      <dl className="grid gap-2 sm:grid-cols-2" aria-live="polite"><Metric label={c.difference} value={m.overallDifference} unit={c.points} locale={locale}/><Metric label={c.withinLow} value={m.withinLowDifference} unit={c.points} locale={locale}/><Metric label={c.withinHigh} value={m.withinHighDifference} unit={c.points} locale={locale}/></dl><p role="status" className="rounded-xl border bg-muted/20 p-3 text-sm font-semibold">{m.reversal?c.reversal:c.noReversal}</p>
    </>} tip={c.studyTip} limit={c.studyLimit}/>;
}
export function HumanitiesLabPanel({lab,language}:{lab:"mapScale"|"population"|"confounding";language:"en"|"de"}){
  const props={c:copy[language],locale:language==="de"?"de-DE":"en-GB",title:humanitiesLabLabels[language][lab]};
  return lab==="mapScale"?<MapLab {...props}/>:lab==="population"?<PopulationLab {...props}/>:<ConfoundingLab {...props}/>;
}
