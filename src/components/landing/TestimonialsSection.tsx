import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Fatima K.",
    role: "A-Level Student, London",
    text: "STEMCoach helped me go from a C to an A* in Physics. The worked solutions are better than any textbook.",
    rating: 5,
    initials: "FK",
    color: "from-primary/15 to-primary/5",
  },
  {
    name: "Dr. Ahmed R.",
    role: "Head of Science, Dubai Academy",
    text: "We onboarded 200 students onto the School plan. The teacher dashboard and assignment tracking is exceptional.",
    rating: 5,
    initials: "AR",
    color: "from-[hsl(258_60%_52%/0.12)] to-[hsl(258_60%_52%/0.04)]",
  },
  {
    name: "Priya S.",
    role: "JEE Aspirant, Mumbai",
    text: "The difficulty levels match actual JEE papers perfectly. The AI tutor explains concepts better than YouTube.",
    rating: 5,
    initials: "PS",
    color: "from-success/12 to-success/4",
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative border-t border-border/30 py-20 md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.03),transparent_60%)]" />
      <div className="container relative mx-auto px-4">
        <div className="mb-16 text-center">
          <div className="stem-label mb-3">What Students Say</div>
          <h2 className="stem-section-heading">
            Trusted by students <span className="stem-gradient-text">worldwide</span>
          </h2>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="stem-card relative overflow-hidden p-6"
            >
              <div className={`absolute top-0 right-0 h-32 w-32 rounded-bl-full bg-gradient-to-bl ${t.color} opacity-50`} />
              <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/[0.06]" />
              <div className="relative">
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
                <div className="flex items-center gap-3 border-t border-border/40 pt-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.color} text-sm font-bold text-foreground`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
