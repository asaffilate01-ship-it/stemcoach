import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, LayoutDashboard, GraduationCap, Trophy, LogOut, Users, Sparkles, Award, Medal, ScrollText, Eye, Building2, BookCheck, Bot, CreditCard, BarChart3, Settings, Database, CalendarDays, Brain, Video, FileText, Layers, ChevronDown, Moon, Sun, Flame, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Icon3D } from "@/components/ui/icon-3d";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useTenantBranding } from "@/hooks/useTenantBranding";
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
import type { Icon3DVariant } from "@/components/ui/icon-3d";

interface NavItem {
  to: string;
  label: string;
  labelKey?: string;
  icon: typeof BookOpen;
  roles?: string[];
  group?: string;
  image?: string;
  comingSoon?: boolean;
  variant?: Icon3DVariant;
}

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
];

function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors sm:p-2 flex items-center gap-1" aria-label="Language">
          <span className="text-sm">{current.flag}</span>
          <Globe className="h-3.5 w-3.5 hidden sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuLabel className="text-xs">{t("common.language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`gap-2 ${i18n.language === lang.code ? "bg-primary/10 text-primary" : ""}`}
          >
            <span>{lang.flag}</span>
            <span className="text-sm">{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const navItems: NavItem[] = [
  { to: "/", labelKey: "nav.home", label: "Home", icon: BookOpen, variant: "primary" },
  { to: "/subjects", labelKey: "nav.subjects", label: "Subjects", icon: GraduationCap, variant: "success" },
  { to: "/mock-exam", labelKey: "nav.exam", label: "Exam", icon: Trophy, variant: "warning" },
  { to: "/ai-tutor", labelKey: "nav.aiTutor", label: "STEMcoach", icon: Bot, image: "/assets/coach-stem.png" },
  { to: "/dashboard", labelKey: "nav.dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["student", "admin"], group: "study", variant: "primary" },
  { to: "/flashcards", labelKey: "nav.flashcards", label: "Flashcards", icon: Layers, roles: ["student", "admin"], group: "study", variant: "accent" },
  { to: "/weak-drills", labelKey: "nav.drills", label: "Drills", icon: Brain, group: "study", variant: "warning" },
  { to: "/daily-challenge", labelKey: "nav.dailyChallenge", label: "Daily Challenge", icon: Flame, group: "study", variant: "destructive" },
  { to: "/past-papers", labelKey: "nav.pastPapers", label: "Past Papers", icon: FileText, group: "study", variant: "purple" },
  { to: "/study-planner", labelKey: "nav.planner", label: "Planner", icon: CalendarDays, roles: ["student", "admin"], group: "study", variant: "success" },
  { to: "/analytics", labelKey: "nav.analytics", label: "Analytics", icon: BarChart3, roles: ["student", "admin"], group: "study", variant: "primary" },
  { to: "/progress-report", labelKey: "nav.report", label: "Report", icon: FileText, roles: ["student", "parent", "admin"], group: "study", variant: "accent" },
  { to: "/badges", labelKey: "nav.badges", label: "Badges", icon: Award, group: "social", variant: "warning" },
  { to: "/leaderboard", labelKey: "nav.leaderboard", label: "Leaderboard", icon: Medal, group: "social", variant: "primary" },
  { to: "/certificates", labelKey: "nav.certificates", label: "Certificates", icon: ScrollText, roles: ["student", "admin"], group: "social", variant: "success" },
  { to: "/study-groups", labelKey: "nav.studyGroups", label: "Study Groups", icon: Users, group: "social", variant: "purple" },
  { to: "/my-classes", labelKey: "nav.myClasses", label: "My Classes", icon: BookCheck, roles: ["student"], group: "classes", variant: "primary" },
  { to: "/live-classroom", labelKey: "nav.liveClass", label: "Live Class", icon: Video, roles: ["student", "teacher", "admin"], group: "classes", comingSoon: true, variant: "destructive" },
  { to: "/formulas", labelKey: "nav.formulaSheets", label: "Formula Sheets", icon: ScrollText, group: "resources", variant: "accent" },
  { to: "/blog", labelKey: "nav.blog", label: "Blog", icon: FileText, group: "resources", variant: "purple" },
  { to: "/parent", labelKey: "nav.parentPortal", label: "Parent Portal", icon: Eye, roles: ["parent"], variant: "success" },
  { to: "/teacher", labelKey: "nav.teacher", label: "Teacher", icon: Users, roles: ["teacher", "admin"], variant: "primary" },
  { to: "/institution", labelKey: "nav.myInstitution", label: "My Institution", icon: Building2, group: "classes", variant: "purple", roles: ["student", "teacher", "admin"] },
  { to: "/join-institution", labelKey: "nav.joinInstitution", label: "Join Institution", icon: Building2, group: "classes", variant: "purple", roles: ["student", "teacher", "admin"] },
  { to: "/admin/generate", labelKey: "nav.generate", label: "Generate", icon: Sparkles, roles: ["admin"], variant: "warning" },
  { to: "/admin/questions", labelKey: "nav.content", label: "Content", icon: Database, roles: ["admin"], variant: "accent" },
  { to: "/settings", labelKey: "nav.settings", label: "Settings", icon: Settings, roles: ["student", "teacher", "parent", "admin"], variant: "primary" },
  { to: "/pricing", labelKey: "nav.pricing", label: "Pricing", icon: CreditCard, variant: "success" },
];

export function AppHeader() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { roles, loading: rolesLoading } = useUserRole();
  const { theme, toggleTheme } = useTheme();
  const tenant = useTenantBranding();

  const handleSignOut = async () => {
    await signOut();
    navigate("/home");
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
      className={`group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        isActive(item.to)
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {item.image ? (
        <img src={item.image} alt={item.label} className="h-5 w-5 rounded-sm object-cover" />
      ) : (
        <Icon3D icon={item.icon} variant={item.variant || "primary"} size="xs" />
      )}
      {item.labelKey ? t(item.labelKey) : item.label}
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
        <DropdownMenuContent align="start" className="min-w-[200px]">
          {items.map(item => (
            <DropdownMenuItem key={item.to} onClick={() => navigate(item.to)} className="gap-2.5 py-2">
              <Icon3D icon={item.icon} variant={item.variant || "primary"} size="xs" />
              {item.labelKey ? t(item.labelKey) : item.label}
              {item.comingSoon && <span className="ml-auto rounded-full bg-warning/15 px-1.5 py-0.5 text-[9px] font-bold text-warning">{t("nav.soon")}</span>}
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
        <Link to="/home" className="group flex items-center gap-2">
          <img
            src={tenant.logoUrl || "/assets/coach-stem.png"}
            alt={tenant.name || "Coach Stem"}
            className="h-7 w-7 rounded-lg shadow-sm shadow-primary/20 transition-transform duration-300 group-hover:scale-105 sm:h-8 sm:w-8 sm:rounded-xl object-cover"
          />
          <span className="font-bold tracking-tight text-foreground text-sm sm:text-base">
            {tenant.name ? (
              <>{tenant.name}</>
            ) : (
              <>STEM<span className="text-primary">Coach</span></>
            )}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {topNav.slice(0, 4).map(item => <NavLink key={item.to} item={item} />)}
          {user && <GroupDropdown label={t("nav.groupStudy")} items={studyItems} />}
          <GroupDropdown label={t("nav.groupRewards")} items={socialItems} />
          {classItems.length > 0 && <GroupDropdown label={t("nav.groupClasses")} items={classItems} />}
          <GroupDropdown label={t("nav.groupResources")} items={resourceItems} />
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language selector */}
          <LanguageSelector />
          <button
            onClick={toggleTheme}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors sm:p-2"
            aria-label={t("nav.toggleTheme")}
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
                <DropdownMenuItem onClick={() => navigate("/dashboard")} className="gap-2.5 py-2">
                  <Icon3D icon={LayoutDashboard} variant="primary" size="xs" /> {t("nav.dashboard")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2.5 py-2">
                  <Icon3D icon={Settings} variant="accent" size="xs" /> {t("nav.settings")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/pricing")} className="gap-2.5 py-2">
                  <Icon3D icon={CreditCard} variant="success" size="xs" /> {t("nav.pricing")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2.5 py-2 text-destructive">
                  <Icon3D icon={LogOut} variant="destructive" size="xs" /> {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => navigate("/auth")} className="rounded-lg shadow-sm h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm">
              {t("nav.login")}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
