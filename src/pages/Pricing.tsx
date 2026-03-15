import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { TIERS, type TierKey } from "@/lib/subscriptionTiers";
import { Check, Crown, Building2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const tierIcons: Record<TierKey, typeof Crown> = {
  free: Sparkles,
  pro: Crown,
  school: Building2,
};

export default function Pricing() {
  const { user } = useAuth();
  const { tier: currentTier, subscribed, checkout, manageSubscription, loading } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSelect = async (key: TierKey) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const tier = TIERS[key];
    if (!tier.price_id) return;

    try {
      await checkout(tier.price_id);
    } catch (e) {
      toast({ title: "Error", description: "Could not start checkout. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Choose Your Plan</h1>
          <p className="mt-3 text-lg text-muted-foreground">Unlock your full potential with STEMCoach</p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {(Object.entries(TIERS) as [TierKey, typeof TIERS[TierKey]][]).map(([key, tier], i) => {
            const Icon = tierIcons[key];
            const isCurrent = key === currentTier;
            const isPopular = key === "pro";

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border p-6 ${
                  isPopular ? "border-primary shadow-lg shadow-primary/10" : "border-border"
                } ${isCurrent ? "ring-2 ring-primary" : ""}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-foreground">
                    Your Plan
                  </div>
                )}

                <div className="mb-4 flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold">{tier.name}</h3>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-bold">{tier.price.split("/")[0]}</span>
                  {tier.price.includes("/") && (
                    <span className="text-sm text-muted-foreground">/{tier.price.split("/")[1]}</span>
                  )}
                </div>

                <ul className="mb-6 space-y-2.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
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
                    className={`w-full rounded-xl ${isPopular ? "" : "variant-outline"}`}
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => handleSelect(key)}
                    disabled={loading}
                  >
                    {user ? "Subscribe" : "Sign in to subscribe"}
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
