import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Trophy, Users, Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroImg from "@/assets/hero-students.png";

const stats = [
  { label: "Questions", value: "1M+", icon: BookOpen },
  { label: "Curricula", value: "30+", icon: Users },
  { label: "Pass Rate", value: "94%", icon: Trophy },
];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.12),transparent)]" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_100%_0%,hsl(260_65%_58%/0.06),transparent)]" />
      
      <div className="container relative mx-auto px-4 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Virtual Tuition Centre
            </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
              Master STEM exams{" "}
              <br className="hidden md:block" />
              through{" "}
              <span className="stem-gradient-text">
                deliberate practice
              </span>
            </h1>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
              A private tutor in your pocket. 1,000,000+ exam-style questions with step-by-step
              solutions, AI coaching, and real exam simulations across GCSE, A-Level, IB, FSC, CBSE & more.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="gap-2 rounded-xl px-8 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
                onClick={() => navigate("/subjects")}
              >
                Start Practising <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 rounded-xl px-8 text-base"
                onClick={() => navigate("/pricing")}
              >
                <Play className="h-4 w-4" /> View Plans
              </Button>
            </div>

            <div className="mt-12 flex items-center gap-8 border-t border-border/50 pt-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <stat.icon className="h-4 w-4 text-primary/60" />
                    <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
                  </div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 blur-2xl" />
              <img
                src={heroImg}
                alt="Students studying STEM subjects together with equations and molecules"
                className="relative w-full rounded-2xl shadow-2xl shadow-primary/10 ring-1 ring-border/50"
                loading="eager"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
