import { motion } from "framer-motion";
import { BookOpen, Brain, Clock, GraduationCap, LineChart, Shield, Users, Zap } from "lucide-react";
import dashboardImg from "@/assets/dashboard-preview.png";

const features = [
  {
    icon: BookOpen,
    title: "Practice Mode",
    description: "Unlimited topic-based questions with instant feedback, step-by-step worked solutions, and tuition tips from expert tutors.",
    color: "from-primary/10 to-primary/5",
  },
  {
    icon: Clock,
    title: "Mock Exams",
    description: "Timed exam simulations matching real paper formats — MCQ, numerical, structured, and essay. Get certified on completion.",
    color: "from-accent to-accent/50",
  },
  {
    icon: Brain,
    title: "AI Tutor",
    description: "Chat with an AI coach that explains concepts, solves problems step-by-step, and adapts to your learning style.",
    color: "from-primary/10 to-accent",
  },
  {
    icon: GraduationCap,
    title: "30+ Curricula",
    description: "GCSE, A-Level, IB, AP, JEE, NEET, FSC, IELTS, CELTA — every major exam board in 5 countries.",
    color: "from-accent to-primary/5",
  },
  {
    icon: LineChart,
    title: "Smart Analytics",
    description: "Track accuracy, exam readiness scores, weak topics, study streaks, and XP progress in real time.",
    color: "from-primary/5 to-accent",
  },
  {
    icon: Shield,
    title: "White-Label Portal",
    description: "Colleges and tuition centres get branded portals with class management, assignments, and parent monitoring.",
    color: "from-accent to-primary/10",
  },
  {
    icon: Users,
    title: "Teacher Dashboard",
    description: "Create classes, set assignments, track student progress, and manage live classroom sessions.",
    color: "from-primary/10 to-accent",
  },
  {
    icon: Zap,
    title: "Gamified Learning",
    description: "Earn XP, unlock badges, climb leaderboards, and maintain streaks to stay motivated every day.",
    color: "from-accent to-primary/5",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative border-t py-20 md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.03),transparent_70%)]" />
      <div className="container relative mx-auto px-4">
        <div className="mb-14 text-center">
          <div className="stem-label mb-3">Platform Features</div>
          <h2 className="stem-section-heading">
            Everything a tuition centre offers
            <br className="hidden sm:block" />
            <span className="stem-gradient-text"> — in an app</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Built by teachers and tutors, powered by AI. From practice questions to live classrooms, everything you need to ace your exams.
          </p>
        </div>

        {/* Dashboard preview image */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-16 max-w-4xl"
        >
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/8 via-transparent to-primary/4 blur-2xl" />
            <img
              src={dashboardImg}
              alt="STEMCoach dashboard showing exam analytics, progress tracking, and achievement badges"
              className="relative w-full rounded-2xl shadow-2xl shadow-primary/10 ring-1 ring-border/50"
              loading="lazy"
            />
          </div>
        </motion.div>

        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="group stem-card p-6"
            >
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-primary transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-primary/10`}>
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
