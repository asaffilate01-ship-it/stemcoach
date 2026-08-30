import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { type PackKey } from "@/lib/subscriptionTiers";

export function useSubscription() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const checkout = useCallback(async (priceId: string, _packType: PackKey = "standard", _questionsGranted: number = 5000) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        // Entitlements are derived from a server-side price catalogue. Only the
        // Stripe price identifier crosses the trust boundary.
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        // Use location.href for PWA/native compatibility (window.open breaks in standalone mode)
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const manageSubscription = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    if (data?.url) window.location.href = data.url;
  }, []);

  return { checkout, manageSubscription, loading };
}
