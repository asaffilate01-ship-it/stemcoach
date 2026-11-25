import { useState } from "react";
import { Control, Metric, ModelFrame } from "./LabPrimitives";
import { AppliedLabPanel } from "./AppliedLabPanel";
import { appliedLabLabels } from "./appliedLabLabels";
import { TechnologyLabPanel } from "./TechnologyLabPanel";
import { technologyLabLabels } from "./technologyLabLabels";
import { Button } from "@/components/ui/button";
import { MascotAvatar } from "@/components/ui/mascot-avatar";
import { getMascot } from "@/lib/mascots";
import { circuitModel, motionModel, dilutionModel, quadraticModel, inheritanceModel, binarySearchModel, BINARY_SEARCH_VALUES, type Genotype } from "@/lib/virtualLabs";
import { Zap, Gauge, FlaskConical, ChartNoAxesCombined, Dna, Code2, ChevronLeft, ChevronRight, Brain, ChartBar, Calculator, Network, Cloud, ShieldCheck } from "lucide-react";

type Lab = "circuit" | "motion" | "dilution" | "quadratic" | "inheritance" | "binarySearch" | "statistics" | "classifier" | "breakEven" | "subnet" | "cloudCapacity" | "policy";
const labels = {
  en: {
    "quadratic": "Quadratic graph explorer",
    "inheritance": "Mendelian inheritance",
    "binarySearch": "Binary search visualiser",
    "mathematics": "Mathematics",
    "biology": "Biology",
    "computer-science": "Computing",
    "coefficient": "Coefficient a",
    "horizontal": "Vertex x-coordinate h",
    "vertical": "Vertex y-coordinate k",
    "roots": "Real roots",
    "noRoots": "No real roots",
    "vertex": "Vertex",
    "yIntercept": "y-intercept",
    "graph": "Quadratic graph",
    "up": "Opens upwards",
    "down": "Opens downwards",
    "quadraticTip": "Keep a fixed and change k. Explain when the curve crosses, touches or does not meet the x-axis.",
    "quadraticLimit": "Vertex form, non-zero integer coefficient, real roots only. The graph is drawn on the displayed interval.",
    "parent1": "Parent 1 genotype",
    "parent2": "Parent 2 genotype",
    "punnett": "Punnett square",
    "gametes": "Gametes",
    "genotype": "Genotype",
    "probability": "Theoretical probability",
    "dominant": "Dominant phenotype",
    "recessive": "Recessive phenotype",
    "inheritanceTip": "Compare Aa × Aa with Aa × aa. Explain why allele combinations are not the same as phenotype proportions.",
    "inheritanceLimit": "Single autosomal locus, equal gamete probabilities and complete dominance. These are model probabilities, not predictions for a person's health or complex traits.",
    "target": "Target value",
    "searchArray": "Sorted array",
    "step": "Step",
    "lower": "Lower bound (index)",
    "upper": "Upper bound (index)",
    "middle": "Middle index",
    "inspected": "Inspected value",
    "found": "Found",
    "left": "Search the left half next",
    "right": "Search the right half next",
    "notFound": "Target absent from this array",
    "foundAt": "Found at zero-based index",
    "previous": "Previous step",
    "next": "Next step",
    "comparisons": "Comparisons",
    "binaryTip": "Try a present value and a missing value. Explain why the search interval shrinks after every unsuccessful comparison.",
    "binaryLimit": "Fixed, sorted, unique integers; a deterministic trace, not an arbitrary code execution environment.",
    heading: "Virtual laboratories", subtitle: "Explore an idealised scientific model, change one variable and explain what happens.",
    circuit: "Electric circuits", motion: "Motion and acceleration", dilution: "Dilution model",
    physics: "Physics", chemistry: "Chemistry", reset: "Reset model", inputs: "Model controls", results: "Calculated results",
    voltage: "Supply voltage", r1: "Resistance R1", r2: "Resistance R2", series: "Series", parallel: "Parallel", topology: "Circuit arrangement",
    resistance: "Equivalent resistance", current: "Total current", power: "Total power", branch1: "Current through R1", branch2: "Current through R2",
    initialVelocity: "Initial velocity", acceleration: "Acceleration", time: "Elapsed time", finalVelocity: "Final velocity", displacement: "Displacement",
    velocityChart: "Velocity against time", initialConcentration: "Initial concentration", sampleVolume: "Initial sample volume", finalVolume: "Final volume",
    finalConcentration: "Final concentration", amount: "Amount of dissolved substance", dilutionFactor: "Dilution factor", concentrationRatio: "Concentration as a fraction of the initial value",
    circuitTip: "Predict how the total current changes when you switch from series to parallel at the same voltage. Explain your observation using equivalent resistance.",
    motionTip: "Keep acceleration fixed and double the elapsed time. Compare the displacement when initial velocity is zero.",
    dilutionTip: "Keep the initial sample and concentration fixed. Predict what happens to the final concentration when the final volume doubles.",
    circuitLimit: "Ideal voltage source and resistors; temperature, internal resistance and component limits are not modelled.",
    motionLimit: "One-dimensional motion with constant acceleration, no drag and non-negative velocity.",
    dilutionLimit: "Ideal conserved solute, exact final volume and no reaction. This is a virtual model, not a practical chemistry procedure.",
    experiment: "Predict, explore, explain", local: "Session only · No grades, credits or progress are recorded by the lab. Values are not saved.",
    modeNotice: "These simulations are illustrative practice, not official exam specifications or physical lab instructions.",
  },
  de: {
    "quadratic": "Quadratische Funktionen",
    "inheritance": "Mendelsche Vererbung",
    "binarySearch": "Binäre Suche",
    "mathematics": "Mathematik",
    "biology": "Biologie",
    "computer-science": "Informatik",
    "coefficient": "Koeffizient a",
    "horizontal": "x-Koordinate des Scheitelpunkts h",
    "vertical": "y-Koordinate des Scheitelpunkts k",
    "roots": "Reelle Nullstellen",
    "noRoots": "Keine reellen Nullstellen",
    "vertex": "Scheitelpunkt",
    "yIntercept": "y-Achsenabschnitt",
    "graph": "Graph der quadratischen Funktion",
    "up": "Nach oben geöffnet",
    "down": "Nach unten geöffnet",
    "quadraticTip": "Halte a konstant und ändere k. Erkläre, wann die Kurve die x-Achse schneidet, berührt oder nicht trifft.",
    "quadraticLimit": "Scheitelpunktform mit ganzzahligem Koeffizienten ungleich null; nur reelle Nullstellen. Der Graph zeigt das angegebene Intervall.",
    "parent1": "Genotyp Elternteil 1",
    "parent2": "Genotyp Elternteil 2",
    "punnett": "Kreuzungsschema",
    "gametes": "Keimzellen",
    "genotype": "Genotyp",
    "probability": "Theoretische Wahrscheinlichkeit",
    "dominant": "Dominanter Phänotyp",
    "recessive": "Rezessiver Phänotyp",
    "inheritanceTip": "Vergleiche Aa × Aa mit Aa × aa. Erkläre den Unterschied zwischen Genotyp- und Phänotypverhältnissen.",
    "inheritanceLimit": "Ein autosomaler Genort, gleich wahrscheinliche Keimzellen und vollständige Dominanz. Keine Vorhersagen über die Gesundheit von Personen oder komplexe Merkmale.",
    "target": "Suchwert",
    "searchArray": "Sortiertes Array",
    "step": "Schritt",
    "lower": "Untere Grenze (Index)",
    "upper": "Obere Grenze (Index)",
    "middle": "Mittlerer Index",
    "inspected": "Verglichener Wert",
    "found": "Gefunden",
    "left": "Links weitersuchen",
    "right": "Rechts weitersuchen",
    "notFound": "Suchwert nicht im Array",
    "foundAt": "Gefunden am nullbasierten Index",
    "previous": "Vorheriger Schritt",
    "next": "Nächster Schritt",
    "comparisons": "Vergleiche",
    "binaryTip": "Teste einen vorhandenen und einen fehlenden Wert. Erkläre, warum das Suchintervall nach jedem erfolglosen Vergleich kleiner wird.",
    "binaryLimit": "Festes, sortiertes Array eindeutiger Ganzzahlen. Deterministische Ablaufdarstellung, keine Ausführung beliebigen Codes.",
    heading: "Virtuelle Labore", subtitle: "Untersuche ein idealisiertes wissenschaftliches Modell, ändere eine Größe und erkläre die Wirkung.",
    circuit: "Elektrische Schaltungen", motion: "Bewegung und Beschleunigung", dilution: "Verdünnungsmodell",
    physics: "Physik", chemistry: "Chemie", reset: "Modell zurücksetzen", inputs: "Modellparameter", results: "Berechnete Ergebnisse",
    voltage: "Versorgungsspannung", r1: "Widerstand R1", r2: "Widerstand R2", series: "Reihe", parallel: "Parallel", topology: "Schaltung",
    resistance: "Gesamtwiderstand", current: "Gesamtstrom", power: "Gesamtleistung", branch1: "Strom durch R1", branch2: "Strom durch R2",
    initialVelocity: "Anfangsgeschwindigkeit", acceleration: "Beschleunigung", time: "Vergangene Zeit", finalVelocity: "Endgeschwindigkeit", displacement: "Ortsänderung",
    velocityChart: "Geschwindigkeit über der Zeit", initialConcentration: "Ausgangskonzentration", sampleVolume: "Anfangsvolumen", finalVolume: "Endvolumen",
    finalConcentration: "Endkonzentration", amount: "Stoffmenge des gelösten Stoffes", dilutionFactor: "Verdünnungsfaktor", concentrationRatio: "Konzentration im Verhältnis zum Anfangswert",
    circuitTip: "Sage voraus, wie sich der Gesamtstrom bei gleicher Spannung beim Wechsel von Reihen- zu Parallelschaltung ändert. Erkläre dies mit dem Gesamtwiderstand.",
    motionTip: "Halte die Beschleunigung konstant und verdopple die Zeit. Vergleiche die Ortsänderung bei Anfangsgeschwindigkeit null.",
    dilutionTip: "Halte Anfangsvolumen und Ausgangskonzentration konstant. Sage voraus, wie sich die Endkonzentration bei doppeltem Endvolumen ändert.",
    circuitLimit: "Ideale Spannungsquelle und Widerstände; Temperatur, Innenwiderstand und Bauteilgrenzen werden nicht berücksichtigt.",
    motionLimit: "Eindimensionale Bewegung mit konstanter Beschleunigung, ohne Luftwiderstand und mit nichtnegativer Geschwindigkeit.",
    dilutionLimit: "Ideales Modell mit erhaltener Stoffmenge, exaktem Endvolumen und ohne Reaktion. Keine praktische Versuchsanleitung.",
    experiment: "Vorhersagen, untersuchen, erklären", local: "Nur diese Sitzung · Das Labor speichert keine Werte, Noten, Guthaben oder Lernfortschritte.",
    modeNotice: "Die Simulationen dienen der Veranschaulichung und sind keine offiziellen Prüfungsvorgaben oder praktischen Versuchsanleitungen.",
  },
};
type Copy = typeof labels.en;
function Circuit({c,locale}:{c:Copy;locale:string}) {
  const [voltage,V]=useState(12),[r1,R1]=useState(30),[r2,R2]=useState(60),[topology,T]=useState<"series"|"parallel">("series");
  const m=circuitModel(voltage,r1,r2,topology);
  const controls=<><div role="group" aria-label={c.topology} className="grid grid-cols-2 gap-2">{(["series","parallel"] as const).map(mode=><Button key={mode} type="button" aria-pressed={topology===mode} variant={topology===mode?"default":"outline"} onClick={()=>T(mode)} className="min-h-11">{c[mode]}</Button>)}</div><Control label={c.voltage} value={voltage} min={1} max={24} unit="V" change={V} locale={locale}/><Control label={c.r1} value={r1} min={10} max={100} unit="Ω" change={R1} locale={locale}/><Control label={c.r2} value={r2} min={10} max={100} unit="Ω" change={R2} locale={locale}/></>;
  return <ModelFrame c={c} title={c.circuit} reset={()=>{V(12);R1(30);R2(60);T("series");}} inputs={controls} formula={topology==="series"?"R = R₁ + R₂; I = V / R":"R = R₁R₂ / (R₁ + R₂); I = V / R"} results={<dl className="grid gap-2 sm:grid-cols-2" aria-live="polite"><Metric label={c.resistance} value={m.resistance} unit="Ω" locale={locale}/><Metric label={c.current} value={m.current} unit="A" locale={locale}/><Metric label={c.branch1} value={m.branch1} unit="A" locale={locale}/><Metric label={c.branch2} value={m.branch2} unit="A" locale={locale}/><Metric label={c.power} value={m.power} unit="W" locale={locale}/></dl>} tip={c.circuitTip} limit={c.circuitLimit}/>;
}
function Motion({c,locale}:{c:Copy;locale:string}) {
  const [velocity,V]=useState(0),[acceleration,A]=useState(2),[time,T]=useState(5);
  const m=motionModel(velocity,acceleration,time);
  const x=(t:number)=>40+260*t/10, y=(v:number)=>155-125*v/70;
  return <ModelFrame c={c} title={c.motion} reset={()=>{V(0);A(2);T(5);}} inputs={<><Control label={c.initialVelocity} value={velocity} min={0} max={20} unit="m/s" change={V} locale={locale}/><Control label={c.acceleration} value={acceleration} min={0} max={5} step={0.5} unit="m/s²" change={A} locale={locale}/><Control label={c.time} value={time} min={0} max={10} step={0.5} unit="s" change={T} locale={locale}/></>} formula="v = u + at; s = ut + ½at²" results={<><dl className="grid gap-2 sm:grid-cols-2" aria-live="polite"><Metric label={c.finalVelocity} value={m.velocity} unit="m/s" locale={locale}/><Metric label={c.displacement} value={m.displacement} unit="m" locale={locale}/></dl><figure className="rounded-xl border bg-background p-3"><figcaption className="text-sm font-medium">{c.velocityChart}</figcaption><svg viewBox="0 0 330 190" className="mt-2 h-auto w-full max-w-lg" role="img" aria-label={c.velocityChart + ": " + m.velocity + " m/s, " + time + " s"}><g fill="none" stroke="currentColor" opacity=".35"><path d="M40 25V155H305"/>{[0,35,70].map(v=><path key={v} d={`M40 ${y(v)}H300`} strokeDasharray="3 5"/>)}</g><g fill="currentColor" fontSize="10"><text x="8" y="18">m/s</text>{[0,35,70].map(v=><text key={v} x="14" y={y(v)+3}>{v}</text>)}{[0,5,10].map(t=><text key={t} x={x(t)-3} y="172">{t}</text>)}<text x="310" y="172">s</text></g><polyline points={m.points.map(p=>x(p.time)+","+y(p.velocity)).join(" ")} fill="none" stroke="hsl(var(--primary))" strokeWidth="3"/><circle cx={x(time)} cy={y(m.velocity)} r="4" fill="hsl(var(--primary))"/></svg></figure></>} tip={c.motionTip} limit={c.motionLimit}/>;
}
function Dilution({c,locale}:{c:Copy;locale:string}) {
  const [concentration,C]=useState(1),[sample,S]=useState(50),[final,F]=useState(250);
  const m=dilutionModel(concentration,sample,final);
  return <ModelFrame c={c} title={c.dilution} reset={()=>{C(1);S(50);F(250);}} inputs={<><Control label={c.initialConcentration} value={concentration} min={0.1} max={2} step={0.1} unit="mol/L" change={C} locale={locale}/><Control label={c.sampleVolume} value={sample} min={10} max={100} step={5} unit="mL" change={S} locale={locale}/><Control label={c.finalVolume} value={final} min={100} max={500} step={10} unit="mL" change={F} locale={locale}/></>} formula="c₁V₁ = c₂V₂; n = cV (V in L)" results={<><dl className="grid gap-2 sm:grid-cols-2" aria-live="polite"><Metric label={c.finalConcentration} value={m.concentration} unit="mol/L" locale={locale}/><Metric label={c.amount} value={m.amount} unit="mol" locale={locale}/><Metric label={c.dilutionFactor} value={m.dilutionFactor} unit="×" locale={locale}/></dl><div className="rounded-xl border bg-background p-3"><p className="mb-2 text-sm font-medium">{c.concentrationRatio}</p><div className="h-4 rounded-full bg-muted" role="meter" aria-label={c.concentrationRatio} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(m.fraction*100)}><div className="h-full rounded-full bg-primary" style={{width:(m.fraction*100)+"%"}}/></div><p className="mt-2 text-sm tabular-nums">{new Intl.NumberFormat(locale,{style:"percent",maximumFractionDigits:1}).format(m.fraction)}</p></div></>} tip={c.dilutionTip} limit={c.dilutionLimit}/>;
}
function Quadratic({c,locale}:{c:Copy;locale:string}) {
  const [a,A]=useState(1),[h,H]=useState(1),[k,K]=useState(-4);
  const m=quadraticModel(a,h,k),fmt=(n:number)=>new Intl.NumberFormat(locale,{maximumFractionDigits:3}).format(n);
  const range=Math.max(1,m.yMax-m.yMin),x=(n:number)=>36+(n+5)*27,y=(n:number)=>156-(n-m.yMin)*126/range;
  return <ModelFrame c={c} title={c.quadratic} reset={()=>{A(1);H(1);K(-4);}} inputs={<>
    <label className="block rounded-xl border bg-background p-3 text-sm font-medium">{c.coefficient}<select aria-label={c.coefficient} value={a} onChange={e=>A(Number(e.target.value))} className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3 focus-visible:ring-2 focus-visible:ring-ring">{[-3,-2,-1,1,2,3].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
    <Control label={c.horizontal} value={h} min={-3} max={3} unit="" change={H} locale={locale}/>
    <Control label={c.vertical} value={k} min={-4} max={4} unit="" change={K} locale={locale}/>
  </>} formula="y = a(x − h)² + k" results={<>
    <dl className="grid gap-2 sm:grid-cols-2" aria-live="polite">
      <div className="min-w-0 rounded-xl border bg-background p-3"><dt className="text-xs text-muted-foreground">{c.vertex}</dt><dd className="mt-1 text-xl font-semibold tabular-nums">({fmt(h)}; {fmt(k)})</dd><p className="text-xs text-muted-foreground">{m.opensUp?c.up:c.down}</p></div>
      <div className="min-w-0 rounded-xl border bg-background p-3"><dt className="text-xs text-muted-foreground">{c.roots}</dt><dd className="mt-1 break-words text-xl font-semibold tabular-nums">{m.roots.length?m.roots.map(fmt).join("; "):c.noRoots}</dd></div>
      <Metric label={c.yIntercept} value={m.yIntercept} unit="" locale={locale}/>
    </dl>
    <figure className="rounded-xl border bg-background p-3"><figcaption className="text-sm font-medium">{c.graph}</figcaption>
      <svg viewBox="0 0 330 190" className="mt-2 h-auto w-full max-w-lg" role="img" aria-label={c.graph+": "+c.vertex+" ("+fmt(h)+"; "+fmt(k)+"), "+c.roots+": "+(m.roots.length?m.roots.map(fmt).join("; "):c.noRoots)}>
        <g fill="none" stroke="currentColor" opacity=".35"><path d={`M36 ${y(0)}H310 M${x(0)} 24V160`}/>{[-5,-2.5,2.5,5].map(v=><path key={v} d={`M${x(v)} 30V156`} strokeDasharray="3 5"/>)}</g>
        <g fontSize="10" fill="currentColor"><text x="316" y={y(0)+3}>x</text><text x={x(0)+5} y="20">y</text>{[-5,0,5].map(v=><text key={v} x={x(v)-3} y="174">{v}</text>)}<text x="2" y="30">{fmt(m.yMax)}</text><text x="2" y="156">{fmt(m.yMin)}</text></g>
        <polyline points={m.points.map(p=>x(p.x)+","+y(p.y)).join(" ")} fill="none" stroke="hsl(var(--primary))" strokeWidth="3"/>
        <circle cx={x(h)} cy={y(k)} r="4.5" fill="hsl(var(--primary))"/>{m.roots.map(root=><circle key={root} cx={x(root)} cy={y(0)} r="4" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="2"/>)}
      </svg>
    </figure>
  </>} tip={c.quadraticTip} limit={c.quadraticLimit}/>;
}
function Inheritance({c,locale}:{c:Copy;locale:string}) {
  const [p1,P1]=useState<Genotype>("Aa"),[p2,P2]=useState<Genotype>("Aa");
  const m=inheritanceModel(p1,p2);
  const select=(label:string,value:Genotype,change:(v:Genotype)=>void)=><label className="block rounded-xl border bg-background p-3 text-sm font-medium">{label}<select value={value} aria-label={label} onChange={e=>change(e.target.value as Genotype)} className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3 focus-visible:ring-2 focus-visible:ring-ring">{(["AA","Aa","aa"] as const).map(v=><option key={v}>{v}</option>)}</select></label>;
  return <ModelFrame c={c} title={c.inheritance} reset={()=>{P1("Aa");P2("Aa");}} inputs={<>{select(c.parent1,p1,P1)}{select(c.parent2,p2,P2)}</>} formula="P = n / 4" results={<>
    <div className="rounded-xl border bg-background p-3"><table className="w-full table-fixed text-center text-sm" aria-label={c.punnett}><caption className="mb-2 text-left font-semibold">{c.punnett}</caption><thead><tr><th scope="col" className="p-2 text-xs">{c.gametes}</th>{m.gametes2.map((g,i)=><th scope="col" key={i} className="border p-2">{g}</th>)}</tr></thead><tbody>{m.grid.map((row,i)=><tr key={i}><th scope="row" className="border p-2">{m.gametes1[i]}</th>{row.map((g,j)=><td key={j} className="border bg-muted/30 p-3 font-semibold">{g}</td>)}</tr>)}</tbody></table></div>
    <div aria-live="polite"><dl className="grid grid-cols-3 gap-2">{(["AA","Aa","aa"] as const).map(g=><Metric key={g} label={g} value={m.counts[g]*25} unit="%" locale={locale}/>)}</dl><dl className="mt-2 grid gap-2 sm:grid-cols-2"><Metric label={c.dominant} value={m.dominantPercent} unit="%" locale={locale}/><Metric label={c.recessive} value={m.recessivePercent} unit="%" locale={locale}/></dl></div>
  </>} tip={c.inheritanceTip} limit={c.inheritanceLimit}/>;
}
function BinarySearch({c,locale}:{c:Copy;locale:string}) {
  const [target,T]=useState(23),[step,S]=useState(0);
  const model=binarySearchModel(target),current=model.steps[step],last=step===model.steps.length-1;
  return <ModelFrame c={c} title={c.binarySearch} reset={()=>{T(23);S(0);}} inputs={<Control label={c.target} value={target} min={0} max={80} unit="" change={v=>{T(v);S(0);}} locale={locale}/>} formula="mid = floor((low + high) / 2)" results={<>
    <div className="rounded-xl border bg-background p-3"><h4 className="mb-2 text-sm font-semibold">{c.searchArray}</h4><ol aria-label={c.searchArray} className="grid grid-cols-5 gap-1 sm:grid-cols-9">{BINARY_SEARCH_VALUES.map((v,i)=><li key={v} aria-current={i===current.mid?"step":undefined} className={`min-w-0 rounded-lg border py-2 text-center text-sm font-semibold tabular-nums ${i===current.mid?"border-primary bg-primary/10 ring-1 ring-primary":i<current.low||i>current.high?"text-muted-foreground line-through":"bg-muted/20"}`}><span className="block text-xs text-muted-foreground">{i}</span>{v}</li>)}</ol></div>
    <dl className="grid grid-cols-2 gap-2" aria-live="polite"><Metric label={c.lower} value={current.low} unit="" locale={locale}/><Metric label={c.upper} value={current.high} unit="" locale={locale}/><Metric label={c.middle} value={current.mid} unit="" locale={locale}/><Metric label={c.inspected} value={current.value} unit="" locale={locale}/></dl>
    <div className="rounded-xl border bg-muted/20 p-3"><p role="status" className="text-sm font-semibold">{c.step} {step+1} / {model.steps.length} · {last?(model.found?c.foundAt+" "+model.foundIndex:c.notFound):c[current.decision]}</p><div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={step===0} onClick={()=>S(v=>Math.max(0,v-1))} className="min-h-11 gap-1"><ChevronLeft className="h-4 w-4" aria-hidden="true"/>{c.previous}</Button><Button type="button" disabled={last} onClick={()=>S(v=>Math.min(model.steps.length-1,v+1))} className="min-h-11 gap-1">{c.next}<ChevronRight className="h-4 w-4" aria-hidden="true"/></Button></div></div>
  </>} tip={c.binaryTip} limit={c.binaryLimit}/>;
}
export function VirtualLabWorkspace({ language="en" }: { language?: "en"|"de" }) {
  const c={...labels[language],...appliedLabLabels[language],...technologyLabLabels[language]},locale=language==="de"?"de-DE":"en-GB";
  const [lab,setLab]=useState<Lab>("circuit");
  const labs=[{id:"circuit",icon:Zap,subject:"physics"},{id:"motion",icon:Gauge,subject:"physics"},{id:"dilution",icon:FlaskConical,subject:"chemistry"},{id:"quadratic",icon:ChartNoAxesCombined,subject:"mathematics"},{id:"inheritance",icon:Dna,subject:"biology"},{id:"binarySearch",icon:Code2,subject:"computer-science"},{id:"statistics",icon:ChartBar,subject:"mathematics"},{id:"classifier",icon:Brain,subject:"computer-science"},{id:"breakEven",icon:Calculator,subject:"business-studies"},{id:"subnet",icon:Network,subject:"computer-science"},{id:"cloudCapacity",icon:Cloud,subject:"computer-science"},{id:"policy",icon:ShieldCheck,subject:"computer-science"}] as const;
  const active=labs.find(item=>item.id===lab)!;
  return <main id="main-content" className="container mx-auto max-w-6xl px-4 py-6 pb-28 sm:py-10">
    <header className="mb-5 flex items-start gap-3 sm:gap-5"><MascotAvatar mascot={getMascot(active.subject)} className="h-14 w-14 sm:h-20 sm:w-20"/><div className="min-w-0"><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{c.heading}</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.subtitle}</p></div></header>
    <div role="group" aria-label={c.heading} className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">{labs.map(item=><button key={item.id} type="button" aria-pressed={lab===item.id} onClick={()=>setLab(item.id)} className={`flex min-h-14 min-w-0 items-center gap-3 rounded-xl border p-3 text-left focus-visible:ring-2 focus-visible:ring-ring ${lab===item.id?"border-primary bg-primary/5":"bg-card"}`}><item.icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true"/><span className="min-w-0"><span className="block text-sm font-semibold">{c[item.id]}</span><span className="block text-xs text-muted-foreground">{c[item.subject]}</span></span></button>)}</div>
    {lab==="circuit"?<Circuit c={c} locale={locale}/>:lab==="motion"?<Motion c={c} locale={locale}/>:lab==="dilution"?<Dilution c={c} locale={locale}/>:lab==="quadratic"?<Quadratic c={c} locale={locale}/>:lab==="inheritance"?<Inheritance c={c} locale={locale}/>:lab==="binarySearch"?<BinarySearch c={c} locale={locale}/> :lab==="subnet"||lab==="cloudCapacity"||lab==="policy"?<TechnologyLabPanel lab={lab} language={language}/>:<AppliedLabPanel lab={lab} language={language}/>}
    <footer className="mt-4 space-y-1 text-xs text-muted-foreground"><p>{c.local}</p><p>{c.modeNotice}</p></footer>
  </main>;
}
