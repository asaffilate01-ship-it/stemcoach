import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpen, CalendarClock, Bookmark, CircleHelp, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { qaEntries } from "@/data/qaClinic";
import { isLaunchSubject } from "@/lib/launchDiscovery";
import { qaStorageKeys, qaReviewPath, type ReviewFocus } from "@/lib/qaReviewFocus";
import { readRevisionOverview } from "@/lib/revisionOverview";

const entries = qaEntries.filter(entry => isLaunchSubject(entry.subject));
const cards = [
  { focus: "due", Icon: CalendarClock },
  { focus: "missed", Icon: Target },
  { focus: "saved", Icon: Bookmark },
  { focus: "new", Icon: CircleHelp },
] as const;

/** Keep the account-scoped view independent of the graded dashboard data. */
export function RevisionOverview({ accountId }: { accountId: string }) {
  return <ScopedRevisionOverview key={accountId} accountId={accountId} />;
}

function ScopedRevisionOverview({ accountId }: { accountId: string }) {
  const { t } = useTranslation();
  const read = () => readRevisionOverview(entries, accountId, key => localStorage.getItem(key), Date.now());
  const [overview, setOverview] = useState(read);

  useEffect(() => {
    const keys = qaStorageKeys(accountId);
    const refresh = () => setOverview(readRevisionOverview(entries, accountId, key => localStorage.getItem(key), Date.now()));
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === keys.history || event.key === keys.bookmarks) refresh();
    };
    refresh();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.clearInterval(timer);
    };
  }, [accountId]);

  const recommended: ReviewFocus = overview?.counts.due ? "due" : overview?.counts.new ? "new" : "all";

  return (
    <section aria-labelledby="dashboard-revision-title" className="stem-card mb-5 min-w-0 rounded-2xl p-4 sm:p-6 md:mb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="dashboard-revision-title" className="flex items-center gap-2 text-lg font-semibold"><BookOpen className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />{t("qa.reviewTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{overview ? t("qa.reviewStats", { practiced: overview.practiced, total: overview.counts.all, due: overview.counts.due }) : t("common.error")}</p>
        </div>
        <Button asChild className="min-h-11 gap-2 rounded-xl">
          <Link to={qaReviewPath(recommended)}>{t("qa.explore")}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link>
        </Button>
      </div>
      {overview ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {cards.map(({ focus, Icon }) => (
            <Link key={focus} to={qaReviewPath(focus)} className="group flex min-h-24 min-w-0 flex-col justify-between gap-2 rounded-xl border bg-muted/20 p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex items-center justify-between gap-2"><Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /><ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" /></div>
              <span className="text-xl font-bold tabular-nums">{overview.counts[focus]}</span>
              <span className="break-words text-xs font-medium text-muted-foreground sm:text-sm">{t(`qa.reviewFilters.${focus}`)}</span>
            </Link>
          ))}
        </div>
      ) : <Button type="button" variant="outline" className="mt-3 min-h-11" onClick={() => setOverview(read())}>{t("common.retry")}</Button>}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("qa.privateHistoryNotice")}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("qa.scopedHistoryNotice")}</p>
    </section>
  );
}
