import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { EarnedBadge } from "@/hooks/useGameStats";

interface BadgeUnlockProps {
  badge: EarnedBadge | null;
  onDismiss: () => void;
}

export function BadgeUnlock({ badge, onDismiss }: BadgeUnlockProps) {
  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ scale: 0.3, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="mx-4 max-w-sm rounded-2xl bg-card p-8 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: 2, repeatType: "reverse" }}
              className="mb-4 text-6xl"
            >
              {badge.icon}
            </motion.div>
            <div className="stem-label mb-2 text-primary">Badge Unlocked!</div>
            <h3 className="mb-2 text-xl font-bold">{badge.name}</h3>
            <p className="mb-6 text-sm text-muted-foreground">{badge.description}</p>
            <Button onClick={onDismiss} className="rounded-full px-6">
              Awesome!
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
