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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-xl lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-1.5 px-1">
        {visible.map((item) => {
          const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
