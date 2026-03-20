import { motion } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getSquadMembers, getCoachStem } from "@/lib/mascots";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lightbulb, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import stemsquadImg from "@/assets/stemsquad-hero.png";

export default function MeetTheSquad() {
  useDocumentTitle("Meet the STEM Squad");
  const navigate = useNavigate();
  const members = getSquadMembers();
  const coach = getCoachStem();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <PageTransition>
        <main className="container mx-auto max-w-5xl px-4 py-8 md:py-14">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-[hsl(258,60%,52%)] px-6 py-10 text-center text-primary-foreground md:px-12 md:py-16"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative z-10">
              <h1 className="mb-3 text-3xl font-extrabold tracking-tight md:text-5xl">
                Meet the STEM Squad
              </h1>
              <p className="mx-auto max-w-2xl text-sm opacity-80 md:text-base">
                Your team of expert mascots, each specialising in a different subject.
                They'll guide you, motivate you, and celebrate every milestone with you!
              </p>
              <div className="mt-8 flex justify-center">
                <img
                  src={stemsquadImg}
                  alt="The full STEM Squad team"
                  className="max-h-32 w-auto md:max-h-48"
                />
              </div>
            </div>
          </motion.div>

          {/* Coach Stem - Leader card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-6 md:p-8"
          >
            <div className="flex flex-col items-center gap-5 md:flex-row md:items-start">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 shadow-lg md:h-28 md:w-28">
                <img src={coach.image} alt={coach.name} className="h-full w-full object-cover" />
              </div>
              <div className="text-center md:text-left">
                <div className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">Squad Leader · {coach.personality}</div>
                <h2 className="mb-2 text-2xl font-extrabold">{coach.name} {coach.emoji}</h2>
                <p className="mb-2 text-sm italic text-primary/80">"{coach.catchphrase}"</p>
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  {coach.traits.map(t => (
                    <span key={t} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">{t}</span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{coach.bio}</p>
              </div>
            </div>
          </motion.div>

          {/* Squad Members Grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {members.filter(m => m.name !== "Lexi" || m.subjectId === "ielts").map((member, i) => (
              <motion.div
                key={member.subjectId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                className="group overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/20"
              >
                <div className="flex items-center gap-4 p-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 shadow-md">
                    <img src={member.image} alt={member.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold">{member.name} {member.emoji}</h3>
                    <p className="text-xs font-medium text-primary/70">{member.personality}</p>
                  </div>
                </div>
                <div className="border-t border-border/30 px-5 py-4">
                  <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{member.bio}</p>

                  {/* Top tip */}
                  <div className="mb-3 flex items-start gap-2 rounded-xl bg-primary/5 px-3 py-2.5">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <p className="text-[11px] font-medium text-primary">{member.tips[0]}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MessageCircle className="h-3 w-3" />
                    <span className="italic">"{member.cheerMessage}"</span>
                  </div>
                </div>
                <div className="border-t border-border/30 p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={() => navigate(`/practice/${member.subjectId}`)}
                  >
                    Study with {member.name} <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}
