import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Trophy, LayoutDashboard, Bot } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/ai-tutor", label: "STEMcoach", icon: Bot },
  { to: "/mock-exam", label: "Exam", icon: Trophy },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, auth: true },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const visible = items.filter(i => !i.auth || user);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/20 bg-background/85 backdrop-blur-2xl backdrop-saturate-150 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {visible.map((item) => {
          const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition-all"
            >
              <div className={`relative flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-200 ${
                active ? "bg-primary/12" : ""
              }`}>
                <item.icon className={`h-[18px] w-[18px] transition-colors duration-200 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`} />
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 h-0.5 w-4 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </div>
              <span className={`transition-colors duration-200 ${
                active ? "text-primary" : "text-muted-foreground"
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
