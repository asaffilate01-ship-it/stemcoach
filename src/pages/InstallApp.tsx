import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Download, Smartphone, Check, Share, Plus, ArrowUpFromLine } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallApp() {
  useDocumentTitle("Install App");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Listen for successful install
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const benefits = [
    "Works offline — access loaded questions without internet",
    "Instant launch from your home screen",
    "Full-screen experience without browser bars",
    "Push notifications for streaks and study reminders",
    "Faster loading with cached resources",
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <PageTransition>
        <main id="main-content" className="flex-1">
          <section className="relative overflow-hidden py-16 md:py-24">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.08),transparent)]" />
            <div className="container relative mx-auto px-4">
              <div className="mx-auto max-w-2xl text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/25">
                    <Smartphone className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <h1 className="stem-section-heading mb-4">
                    Install <span className="stem-gradient-text">STEMCoach</span>
                  </h1>
                  <p className="mx-auto mb-8 max-w-md text-lg text-muted-foreground">
                    Add STEMCoach to your home screen for instant access, offline practice, and a native app experience.
                  </p>

                  {isInstalled ? (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-success/10 border border-success/20 px-6 py-3 text-sm font-semibold text-success">
                      <Check className="h-5 w-5" /> App is installed! Open from your home screen.
                    </div>
                  ) : deferredPrompt ? (
                    <Button size="lg" onClick={handleInstall} className="gap-2 rounded-xl px-8 shadow-lg shadow-primary/25">
                      <Download className="h-5 w-5" /> Install STEMCoach
                    </Button>
                  ) : isIOS ? (
                    <div className="mx-auto max-w-sm space-y-4">
                      <p className="text-sm font-semibold text-foreground">To install on iPhone / iPad:</p>
                      <div className="space-y-3 text-left">
                        <div className="flex items-start gap-3 rounded-xl border p-4">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">1</div>
                          <div>
                            <p className="text-sm font-medium">Tap the Share button</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <ArrowUpFromLine className="h-3 w-3" /> at the bottom of Safari
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-xl border p-4">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">2</div>
                          <div>
                            <p className="text-sm font-medium">Scroll down and tap</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Plus className="h-3 w-3" /> "Add to Home Screen"
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-xl border p-4">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">3</div>
                          <div>
                            <p className="text-sm font-medium">Tap "Add" to confirm</p>
                            <p className="text-xs text-muted-foreground mt-1">The app will appear on your home screen</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-center">
                      <p className="text-sm text-muted-foreground">
                        Open this page in Chrome or Edge, then use the browser menu to install.
                      </p>
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-muted/50 border px-4 py-3 text-xs text-muted-foreground">
                        <Share className="h-4 w-4" /> Menu → "Install App" or "Add to Home Screen"
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Benefits */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mx-auto mt-12 max-w-md"
                >
                  <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Why install?</h3>
                  <div className="space-y-3 text-left">
                    {benefits.map((b, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{b}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}
