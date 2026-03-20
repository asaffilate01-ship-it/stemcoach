import { motion } from "framer-motion";
import { BookOpen, Brain, Clock, GraduationCap, LineChart, Shield, Users, Zap } from "lucide-react";
import { Icon3D } from "@/components/ui/icon-3d";
import stemsquadImg from "@/assets/stemsquad.png";

const features = [
  {
    icon: BookOpen,
    title: "Practice Mode",
    description: "Unlimited topic-based questions with instant feedback, step-by-step worked solutions, and tuition tips from expert tutors.",
    variant: "primary" as const,
  },
  {
    icon: Clock,
    title: "Mock Exams",
    description: "Timed exam simulations matching real paper formats — MCQ, numerical, structured, and essay. Get certified on completion.",
    variant: "warning" as const,
  },
  {
    icon: Brain,
    title: "STEMcoach Coaching",
    description: "Chat with STEMcoach — get step-by-step explanations, problem solving, and personalised coaching that adapts to your learning style.",
    variant: "purple" as const,
  },
  {
    icon: GraduationCap,
    title: "30+ Curricula",
    description: "GCSE, A-Level, IB, AP, JEE, NEET, FSC, IELTS, CELTA — every major exam board in 5 countries.",
    variant: "success" as const,
  },
  {
    icon: LineChart,
    title: "Smart Analytics",
    description: "Track accuracy, exam readiness scores, weak topics, study streaks, and XP progress in real time.",
    variant: "primary" as const,
  },
  {
    icon: Shield,
    title: "White-Label Portal",
    description: "Colleges and tuition centres get branded portals with class management, assignments, and parent monitoring.",
    variant: "purple" as const,
  },
  {
    icon: Users,
    title: "Teacher Dashboard",
    description: "Create classes, set assignments, track student progress, and manage live classroom sessions.",
    variant: "warning" as const,
  },
  {
    icon: Zap,
    title: "Gamified Learning",
    description: "Earn XP, unlock badges, climb leaderboards, and maintain streaks to stay motivated every day.",
    variant: "success" as const,
  },
];

export function FeaturesSection() {
  return (
    <section className="relative border-t border-border/30 py-10 md:py-14">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.02),transparent_70%)]" />
      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <div className="stem-label mb-3">Platform Features</div>
          <h2 className="stem-section-heading">
            Everything a tuition centre offers
            <br className="hidden sm:block" />
            <span className="stem-gradient-text"> — in an app</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Built by teachers and tutors. From practice questions to live classrooms, everything you need to ace your exams.
          </p>
        </motion.div>

        {/* STEM Squad showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-20 max-w-3xl"
        >
          <div className="relative flex flex-col items-center">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/6 via-transparent to-[hsl(258_60%_52%/0.04)] blur-3xl" />
            <img
              src={stemsquadImg}
              alt="The STEM Squad — 7 subject mascots guiding your learning journey"
              className="relative w-full max-w-lg transition-transform duration-700 hover:scale-[1.02]"
              loading="lazy"
            />
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="mt-3 rounded-xl bg-card px-5 py-2.5 shadow-lg ring-1 ring-border/30 text-center"
            >
              <p className="text-sm font-bold">Meet your learning squad 🚀</p>
              <p className="text-[11px] text-muted-foreground">Each mascot specialises in a different subject</p>
            </motion.div>
          </div>
        </motion.div>

        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.25 } }}
              className="group stem-card p-5 sm:p-6"
            >
              <div className="mb-4">
                <Icon3D icon={feature.icon} variant={feature.variant} size="lg" />
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
