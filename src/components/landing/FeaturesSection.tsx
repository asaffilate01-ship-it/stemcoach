import { motion } from "framer-motion";
import { BookOpen, Brain, Clock, GraduationCap, LineChart, Shield, Users, Zap } from "lucide-react";
import dashboardImg from "@/assets/dashboard-preview.png";

const features = [
  {
    icon: BookOpen,
    title: "Practice Mode",
    description: "Unlimited topic-based questions with instant feedback, step-by-step worked solutions, and tuition tips from expert tutors.",
    iconBg: "bg-primary/8 text-primary",
  },
  {
    icon: Clock,
    title: "Mock Exams",
    description: "Timed exam simulations matching real paper formats — MCQ, numerical, structured, and essay. Get certified on completion.",
    iconBg: "bg-warning/8 text-warning",
  },
  {
    icon: Brain,
    title: "AI Tutor",
    description: "Chat with an AI coach that explains concepts, solves problems step-by-step, and adapts to your learning style.",
    iconBg: "bg-[hsl(258_60%_52%/0.08)] text-[hsl(258_60%_52%)]",
  },
  {
    icon: GraduationCap,
    title: "30+ Curricula",
    description: "GCSE, A-Level, IB, AP, JEE, NEET, FSC, IELTS, CELTA — every major exam board in 5 countries.",
    iconBg: "bg-success/8 text-success",
  },
  {
    icon: LineChart,
    title: "Smart Analytics",
    description: "Track accuracy, exam readiness scores, weak topics, study streaks, and XP progress in real time.",
    iconBg: "bg-primary/8 text-primary",
  },
  {
    icon: Shield,
    title: "White-Label Portal",
    description: "Colleges and tuition centres get branded portals with class management, assignments, and parent monitoring.",
    iconBg: "bg-[hsl(258_60%_52%/0.08)] text-[hsl(258_60%_52%)]",
  },
  {
    icon: Users,
    title: "Teacher Dashboard",
    description: "Create classes, set assignments, track student progress, and manage live classroom sessions.",
    iconBg: "bg-warning/8 text-warning",
  },
  {
    icon: Zap,
    title: "Gamified Learning",
    description: "Earn XP, unlock badges, climb leaderboards, and maintain streaks to stay motivated every day.",
    iconBg: "bg-success/8 text-success",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative border-t border-border/30 py-20 md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.02),transparent_70%)]" />
      <div className="container relative mx-auto px-4">
        <div className="mb-16 text-center">
          <div className="stem-label mb-3">Platform Features</div>
          <h2 className="stem-section-heading">
            Everything a tuition centre offers
            <br className="hidden sm:block" />
            <span className="stem-gradient-text"> — in an app</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Built by teachers and tutors, powered by AI. From practice questions to live classrooms, everything you need to ace your exams.
          </p>
        </div>

        {/* Dashboard preview image */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-20 max-w-4xl"
        >
          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/6 via-transparent to-[hsl(258_60%_52%/0.04)] blur-3xl" />
            <img
              src={dashboardImg}
              alt="STEMCoach dashboard showing exam analytics, progress tracking, and achievement badges"
              className="relative w-full rounded-2xl shadow-2xl shadow-primary/8 ring-1 ring-border/30"
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
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${feature.iconBg} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-bold text-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
