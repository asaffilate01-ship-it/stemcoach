import { motion } from "framer-motion";

const counters = [
  { value: "2M+", label: "Exam Questions" },
  { value: "50+", label: "Curricula Covered" },
  { value: "12", label: "Subjects" },
  { value: "6", label: "AI Mascot Tutors" },
];


export function SocialProofBar() {
  return (
    <section className="relative border-t border-border/30 bg-muted/15 py-12 md:py-16">
      <div className="container mx-auto px-4">
        {/* Counters */}
        <div className="mx-auto mb-12 grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4">
          {counters.map((counter, i) => (
            <motion.div
              key={counter.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group text-center"
            >
              <div className="text-2xl font-extrabold tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary sm:text-3xl lg:text-4xl">
                {counter.value}
              </div>
              <div className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {counter.label}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
