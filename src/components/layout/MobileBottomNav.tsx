import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import homeIcon from "@/assets/icons/home-3d.png";
import subjectsIcon from "@/assets/icons/subjects-3d.png";
import examsIcon from "@/assets/icons/exams-3d.png";
import dashboardIcon from "@/assets/icons/dashboard-3d.png";

const items = [
  { to: "/", label: "Home", image: homeIcon },
  { to: "/subjects", label: "Subjects", image: subjectsIcon },
  { to: "/ai-tutor", label: "STEMcoach", image: "/assets/coach-stem.png" },
  { to: "/mock-exam", label: "Exam", image: examsIcon },
  { to: "/dashboard", label: "Dashboard", image: dashboardIcon, auth: true },
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
                active ? "scale-110" : ""
              }`}>
                <img
                  src={item.image}
                  alt={item.label}
                  className={`h-7 w-7 object-contain transition-all duration-300 ${
                    active ? "scale-110 drop-shadow-md" : "opacity-60 grayscale-[30%]"
                  }`}
                />
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
