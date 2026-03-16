import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useGeoRegion } from "@/hooks/useGeoRegion";
import { TIERS, type TierKey, type RegionKey } from "@/lib/subscriptionTiers";
import { Check, Crown, Building2, Sparkles, Globe, ArrowRight, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const tierIcons: Record<TierKey, typeof Crown> = {
  free: Sparkles,
  pro: Crown,
  school: Building2,
};

const regionLabels: Record<RegionKey, string> = {
  uk: "🇬🇧 United Kingdom",
  us: "🇺🇸 United States",
  ae: "🇦🇪 UAE",
  in: "🇮🇳 India",
  pk: "🇵🇰 Pakistan",
};

const faqs = [
  { q: "Can I cancel anytime?", a: "Yes — cancel from your dashboard with one click. No long-term contracts." },
  { q: "Is there a free trial?", a: "The Free tier gives you 5 questions/day forever. Upgrade when you're ready." },
  { q: "What payment methods do you accept?", a: "Visa, Mastercard, and all major cards via Stripe. Fully secure." },
  { q: "Can my school get a bulk discount?", a: "Yes! The School plan includes volume pricing. Contact us for 50+ students." },
];

export default function Pricing() {
  const { user } = useAuth();
  const { tier: currentTier, subscribed, checkout, manageSubscription, loading } = useSubscription();
  const { region, setRegion, loading: geoLoading } = useGeoRegion();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSelect = async (key: TierKey) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const tier = TIERS[key];
    const priceId = tier.regional[region].price_id;
    if (!priceId) return;

    try {
      await checkout(priceId);
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
                <Sparkles className="h-3.5 w-3.5" /> Simple Pricing
              </div>
              <h1 className="stem-section-heading mb-4">
                Plans that grow{" "}
                <span className="stem-gradient-text">with you</span>
              </h1>
              <p className="mx-auto max-w-xl text-lg text-muted-foreground">
                Start free, upgrade when you need more. No hidden fees, cancel anytime.
              </p>

              <div className="mt-8 flex items-center justify-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Select value={region} onValueChange={(v) => setRegion(v as RegionKey)}>
                  <SelectTrigger className="w-[200px] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(regionLabels) as [RegionKey, string][]).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="relative py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
              {(Object.entries(TIERS) as [TierKey, typeof TIERS[TierKey]][]).map(([key, tier], i) => {
                const Icon = tierIcons[key];
                const isCurrent = key === currentTier;
                const isPopular = key === "pro";
                const regionalPrice = tier.regional[region];
                const priceDisplay = regionalPrice.price;

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className={`relative rounded-2xl border p-7 transition-shadow duration-300 ${
                      isPopular
                        ? "border-primary bg-card shadow-xl shadow-primary/10 scale-[1.02]"
                        : "border-border bg-card hover:shadow-lg hover:shadow-primary/5"
                    } ${isCurrent ? "ring-2 ring-primary" : ""}`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/30">
                        Most Popular
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-3.5 right-4 rounded-full bg-accent border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
                        Your Plan
                      </div>
                    )}

                    <div className="mb-5 flex items-center gap-2.5">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        isPopular ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold">{tier.name}</h3>
                    </div>

                    <div className="mb-6">
                      <span className="text-4xl font-extrabold tracking-tight">{priceDisplay.split("/")[0]}</span>
                      {priceDisplay.includes("/") && (
                        <span className="text-sm text-muted-foreground">/{priceDisplay.split("/")[1]}</span>
                      )}
                    </div>

                    <ul className="mb-8 space-y-3">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrent && subscribed ? (
                      <Button variant="outline" className="w-full rounded-xl" onClick={manageSubscription}>
                        Manage Subscription
                      </Button>
                    ) : key === "free" ? (
                      <Button variant="outline" className="w-full rounded-xl" disabled>
                        {currentTier === "free" ? "Current Plan" : "Downgrade via portal"}
                      </Button>
                    ) : (
                      <Button
                        className={`w-full rounded-xl gap-2 ${
                          isPopular
                            ? "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
                            : ""
                        }`}
                        variant={isPopular ? "default" : "outline"}
                        onClick={() => handleSelect(key)}
                        disabled={loading || geoLoading}
                      >
                        {user ? "Subscribe Now" : "Sign in to subscribe"}
                        {isPopular && <ArrowRight className="h-4 w-4" />}
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Security badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mx-auto mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground"
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
      </main>
      <Footer />
    </div>
  );
}
