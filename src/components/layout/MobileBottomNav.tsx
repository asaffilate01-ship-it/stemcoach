import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Trophy, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/ai-tutor", label: "STEMcoach", icon: null, image: "/assets/coach-stem.png" },
  { to: "/mock-exam", label: "Exam", icon: Trophy },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, auth: true },
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
              className="relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition-all active:scale-95"
            >
              <div className={`relative flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-300 ${
                active ? "bg-primary/12 scale-110" : ""
              }`}>
                <item.icon className={`h-[18px] w-[18px] transition-all duration-300 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`} strokeWidth={active ? 2.5 : 2} />
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 h-[3px] w-4 rounded-full bg-primary"
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
