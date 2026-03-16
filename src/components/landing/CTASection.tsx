import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden border-t py-20 md:py-28">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-primary/3" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="container relative mx-auto px-4 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Get Started Today
          </div>
          <h2 className="mb-5 stem-section-heading">
            Ready to <span className="stem-gradient-text">ace your exams</span>?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
            Join thousands of students already using STEMCoach to boost their grades. Start free — no credit card required.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="gap-2 rounded-xl px-10 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
              onClick={() => navigate("/auth")}
            >
              Sign Up Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 rounded-xl px-10 text-base"
              onClick={() => navigate("/pricing")}
            >
              Compare Plans
            </Button>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Free tier includes 5 questions/day · No credit card needed · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
