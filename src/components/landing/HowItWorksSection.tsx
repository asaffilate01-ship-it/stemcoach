import { motion } from "framer-motion";
import { UserPlus, BookOpen, Trophy, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Your Account",
    description: "Sign up in seconds. Choose your curriculum, subjects, and exam board — we personalise everything for you.",
  },
  {
    icon: BookOpen,
    step: "02",
    title: "Practise & Learn",
    description: "Work through exam-style questions with instant feedback, worked solutions, and AI coaching when you get stuck.",
  },
  {
    icon: Trophy,
    step: "03",
    title: "Ace Your Exams",
    description: "Track progress, earn badges, take mock exams, and build confidence. Your grades will thank you.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="relative border-t py-20 md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.04),transparent_60%)]" />
      <div className="container relative mx-auto px-4">
        <div className="mb-16 text-center">
          <div className="stem-label mb-3">How It Works</div>
          <h2 className="stem-section-heading">
            Three steps to <span className="stem-gradient-text">exam success</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            No complicated setup. No textbooks. Just focused practice that actually works.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative text-center"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute right-0 top-14 hidden h-px w-[calc(100%-3rem)] translate-x-1/2 bg-gradient-to-r from-primary/20 to-primary/5 md:block">
                  <ArrowRight className="absolute -right-1.5 -top-1.5 h-3 w-3 text-primary/30" />
                </div>
              )}

              <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5" />
                <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-lg shadow-primary/30">
                  {step.step}
                </div>
                <step.icon className="relative h-8 w-8 text-primary" />
              </div>

              <h3 className="mb-3 text-lg font-bold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
