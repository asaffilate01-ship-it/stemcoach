import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CurriculaSection } from "@/components/landing/CurriculaSection";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <CurriculaSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
