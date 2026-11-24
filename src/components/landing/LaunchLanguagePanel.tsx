import { Link } from "react-router-dom";
import { BookOpen, ArrowRight } from "lucide-react";
import { launchStudyLanguages } from "@/lib/launchDiscovery";
import { MascotAvatar } from "@/components/ui/mascot-avatar";
import { getMascot } from "@/lib/mascots";

export function LaunchLanguagePanel() {
  return <section id="study-languages" aria-labelledby="study-languages-title" className="mb-6 scroll-mt-24 rounded-2xl border bg-card p-4 sm:p-6">
    <div className="mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" aria-hidden="true" /><h2 id="study-languages-title" className="text-lg font-semibold">Study languages</h2></div>
    <p className="mb-4 text-sm text-muted-foreground">English includes IELTS; German includes everyday and visa-language preparation. Availability depends on reviewed content.</p>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {launchStudyLanguages.map(item => {
        const detail = <><MascotAvatar mascot={getMascot(item.subject)} decorative className="h-12 w-12" /><div className="min-w-0 flex-1"><p className="font-semibold">{item.name}</p><p dir="auto" className="break-words text-xs text-muted-foreground">{item.native}</p><p className="mt-1 text-xs text-muted-foreground">{item.available ? "Study resources" : "Content in preparation"}</p></div>{item.available && <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}</>;
        return item.available ? <Link key={item.id} to={"/qa-clinic?subject=" + item.subject} className="flex min-h-16 items-center gap-3 rounded-xl border p-3 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring">{detail}</Link>
          : <div key={item.id} className="flex min-h-16 items-center gap-3 rounded-xl border bg-muted/20 p-3">{detail}</div>;
      })}
    </div>
  </section>;
}
