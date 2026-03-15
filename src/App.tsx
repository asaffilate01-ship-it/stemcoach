import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import Badges from "./pages/Badges";
import Leaderboard from "./pages/Leaderboard";
import Certificates from "./pages/Certificates";
import Pricing from "./pages/Pricing";
import AITutor from "./pages/AITutor";
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

            {/* Student */}
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/practice/:subjectId" element={<Practice />} />
            <Route path="/mock-exam" element={<MockExam />} />
            <Route path="/badges" element={<Badges />} />
            <Route path="/leaderboard" element={<Leaderboard />} />

            {/* Protected */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
            <Route path="/my-classes" element={<ProtectedRoute><StudentClasses /></ProtectedRoute>} />
            <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/parent" element={<ProtectedRoute><ParentDashboard /></ProtectedRoute>} />
            <Route path="/institution" element={<ProtectedRoute><TenantAdmin /></ProtectedRoute>} />
            <Route path="/admin/generate" element={<ProtectedRoute><AdminGenerate /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
