import { useId, useState } from "react";
import { Search, X, ArrowDown, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { filterLabCatalogue, LAB_GROUPS, type CatalogueEntry, type LabGroup, type LabId } from "@/lib/labCatalogue";

type LabCard=CatalogueEntry&{icon:LucideIcon};
const copy={
  en:{heading:"Find a laboratory",search:"Search laboratories",placeholder:"Search by topic or subject",group:"Subject group",all:"All subjects",science:"Science",maths:"Mathematics & statistics",technology:"Technology & computing",business:"Business & economics",clear:"Clear filters",results:"laboratories found",none:"No matching laboratories. Try a different search or clear the filters.",selected:"Selected laboratory",hidden:"The selected laboratory is outside your current filters. Its settings have not changed.",jump:"Go to selected experiment",count:"of"},
  de:{heading:"Labor finden",search:"Labore suchen",placeholder:"Thema oder Fach suchen",group:"Fachgruppe",all:"Alle Fächer",science:"Naturwissenschaften",maths:"Mathematik & Statistik",technology:"Technik & Informatik",business:"Wirtschaft",clear:"Filter zurücksetzen",results:"Labore gefunden",none:"Keine passenden Labore. Ändere die Suche oder setze die Filter zurück.",selected:"Ausgewähltes Labor",hidden:"Das ausgewählte Labor liegt außerhalb der Filter. Seine Einstellungen bleiben erhalten.",jump:"Zum ausgewählten Experiment",count:"von"}
};

export function LabCatalogue({entries,selected,onSelect,onJump,language}:{entries:readonly LabCard[];selected:LabId;onSelect:(id:LabId)=>void;onJump:()=>void;language:"en"|"de"}){
  const c=copy[language],headingId=useId(),searchId=useId(),groupId=useId();
  const [query,setQuery]=useState(""),[group,setGroup]=useState<LabGroup>("all");
  const visible=filterLabCatalogue(entries,group,query);
  const active=entries.find(entry=>entry.id===selected)!;
  const clear=()=>{setQuery("");setGroup("all");};
  return <aside aria-labelledby={headingId} className="min-w-0 rounded-2xl border bg-card p-4 lg:sticky lg:top-24">
    <h2 id={headingId} className="mb-3 text-lg font-semibold">{c.heading}</h2>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      <div className="min-w-0">
        <label htmlFor={searchId} className="mb-1 block text-xs font-semibold text-muted-foreground">{c.search}</label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"/>
          <input id={searchId} type="search" maxLength={160} value={query} onChange={e=>setQuery(e.target.value)} placeholder={c.placeholder} className="min-h-11 w-full min-w-0 rounded-xl border bg-background py-2 pl-9 pr-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"/>
        </div>
      </div>
      <div className="min-w-0">
        <label htmlFor={groupId} className="mb-1 block text-xs font-semibold text-muted-foreground">{c.group}</label>
        <select id={groupId} value={group} onChange={e=>setGroup(e.target.value as LabGroup)} className="min-h-11 w-full min-w-0 rounded-xl border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring">
          {LAB_GROUPS.map(g=><option key={g} value={g}>{c[g]}</option>)}
        </select>
      </div>
    </div>
    <div className="my-3 flex flex-wrap items-center justify-between gap-2">
      <p aria-live="polite" className="text-xs text-muted-foreground tabular-nums">{visible.length} {c.count} {entries.length} {c.results}</p>
      {(query||group!=="all")&&<Button type="button" variant="ghost" className="min-h-11 gap-1 text-xs" onClick={clear}><X className="h-4 w-4" aria-hidden="true"/>{c.clear}</Button>}
    </div>
    <div role="group" aria-label={c.heading} className="grid max-h-[18rem] grid-cols-1 gap-2 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-2 lg:max-h-[min(42dvh,30rem)] lg:grid-cols-1">
      {visible.map(item=><button key={item.id} type="button" aria-pressed={selected===item.id} onClick={()=>onSelect(item.id)} className={`flex min-h-14 min-w-0 items-center gap-3 rounded-xl border p-3 text-left focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${selected===item.id?"border-primary bg-primary/5":"bg-background hover:border-primary/40"}`}>
        <item.icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true"/>
        <span className="min-w-0"><span className="block break-words text-sm font-semibold">{item.title}</span><span className="block text-xs text-muted-foreground">{item.subjectLabel}</span></span>
      </button>)}
      {!visible.length&&<p className="col-span-full rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">{c.none}</p>}
    </div>
    <div className="mt-4 space-y-2 border-t pt-3">
      <p className="text-xs text-muted-foreground">{c.selected}</p><p className="break-words text-sm font-semibold">{active.title}</p>
      {!visible.some(item=>item.id===selected)&&<p className="text-xs leading-relaxed text-muted-foreground">{c.hidden}</p>}
      <Button type="button" variant="outline" className="min-h-11 h-auto w-full gap-2 whitespace-normal text-left" onClick={onJump}>{c.jump}<ArrowDown aria-hidden="true" className="h-4 w-4 shrink-0"/></Button>
    </div>
  </aside>;
}
