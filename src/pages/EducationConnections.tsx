import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Building2, Download, CalendarDays, RotateCcw, Target, Users } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/integrations/supabase/client";
import {
  revisionPriorities, safeLearnerProgressDigest,
  type MasteryEvidence,
} from "@/lib/educationBridge";
import {buildRevisionWeek} from "@/lib/revisionWeek";

type InstitutionMembership = {
  tenant_id: string;
  status: string;
  role: string;
  tenants: { name?: string; slug?: string } | { name?: string; slug?: string }[] | null;
};

export default function EducationConnections() {
  useDocumentTitle("School & Tuition Connections");
  const { user } = useAuth();
  const [membership, setMembership] = useState<InstitutionMembership[]>([]);
  const [mastery, setMastery] = useState<MasteryEvidence[]>([]);
  const [partnerCourses, setPartnerCourses] = useState<{source_product:string;institution_name:string;curriculum:string;subject:string;valid_until:string}[]>([]);
  const [partnerState, setPartnerState] = useState<"loading"|"ready"|"unavailable">("loading");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const load = async () => {
      try {
        // Both queries are authorised on the signed-in STEMCoach account only.
        // No SchoolDash/UniPathway API or credentials are contacted from the browser.
        const [members, progress] = await Promise.all([
          supabase.from("tenant_members")
            .select("tenant_id, role, status, tenants(name,slug)")
            .eq("user_id", user.id).limit(30),
          (supabase.rpc as any)("get_learner_mastery_dashboard", { _curriculum: null }),
        ]);
        if (members.error) throw members.error;
        if (progress.error) throw progress.error;
        if (!cancelled) {
          setMembership((members.data || []) as unknown as InstitutionMembership[]);
          setMastery((progress.data || []) as MasteryEvidence[]);
          // Optional staged bridge migration. Missing RPC fails closed without
          // breaking personal revision or exposing any third-party learner data.
          setPartnerState("loading");
          setPartnerCourses([]);
          void (supabase.rpc as any)("get_my_partner_course_preview")
            .then(({data,error}: {data:unknown;error:unknown})=>{
              if (cancelled) return;
              if(error || !Array.isArray(data)){setPartnerState("unavailable");return;}
              setPartnerCourses(data);
              setPartnerState("ready");
            })
            .catch(()=>{if(!cancelled)setPartnerState("unavailable");});
        }
      } catch {
        if (!cancelled) setError("Your institution or learning records could not be loaded. Please retry.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [user?.id, reload]);

  const priorities = useMemo(() => revisionPriorities(mastery, new Date()), [mastery]);
  const digest = useMemo(() => safeLearnerProgressDigest(mastery, new Date()), [mastery]);
  const revisionWeek = useMemo(() => buildRevisionWeek(mastery, new Date()), [mastery]);
  const downloadOwnSummary = () => {
    // This local export is not an institution submission. The user chooses
    // whether to disclose it outside STEMCoach.
    const data = JSON.stringify(digest, null, 2);
    const href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = href;
    a.download = "stemcoach-my-learning-summary.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-7">
          <div className="stem-label mb-2">Education partnerships · Phase 1</div>
          <h1 className="stem-heading text-3xl">School & Tuition Connections</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Connect with an approved school or tuition centre, then follow your own
            STEMCoach revision priorities. SchoolDash and UniPathway remain separate
            services: there is no automatic sign-in, access grant or progress transfer yet.
          </p>
        </div>

        {loading && <p role="status" className="py-6 text-sm text-muted-foreground">Loading your learning records…</p>}
        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-destructive/30 p-4">
            <p className="mb-3 text-sm">{error}</p>
            <Button onClick={() => setReload((v) => v + 1)} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" /> Retry
            </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="stem-card mb-6 rounded-2xl p-5">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold"><Building2 className="h-5 w-5 text-primary" /> My institutions</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                A code or visit from another platform never approves school membership.
                Only your STEMCoach institution administrator can approve a request.
              </p>
              {membership.length ? (
                <ul className="mb-4 space-y-2">
                  {membership.map((member) => {
                    const tenant = Array.isArray(member.tenants) ? member.tenants[0] : member.tenants;
                    return (
                      <li key={member.tenant_id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm">
                        <span className="font-medium">{tenant?.name || "Institution"}</span>
                        <span className="text-xs text-muted-foreground">{member.role} · {member.status}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mb-4 text-sm text-muted-foreground">No institution membership has been found for this account.</p>
              )}
              <Button asChild variant="outline" className="gap-2">
                <Link to="/join-institution"><Users className="h-4 w-4" /> Request institution access</Link>
              </Button>
            </section>

            <section className="stem-card mb-6 rounded-2xl p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold"><Target className="h-5 w-5 text-primary" /> Your revision focus</h2>
                  <p className="text-xs text-muted-foreground">Calculated from your own saved mastery records, not generated grades.</p>
                </div>
                <Button asChild size="sm" variant="outline"><Link to="/mastery">View mastery dashboard</Link></Button>
              </div>
              {priorities.length ? (
                <ul className="grid gap-2 md:grid-cols-2">
                  {priorities.map((p) => (
                    <li key={p.subject + ":" + p.topic} className="rounded-xl border border-border p-3">
                      <div className="text-sm font-semibold">{p.subject} · {p.topic}</div>
                      <p className="my-1 text-xs text-muted-foreground">
                        {p.mastery}% mastery · {p.attempts} attempts · {p.due ? "Due for review" : "Focus practice"}
                      </p>
                      <Link className="text-sm font-medium text-primary hover:underline" to={p.practicePath}>
                        Practise this subject →
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-start gap-3">
                  <p className="text-sm text-muted-foreground">Complete a diagnostic or practice session to start a personalised revision plan.</p>
                  <Button asChild><Link to="/subjects"><BookOpen className="mr-2 h-4 w-4" /> Browse subjects</Link></Button>
                </div>
              )}
            </section>

            <section className="stem-card mb-6 rounded-2xl p-5">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold"><CalendarDays className="h-5 w-5 text-primary" /> Your 7-day study plan</h2>
              <p className="mb-4 text-sm text-muted-foreground">Suggested revision from your own recorded progress. This is not official assigned homework or a completed attendance record.</p>
              {revisionWeek.totalTopics === 0 ? (
                <p className="text-sm text-muted-foreground">Practise a topic to generate your first weekly plan.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {revisionWeek.dates.map(day => (
                    <div key={day.date} className="rounded-xl border border-border p-3">
                      <h3 className="text-sm font-semibold">{new Date(day.date+"T12:00:00Z").toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"})}</h3>
                      <p className="mb-2 text-xs text-muted-foreground">{day.tasks.length ? day.tasks.length+" suggested tasks · about "+day.minutes+" min" : "Open study day"}</p>
                      {day.tasks.map(task => (
                        <div key={task.id} className="mb-2 text-sm">
                          <Link className="font-medium text-primary hover:underline" to={task.practicePath}>{task.subject}: {task.topic}</Link>
                          <p className="text-xs text-muted-foreground">{task.reason === "follow-up" ? "Spaced repeat" : task.reason === "due" ? "Due for review" : "Build confidence"}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">The plan recalculates from your saved progress and is not sent to a school or AI provider.</p>
            </section>

            <section className="stem-card mb-6 rounded-2xl p-5">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold"><Building2 className="h-5 w-5 text-primary" /> Verified partner course mappings</h2>
              <p className="mb-3 text-sm text-muted-foreground">Course mapping alone does not grant STEMCoach subscription access. Every school, learner and curriculum mapping must first pass an independent operator check.</p>
              {partnerState === "loading" ? (
                <p role="status" className="text-sm text-muted-foreground">Checking mapped courses…</p>
              ) : partnerState === "unavailable" ? (
                <p className="text-sm text-muted-foreground">Partner mapping is not yet enabled on this backend. Personal STEMCoach learning remains available.</p>
              ) : partnerCourses.length ? (
                <ul className="space-y-2">{partnerCourses.map((course,index) => (
                  <li key={course.source_product+":"+course.subject+":"+index} className="rounded-xl border border-border p-3 text-sm">
                    <span className="font-medium">{course.institution_name} · {course.subject}</span>
                    <p className="text-xs text-muted-foreground">{course.source_product} · {course.curriculum} · Reviewed mapping; subscription activation separate</p>
                  </li>
                ))}</ul>
              ) : (
                <p className="text-sm text-muted-foreground">No verified and current partner-course mapping found for this account.</p>
              )}
            </section>

            <section className="stem-card rounded-2xl p-5">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold"><Download className="h-5 w-5 text-primary" /> My private progress summary</h2>
              <p className="mb-3 text-sm text-muted-foreground">
                {digest.topicsReviewed} topics across {digest.subjects.length} subject and curriculum combinations.
                The downloadable summary contains only subject-level learning counts and averages.
                It excludes your name, account ID, school, exact topic names, conversations and answers.
              </p>
              <Button onClick={downloadOwnSummary} disabled={digest.subjects.length === 0} className="gap-2">
                <Download className="h-4 w-4" /> Download my summary
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                Downloading does not send it to SchoolDash, UniPathway or Omniqora.
                Automatic progress sharing requires a separately verified connection and consent.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
