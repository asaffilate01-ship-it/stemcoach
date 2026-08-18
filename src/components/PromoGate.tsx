import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isPreviewUnlocked } from "@/lib/promoAccess";

/**
 * Keeps the full product behind the promo landing page until a visitor
 * enters the preview access code.
 */
export function PromoGate({ children }: { children: ReactNode }) {
  const location = useLocation();

  if (!isPreviewUnlocked()) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
