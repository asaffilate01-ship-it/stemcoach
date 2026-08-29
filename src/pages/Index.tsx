import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProofBar } from "@/components/landing/SocialProofBar";
import { StemSquadSection } from "@/components/landing/StemSquadSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CurriculaSection } from "@/components/landing/CurriculaSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1">
        <HeroSection />
        <SocialProofBar />
        <StemSquadSection />
        <HowItWorksSection />
        <FeaturesSection />
        <CurriculaSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
