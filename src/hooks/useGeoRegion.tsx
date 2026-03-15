import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RegionKey } from "@/lib/subscriptionTiers";

export function useGeoRegion() {
  const [region, setRegion] = useState<RegionKey>("uk");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detect = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("geo-detect");
        if (!error && data?.region) {
          setRegion(data.region as RegionKey);
        }
      } catch {
        // default to uk
      } finally {
        setLoading(false);
      }
    };
    detect();
  }, []);

  return { region, setRegion, loading };
}
