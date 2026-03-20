import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";
import { getSquadMembers } from "@/lib/mascots";

const confused404Messages = [
  { text: "I've searched every equation, but this page doesn't compute!", subjectHint: "mathematics" },
  { text: "This page has less energy than a spent battery!", subjectHint: "physics" },
  { text: "No reaction here — this page is inert!", subjectHint: "chemistry" },
  { text: "I've looked through every cell, but this page has gone extinct!", subjectHint: "biology" },
  { text: "Error 404: Page not found in any database!", subjectHint: "computer-science" },
  { text: "I can't find the right words for this missing page!", subjectHint: "ielts" },
];

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [messageIndex] = useState(() => Math.floor(Math.random() * confused404Messages.length));

  const chosen = confused404Messages[messageIndex];
  const members = getSquadMembers();
  const mascot = members.find(m => m.subjectId === chosen.subjectHint) || members[0];

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
          {/* Mascot */}
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [0, -3, 3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto mb-6 flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 shadow-lg"
          >
            <img src={mascot.image} alt={mascot.name} className="h-full w-full object-cover" />
          </motion.div>

          {/* 404 number */}
          <div className="relative mx-auto mb-4">
            <div className="text-[80px] font-black leading-none tracking-tighter stem-gradient-text sm:text-[100px]">
              404
            </div>
          </div>

          <h1 className="mb-2 text-xl font-bold tracking-tight">
            {mascot.name} says:
          </h1>
          <p className="mb-2 text-sm italic text-muted-foreground">
            "{chosen.text}"
          </p>
          <p className="mb-8 text-xs text-muted-foreground">
            The page <code className="rounded bg-muted px-2 py-0.5 text-[10px] font-mono text-foreground">{location.pathname}</code> doesn't exist.
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
