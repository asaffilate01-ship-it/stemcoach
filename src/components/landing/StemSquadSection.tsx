import { motion } from "framer-motion";

const squad = [
  { name: "MathMax", subject: "Mathematics", image: "/assets/mathmax.png" },
  { name: "PhysiX", subject: "Physics", image: "/assets/physix.png" },
  { name: "Chemi", subject: "Chemistry", image: "/assets/chemi.png" },
  { name: "BioBee", subject: "Biology", image: "/assets/biobee.png" },
  { name: "Codey", subject: "Computer Science", image: "/assets/codey.png" },
  { name: "Lexi", subject: "IELTS & CELTA", image: "/assets/lexi.png" },
  { name: "EconiQ", subject: "Economics", image: "/assets/econiq.png" },
  { name: "Litera", subject: "English Literature", image: "/assets/litera.png" },
  { name: "Pysche", subject: "Psychology", image: "/assets/pysche.png" },
  { name: "Geo", subject: "Geography", image: "/assets/geo.png" },
  { name: "BizPro", subject: "Business Studies", image: "/assets/bizpro.png" },
];

export function StemSquadSection() {
  return (
    <section className="relative overflow-hidden py-10 md:py-14">
      {/* Background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,hsl(var(--primary)/0.06),transparent)]" />

      <div className="container relative mx-auto px-4">
        {/* Header with Coach Stem */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl shadow-premium-lg ring-2 ring-primary/20 sm:h-28 sm:w-28"
          >
            <img
              src="/assets/coach-stem.png"
              alt="Coach Stem — leader of the STEM Squad"
              className="h-full w-full object-cover"
            />
          </motion.div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.04] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
            Meet Your Tutors
          </div>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
            The <span className="stem-gradient-text">STEM Squad</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
            Led by <strong className="text-foreground">Coach Stem</strong>, each subject has a dedicated mascot guiding you through every topic, question, and exam tip.
          </p>
        </motion.div>

        {/* Squad grid */}
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-6">
          {squad.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group flex flex-col items-center"
            >
              <div className="relative mb-3 h-20 w-20 overflow-hidden rounded-2xl bg-muted shadow-md ring-1 ring-border/30 transition-all duration-300 group-hover:shadow-lg group-hover:ring-primary/30 group-hover:scale-105 sm:h-24 sm:w-24">
                <img
                  src={member.image}
                  alt={`${member.name} — ${member.subject} mascot`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="text-sm font-bold tracking-tight">{member.name}</span>
              <span className="text-[11px] text-muted-foreground">{member.subject}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
