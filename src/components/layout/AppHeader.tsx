import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, LayoutDashboard, GraduationCap, Trophy, Menu, X, LogOut, Users, Sparkles, Award, Medal, ScrollText, Eye, Building2, BookCheck, Bot, CreditCard, BarChart3, Settings, Database, CalendarDays, Brain, Video, FileText, Layers } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { NotificationBell } from "./NotificationBell";

interface NavItem {
  to: string;
  label: string;
  icon: typeof BookOpen;
  roles?: string[]; // if set, only show for these roles. empty = public
}

const navItems: NavItem[] = [
  { to: "/", label: "Home", icon: BookOpen },
  { to: "/subjects", label: "Subjects", icon: GraduationCap },
  { to: "/ai-tutor", label: "AI Tutor", icon: Bot },
  { to: "/my-classes", label: "Classes", icon: BookCheck, roles: ["student"] },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["student", "admin"] },
  { to: "/mock-exam", label: "Exam", icon: Trophy },
  { to: "/badges", label: "Badges", icon: Award },
  { to: "/leaderboard", label: "Board", icon: Medal },
  { to: "/certificates", label: "Certs", icon: ScrollText, roles: ["student", "admin"] },
  { to: "/parent", label: "Parent", icon: Eye, roles: ["parent"] },
  { to: "/teacher", label: "Teacher", icon: Users, roles: ["teacher", "admin"] },
  { to: "/institution", label: "Admin", icon: Building2, roles: ["admin"] },
  { to: "/admin/generate", label: "Generate", icon: Sparkles, roles: ["admin"] },
  { to: "/admin/questions", label: "Content", icon: Database, roles: ["admin"] },
  { to: "/weak-drills", label: "Drills", icon: Brain },
  { to: "/live-classroom", label: "Live Class", icon: Video, roles: ["student", "teacher", "admin"] },
  { to: "/analytics", label: "Analytics", icon: BarChart3, roles: ["student", "admin"] },
  { to: "/study-planner", label: "Planner", icon: CalendarDays, roles: ["student", "admin"] },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["student", "teacher", "parent", "admin"] },
  { to: "/progress-report", label: "Report", icon: FileText, roles: ["student", "parent", "admin"] },
  { to: "/pricing", label: "Pricing", icon: CreditCard },
];

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { roles, loading: rolesLoading } = useUserRole();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const visibleItems = navItems.filter(item => {
    if (!item.roles) return true; // public nav item
    if (!user) return false; // hide role-based items for guests
    if (rolesLoading) return false;
    return item.roles.some(r => roles.includes(r as any));
  });

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
          {visibleItems.map((item) => (
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
          <NotificationBell />
          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.email}
              </span>
              <Button size="sm" variant="outline" onClick={handleSignOut} className="gap-1.5 rounded">
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => navigate("/auth")} className="rounded">
              Sign In
            </Button>
          )}
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
          {visibleItems.map((item) => (
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
          {!user && (
            <Button size="sm" onClick={() => { setMobileOpen(false); navigate("/auth"); }} className="mt-2 w-full rounded">
              Sign In
            </Button>
          )}
        </nav>
      )}
    </header>
  );
}
