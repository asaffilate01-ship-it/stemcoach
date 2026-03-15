import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CurriculaSection } from "@/components/landing/CurriculaSection";
import { AppHeader } from "@/components/layout/AppHeader";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <CurriculaSection />
        <footer className="border-t py-8 text-center text-sm text-muted-foreground">
          <div className="container mx-auto px-4">
            STEMCoach — Virtual Tuition Centre · 100,000+ questions across 7+ curricula
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
