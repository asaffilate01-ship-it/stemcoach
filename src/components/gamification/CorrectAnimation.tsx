import { motion, AnimatePresence } from "framer-motion";

interface CorrectAnimationProps {
  show: boolean;
  correct: boolean;
}

const correctEmojis = ["🎉", "🔥", "⭐", "💪", "🚀", "✨", "🎯", "💎"];
const wrongEmojis = ["😤", "💡", "📚", "🧠"];
const correctMessages = ["Nailed it!", "Brilliant!", "You got it!", "On fire!", "Perfect!", "Legendary!", "Unstoppable!"];
const wrongMessages = ["Keep going!", "Learn & grow!", "Nearly there!", "Next time!"];

export function CorrectAnimation({ show, correct }: CorrectAnimationProps) {
  const pool = correct ? correctEmojis : wrongEmojis;
  const messages = correct ? correctMessages : wrongMessages;
  const emoji = pool[Math.floor(Math.random() * pool.length)];
  const message = messages[Math.floor(Math.random() * messages.length)];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -10 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="flex items-center gap-2 rounded-xl bg-card border border-border/40 px-3 py-1.5 shadow-lg"
        >
          <motion.span
            animate={{ rotate: [0, -15, 15, -8, 8, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 0.6 }}
            className="text-xl"
          >
            {emoji}
          </motion.span>
          <span className={`text-xs font-bold ${correct ? "text-[hsl(var(--success))]" : "text-warning"}`}>
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
