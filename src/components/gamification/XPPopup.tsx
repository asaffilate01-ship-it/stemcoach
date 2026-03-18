import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface XPPopupProps {
  xp: number;
  show: boolean;
}

export function XPPopup({ xp, show }: XPPopupProps) {
  return (
    <AnimatePresence>
      {show && xp > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: -30, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.5 }}
          transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
          className="pointer-events-none fixed bottom-8 right-8 z-50 flex items-center gap-2 rounded-2xl px-5 py-3 text-primary-foreground shadow-2xl shadow-primary/30"
          style={{ background: "var(--gradient-hero)" }}
        >
          <motion.div
            animate={{ rotate: [0, -20, 20, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Zap className="h-5 w-5 fill-current" />
          </motion.div>
          <span className="text-lg font-extrabold tracking-tight">+{xp} XP</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
