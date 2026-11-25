import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MascotAvatar } from "@/components/ui/mascot-avatar";
import { getMascot } from "@/lib/mascots";
import { circuitModel, motionModel, dilutionModel } from "@/lib/virtualLabs";
import { RotateCcw, Zap, Gauge, FlaskConical } from "lucide-react";

type Lab = "circuit" | "motion" | "dilution";
const labels = {
  en: {
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
function Control({ label, value, unit, min, max, step=1, change, locale }: { label:string; value:number; unit:string; min:number; max:number; step?:number; change:(v:number)=>void; locale:string }) {
  const display = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(value) + " " + unit;
  return <label className="block rounded-xl border bg-background p-3">
    <span className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium"><span>{label}</span><span className="tabular-nums font-semibold text-primary">{display}</span></span>
    <input type="range" aria-label={label} aria-valuetext={display} min={min} max={max} step={step} value={value} onChange={e=>change(Number(e.target.value))}
      className="mt-2 h-11 w-full cursor-pointer accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
    <span className="flex justify-between text-xs text-muted-foreground" aria-hidden="true"><span>{min} {unit}</span><span>{max} {unit}</span></span>
  </label>;
}
function Metric({ label, value, unit, locale }: { label:string; value:number; unit:string; locale:string }) {
  return <div className="min-w-0 rounded-xl border bg-background p-3">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="mt-1 break-words text-xl font-semibold tabular-nums">{new Intl.NumberFormat(locale,{maximumFractionDigits:4}).format(value)} <span className="text-sm font-medium text-muted-foreground">{unit}</span></dd>
  </div>;
}
function ModelFrame({ title, c, reset, inputs, results, formula, tip, limit }: { title:string; c:Copy; reset:()=>void; inputs:React.ReactNode; results:React.ReactNode; formula:string; tip:string; limit:string }) {
  return <section aria-label={title} className="rounded-2xl border bg-card p-4 sm:p-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-xl font-semibold">{title}</h2>
      <Button type="button" variant="outline" onClick={reset} className="min-h-11 gap-2"><RotateCcw className="h-4 w-4" aria-hidden="true" />{c.reset}</Button>
    </div>
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="min-w-0 space-y-3"><h3 className="text-sm font-semibold">{c.inputs}</h3>{inputs}</div>
      <div className="min-w-0 space-y-3"><h3 className="text-sm font-semibold">{c.results}</h3><p dir="ltr" className="break-words rounded-xl bg-primary/5 px-3 py-2 text-sm font-semibold text-primary">{formula}</p>{results}</div>
    </div>
    <div className="mt-5 rounded-xl border bg-muted/20 p-4"><h3 className="text-sm font-semibold">{c.experiment}</h3><p className="mt-1 text-sm leading-relaxed">{tip}</p></div>
    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{limit}</p>
  </section>;
}
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
export function VirtualLabWorkspace({ language="en" }: { language?: "en"|"de" }) {
  const c=labels[language],locale=language==="de"?"de-DE":"en-GB";
  const [lab,setLab]=useState<Lab>("circuit");
  const labs=[{id:"circuit",icon:Zap,subject:"physics"},{id:"motion",icon:Gauge,subject:"physics"},{id:"dilution",icon:FlaskConical,subject:"chemistry"}] as const;
  const active=labs.find(item=>item.id===lab)!;
  return <main id="main-content" className="container mx-auto max-w-6xl px-4 py-6 pb-28 sm:py-10">
    <header className="mb-5 flex items-start gap-3 sm:gap-5"><MascotAvatar mascot={getMascot(active.subject)} className="h-14 w-14 sm:h-20 sm:w-20"/><div className="min-w-0"><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{c.heading}</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.subtitle}</p></div></header>
    <div role="group" aria-label={c.heading} className="mb-5 grid gap-2 sm:grid-cols-3">{labs.map(item=><button key={item.id} type="button" aria-pressed={lab===item.id} onClick={()=>setLab(item.id)} className={`flex min-h-14 min-w-0 items-center gap-3 rounded-xl border p-3 text-left focus-visible:ring-2 focus-visible:ring-ring ${lab===item.id?"border-primary bg-primary/5":"bg-card"}`}><item.icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true"/><span className="min-w-0"><span className="block text-sm font-semibold">{c[item.id]}</span><span className="block text-xs text-muted-foreground">{c[item.subject]}</span></span></button>)}</div>
    {lab==="circuit"?<Circuit c={c} locale={locale}/>:lab==="motion"?<Motion c={c} locale={locale}/>:<Dilution c={c} locale={locale}/>}
    <footer className="mt-4 space-y-1 text-xs text-muted-foreground"><p>{c.local}</p><p>{c.modeNotice}</p></footer>
  </main>;
}
