import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Video, Clock, Users, Bell, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function LiveClassroom() {
  useDocumentTitle("Live Classroom");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto flex max-w-lg flex-col items-center gap-6 px-4 pt-24 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 shadow-lg shadow-primary/10">
            <Video className="h-10 w-10 text-primary" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-warning-foreground shadow-md"
          >
            <Clock className="h-3 w-3" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-warning">
            <Clock className="h-3 w-3" /> Coming Soon
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Live Classroom</h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="max-w-md text-muted-foreground leading-relaxed"
        >
          Live video classrooms with collaborative whiteboard and real-time chat are on the way. 
          Get notified when this feature launches!
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex w-full max-w-sm flex-col gap-3"
        >
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Video, label: "Live Video", desc: "HD video calls" },
              { icon: Users, label: "Whiteboard", desc: "Draw together" },
              { icon: Bell, label: "Chat", desc: "Real-time messaging" },
            ].map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="stem-card flex flex-col items-center gap-1.5 p-3 text-center"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[11px] font-semibold">{f.label}</span>
                <span className="text-[9px] text-muted-foreground">{f.desc}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <Button onClick={() => navigate("/subjects")} className="gap-2">
            Practice Now <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
