import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import createAccountIcon from "@/assets/icons/create-account-3d.png";
import practiceLearnIcon from "@/assets/icons/practice-learn-3d.png";
import aceExamsIcon from "@/assets/icons/ace-exams-3d.png";

export function HowItWorksSection() {
  const { t } = useTranslation();

  const steps = [
    {
      image: createAccountIcon,
      step: "01",
      title: t("landing.step1Title"),
      description: t("landing.step1Desc"),
    },
    {
      image: practiceLearnIcon,
      step: "02",
      title: t("landing.step2Title"),
      description: t("landing.step2Desc"),
    },
    {
      image: aceExamsIcon,
      step: "03",
      title: t("landing.step3Title"),
      description: t("landing.step3Desc"),
    },
  ];

  return (
    <section className="relative border-t border-border/30 py-10 md:py-14">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.03),transparent_60%)]" />
      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <div className="stem-label mb-3">{t("landing.howItWorksLabel")}</div>
          <h2 className="stem-section-heading">
            {t("landing.threeSteps")} <span className="stem-gradient-text">{t("landing.examSuccess")}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            {t("landing.howItWorksDesc")}
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="group relative text-center"
            >
              {i < steps.length - 1 && (
                <div className="absolute right-0 top-14 hidden h-px w-[calc(100%-3rem)] translate-x-1/2 md:block">
                  <div className="h-full w-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
                  <ArrowRight className="absolute -right-1.5 -top-1.5 h-3 w-3 text-primary/25" />
                </div>
              )}

              <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="absolute -top-2 -right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[hsl(258_60%_52%)] text-xs font-bold text-white shadow-lg shadow-primary/30"
                >
                  {step.step}
                </motion.div>
                <motion.img 
                  src={step.image} 
                  alt={step.title} 
                  className="h-full w-full object-contain drop-shadow-lg transition-transform duration-500 group-hover:scale-110" 
                />
              </div>

              <h3 className="mb-3 text-lg font-bold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
