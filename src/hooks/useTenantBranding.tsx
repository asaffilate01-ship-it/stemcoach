import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TenantBranding {
  tenantId: string | null;
  name: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  slug: string | null;
}

const defaultBranding: TenantBranding = {
  tenantId: null,
  name: null,
  logoUrl: null,
  primaryColor: null,
  secondaryColor: null,
  slug: null,
};

const TenantBrandingContext = createContext<TenantBranding>(defaultBranding);

export function TenantBrandingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [branding, setBranding] = useState<TenantBranding>(defaultBranding);

  useEffect(() => {
    if (!user) {
      setBranding(defaultBranding);
      removeCssVars();
      return;
    }

    const fetchBranding = async () => {
      // Check if user belongs to any approved tenant
      const { data: membership } = await supabase
        .from("tenant_members")
        .select("tenant_id, tenants(*)")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .limit(1)
        .maybeSingle();

      if (!membership?.tenants) {
        setBranding(defaultBranding);
        removeCssVars();
        return;
      }

      const t = membership.tenants as any;
      const newBranding: TenantBranding = {
        tenantId: t.id,
        name: t.name,
        logoUrl: t.logo_url,
        primaryColor: t.primary_color,
        secondaryColor: t.secondary_color,
        slug: t.slug,
      };
      setBranding(newBranding);
      applyCssVars(newBranding);
    };

    fetchBranding();
  }, [user]);

  return (
    <TenantBrandingContext.Provider value={branding}>
      {children}
    </TenantBrandingContext.Provider>
  );
}

export function useTenantBranding() {
  return useContext(TenantBrandingContext);
}

function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyCssVars(branding: TenantBranding) {
  const root = document.documentElement;
  if (branding.primaryColor) {
    const hsl = hexToHsl(branding.primaryColor);
    if (hsl) {
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--primary-foreground", "0 0% 100%");
    }
  }
}

function removeCssVars() {
  const root = document.documentElement;
  root.style.removeProperty("--primary");
  root.style.removeProperty("--primary-foreground");
}
