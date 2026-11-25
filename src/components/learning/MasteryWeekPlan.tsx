import { useState } from "react";
import { CalendarDays, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { buildMasteryWeek } from "@/lib/masteryWeek";
import type { MasteryRow } from "@/lib/masteryRevision";
import { launchSubjects } from "@/lib/launchDiscovery";

const copy={
  en:{title:"Your seven-day revision plan",intro:"Suggested from your saved topic review dates. Choose a manageable number of topics each day.",daily:"Maximum topics per day",scheduled:"Scheduled topics",minutes:"Estimated minutes",overflow:"Due within seven days, not scheduled",later:"Due after this week",today:"Today",empty:"No topics scheduled on this day.",start:"Practise topic",due:"Review date",overdue:"Review already due",note:"Suggestions only. A scheduled topic is not a completed review, and this plan does not change your saved review dates. Practice uses a bounded server sample.",capacity:"Increase the daily limit or revisit the plan to fit more due topics.",day:"Select a revision day"},
  de:{title:"Dein Sieben-Tage-Wiederholungsplan",intro:"Vorschläge anhand deiner gespeicherten Wiederholungstermine. Wähle eine machbare tägliche Themenzahl.",daily:"Maximale Themen pro Tag",scheduled:"Eingeplante Themen",minutes:"Geschätzte Minuten",overflow:"Binnen sieben Tagen fällig, nicht eingeplant",later:"Nach dieser Woche fällig",today:"Heute",empty:"Für diesen Tag sind keine Themen eingeplant.",start:"Thema üben",due:"Wiederholungstermin",overdue:"Wiederholung bereits fällig",note:"Nur Vorschläge. Ein eingeplantes Thema gilt nicht als abgeschlossen. Gespeicherte Termine bleiben unverändert. Die Übungen nutzen eine begrenzte Fragenstichprobe.",capacity:"Erhöhe das Tageslimit oder öffne den Plan erneut, um weitere fällige Themen einzuplanen.",day:"Wiederholungstag auswählen"}
};

export function MasteryWeekPlan({rows,curriculum,language,now}:{rows:readonly MasteryRow[];curriculum:string;language:"en"|"de";now:Date}){
  const c=copy[language],locale=language==="de"?"de-DE":"en-GB";
  const [limit,setLimit]=useState(2),[selected,setSelected]=useState(0);
  const plan=buildMasteryWeek(rows,curriculum,now,limit);
  const active=plan.days[selected];
  const formatDay=(date:string,options:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat(locale,options).format(new Date(date+"T12:00:00"));
  return <section aria-label={c.title} className="mb-6 min-w-0 rounded-2xl border bg-card p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><h2 className="flex items-center gap-2 text-lg font-semibold"><CalendarDays className="h-5 w-5 shrink-0 text-primary" aria-hidden="true"/>{c.title}</h2><p className="mt-2 text-sm text-muted-foreground">{c.intro}</p></div>
      <label className="block min-w-0 text-sm font-medium">{c.daily}<select value={limit} onChange={e=>setLimit(Number(e.target.value))} className="mt-1 block min-h-11 w-full rounded-lg border bg-background px-3 focus-visible:ring-2 focus-visible:ring-ring">{[1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
    </div>
    <dl className="my-4 grid grid-cols-2 gap-2 lg:grid-cols-4" aria-live="polite">
      {([[c.scheduled,plan.scheduled],[c.minutes,plan.estimatedMinutes],[c.overflow,plan.unscheduled],[c.later,plan.outsideWindow]] as const).map(([label,value])=><div key={label} className="min-w-0 rounded-xl border bg-background p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd></div>)}
    </dl>
    {plan.unscheduled>0&&<p className="mb-3 text-sm text-muted-foreground">{c.capacity}</p>}
    <div role="group" aria-label={c.day} className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {plan.days.map((day,i)=><button type="button" key={day.date} aria-pressed={selected===i} onClick={()=>setSelected(i)} className={`min-h-14 min-w-0 rounded-xl border p-2 text-left text-xs focus-visible:ring-2 focus-visible:ring-ring ${selected===i?"border-primary bg-primary/5":"bg-background"}`}><span className="block font-semibold">{i===0?c.today:formatDay(day.date,{weekday:"short"})}</span><span className="block">{formatDay(day.date,{day:"numeric",month:"short"})}</span><span className="block tabular-nums text-muted-foreground">{day.tasks.length} · {day.estimatedMinutes} min</span></button>)}
    </div>
    <div className="mt-4 space-y-2" aria-label={formatDay(active.date,{dateStyle:"full"})}>
      <h3 className="text-sm font-semibold">{formatDay(active.date,{dateStyle:"full"})}</h3>
      {!active.tasks.length?<p className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">{c.empty}</p>:active.tasks.map(task=><div key={task.key} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-background p-3"><div className="min-w-0 flex-1 basis-36"><p className="break-words text-sm font-semibold">{task.topic}</p><p className="text-xs text-muted-foreground">{launchSubjects.find(s=>s.id===task.subject)?.name??task.subject} · {Math.round(task.mastery)}%</p><p className="mt-1 text-xs text-muted-foreground">{task.overdue?c.overdue:c.due} · {new Date(task.dueAt).toLocaleDateString(locale)}</p></div><Button asChild variant="outline" className="min-h-11 gap-1"><Link to={task.practicePath}>{c.start}<ArrowRight className="h-4 w-4" aria-hidden="true"/></Link></Button></div>)}
    </div>
    <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{c.note}</p>
  </section>;
}
