import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What curricula and exam boards do you support?",
    a: "We support 30+ curricula including UK GCSE & A-Level (AQA, Edexcel, OCR, WJEC), IB (SL & HL), US AP & SAT, Indian CBSE, ICSE, JEE & NEET, Pakistani FSC, Matric & ECAT/MDCAT, and more. New curricula are added regularly.",
  },
  {
    q: "How does the AI Tutor work?",
    a: "Our AI Tutor provides step-by-step explanations, solves problems interactively, and adapts to your level. It's like having a private tutor available 24/7. You can ask follow-up questions, request alternative explanations, and get exam technique advice.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes! The free plan gives you 5 practice questions per day, access to all subjects, and basic analytics. Upgrade to Pro or School plans for unlimited questions, mock exams, AI tutoring, and advanced analytics.",
  },
  {
    q: "How accurate are the questions?",
    a: "Every question is curriculum-aligned and reviewed for accuracy. Our AI-generated questions go through validation pipelines, and we work with subject-matter experts to ensure answers match exam board specifications.",
  },
  {
    q: "Can schools and tuition centres use STEMCoach?",
    a: "Absolutely! Our School and Institution plans include class management, assignment setting, student progress tracking, parent portals, and optional white-label branding with your own logo and colours.",
  },
  {
    q: "What subjects do you cover?",
    a: "We cover Physics, Chemistry, Biology, Mathematics, Further Maths, Computer Science, Economics, English Language (including IELTS & CELTA), and more. Each subject includes topic-by-topic breakdown with thousands of questions.",
  },
];

export function FAQSection() {
  return (
    <section className="relative border-t py-20 md:py-28">
      <div className="container relative mx-auto px-4">
        <div className="mb-14 text-center">
          <div className="stem-label mb-3">FAQ</div>
          <h2 className="stem-section-heading">
            Frequently asked <span className="stem-gradient-text">questions</span>
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
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
