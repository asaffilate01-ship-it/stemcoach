import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Fatima K.",
    role: "A-Level Student, London",
    text: "STEMCoach helped me go from a C to an A* in Physics. The worked solutions are better than any textbook.",
    rating: 5,
    initials: "FK",
  },
  {
    name: "Dr. Ahmed R.",
    role: "Head of Science, Dubai Academy",
    text: "We onboarded 200 students onto the School plan. The teacher dashboard and assignment tracking is exceptional.",
    rating: 5,
    initials: "AR",
  },
  {
    name: "Priya S.",
    role: "JEE Aspirant, Mumbai",
    text: "The difficulty levels match actual JEE papers perfectly. The AI tutor explains concepts better than YouTube.",
    rating: 5,
    initials: "PS",
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative border-t py-20 md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.04),transparent_60%)]" />
      <div className="container relative mx-auto px-4">
        <div className="mb-14 text-center">
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
              className="stem-card relative p-6"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/8" />
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
              <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
