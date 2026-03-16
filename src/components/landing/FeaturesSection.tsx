import { motion } from "framer-motion";
import { BookOpen, Brain, Clock, GraduationCap, LineChart, Shield, Users, Zap } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Practice Mode",
    description: "Unlimited topic-based questions with instant feedback, step-by-step worked solutions, and tuition tips from expert tutors.",
  },
  {
    icon: Clock,
    title: "Mock Exams",
    description: "Timed exam simulations matching real paper formats — MCQ, numerical, structured, and essay. Get certified on completion.",
  },
  {
    icon: Brain,
    title: "AI Tutor",
    description: "Chat with an AI coach that explains concepts, solves problems step-by-step, and adapts to your learning style.",
  },
  {
    icon: GraduationCap,
    title: "30+ Curricula",
    description: "GCSE, A-Level, IB, AP, JEE, NEET, FSC, IELTS, CELTA — every major exam board in 5 countries.",
  },
  {
    icon: LineChart,
    title: "Smart Analytics",
    description: "Track accuracy, exam readiness scores, weak topics, study streaks, and XP progress in real time.",
  },
  {
    icon: Shield,
    title: "White-Label Portal",
    description: "Colleges and tuition centres get branded portals with class management, assignments, and parent monitoring.",
  },
  {
    icon: Users,
    title: "Teacher Dashboard",
    description: "Create classes, set assignments, track student progress, and manage live classroom sessions.",
  },
  {
    icon: Zap,
    title: "Gamified Learning",
    description: "Earn XP, unlock badges, climb leaderboards, and maintain streaks to stay motivated every day.",
  },
];

export function FeaturesSection() {
  return (
    <section className="border-t bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">Platform Features</div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything a tuition centre offers — in an app
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Built by teachers and tutors, powered by AI. From practice questions to live classrooms, everything you need to ace your exams.
          </p>
        </div>
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.2, 0, 0, 1] }}
              className="group rounded-xl border bg-background p-5 transition-all hover:border-primary/20 hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
