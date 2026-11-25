import {useRef,useState} from "react";
import {useTranslation} from "react-i18next";
import {AppHeader} from "@/components/layout/AppHeader";
import {useAuth} from "@/hooks/useAuth";
import {useApprovedChildren,useChildSummary} from "@/hooks/useParentProgress";
import {recordedAccuracy} from "@/lib/parentProgress";
import {supabase} from "@/integrations/supabase/client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {useDocumentTitle} from "@/hooks/useDocumentTitle";
import {useToast} from "@/hooks/use-toast";
import {Link2,Users,RefreshCw,ShieldCheck} from "lucide-react";

const copy={
 en:{title:"Parent portal",intro:"View recorded learning summaries for children who have approved your link request.",link:"Request a child link",email:"Child's email address",send:"Send request",sending:"Sending…",consent:"The learner must approve the request in their account. A request does not grant access.",sent:"Link request sent",sentDetail:"Access remains unavailable until the learner approves it.",failed:"Request could not be confirmed",failedDetail:"Check the email and existing requests before trying again.",loading:"Verifying approved child links…",error:"Approved child links could not be verified.",empty:"No approved child links",emptyDetail:"A pending request does not appear as an approved link.",retry:"Try again",refresh:"Refresh approved links",choose:"Choose a linked learner",student:"Learner",names:"Some display names are unavailable.",capped:"Showing the first 50 approved links. Additional links are not included in this view.",summary:"Recorded learning summary",summaryLoading:"Verifying selected learner…",summaryError:"This learner's approved link or summary could not be verified. Refresh the approved links.",unavailable:"Unavailable",partial:"Some records could not be verified. Missing values are not counted as zero.",questions:"Recorded questions",accuracy:"Recorded accuracy",streak:"Current streak (days)",longest:"Longest streak (days)",xp:"Recorded XP",level:"Recorded level",badges:"Badges",certificates:"Certificates",last:"Last active date",notice:"Practice accuracy is not an exam-readiness assessment or predicted grade. This portal shows summary records only."},
 de:{title:"Elternportal",intro:"Zeigt gespeicherte Lernübersichten für Kinder, die deine Verknüpfungsanfrage genehmigt haben.",link:"Verknüpfung anfragen",email:"E-Mail-Adresse des Kindes",send:"Anfrage senden",sending:"Wird gesendet…",consent:"Das Kind muss die Anfrage im eigenen Konto genehmigen. Eine Anfrage gewährt keinen Zugriff.",sent:"Anfrage gesendet",sentDetail:"Zugriff erst nach Genehmigung durch das Kind.",failed:"Anfrage konnte nicht bestätigt werden",failedDetail:"Prüfe die E-Mail-Adresse und vorhandene Anfragen vor einem erneuten Versuch.",loading:"Genehmigte Verknüpfungen werden geprüft…",error:"Genehmigte Verknüpfungen konnten nicht bestätigt werden.",empty:"Keine genehmigten Verknüpfungen",emptyDetail:"Offene Anfragen erscheinen nicht als genehmigte Verknüpfungen.",retry:"Erneut versuchen",refresh:"Genehmigte Verknüpfungen aktualisieren",choose:"Kind auswählen",student:"Lernende",names:"Einige Anzeigenamen fehlen.",capped:"Die ersten 50 genehmigten Verknüpfungen werden angezeigt.",summary:"Gespeicherte Lernübersicht",summaryLoading:"Ausgewähltes Kind wird geprüft…",summaryError:"Verknüpfung oder Lernübersicht konnte nicht bestätigt werden. Aktualisiere die Verknüpfungen.",unavailable:"Nicht verfügbar",partial:"Einige Daten konnten nicht bestätigt werden. Fehlende Werte gelten nicht als null.",questions:"Gespeicherte Fragen",accuracy:"Gespeicherte Trefferquote",streak:"Aktuelle Lernserie (Tage)",longest:"Längste Lernserie (Tage)",xp:"Gespeicherte XP",level:"Gespeichertes Level",badges:"Abzeichen",certificates:"Zertifikate",last:"Zuletzt aktiv",notice:"Die Trefferquote ist keine Prüfungseignung oder Notenprognose. Das Portal zeigt ausschließlich zusammengefasste Daten."}
};
function ParentWorkspace({accountId}:{accountId:string}){
  const {i18n}=useTranslation(),{toast}=useToast();
  const c=copy[i18n.resolvedLanguage?.startsWith("de")?"de":"en"];
  useDocumentTitle(c.title);
  const links=useApprovedChildren(accountId);
  const [selected,setSelected]=useState<string|null>(null),[email,setEmail]=useState(""),[sending,setSending]=useState(false);
  const lock=useRef(false);
  const children=links.data?.children??[];
  const active=children.find(child=>child.id===selected)??children[0];
  const summary=useChildSummary(accountId,active?.id??null);
  const request=async()=>{
    const address=email.trim();
    if(lock.current||address.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(address))return;
    lock.current=true;setSending(true);
    try{
      const {data,error}=await supabase.functions.invoke("link-parent-child",{body:{child_email:address}});
      if(error||data?.success!==true)throw Error("Request unconfirmed");
      toast({title:c.sent,description:c.sentDetail});setEmail("");links.retry();
    }catch{toast({title:c.failed,description:c.failedDetail,variant:"destructive"});}
    finally{lock.current=false;setSending(false);}
  };
  const stats=summary.data?.stats,accuracy=recordedAccuracy(stats??null);
  const metrics=[[c.questions,stats?.total_questions],[c.accuracy,accuracy===null?null:accuracy+"%"],[c.streak,stats?.streak],[c.longest,stats?.longest_streak],[c.xp,stats?.xp],[c.level,stats?.level],[c.badges,summary.data?.badges],[c.certificates,summary.data?.certificates]] as const;
  return <div className="min-h-screen bg-background"><AppHeader/><main id="main-content" className="container mx-auto max-w-6xl px-4 py-6 pb-28 sm:py-10">
    <header className="mb-5"><h1 className="text-2xl font-bold sm:text-3xl">{c.title}</h1><p className="mt-2 text-sm text-muted-foreground">{c.intro}</p></header>
    <section className="mb-5 rounded-2xl border bg-card p-4 sm:p-6"><h2 className="flex items-center gap-2 font-semibold"><Link2 className="h-5 w-5 text-primary" aria-hidden="true"/>{c.link}</h2>
      <form className="mt-3 space-y-2" onSubmit={e=>{e.preventDefault();void request();}}><Label htmlFor="child-email">{c.email}</Label><div className="flex flex-col gap-2 sm:flex-row"><Input id="child-email" type="email" maxLength={254} required value={email} onChange={e=>setEmail(e.target.value)} disabled={sending} className="min-h-11 max-w-md"/><Button type="submit" disabled={sending||!email.trim()} className="min-h-11">{sending?c.sending:c.send}</Button></div></form><p className="mt-2 text-xs text-muted-foreground">{c.consent}</p>
    </section>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5 text-primary" aria-hidden="true"/>{c.choose}</h2><Button type="button" variant="outline" onClick={links.retry} disabled={links.loading} className="min-h-11 gap-2"><RefreshCw className="h-4 w-4" aria-hidden="true"/>{c.refresh}</Button></div>
    {links.loading?<p role="status" className="rounded-xl border bg-card p-4">{c.loading}</p>:links.error?<div role="alert" className="rounded-xl border bg-card p-4"><p>{c.error}</p><Button onClick={links.retry} className="mt-3 min-h-11">{c.retry}</Button></div>:!children.length?<section className="rounded-xl border bg-card p-6"><h3 className="font-semibold">{c.empty}</h3><p className="mt-2 text-sm text-muted-foreground">{c.emptyDetail}</p></section>:<>
      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" role="group" aria-label={c.choose}>{children.map((child,index)=><button key={child.id} type="button" aria-pressed={active?.id===child.id} onClick={()=>setSelected(child.id)} className={`min-h-11 break-words rounded-xl border p-3 text-left font-semibold focus-visible:ring-2 focus-visible:ring-ring ${active?.id===child.id?"border-primary bg-primary/5":"bg-card"}`}>{child.name||c.student+" "+(index+1)}</button>)}</div>
      {links.data?.namesUnavailable&&<p className="mb-2 text-xs text-muted-foreground">{c.names}</p>}
      {links.data?.capped&&<p className="mb-2 text-xs text-muted-foreground">{c.capped}</p>}
      {summary.loading?<p role="status" className="rounded-xl border bg-card p-4">{c.summaryLoading}</p>:summary.error?<section role="alert" className="rounded-xl border bg-card p-4"><p>{c.summaryError}</p><Button onClick={links.retry} className="mt-3 min-h-11">{c.refresh}</Button></section>:summary.data&&<section aria-label={c.summary} className="rounded-2xl border bg-card p-4 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true"/>{c.summary}</h2><Button variant="outline" onClick={summary.retry} className="min-h-11">{c.retry}</Button></div>
        {(!stats||summary.data.badges===null||summary.data.certificates===null)&&<p role="status" className="mb-3 text-sm text-muted-foreground">{c.partial}</p>}
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(([label,value])=><div key={label} className="min-w-0 rounded-xl border bg-background p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-2 break-words font-semibold tabular-nums text-lg">{value??c.unavailable}</dd></div>)}</dl>
        <p className="mt-4 text-sm text-muted-foreground">{c.last}: {stats?.last_active_date??c.unavailable}</p><p className="mt-2 text-xs text-muted-foreground">{c.notice}</p>
      </section>}
    </>}
  </main></div>;
}
export default function ParentDashboard(){
  const {user}=useAuth();
  return user?<ParentWorkspace key={user.id} accountId={user.id}/>:null;
}
