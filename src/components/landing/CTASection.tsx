import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="border-t bg-primary/5 py-16 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          Ready to ace your exams?
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
          Join thousands of students already using STEMCoach to boost their grades. Start free — no credit card required.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" className="gap-2 rounded-xl px-8 text-base" onClick={() => navigate("/auth")}>
            Sign Up Free <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" className="gap-2 rounded-xl px-8 text-base" onClick={() => navigate("/pricing")}>
            Compare Plans
          </Button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Free tier includes 5 questions/day · No credit card needed · Cancel anytime
        </p>
      </div>
    </section>
  );
}
