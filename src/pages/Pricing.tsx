import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useGeoRegion } from "@/hooks/useGeoRegion";
import { PACKS, type PackKey, regionLabels } from "@/lib/subscriptionTiers";
import { Check, Zap, Plus, Globe, ArrowRight, Shield, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const packIcons: Record<PackKey, typeof Zap> = {
  standard: Package,
  topup: Plus,
};

const faqs = [
  { q: "How does question allocation work?", a: "Choose 1 subject & 1 level = 20,000 questions. Multiple subjects split your 10,000 question pack evenly." },
  { q: "Can I add more subjects later?", a: "Yes! Buy a Top-Up pack to add 2,000 more questions to new or existing subjects." },
  { q: "Is this a one-time purchase?", a: "Yes — pay once, access forever. No subscriptions or recurring charges." },
  { q: "Can I share my account?", a: "Each account allows one active login at a time. Logging in elsewhere will sign out the other device." },
];

export default function Pricing() {
  const { user } = useAuth();
  const { checkout, loading } = useSubscription();
  const { region, setRegion, loading: geoLoading } = useGeoRegion();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSelect = async (key: PackKey) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const pack = PACKS[key];
    const priceId = pack.regional[region].price_id;
    if (!priceId) return;

    try {
      await checkout(priceId, key, pack.questions);
    } catch (e) {
      toast({ title: "Error", description: "Could not start checkout. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <PageTransition><main className="flex-1">
        {/* Header */}
        <section className="relative overflow-hidden border-b py-16 md:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.08),transparent)]" />
          <div className="container relative mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <Zap className="h-3.5 w-3.5" /> One-Time Purchase
              </div>
              <h1 className="stem-section-heading mb-4">
                Pay once,{" "}
                <span className="stem-gradient-text">learn forever</span>
              </h1>
              <p className="mx-auto max-w-xl text-lg text-muted-foreground">
                Get thousands of exam-ready questions. No subscriptions, no hidden fees.
              </p>

              {!geoLoading && (
                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>Showing prices for {regionLabels[region]}</span>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="relative py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
              {(Object.entries(PACKS) as [PackKey, typeof PACKS[PackKey]][]).map(([key, pack], i) => {
                const Icon = packIcons[key];
                const isMain = key === "standard";
                const regionalPrice = pack.regional[region];

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className={`relative rounded-2xl border p-7 transition-shadow duration-300 ${
                      isMain
                        ? "border-primary bg-card shadow-xl shadow-primary/10 scale-[1.02]"
                        : "border-border bg-card hover:shadow-lg hover:shadow-primary/5"
                    }`}
                  >
                    {isMain && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/30">
                        Best Value
                      </div>
                    )}

                    <div className="mb-5 flex items-center gap-2.5">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        isMain ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{pack.name}</h3>
                        <p className="text-xs text-muted-foreground">{pack.questions.toLocaleString()} questions</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <span className="text-4xl font-extrabold tracking-tight">{regionalPrice.price}</span>
                      <span className="ml-2 text-sm text-muted-foreground">one-time</span>
                    </div>

                    <ul className="mb-8 space-y-3">
                      {pack.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full rounded-xl gap-2 ${
                        isMain
                          ? "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
                          : ""
                      }`}
                      variant={isMain ? "default" : "outline"}
                      onClick={() => handleSelect(key)}
                      disabled={loading || geoLoading}
                    >
                      {user ? "Buy Now" : "Sign in to purchase"}
                      {isMain && <ArrowRight className="h-4 w-4" />}
                    </Button>
                  </motion.div>
                );
              })}
            </div>

            {/* Allocation info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mx-auto mt-10 max-w-2xl rounded-xl border border-primary/10 bg-primary/5 p-6"
            >
              <h3 className="mb-3 text-center text-sm font-bold text-primary">How Question Allocation Works</h3>
              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <span><strong className="text-foreground">1 subject, 1 level</strong> → 20,000 questions</span>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <span><strong className="text-foreground">Multiple subjects</strong> → Split evenly across subjects</span>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <span><strong className="text-foreground">Need more?</strong> → Buy Top-Up for 2,000 extra questions</span>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <span><strong className="text-foreground">Add subjects</strong> → Top-Up lets you expand anytime</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mx-auto mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <Shield className="h-4 w-4" />
              <span>Payments secured by Stripe · 256-bit SSL encryption</span>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 className="stem-section-heading text-2xl md:text-3xl">Frequently Asked Questions</h2>
            </div>
            <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
              {faqs.map((faq, i) => (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="stem-card rounded-xl p-5"
                >
                  <h4 className="mb-2 text-sm font-semibold text-foreground">{faq.q}</h4>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main></PageTransition>
      <Footer />
    </div>
  );
}
