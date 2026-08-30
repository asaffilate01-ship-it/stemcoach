import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQSection() {
  const { t } = useTranslation();

  const faqs = [
    { q: t("landing.faq1q"), a: t("landing.faq1a") },
    { q: t("landing.faq2q"), a: t("landing.faq2a") },
    { q: t("landing.faq3q"), a: t("landing.faq3a") },
    { q: t("landing.faq4q"), a: t("landing.faq4a") },
    { q: t("landing.faq5q"), a: t("landing.faq5a") },
    { q: t("landing.faq6q"), a: t("landing.faq6a") },
  ];

  return (
    <section className="relative border-t py-10 md:py-14">
      <div className="container relative mx-auto px-4">
        <div className="mb-14 text-center">
          <div className="stem-label mb-3">{t("landing.faqLabel")}</div>
          <h2 className="stem-section-heading">
            {t("landing.faqHeading")} <span className="stem-gradient-text">{t("landing.faqQuestionsSuffix")}</span>
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="stem-card overflow-hidden rounded-xl border-border/50 px-6"
              >
                <AccordionTrigger className="py-5 text-left text-sm font-semibold hover:no-underline sm:text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <img src="/assets/coach-stem.png" alt="STEMCoach" className="h-6 w-6 shrink-0 rounded-full object-cover mt-0.5" />
                    <span>{faq.a}</span>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
