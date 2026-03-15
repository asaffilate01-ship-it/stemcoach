import { motion, AnimatePresence } from "framer-motion";

interface CorrectAnimationProps {
  show: boolean;
  correct: boolean;
}

const emojis = ["🎉", "🔥", "⭐", "💪", "🚀"];
const wrongEmojis = ["😤", "💡", "📚"];

export function CorrectAnimation({ show, correct }: CorrectAnimationProps) {
  const pool = correct ? emojis : wrongEmojis;
  const emoji = pool[Math.floor(Math.random() * pool.length)];
  const message = correct
    ? ["Nailed it!", "Brilliant!", "You got it!", "On fire!", "Perfect!"][Math.floor(Math.random() * 5)]
    : ["Keep going!", "Learn & grow!", "Nearly there!"][Math.floor(Math.random() * 3)];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="flex items-center gap-2"
        >
          <motion.span
            animate={{ rotate: [0, -15, 15, 0] }}
            transition={{ duration: 0.5 }}
            className="text-2xl"
          >
            {emoji}
          </motion.span>
          <span className={`text-sm font-bold ${correct ? "text-success" : "text-warning"}`}>
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
