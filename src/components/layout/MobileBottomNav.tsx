import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Trophy, LayoutDashboard, Bot } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/ai-tutor", label: "AI Tutor", icon: Bot },
  { to: "/mock-exam", label: "Exam", icon: Trophy },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, auth: true },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const visible = items.filter(i => !i.auth || user);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 bg-background/80 backdrop-blur-2xl backdrop-saturate-150 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-1.5 px-1">
        {visible.map((item) => {
          const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition-all ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${active ? "bg-primary/10" : ""}`}>
                <item.icon className={`h-[18px] w-[18px] ${active ? "text-primary" : ""}`} />
              </div>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
