import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, LayoutDashboard, GraduationCap, Trophy, Menu, X, LogOut, Users, Sparkles, Award, Medal, ScrollText, Eye, Building2, BookCheck, Bot, CreditCard, BarChart3, Settings, Database, CalendarDays, Brain, Video, FileText, Layers, ChevronDown, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { NotificationBell } from "./NotificationBell";
import { useTheme } from "@/hooks/useTheme";
import { motion, AnimatePresence } from "framer-motion";
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
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["student", "admin"], group: "study" },
  { to: "/flashcards", label: "Flashcards", icon: Layers, roles: ["student", "admin"], group: "study" },
  { to: "/weak-drills", label: "Drills", icon: Brain, group: "study" },
  { to: "/study-planner", label: "Planner", icon: CalendarDays, roles: ["student", "admin"], group: "study" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, roles: ["student", "admin"], group: "study" },
  { to: "/progress-report", label: "Report", icon: FileText, roles: ["student", "parent", "admin"], group: "study" },
  { to: "/badges", label: "Badges", icon: Award, group: "social" },
  { to: "/leaderboard", label: "Leaderboard", icon: Medal, group: "social" },
  { to: "/certificates", label: "Certificates", icon: ScrollText, roles: ["student", "admin"], group: "social" },
  { to: "/my-classes", label: "My Classes", icon: BookCheck, roles: ["student"], group: "classes" },
  { to: "/live-classroom", label: "Live Class", icon: Video, roles: ["student", "teacher", "admin"], group: "classes" },
  { to: "/parent", label: "Parent Portal", icon: Eye, roles: ["parent"] },
  { to: "/teacher", label: "Teacher", icon: Users, roles: ["teacher", "admin"] },
  { to: "/institution", label: "Institution", icon: Building2, roles: ["admin"] },
  { to: "/admin/generate", label: "Generate", icon: Sparkles, roles: ["admin"] },
  { to: "/admin/questions", label: "Content", icon: Database, roles: ["admin"] },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["student", "teacher", "parent", "admin"] },
  { to: "/pricing", label: "Pricing", icon: CreditCard },
];

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { roles, loading: rolesLoading } = useUserRole();
  const { theme, toggleTheme } = useTheme();
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

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ item }: { item: NavItem }) => (
    <Link
      to={item.to}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        isActive(item.to)
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
          <button className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}>
            {label} <ChevronDown className="h-3 w-3 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[180px]">
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
    <header className="sticky top-0 z-50 border-b border-border/30 bg-background/70 backdrop-blur-2xl backdrop-saturate-150">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[hsl(258_60%_52%)] text-sm font-extrabold text-white shadow-sm shadow-primary/20">
            S
          </span>
          <span className="hidden font-bold tracking-tight text-foreground sm:inline">
            STEM<span className="text-primary">Coach</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {topNav.slice(0, 4).map(item => <NavLink key={item.to} item={item} />)}
          {user && <GroupDropdown label="Study" items={studyItems} />}
          <GroupDropdown label="Rewards" items={socialItems} />
          {classItems.length > 0 && <GroupDropdown label="Classes" items={classItems} />}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user && <NotificationBell />}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="gap-1.5 rounded-lg text-sm">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate text-xs">{user.email?.split("@")[0]}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px]">
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
            <Button size="sm" onClick={() => navigate("/auth")} className="rounded-lg shadow-sm">
              Sign In
            </Button>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav with animation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t bg-background lg:hidden"
          >
            <div className="px-4 py-4 max-h-[70vh] overflow-y-auto space-y-0.5">
              {topNav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    isActive(item.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}

              {studyItems.length > 0 && (
                <>
                  <div className="pt-4 pb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Study</div>
                  {studyItems.map((item) => (
                    <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                        isActive(item.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                      }`}>
                      <item.icon className="h-4 w-4" />{item.label}
                    </Link>
                  ))}
                </>
              )}

              {socialItems.length > 0 && (
                <>
                  <div className="pt-4 pb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rewards</div>
                  {socialItems.map((item) => (
                    <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                        isActive(item.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                      }`}>
                      <item.icon className="h-4 w-4" />{item.label}
                    </Link>
                  ))}
                </>
              )}

              {classItems.length > 0 && (
                <>
                  <div className="pt-4 pb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Classes</div>
                  {classItems.map((item) => (
                    <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                        isActive(item.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                      }`}>
                      <item.icon className="h-4 w-4" />{item.label}
                    </Link>
                  ))}
                </>
              )}

              {filterVisible(navItems.filter(i => !i.group && i.roles && !topNav.includes(i))).map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    isActive(item.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  }`}>
                  <item.icon className="h-4 w-4" />{item.label}
                </Link>
              ))}

              {!user && (
                <Button size="sm" onClick={() => { setMobileOpen(false); navigate("/auth"); }} className="mt-4 w-full rounded-lg">
                  Sign In
                </Button>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
