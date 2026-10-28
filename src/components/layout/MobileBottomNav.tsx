import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { motion, useReducedMotion } from "framer-motion";
import { Home, BookOpen, GraduationCap, LayoutDashboard } from "lucide-react";
import { Icon3D, type Icon3DVariant } from "@/components/ui/icon-3d";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  to: string;
  labelKey: string;
  icon?: LucideIcon;
  image?: string;
  variant: Icon3DVariant;
  auth?: boolean;
}

const items: NavItem[] = [
  { to: "/home", labelKey: "nav.home", icon: Home, variant: "primary" },
  { to: "/subjects", labelKey: "nav.subjects", icon: BookOpen, variant: "success" },
  { to: "/ai-tutor", labelKey: "nav.aiTutor", image: "/assets/coach-stem.png", variant: "purple" },
  { to: "/mock-exam", labelKey: "nav.mockExam", icon: GraduationCap, variant: "warning" },
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, variant: "accent", auth: true },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const visible = items.filter(i => !i.auth || user);

  // The promo landing page ships its own native-style bottom navigation
  if (pathname === "/") return null;

  return (
    <nav aria-label={t("nav.mobileNavigation")} className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 bg-background/95 backdrop-blur-xl lg:hidden safe-area-bottom">
      <div className="flex items-stretch justify-around gap-1 px-1 py-1.5">
        {visible.map((item) => {
          const label = t(item.labelKey);
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className="group relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-xs font-semibold leading-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary motion-safe:transition-colors"
            >
              <div aria-hidden="true" className={`relative flex items-center justify-center motion-safe:transition-opacity ${
                active ? "opacity-100" : "opacity-75"
              }`}>
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="h-8 w-8 rounded-xl object-cover shadow-md ring-1 ring-border/20"
                  />
                ) : item.icon ? (
                  <Icon3D icon={item.icon} variant={item.variant} size="sm" />
                ) : null}
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1.5 h-[3px] w-4 rounded-full bg-primary"
                    transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </div>
              <span className={`max-w-full break-words text-center ${
                active ? "text-primary font-bold" : "text-muted-foreground"
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
