import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md"
        >
          {/* Animated 404 */}
          <div className="relative mx-auto mb-8">
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: [20, 0, 20] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-[120px] font-black leading-none tracking-tighter stem-gradient-text sm:text-[160px]"
            >
              404
            </motion.div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_70%)]" />
          </div>

          <h1 className="mb-3 text-2xl font-bold tracking-tight">Page not found</h1>
          <p className="mb-8 text-muted-foreground">
            The page <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-foreground">{location.pathname}</code> doesn't exist or has been moved.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => navigate(-1)} variant="outline" className="gap-2 rounded-xl">
              <ArrowLeft className="h-4 w-4" /> Go Back
            </Button>
            <Button onClick={() => navigate("/")} className="gap-2 rounded-xl">
              <Home className="h-4 w-4" /> Home
            </Button>
            <Button onClick={() => navigate("/subjects")} variant="outline" className="gap-2 rounded-xl">
              <Search className="h-4 w-4" /> Subjects
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default NotFound;
