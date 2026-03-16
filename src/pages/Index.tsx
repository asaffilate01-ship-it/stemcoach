import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CurriculaSection } from "@/components/landing/CurriculaSection";
import { AppHeader } from "@/components/layout/AppHeader";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <CurriculaSection />
        <footer className="border-t py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} STEMCoach — Virtual Tuition Centre
              </div>
              <nav className="flex gap-4 text-sm text-muted-foreground">
                <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
                <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
                <a href="mailto:support@stemcoach.app" className="hover:text-foreground">Contact</a>
              </nav>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
