import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

type LabFrameCopy = { reset:string; inputs:string; results:string; experiment:string };
export function Control({ label, value, unit, min, max, step=1, change, locale }: { label:string; value:number; unit:string; min:number; max:number; step?:number; change:(v:number)=>void; locale:string }) {
  const display = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(value) + " " + unit;
  return <label className="block rounded-xl border bg-background p-3">
    <span className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium"><span>{label}</span><span className="tabular-nums font-semibold text-primary">{display}</span></span>
    <input type="range" aria-label={label} aria-valuetext={display} min={min} max={max} step={step} value={value} onChange={e=>change(Number(e.target.value))}
      className="mt-2 h-11 w-full cursor-pointer accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
    <span className="flex justify-between text-xs text-muted-foreground" aria-hidden="true"><span>{min} {unit}</span><span>{max} {unit}</span></span>
  </label>;
}
export function Metric({ label, value, unit, locale }: { label:string; value:number; unit:string; locale:string }) {
  return <div className="min-w-0 rounded-xl border bg-background p-3">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="mt-1 break-words text-xl font-semibold tabular-nums">{new Intl.NumberFormat(locale,{maximumFractionDigits:4}).format(value)} <span className="text-sm font-medium text-muted-foreground">{unit}</span></dd>
  </div>;
}
export function ModelFrame({ title, c, reset, inputs, results, formula, tip, limit }: { title:string; c:LabFrameCopy; reset:()=>void; inputs:React.ReactNode; results:React.ReactNode; formula:string; tip:string; limit:string }) {
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
