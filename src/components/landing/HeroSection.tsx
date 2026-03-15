import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const stats = [
  { label: "Questions", value: "100K+", icon: BookOpen },
  { label: "Curricula", value: "7+", icon: Users },
  { label: "Pass Rate", value: "94%", icon: Trophy },
];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(221_83%_53%/0.08),transparent_60%)]" />
      <div className="container relative mx-auto px-4 pt-24 pb-16 md:pt-32 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="stem-label mb-4 inline-block rounded-full border px-4 py-1.5">
            Virtual Tuition Centre
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
            Master STEM exams through{" "}
            <span className="stem-gradient-text">deliberate practice</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            A private tutor in your pocket. 100,000+ exam-style questions with step-by-step solutions,
            tuition tips, and adaptive coaching across GCSE, A-Level, IB, FSC, and more.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="gap-2 rounded px-8"
              onClick={() => navigate("/subjects")}
            >
              Start Practising <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 rounded px-8"
              onClick={() => navigate("/dashboard")}
            >
              View Dashboard
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.2, 0, 0, 1] }}
          className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-6"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="stem-card rounded-xl p-4 text-center">
              <stat.icon className="mx-auto mb-2 h-5 w-5 text-primary" />
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <div className="stem-label mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
