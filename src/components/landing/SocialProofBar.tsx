import { motion } from "framer-motion";

const trustedBy = [
  { name: "Dubai Academy", location: "UAE" },
  { name: "Lahore Grammar School", location: "Pakistan" },
  { name: "DPS International", location: "India" },
  { name: "Westminster Academy", location: "UK" },
  { name: "GEMS Education", location: "UAE" },
];

const counters = [
  { value: "25,000+", label: "Active Students" },
  { value: "200+", label: "Partner Schools" },
  { value: "5", label: "Countries" },
  { value: "4.9★", label: "App Rating" },
];

export function SocialProofBar() {
  return (
    <section className="relative border-t border-border/40 bg-muted/20 py-10 md:py-14">
      <div className="container mx-auto px-4">
        {/* Counters */}
        <div className="mx-auto mb-10 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
          {counters.map((counter, i) => (
            <motion.div
              key={counter.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {counter.value}
              </div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {counter.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trusted by */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
            Trusted by leading institutions
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {trustedBy.map((org) => (
              <div
                key={org.name}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground/60 transition-colors hover:text-muted-foreground"
              >
                <div className="h-2 w-2 rounded-full bg-primary/20" />
                <span>{org.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
