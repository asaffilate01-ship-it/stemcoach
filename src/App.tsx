import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SessionGuard } from "@/components/SessionGuard";
import { CookieConsent } from "@/components/CookieConsent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageTransition } from "@/components/layout/PageTransition";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SkipToContent } from "@/components/layout/SkipToContent";
import Index from "./pages/Index";
import Subjects from "./pages/Subjects";
import Practice from "./pages/Practice";
import Dashboard from "./pages/Dashboard";
import MockExam from "./pages/MockExam";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import TeacherDashboard from "./pages/TeacherDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import StudentClasses from "./pages/StudentClasses";
import TenantAdmin from "./pages/TenantAdmin";
import AdminGenerate from "./pages/AdminGenerate";
import AdminQuestions from "./pages/AdminQuestions";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Badges from "./pages/Badges";
import Leaderboard from "./pages/Leaderboard";
import Certificates from "./pages/Certificates";
import Pricing from "./pages/Pricing";
import AITutor from "./pages/AITutor";
import StudyPlanner from "./pages/StudyPlanner";
import WeakTopicDrill from "./pages/WeakTopicDrill";
import LiveClassroom from "./pages/LiveClassroom";
import ProgressReports from "./pages/ProgressReports";
import Flashcards from "./pages/Flashcards";
import Onboarding from "./pages/Onboarding";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import InstallApp from "./pages/InstallApp";
import { DevToolsPanel } from "./components/dev/DevToolsPanel";

const queryClient = new QueryClient();

const P = ({ children }: { children: React.ReactNode }) => (
  <PageTransition>{children}</PageTransition>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SessionGuard />
            <SkipToContent />
            <ScrollToTop />
            <div className="pb-16 lg:pb-0">
              <Routes>
                {/* Public */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<P><Auth /></P>} />
                <Route path="/reset-password" element={<P><ResetPassword /></P>} />
                <Route path="/pricing" element={<P><Pricing /></P>} />
                <Route path="/ai-tutor" element={<P><AITutor /></P>} />
                <Route path="/privacy" element={<P><PrivacyPolicy /></P>} />
                <Route path="/install" element={<P><InstallApp /></P>} />
                <Route path="/terms" element={<P><TermsOfService /></P>} />
                <Route path="/onboarding" element={<ProtectedRoute><P><Onboarding /></P></ProtectedRoute>} />

                {/* Student */}
                <Route path="/subjects" element={<P><Subjects /></P>} />
                <Route path="/practice/:subjectId" element={<P><Practice /></P>} />
                <Route path="/mock-exam" element={<P><MockExam /></P>} />
                <Route path="/badges" element={<P><Badges /></P>} />
                <Route path="/leaderboard" element={<P><Leaderboard /></P>} />
                <Route path="/weak-drills" element={<P><WeakTopicDrill /></P>} />
                <Route path="/flashcards" element={<ProtectedRoute><P><Flashcards /></P></ProtectedRoute>} />
                <Route path="/live-classroom" element={<ProtectedRoute><P><LiveClassroom /></P></ProtectedRoute>} />

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
                <Route path="/institution" element={<ProtectedRoute requiredRole="admin"><P><TenantAdmin /></P></ProtectedRoute>} />
                <Route path="/admin/generate" element={<ProtectedRoute requiredRole="admin"><P><AdminGenerate /></P></ProtectedRoute>} />
                <Route path="/admin/questions" element={<ProtectedRoute requiredRole="admin"><P><AdminQuestions /></P></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <MobileBottomNav />
            <CookieConsent />
            <DevToolsPanel />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
