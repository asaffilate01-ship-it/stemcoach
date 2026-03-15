import { motion } from "framer-motion";
import { BookOpen, Brain, Clock, GraduationCap, LineChart, Shield } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Practice Mode",
    description: "Unlimited topic-based questions with instant feedback, step-by-step solutions, and tuition tips.",
  },
  {
    icon: Clock,
    title: "Mock Exams",
    description: "Timed exam simulations matching real paper formats — MCQ, numerical, structured, and essay.",
  },
  {
    icon: Brain,
    title: "AI Coach",
    description: "Adaptive learning that identifies weak areas and creates personalised revision plans.",
  },
  {
    icon: GraduationCap,
    title: "Multi-Curriculum",
    description: "GCSE, A-Level, IB, FSC, CBSE, US Grade 9–11 — all major exam boards supported.",
  },
  {
    icon: LineChart,
    title: "Analytics",
    description: "Track accuracy, readiness scores, weak topics, and study streaks in real time.",
  },
  {
    icon: Shield,
    title: "White-Label",
    description: "Colleges and tuition centres get branded portals with class management and reporting.",
  },
];

export function FeaturesSection() {
  return (
    <section className="border-t py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <div className="stem-label mb-3">Platform Features</div>
          <h2 className="stem-heading text-3xl md:text-4xl">Everything a tuition centre offers — in an app</h2>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: [0.2, 0, 0, 1] }}
              className="stem-card rounded-xl p-6"
            >
              <feature.icon className="mb-3 h-6 w-6 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
