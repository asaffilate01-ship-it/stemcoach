import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Fatima K.",
    role: "A-Level Student, London",
    text: "STEMCoach helped me go from a C to an A* in Physics. The worked solutions are better than any textbook.",
    rating: 5,
  },
  {
    name: "Dr. Ahmed R.",
    role: "Head of Science, Dubai Academy",
    text: "We onboarded 200 students onto the School plan. The teacher dashboard and assignment tracking is exceptional.",
    rating: 5,
  },
  {
    name: "Priya S.",
    role: "JEE Aspirant, Mumbai",
    text: "The difficulty levels match actual JEE papers perfectly. The AI tutor explains concepts better than YouTube.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="border-t py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">What Students Say</div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Trusted by students worldwide
          </h2>
        </div>
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-xl border bg-background p-6"
            >
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
              <div>
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
