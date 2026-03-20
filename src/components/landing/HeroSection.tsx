import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Trophy, Users, Sparkles, Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroImg from "@/assets/hero-stemsquad.png";
import stemsquadImg from "@/assets/stemsquad.png";

const stats = [
  { label: "Questions", value: "2M+", icon: BookOpen },
  { label: "Curricula", value: "30+", icon: Users },
  { label: "Pass Rate", value: "94%", icon: Trophy },
];

const highlights = [
  "Step-by-step worked solutions",
  "STEMcoach coaching when you're stuck",
  "Real exam simulations",
];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      {/* Layered premium background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.10),transparent)]" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_100%_0%,hsl(258_60%_52%/0.05),transparent)]" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-[radial-gradient(ellipse_at_0%_100%,hsl(var(--primary)/0.04),transparent)]" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Floating orbs */}
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-[15%] h-48 w-48 rounded-full bg-primary/[0.04] blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 15, 0], x: [0, -15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-20 right-[10%] h-64 w-64 rounded-full bg-[hsl(258_60%_52%/0.03)] blur-3xl"
      />

      <div className="container relative mx-auto px-4 pt-20 pb-12 md:pt-28 md:pb-20 lg:pt-36 lg:pb-28">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.04] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-primary backdrop-blur-sm"
            >
              <img src="/assets/coach-stem.png" alt="Coach Stem" className="h-5 w-5 rounded-full object-cover" /> Virtual Tuition Centre
            </motion.div>
            <h1 className="mb-6 text-[2rem] font-extrabold tracking-tight leading-[1.12] sm:text-4xl md:text-5xl lg:text-[3.5rem]">
              Master your exams{" "}
              <br className="hidden md:block" />
              through{" "}
              <span className="stem-gradient-text">
                deliberate practice
              </span>
            </h1>
            <p className="mb-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-[1.125rem]">
              A private tutor in your pocket. 1,000,000+ exam-style questions with step-by-step
              solutions, STEMcoach coaching, and real exam simulations across GCSE, A-Level, IB, FSC, CBSE & more.
            </p>

            {/* Highlights */}
            <div className="mb-8 flex flex-col gap-2.5 sm:flex-row sm:gap-6">
              {highlights.map((h, i) => (
                <motion.div
                  key={h}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  <span>{h}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="premium"
                size="lg"
                className="gap-2 px-8"
                onClick={() => navigate("/subjects")}
              >
                Start Practising <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 px-8"
                onClick={() => navigate("/pricing")}
              >
                <Play className="h-4 w-4" /> View Plans
              </Button>
            </div>

            <div className="mt-12 flex items-center gap-8 border-t border-border/40 pt-8 sm:gap-10">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="group text-center"
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <stat.icon className="h-4 w-4 text-primary/50 transition-colors group-hover:text-primary" />
                    <span className="text-xl font-extrabold tracking-tight sm:text-2xl">{stat.value}</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px]">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/8 via-transparent to-[hsl(258_60%_52%/0.06)] blur-3xl" />
              <img
                src={heroImg}
                alt="Students studying STEM subjects together with equations and molecules"
                className="relative w-full rounded-2xl shadow-2xl shadow-primary/10 ring-1 ring-border/30"
                loading="eager"
              />
              {/* Floating Squad strip */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-5 left-1/2 -translate-x-1/2 hidden rounded-2xl bg-card/95 backdrop-blur-sm px-5 py-3 shadow-premium-lg ring-1 ring-border/30 md:flex items-center gap-4"
              >
                <img src={stemsquadImg} alt="STEM Squad" className="h-9 w-auto" />
                <div>
                  <div className="text-xs font-bold">Meet the STEM Squad</div>
                  <div className="text-[10px] text-muted-foreground">Your personal tutoring team</div>
                </div>
              </motion.div>

              {/* Floating badge top-right */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute -top-3 -right-3 hidden rounded-xl bg-card px-3 py-2.5 shadow-premium-lg ring-1 ring-border/30 md:flex items-center gap-2.5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-bold">1M+ Questions</div>
                  <div className="text-[10px] text-muted-foreground">All subjects</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
