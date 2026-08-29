import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { TenantBrandingProvider } from "@/hooks/useTenantBranding";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SessionGuard } from "@/components/SessionGuard";
import { CookieConsent } from "@/components/CookieConsent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageTransition } from "@/components/layout/PageTransition";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SkipToContent } from "@/components/layout/SkipToContent";

// Lazy-loaded pages for code-splitting
const Index = lazy(() => import("./pages/Index"));
const Promo = lazy(() => import("./pages/Promo"));
const Subjects = lazy(() => import("./pages/Subjects"));
const Practice = lazy(() => import("./pages/Practice"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MockExam = lazy(() => import("./pages/MockExam"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const ParentDashboard = lazy(() => import("./pages/ParentDashboard"));
const StudentClasses = lazy(() => import("./pages/StudentClasses"));
const TenantAdmin = lazy(() => import("./pages/TenantAdmin"));
const AdminGenerate = lazy(() => import("./pages/AdminGenerate"));
const AdminQuestions = lazy(() => import("./pages/AdminQuestions"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const Badges = lazy(() => import("./pages/Badges"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Pricing = lazy(() => import("./pages/Pricing"));
const AITutor = lazy(() => import("./pages/AITutor"));
const StudyPlanner = lazy(() => import("./pages/StudyPlanner"));
const WeakTopicDrill = lazy(() => import("./pages/WeakTopicDrill"));
const LiveClassroom = lazy(() => import("./pages/LiveClassroom"));
const ProgressReports = lazy(() => import("./pages/ProgressReports"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const SelectSubjects = lazy(() => import("./pages/SelectSubjects"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const InstallApp = lazy(() => import("./pages/InstallApp"));
const FormulaSheets = lazy(() => import("./pages/FormulaSheets"));
const PastPapers = lazy(() => import("./pages/PastPapers"));
const DailyChallenge = lazy(() => import("./pages/DailyChallenge"));
const StudyGroups = lazy(() => import("./pages/StudyGroups"));
const Blog = lazy(() => import("./pages/Blog"));
const MeetTheSquad = lazy(() => import("./pages/MeetTheSquad"));
const RegisterInstitution = lazy(() => import("./pages/RegisterInstitution"));
const JoinInstitution = lazy(() => import("./pages/JoinInstitution"));
const Support = lazy(() => import("./pages/Support"));
const Tutorials = lazy(() => import("./pages/Tutorials"));

// Keep test credentials and development helpers out of production bundles.
const DevToolsPanel = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_TOOLS === "true"
  ? lazy(() => import("./components/dev/DevToolsPanel").then(m => ({ default: m.DevToolsPanel })))
  : null;

const queryClient = new QueryClient();
const previewEnabled = import.meta.env.VITE_PREVIEW_GATE_ENABLED !== "false";

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
      <span className="text-sm text-muted-foreground">Loading…</span>
    </div>
  </div>
);

// Public (always reachable) page wrapper
const Pub = ({ children }: { children: React.ReactNode }) => (
  <PageTransition>{children}</PageTransition>
);

const P = ({ children }: { children: React.ReactNode }) => (
  previewEnabled
    ? <PromoGate><PageTransition>{children}</PageTransition></PromoGate>
    : <PageTransition>{children}</PageTransition>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TenantBrandingProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <SessionGuard />
              <SkipToContent />
              <ScrollToTop />
              <div className="pb-16 lg:pb-0">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public */}
                    <Route path="/" element={previewEnabled ? <Promo /> : <Index />} />
                    <Route path="/home" element={<P><Index /></P>} />
                    <Route path="/auth" element={<P><Auth /></P>} />
                    <Route path="/reset-password" element={<P><ResetPassword /></P>} />
                    <Route path="/pricing" element={<P><Pricing /></P>} />
                    <Route path="/privacy" element={<Pub><PrivacyPolicy /></Pub>} />
                    <Route path="/install" element={<P><InstallApp /></P>} />
                    <Route path="/terms" element={<Pub><TermsOfService /></Pub>} />
                    <Route path="/cookies" element={<Pub><CookiePolicy /></Pub>} />
                    <Route path="/blog" element={<P><Blog /></P>} />
                    <Route path="/blog/:slug" element={<P><Blog /></P>} />
                    <Route path="/meet-the-squad" element={<P><MeetTheSquad /></P>} />
                    <Route path="/register-institution" element={<P><RegisterInstitution /></P>} />
                    <Route path="/join-institution" element={<P><JoinInstitution /></P>} />
                    <Route path="/formulas" element={<P><FormulaSheets /></P>} />
                    <Route path="/support" element={<P><Support /></P>} />
                    <Route path="/tutorials" element={<P><Tutorials /></P>} />

                    {/* Auth-required public */}
                    <Route path="/onboarding" element={<ProtectedRoute><P><Onboarding /></P></ProtectedRoute>} />
                    <Route path="/select-subjects" element={<ProtectedRoute><P><SelectSubjects /></P></ProtectedRoute>} />

                    {/* Student — require auth */}
                    <Route path="/subjects" element={<ProtectedRoute><P><Subjects /></P></ProtectedRoute>} />
                    <Route path="/practice/:subjectId" element={<ProtectedRoute><P><Practice /></P></ProtectedRoute>} />
                    <Route path="/mock-exam" element={<ProtectedRoute><P><MockExam /></P></ProtectedRoute>} />
                    <Route path="/ai-tutor" element={<ProtectedRoute><P><AITutor /></P></ProtectedRoute>} />
                    <Route path="/badges" element={<ProtectedRoute><P><Badges /></P></ProtectedRoute>} />
                    <Route path="/leaderboard" element={<ProtectedRoute><P><Leaderboard /></P></ProtectedRoute>} />
                    <Route path="/weak-drills" element={<ProtectedRoute><P><WeakTopicDrill /></P></ProtectedRoute>} />
                    <Route path="/flashcards" element={<ProtectedRoute><P><Flashcards /></P></ProtectedRoute>} />
                    <Route path="/live-classroom" element={<ProtectedRoute><P><LiveClassroom /></P></ProtectedRoute>} />
                    <Route path="/daily-challenge" element={<ProtectedRoute><P><DailyChallenge /></P></ProtectedRoute>} />
                    <Route path="/past-papers" element={<ProtectedRoute><P><PastPapers /></P></ProtectedRoute>} />
                    <Route path="/study-groups" element={<ProtectedRoute><P><StudyGroups /></P></ProtectedRoute>} />

                    {/* Protected */}
                    <Route path="/dashboard" element={<ProtectedRoute><P><Dashboard /></P></ProtectedRoute>} />
                    <Route path="/certificates" element={<ProtectedRoute><P><Certificates /></P></ProtectedRoute>} />
                    <Route path="/my-classes" element={<ProtectedRoute><P><StudentClasses /></P></ProtectedRoute>} />
                    <Route path="/analytics" element={<ProtectedRoute><P><Analytics /></P></ProtectedRoute>} />
                    <Route path="/study-planner" element={<ProtectedRoute><P><StudyPlanner /></P></ProtectedRoute>} />
                    <Route path="/progress-report" element={<ProtectedRoute><P><ProgressReports /></P></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><P><Settings /></P></ProtectedRoute>} />

                    {/* Role-protected */}
                    <Route path="/teacher" element={<ProtectedRoute requiredRole="teacher"><P><TeacherDashboard /></P></ProtectedRoute>} />
                    <Route path="/parent" element={<ProtectedRoute requiredRole="parent"><P><ParentDashboard /></P></ProtectedRoute>} />
                    <Route path="/institution" element={<ProtectedRoute><P><TenantAdmin /></P></ProtectedRoute>} />
                    <Route path="/admin/generate" element={<ProtectedRoute requiredRole="admin"><P><AdminGenerate /></P></ProtectedRoute>} />
                    <Route path="/admin/questions" element={<ProtectedRoute requiredRole="admin"><P><AdminQuestions /></P></ProtectedRoute>} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
              <MobileBottomNav />
              <CookieConsent />
              {DevToolsPanel && (
                <Suspense fallback={null}>
                  <DevToolsPanel />
                </Suspense>
              )}
            </BrowserRouter>
          </TooltipProvider>
        </TenantBrandingProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
