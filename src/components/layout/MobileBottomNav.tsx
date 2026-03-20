import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Home, BookOpen, GraduationCap, LayoutDashboard } from "lucide-react";
import { Icon3D, type Icon3DVariant } from "@/components/ui/icon-3d";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon?: LucideIcon;
  image?: string;
  variant: Icon3DVariant;
  auth?: boolean;
}

const items: NavItem[] = [
  { to: "/", label: "Home", icon: Home, variant: "primary" },
  { to: "/subjects", label: "Subjects", icon: BookOpen, variant: "success" },
  { to: "/ai-tutor", label: "STEMcoach", image: "/assets/coach-stem.png", variant: "purple" },
  { to: "/mock-exam", label: "Exam", icon: GraduationCap, variant: "warning" },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, variant: "accent", auth: true },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const visible = items.filter(i => !i.auth || user);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/15 bg-background/80 backdrop-blur-2xl backdrop-saturate-150 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1.5">
        {visible.map((item) => {
          const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className="group relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition-all active:scale-95"
            >
              <div className={`relative flex items-center justify-center transition-all duration-300 ${
                active ? "scale-110" : "opacity-60"
              }`}>
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.label}
                    className="h-8 w-8 rounded-xl object-cover shadow-md ring-1 ring-border/20"
                  />
                ) : item.icon ? (
                  <Icon3D icon={item.icon} variant={item.variant} size="sm" />
                ) : null}
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1.5 h-[3px] w-4 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </div>
              <span className={`transition-all duration-300 ${
                active ? "text-primary font-bold" : "text-muted-foreground"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
