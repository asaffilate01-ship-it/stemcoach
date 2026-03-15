import { Link, useLocation } from "react-router-dom";
import { BookOpen, LayoutDashboard, GraduationCap, Trophy, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", label: "Home", icon: BookOpen },
  { to: "/subjects", label: "Subjects", icon: GraduationCap },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/mock-exam", label: "Mock Exam", icon: Trophy },
];

export function AppHeader() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
            S
          </span>
          <span className="hidden sm:inline">STEMCoach</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                location.pathname === item.to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button size="sm" className="hidden rounded sm:inline-flex">
            Sign Up Free
          </Button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded p-1.5 text-muted-foreground hover:text-foreground md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t bg-background px-4 py-3 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-medium ${
                location.pathname === item.to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <Button size="sm" className="mt-2 w-full rounded">
            Sign Up Free
          </Button>
        </nav>
      )}
    </header>
  );
}
