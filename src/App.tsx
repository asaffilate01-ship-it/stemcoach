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
import { PersistentCoach } from "@/components/layout/PersistentCoach";

// Lazy-loaded pages for code-splitting
const Index = lazy(() => import("./pages/Index"));
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
                    {/* Public landing */}
                    <Route path="/" element={<Pub><Index /></Pub>} />
                    <Route path="/home" element={<Pub><Index /></Pub>} />

                    {/* Auth pages remain available for those who want accounts */}
                    <Route path="/auth" element={<Pub><Auth /></Pub>} />
                    <Route path="/reset-password" element={<Pub><ResetPassword /></Pub>} />

                    {/* Public app surfaces */}
                    <Route path="/pricing" element={<Pub><Pricing /></Pub>} />
                    <Route path="/privacy" element={<Pub><PrivacyPolicy /></Pub>} />
                    <Route path="/install" element={<Pub><InstallApp /></Pub>} />
                    <Route path="/terms" element={<Pub><TermsOfService /></Pub>} />
                    <Route path="/cookies" element={<Pub><CookiePolicy /></Pub>} />
                    <Route path="/blog" element={<Pub><Blog /></Pub>} />
                    <Route path="/blog/:slug" element={<Pub><Blog /></Pub>} />
                    <Route path="/meet-the-squad" element={<Pub><MeetTheSquad /></Pub>} />
                    <Route path="/register-institution" element={<Pub><RegisterInstitution /></Pub>} />
                    <Route path="/join-institution" element={<Pub><JoinInstitution /></Pub>} />
                    <Route path="/formulas" element={<Pub><FormulaSheets /></Pub>} />
                    <Route path="/support" element={<Pub><Support /></Pub>} />
                    <Route path="/tutorials" element={<Pub><Tutorials /></Pub>} />

                    {/* Student features — available without login; pages handle anonymous state */}
                    <Route path="/subjects" element={<Pub><Subjects /></Pub>} />
                    <Route path="/practice/:subjectId" element={<Pub><Practice /></Pub>} />
                    <Route path="/mock-exam" element={<Pub><MockExam /></Pub>} />
                    <Route path="/ai-tutor" element={<Pub><AITutor /></Pub>} />
                    <Route path="/badges" element={<Pub><Badges /></Pub>} />
                    <Route path="/leaderboard" element={<Pub><Leaderboard /></Pub>} />
                    <Route path="/weak-drills" element={<Pub><WeakTopicDrill /></Pub>} />
                    <Route path="/flashcards" element={<Pub><Flashcards /></Pub>} />
                    <Route path="/live-classroom" element={<Pub><LiveClassroom /></Pub>} />
                    <Route path="/daily-challenge" element={<Pub><DailyChallenge /></Pub>} />
                    <Route path="/past-papers" element={<Pub><PastPapers /></Pub>} />
                    <Route path="/study-groups" element={<Pub><StudyGroups /></Pub>} />

                    {/* Account-only features */}
                    <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                    <Route path="/select-subjects" element={<ProtectedRoute><SelectSubjects /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
                    <Route path="/my-classes" element={<ProtectedRoute><StudentClasses /></ProtectedRoute>} />
                    <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                    <Route path="/study-planner" element={<ProtectedRoute><StudyPlanner /></ProtectedRoute>} />
                    <Route path="/progress-report" element={<ProtectedRoute><ProgressReports /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                    {/* Role-protected */}
                    <Route path="/teacher" element={<ProtectedRoute requiredRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
                    <Route path="/parent" element={<ProtectedRoute requiredRole="parent"><ParentDashboard /></ProtectedRoute>} />
                    <Route path="/institution" element={<ProtectedRoute><TenantAdmin /></ProtectedRoute>} />
                    <Route path="/admin/generate" element={<ProtectedRoute requiredRole="admin"><AdminGenerate /></ProtectedRoute>} />
                    <Route path="/admin/questions" element={<ProtectedRoute allowedRoles={["admin", "reviewer"]}><AdminQuestions /></ProtectedRoute>} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
              <MobileBottomNav />
              <PersistentCoach />
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
