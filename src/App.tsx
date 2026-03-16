import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CookieConsent } from "@/components/CookieConsent";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/ai-tutor" element={<AITutor />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

            {/* Student */}
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/practice/:subjectId" element={<Practice />} />
            <Route path="/mock-exam" element={<MockExam />} />
            <Route path="/badges" element={<Badges />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/weak-drills" element={<WeakTopicDrill />} />
            <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
            <Route path="/live-classroom" element={<ProtectedRoute><LiveClassroom /></ProtectedRoute>} />

            {/* Protected */}
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
            <Route path="/institution" element={<ProtectedRoute requiredRole="admin"><TenantAdmin /></ProtectedRoute>} />
            <Route path="/admin/generate" element={<ProtectedRoute requiredRole="admin"><AdminGenerate /></ProtectedRoute>} />
            <Route path="/admin/questions" element={<ProtectedRoute requiredRole="admin"><AdminQuestions /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
