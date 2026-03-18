import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { PACKS, type PackKey, type RegionKey } from "@/lib/subscriptionTiers";

export function useSubscription() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const checkout = useCallback(async (priceId: string, packType: PackKey = "standard", questionsGranted: number = 5000) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, packType, questionsGranted },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } finally {
      setLoading(false);
    }
  }, []);

  const manageSubscription = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  }, []);

  return { checkout, manageSubscription, loading };
}
