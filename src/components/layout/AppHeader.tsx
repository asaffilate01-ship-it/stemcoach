import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, LayoutDashboard, GraduationCap, Trophy, Menu, X, LogOut, Users, Sparkles, Award, Medal, ScrollText, Eye, Building2, BookCheck, Bot, CreditCard, BarChart3, Settings, Database, CalendarDays, Brain, Video, FileText, Layers, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { NotificationBell } from "./NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  to: string;
  label: string;
  icon: typeof BookOpen;
  roles?: string[];
  group?: string;
}

const navItems: NavItem[] = [
  { to: "/", label: "Home", icon: BookOpen },
  { to: "/subjects", label: "Subjects", icon: GraduationCap },
  { to: "/mock-exam", label: "Exam", icon: Trophy },
  { to: "/ai-tutor", label: "AI Tutor", icon: Bot },
  // Study group
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["student", "admin"], group: "study" },
  { to: "/flashcards", label: "Flashcards", icon: Layers, roles: ["student", "admin"], group: "study" },
  { to: "/weak-drills", label: "Drills", icon: Brain, group: "study" },
  { to: "/study-planner", label: "Planner", icon: CalendarDays, roles: ["student", "admin"], group: "study" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, roles: ["student", "admin"], group: "study" },
  { to: "/progress-report", label: "Report", icon: FileText, roles: ["student", "parent", "admin"], group: "study" },
  // Social
  { to: "/badges", label: "Badges", icon: Award, group: "social" },
  { to: "/leaderboard", label: "Leaderboard", icon: Medal, group: "social" },
  { to: "/certificates", label: "Certificates", icon: ScrollText, roles: ["student", "admin"], group: "social" },
  // Classes
  { to: "/my-classes", label: "My Classes", icon: BookCheck, roles: ["student"], group: "classes" },
  { to: "/live-classroom", label: "Live Class", icon: Video, roles: ["student", "teacher", "admin"], group: "classes" },
  // Role-specific
  { to: "/parent", label: "Parent Portal", icon: Eye, roles: ["parent"] },
  { to: "/teacher", label: "Teacher", icon: Users, roles: ["teacher", "admin"] },
  { to: "/institution", label: "Institution", icon: Building2, roles: ["admin"] },
  { to: "/admin/generate", label: "Generate", icon: Sparkles, roles: ["admin"] },
  { to: "/admin/questions", label: "Content", icon: Database, roles: ["admin"] },
  // Utility
  { to: "/settings", label: "Settings", icon: Settings, roles: ["student", "teacher", "parent", "admin"] },
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

  const filterVisible = (items: NavItem[]) =>
    items.filter(item => {
      if (!item.roles) return true;
      if (!user) return false;
      if (rolesLoading) return false;
      return item.roles.some(r => roles.includes(r as any));
    });

  const topNav = filterVisible(navItems.filter(i => !i.group));
  const studyItems = filterVisible(navItems.filter(i => i.group === "study"));
  const socialItems = filterVisible(navItems.filter(i => i.group === "social"));
  const classItems = filterVisible(navItems.filter(i => i.group === "classes"));
  const allVisible = filterVisible(navItems);

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ item }: { item: NavItem }) => (
    <Link
      to={item.to}
      className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm font-medium transition-colors ${
        isActive(item.to)
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <item.icon className="h-3.5 w-3.5" />
      {item.label}
    </Link>
  );

  const GroupDropdown = ({ label, items }: { label: string; items: NavItem[] }) => {
    if (items.length === 0) return null;
    const active = items.some(i => isActive(i.to));
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={`flex items-center gap-1 rounded px-2.5 py-1.5 text-sm font-medium transition-colors ${
            active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
          }`}>
            {label} <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {items.map(item => (
            <DropdownMenuItem key={item.to} onClick={() => navigate(item.to)} className="gap-2">
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
            S
          </span>
          <span className="hidden sm:inline">STEMCoach</span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {topNav.slice(0, 4).map(item => <NavLink key={item.to} item={item} />)}
          {user && <GroupDropdown label="Study" items={studyItems} />}
          <GroupDropdown label="Rewards" items={socialItems} />
          {classItems.length > 0 && <GroupDropdown label="Classes" items={classItems} />}
        </nav>

        <div className="flex items-center gap-2">
          {user && <NotificationBell />}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="gap-1.5 rounded text-sm">
                  <span className="hidden sm:inline max-w-[120px] truncate">{user.email}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs truncate max-w-[200px]">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")} className="gap-2">
                  <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2">
                  <Settings className="h-3.5 w-3.5" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/pricing")} className="gap-2">
                  <CreditCard className="h-3.5 w-3.5" /> Pricing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive">
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => navigate("/auth")} className="rounded">
              Sign In
            </Button>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded p-1.5 text-muted-foreground hover:text-foreground lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t bg-background px-4 py-3 lg:hidden max-h-[70vh] overflow-y-auto">
          <div className="space-y-0.5">
            {/* Top nav */}
            {topNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded px-3 py-2.5 text-sm font-medium ${
                  isActive(item.to) ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}

            {/* Study */}
            {studyItems.length > 0 && (
              <>
                <div className="pt-3 pb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Study</div>
                {studyItems.map((item) => (
                  <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 rounded px-3 py-2.5 text-sm font-medium ${
                      isActive(item.to) ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    }`}>
                    <item.icon className="h-4 w-4" />{item.label}
                  </Link>
                ))}
              </>
            )}

            {/* Rewards */}
            {socialItems.length > 0 && (
              <>
                <div className="pt-3 pb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rewards</div>
                {socialItems.map((item) => (
                  <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 rounded px-3 py-2.5 text-sm font-medium ${
                      isActive(item.to) ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    }`}>
                    <item.icon className="h-4 w-4" />{item.label}
                  </Link>
                ))}
              </>
            )}

            {/* Classes */}
            {classItems.length > 0 && (
              <>
                <div className="pt-3 pb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Classes</div>
                {classItems.map((item) => (
                  <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 rounded px-3 py-2.5 text-sm font-medium ${
                      isActive(item.to) ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    }`}>
                    <item.icon className="h-4 w-4" />{item.label}
                  </Link>
                ))}
              </>
            )}

            {/* Role-specific items (not in a group) */}
            {filterVisible(navItems.filter(i => !i.group && i.roles && !topNav.includes(i))).map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded px-3 py-2.5 text-sm font-medium ${
                  isActive(item.to) ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}>
                <item.icon className="h-4 w-4" />{item.label}
              </Link>
            ))}
          </div>

          {!user && (
            <Button size="sm" onClick={() => { setMobileOpen(false); navigate("/auth"); }} className="mt-3 w-full rounded">
              Sign In
            </Button>
          )}
        </nav>
      )}
    </header>
  );
}
