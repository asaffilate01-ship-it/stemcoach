import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function CTASection() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden border-t border-border/30 py-10 md:py-14">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-[hsl(258_60%_52%/0.03)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/[0.03] blur-3xl" />
      <div className="container relative mx-auto px-4">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="hidden md:block"
          >
            <div className="relative flex flex-col items-center">
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/6 via-transparent to-[hsl(258_60%_52%/0.04)] blur-3xl" />
              
              <div className="relative grid grid-cols-4 gap-3 max-w-sm">
                {[
                  { src: "/assets/mathmax.png", name: "MathMax", delay: 0 },
                  { src: "/assets/physix.png", name: "PhysiX", delay: 0.05 },
                  { src: "/assets/chemi.png", name: "Chemi", delay: 0.1 },
                  { src: "/assets/biobee.png", name: "BioBee", delay: 0.15 },
                  { src: "/assets/codey.png", name: "Codey", delay: 0.2 },
                  { src: "/assets/lexi.png", name: "Lexi", delay: 0.25 },
                  { src: "/assets/econiq.png", name: "EconiQ", delay: 0.1 },
                  { src: "/assets/litera.png", name: "Litera", delay: 0.15 },
                  { src: "/assets/psyche-cutout.png", name: "Pysche", delay: 0.2 },
                  { src: "/assets/geo.png", name: "Geo", delay: 0.25 },
                  { src: "/assets/bizpro.png", name: "BizPro", delay: 0.3 },
                  { src: "/assets/coach-stem-cutout.png", name: "Coach Stem", delay: 0.05 },
                ].map((m) => (
                  <motion.div
                    key={m.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: m.delay, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -6, scale: 1.1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="rounded-2xl bg-card p-2 shadow-md ring-1 ring-border/20">
                      <img src={m.src} alt={m.name} className="h-14 w-14 object-contain" loading="lazy" />
                    </div>
                    <span className="mt-1 text-[10px] font-semibold text-muted-foreground">{m.name}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="mt-4 rounded-xl bg-card px-5 py-3 shadow-lg ring-1 ring-border/30 text-center"
              >
                <p className="text-sm font-bold">{t("landing.squadRooting")}</p>
                <p className="text-[11px] text-muted-foreground">{t("landing.squadStats")}</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center lg:text-left"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.04] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
              <Sparkles className="h-3.5 w-3.5" /> {t("landing.getStartedToday")}
            </div>
            <h2 className="mb-5 stem-section-heading">
              {t("landing.readyToAce")} <span className="stem-gradient-text">{t("landing.aceYourExams")}</span>?
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground lg:mx-0">
              {t("landing.ctaDesc")}
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start sm:justify-center">
              <Button
                variant="premium"
                size="lg"
                className="gap-2 px-10"
                onClick={() => navigate("/auth")}
              >
                {t("landing.signUpFree")} <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 px-10"
                onClick={() => navigate("/pricing")}
              >
                {t("landing.comparePlans")}
              </Button>
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              {t("landing.ctaFooter")}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
