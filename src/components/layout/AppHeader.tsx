import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, LayoutDashboard, GraduationCap, Trophy, LogOut, Users, Sparkles, Award, Medal, ScrollText, Eye, Building2, BookCheck, Bot, CreditCard, BarChart3, Settings, Database, CalendarDays, Brain, Video, FileText, Layers, ChevronDown, Moon, Sun, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { NotificationBell } from "./NotificationBell";
import { useTheme } from "@/hooks/useTheme";
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
  image?: string;
}

const navItems: NavItem[] = [
  { to: "/", label: "Home", icon: BookOpen },
  { to: "/subjects", label: "Subjects", icon: GraduationCap },
  { to: "/mock-exam", label: "Exam", icon: Trophy },
  { to: "/ai-tutor", label: "STEMcoach", icon: Bot, image: "/assets/coach-stem.png" },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["student", "admin"], group: "study" },
  { to: "/flashcards", label: "Flashcards", icon: Layers, roles: ["student", "admin"], group: "study" },
  { to: "/weak-drills", label: "Drills", icon: Brain, group: "study" },
  { to: "/daily-challenge", label: "Daily Challenge", icon: Flame, group: "study" },
  { to: "/past-papers", label: "Past Papers", icon: FileText, group: "study" },
  { to: "/study-planner", label: "Planner", icon: CalendarDays, roles: ["student", "admin"], group: "study" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, roles: ["student", "admin"], group: "study" },
  { to: "/progress-report", label: "Report", icon: FileText, roles: ["student", "parent", "admin"], group: "study" },
  { to: "/badges", label: "Badges", icon: Award, group: "social" },
  { to: "/leaderboard", label: "Leaderboard", icon: Medal, group: "social" },
  { to: "/certificates", label: "Certificates", icon: ScrollText, roles: ["student", "admin"], group: "social" },
  { to: "/study-groups", label: "Study Groups", icon: Users, group: "social" },
  { to: "/my-classes", label: "My Classes", icon: BookCheck, roles: ["student"], group: "classes" },
  { to: "/live-classroom", label: "Live Class", icon: Video, roles: ["student", "teacher", "admin"], group: "classes", comingSoon: true },
  { to: "/formulas", label: "Formula Sheets", icon: ScrollText, group: "resources" },
  { to: "/blog", label: "Blog", icon: FileText, group: "resources" },
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
  const resourceItems = filterVisible(navItems.filter(i => i.group === "resources"));

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
      {item.image ? (
        <img src={item.image} alt={item.label} className="h-4 w-4 rounded-sm object-cover" />
      ) : (
        <item.icon className="h-3.5 w-3.5" />
      )}
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
    <header className="sticky top-0 z-50 border-b border-border/20 bg-background/70 backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300">
      <div className="container mx-auto flex h-12 items-center justify-between px-4 sm:h-14">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2">
          <img
            src="/assets/coach-stem.png"
            alt="Coach Stem"
            className="h-7 w-7 rounded-lg shadow-sm shadow-primary/20 transition-transform duration-300 group-hover:scale-105 sm:h-8 sm:w-8 sm:rounded-xl object-cover"
          />
          <span className="font-bold tracking-tight text-foreground text-sm sm:text-base">
            STEM<span className="text-primary">Coach</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {topNav.slice(0, 4).map(item => <NavLink key={item.to} item={item} />)}
          {user && <GroupDropdown label="Study" items={studyItems} />}
          <GroupDropdown label="Rewards" items={socialItems} />
          {classItems.length > 0 && <GroupDropdown label="Classes" items={classItems} />}
          <GroupDropdown label="Resources" items={resourceItems} />
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors sm:p-2"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user && <NotificationBell />}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="gap-1.5 rounded-lg text-xs h-8 px-2 sm:h-9 sm:px-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.email?.split("@")[0]}</span>
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
            <Button size="sm" onClick={() => navigate("/auth")} className="rounded-lg shadow-sm h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
