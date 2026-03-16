import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Trophy, Users, Sparkles } from "lucide-react";
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.06),transparent_60%)]" />
      <div className="container relative mx-auto px-4 pt-20 pb-12 md:pt-28 md:pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" /> Virtual Tuition Centre
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Master STEM exams through{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                deliberate practice
              </span>
            </h1>
            <p className="mb-8 max-w-xl text-lg text-muted-foreground">
              A private tutor in your pocket. 1,000,000+ exam-style questions with step-by-step
              solutions, AI coaching, and real exam simulations across GCSE, A-Level, IB, FSC, CBSE & more.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="gap-2 rounded-xl px-8 text-base" onClick={() => navigate("/subjects")}>
                Start Practising <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="gap-2 rounded-xl px-8 text-base" onClick={() => navigate("/pricing")}>
                View Plans
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="mx-auto mb-1.5 h-5 w-5 text-primary/60" />
                  <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.2, 0, 0, 1] }}
            className="hidden lg:block"
          >
            <img
              src={heroImg}
              alt="Students studying STEM subjects together with equations and molecules"
              className="w-full rounded-2xl"
              loading="eager"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
