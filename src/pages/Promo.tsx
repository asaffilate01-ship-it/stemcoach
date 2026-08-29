import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { openCookieSettings } from "@/lib/cookieConsent";
import {
  ArrowRight, Lock, BookOpen, Brain, Trophy, BarChart3, Users, GraduationCap,
  CalendarDays, Layers, Bot, ShieldCheck, Smartphone, Globe, Sparkles, CheckCircle2,
  Building2, Bell, CreditCard, Menu, Home, LayoutGrid, Images, HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Icon3D, type Icon3DVariant } from "@/components/ui/icon-3d";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { unlockPreview } from "@/lib/promoAccess";
import promoHero from "@/assets/promo-hero.jpg";
import promoMobile from "@/assets/promo-mobile-app.jpg";
import dashboardPreview from "@/assets/dashboard-preview.png";
import tutorPreview from "@/assets/ai-tutor-preview.png";

type Feature = { icon: typeof BookOpen; variant: Icon3DVariant; title: string; description: string };

const featureGroups: { label: string; items: Feature[] }[] = [
  {
    label: "Learn",
    items: [
      { icon: BookOpen, variant: "primary", title: "Reviewed practice questions", description: "Published questions pass structural checks and human review; draft AI content stays out of student practice." },
      { icon: Bot, variant: "purple", title: "STEMCoaching, not answers", description: "Every question comes with tutor-style feedback, distractor reasoning and a worked solution — cached so learning stays instant and affordable." },
      { icon: Layers, variant: "accent", title: "Spaced-repetition flashcards", description: "Missed questions automatically convert into SM-2 scheduled flashcards so weak topics resurface at the perfect moment." },
      { icon: Brain, variant: "warning", title: "Adaptive weak-topic drills", description: "Drop below 60% accuracy in a topic and STEMCoach builds a targeted drill to close the gap." },
    ],
  },
  {
    label: "Assess",
    items: [
      { icon: GraduationCap, variant: "success", title: "Secure mock exams", description: "Timed papers graded entirely server-side — answers never reach the browser before submission." },
      { icon: CalendarDays, variant: "primary", title: "Daily challenge", description: "A fresh ten-question set every day with a live leaderboard, streaks and bonus XP." },
      { icon: BarChart3, variant: "accent", title: "Deep analytics", description: "Accuracy rings, subject radars and topic breakdowns that show exactly where the next mark comes from." },
      { icon: Trophy, variant: "warning", title: "XP, badges & certificates", description: "Levels, streak bars and shareable certificates keep learners coming back without nagging." },
    ],
  },
  {
    label: "Scale",
    items: [
      { icon: Users, variant: "purple", title: "Parent & teacher portals", description: "Approved parent links, class rosters and progress reports for every stakeholder around the learner." },
      { icon: Building2, variant: "primary", title: "White-label for schools", description: "Multi-tenant branding, seat tiers and institution admin — your logo, your colours, our engine." },
      { icon: Globe, variant: "success", title: "Global curricula, 3 languages", description: "Country, level, exam board and difficulty filters, with the interface localised in English, French and German." },
      { icon: CreditCard, variant: "accent", title: "Localised pay-as-you-go", description: "No subscriptions. Region-aware pricing in GBP, USD, EUR and PHP with server-verified purchases." },
    ],
  },
];

const platformPoints = [
  { icon: Smartphone, variant: "primary" as Icon3DVariant, title: "Installable PWA + native shells", description: "Offline-first caching, home-screen install and Capacitor builds ready for the App Store and Play Store." },
  { icon: ShieldCheck, variant: "success" as Icon3DVariant, title: "Security-first backend", description: "Row-level security, ownership-checked database functions and server-side grading throughout." },
  { icon: Bell, variant: "warning" as Icon3DVariant, title: "Scheduled coaching nudges", description: "Daily mascot notifications and streak reminders driven by protected scheduled jobs." },
];

const stats = [
  { value: "170K+", label: "Questions live" },
  { value: "Global", label: "Curricula" },
  { value: "14", label: "Coach mascots" },
  { value: "Full", label: "Study workflow" },
];

const faqs = [
  { q: "What exactly is STEMCoach?", a: "A virtual tuition centre. Learners use reviewed, exam-style practice with a squad of subject coaches that explain the thinking behind each answer — not just whether it was right." },
  { q: "Is this a subscription?", a: "No. STEMCoach is pay-as-you-go with regionally priced question and exam packs, so families only pay for what they actually use." },
  { q: "Which subjects and curricula are covered?", a: "The platform maps practice to global qualification frameworks by country, level and exam board. Availability is based on the reviewed questions currently published for each subject." },
  { q: "How do parents and teachers fit in?", a: "Parents request a link that the student approves, then see progress reports and streaks. Teachers get class rosters, assignments and cohort analytics; institutions get a white-label admin portal." },
  { q: "Does it work on phones and offline?", a: "Yes. It installs as a PWA with offline caching, uses a native-style bottom navigation on mobile, and ships as Capacitor iOS and Android builds." },
  { q: "How is learner data protected?", a: "Every table is behind row-level security, sensitive lookups run through ownership-checked functions, grading happens server-side, and GDPR export plus right-to-erasure flows are built in." },
  { q: "Can we brand it for our school?", a: "Yes — multi-tenant white-label branding applies your logo and palette across the whole product, with seat tiers per institution." },
  { q: "Why is the product behind a password?", a: "This page is a promo preview while we finish content coverage. Enter the access code shared with you to explore the full platform." },
];

const sections = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "features", label: "Features", icon: LayoutGrid },
  { id: "screens", label: "Screens", icon: Images },
  { id: "faq", label: "FAQ", icon: HelpCircle },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Promo() {
  useDocumentTitle("STEMCoach — The virtual tuition centre for exam success");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    if (unlockPreview(code)) {
      toast({ title: "Preview unlocked", description: "Welcome to STEMCoach." });
      navigate("/home");
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/20 bg-background/80 backdrop-blur-2xl backdrop-saturate-150">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <button onClick={() => scrollToId("overview")} className="flex items-center gap-2.5">
            <img src="/assets/coach-stem.png" alt="STEMCoach" className="h-9 w-9 rounded-xl object-cover ring-1 ring-border/30" />
            <div className="text-left leading-none">
              <div className="text-base font-extrabold tracking-tight">STEM<span className="stem-gradient-text">coach</span></div>
              <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Virtual tuition centre</div>
            </div>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollToId(s.id)}
                className="rounded-lg px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="premium" size="sm" className="gap-2" onClick={() => setOpen(true)}>
              <Lock className="h-3.5 w-3.5" /> Enter preview
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="mt-8 flex flex-col gap-1">
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => scrollToId(s.id)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                    >
                      <Icon3D icon={s.icon} variant="primary" size="sm" /> {s.label}
                    </button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="pb-24 lg:pb-0">
        {/* Hero */}
        <section id="overview" className="relative overflow-hidden scroll-mt-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]" />
          <div className="container relative mx-auto grid items-center gap-10 px-4 pt-14 pb-12 md:pt-20 lg:grid-cols-2 lg:gap-16 lg:pb-20">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.05] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Private preview
              </div>
              <h1 className="mb-6 text-[2rem] font-extrabold leading-[1.12] tracking-tight sm:text-4xl lg:text-[3.25rem]">
                An entire tuition centre,{" "}
                <span className="stem-gradient-text">packaged as software</span>
              </h1>
              <p className="mb-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                STEMCoach turns exam preparation into deliberate practice: reviewed, curriculum-mapped
                questions, 14 subject coaches, secure mock exams, adaptive drills and portals for
                students, parents, teachers and whole institutions.
              </p>
              <div className="mb-8 flex flex-col gap-2.5 sm:flex-row sm:gap-6">
                {["Pay-as-you-go", "PWA + native apps", "White-label ready"].map((h) => (
                  <div key={h} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> {h}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="premium" size="lg" className="gap-2 px-8" onClick={() => setOpen(true)}>
                  <Lock className="h-4 w-4" /> Enter with access code
                </Button>
                <Button variant="outline" size="lg" className="gap-2 px-8" onClick={() => scrollToId("features")}>
                  Explore the platform <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-12 grid grid-cols-2 gap-6 border-t border-border/40 pt-8 sm:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label}>
                    <div className="text-xl font-extrabold tracking-tight sm:text-2xl">{s.value}</div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="relative mx-auto w-full max-w-xl"
            >
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/15 via-transparent to-[hsl(258_60%_52%/0.12)] blur-3xl" />
              <img
                src={promoHero}
                alt="STEMCoach learning platform interface"
                width={1536}
                height={1024}
                className="relative w-full rounded-2xl shadow-2xl shadow-primary/15 ring-1 ring-border/30"
              />
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="relative scroll-mt-16 border-t border-border/30 py-14">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <div className="stem-label mb-3">What's inside</div>
              <h2 className="stem-section-heading">Everything a tuition centre does, <span className="stem-gradient-text">automated</span></h2>
            </div>

            <div className="space-y-12">
              {featureGroups.map((group, gi) => (
                <div key={group.label}>
                  <div className="mb-5 flex items-center gap-3">
                    <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em]">{group.label}</Badge>
                    <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {group.items.map((f, i) => (
                      <motion.div
                        key={f.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45, delay: (gi * 0.02) + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                        className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-premium-lg"
                      >
                        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/[0.07] blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-0" />
                        <Icon3D icon={f.icon} variant={f.variant} size="md" />
                        <h3 className="mb-2 mt-4 text-base font-bold">{f.title}</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {platformPoints.map((p) => (
                <div key={p.title} className="flex gap-4 rounded-2xl border border-border/40 bg-gradient-to-br from-card/80 to-card/40 p-6 backdrop-blur-xl">
                  <Icon3D icon={p.icon} variant={p.variant} size="md" />
                  <div>
                    <h3 className="mb-1.5 text-sm font-bold">{p.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Screens */}
        <section id="screens" className="relative scroll-mt-16 border-t border-border/30 py-14">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.05),transparent_60%)]" />
          <div className="container relative mx-auto px-4">
            <div className="mb-12 text-center">
              <div className="stem-label mb-3">Inside the product</div>
              <h2 className="stem-section-heading">Web platform and <span className="stem-gradient-text">mobile app</span></h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">The same experience across desktop, installable PWA and native builds.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <motion.figure
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="lg:col-span-2 overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-3 backdrop-blur-xl shadow-premium-lg"
              >
                <img src={dashboardPreview} alt="STEMCoach student dashboard on desktop" loading="lazy" className="w-full rounded-xl ring-1 ring-border/20" />
                <figcaption className="px-2 py-3 text-sm font-semibold">Student dashboard — streaks, XP, accuracy and next best action</figcaption>
              </motion.figure>

              <motion.figure
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
                className="overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-3 backdrop-blur-xl shadow-premium-lg"
              >
                <img src={promoMobile} alt="STEMCoach mobile app on a smartphone" loading="lazy" width={1024} height={1024} className="w-full rounded-xl ring-1 ring-border/20" />
                <figcaption className="px-2 py-3 text-sm font-semibold">Mobile app — native bottom navigation, offline ready</figcaption>
              </motion.figure>

              <motion.figure
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.12 }}
                className="lg:col-span-3 overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-3 backdrop-blur-xl shadow-premium-lg"
              >
                <img src={tutorPreview} alt="STEMCoaching session explaining a question" loading="lazy" className="w-full rounded-xl ring-1 ring-border/20" />
                <figcaption className="px-2 py-3 text-sm font-semibold">STEMCoaching clinic — hints, distractor reasoning and worked solutions</figcaption>
              </motion.figure>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="relative scroll-mt-16 border-t border-border/30 py-14">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <div className="stem-label mb-3">FAQ</div>
              <h2 className="stem-section-heading">What STEMCoach <span className="stem-gradient-text">offers</span></h2>
            </div>
            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((f, i) => (
                  <AccordionItem key={i} value={`f-${i}`} className="overflow-hidden rounded-xl border border-border/40 bg-card/60 px-6 backdrop-blur-xl">
                    <AccordionTrigger className="py-5 text-left text-sm font-semibold hover:no-underline sm:text-base">{f.q}</AccordionTrigger>
                    <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                      <div className="flex items-start gap-3">
                        <img src="/assets/coach-stem.png" alt="" className="mt-0.5 h-6 w-6 shrink-0 rounded-full object-cover" />
                        <span>{f.a}</span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/30 py-14">
          <div className="container mx-auto px-4">
            <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/60 to-[hsl(258_60%_52%/0.10)] p-10 text-center backdrop-blur-xl">
              <h2 className="mb-4 text-2xl font-extrabold tracking-tight sm:text-3xl">Have an access code?</h2>
              <p className="mx-auto mb-8 max-w-lg text-muted-foreground">
                The full platform — dashboards, practice, mock exams, analytics and portals — is one code away.
              </p>
              <Button variant="premium" size="lg" className="gap-2 px-8" onClick={() => setOpen(true)}>
                <Lock className="h-4 w-4" /> Unlock the preview
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/30 py-10">
          <div className="container mx-auto flex flex-col items-center gap-3 px-4 text-center">
            <img src="/assets/coach-stem.png" alt="" className="h-10 w-10 rounded-xl object-cover ring-1 ring-border/30" />
            <p className="text-sm font-semibold">STEMCoach</p>
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
              <Link to="/cookies" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cookie Policy</Link>
              <button
                type="button"
                onClick={openCookieSettings}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cookie settings
              </button>
              <a href="mailto:support@stemcoach.app" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            </nav>
            <p className="text-xs text-muted-foreground">
              STEMCoach is a trading name of iTechLounge Ltd
            </p>
            <p className="text-xs text-muted-foreground/70">
              © {new Date().getFullYear()} iTechLounge Ltd. All rights reserved.
            </p>
          </div>
        </footer>
      </main>

      {/* Native-style mobile bottom nav */}
      <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-border/15 bg-background/85 backdrop-blur-2xl backdrop-saturate-150 lg:hidden">
        <div className="flex items-center justify-around px-2 py-1.5">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollToId(s.id)}
              className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-semibold text-muted-foreground transition-all active:scale-95"
            >
              <Icon3D icon={s.icon} variant="primary" size="sm" />
              {s.label}
            </button>
          ))}
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-bold text-primary transition-all active:scale-95"
          >
            <Icon3D icon={Lock} variant="warning" size="sm" />
            Enter
          </button>
        </div>
      </nav>

      {/* Access dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Preview access</DialogTitle>
            <DialogDescription>
              STEMCoach is in private preview. Enter the access code you were given to open the full platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              autoFocus
              value={code}
              placeholder="Access code"
              onChange={(e) => { setCode(e.target.value); setError(false); }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              aria-invalid={error}
            />
            {error && <p className="text-sm text-destructive">That code isn't recognised. Please check and try again.</p>}
          </div>
          <DialogFooter>
            <Button variant="premium" className="w-full gap-2" onClick={submit}>
              Unlock <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
