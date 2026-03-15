import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Subjects from "./pages/Subjects";
import Practice from "./pages/Practice";
import Dashboard from "./pages/Dashboard";
import MockExam from "./pages/MockExam";
import Auth from "./pages/Auth";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminGenerate from "./pages/AdminGenerate";
import Badges from "./pages/Badges";
import Leaderboard from "./pages/Leaderboard";
import Certificates from "./pages/Certificates";
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
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/practice/:subjectId" element={<Practice />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/mock-exam" element={<MockExam />} />
            <Route path="/badges" element={<Badges />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/admin/generate" element={<AdminGenerate />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
