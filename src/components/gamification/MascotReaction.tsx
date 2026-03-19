import { motion } from "framer-motion";
import { getMascot } from "@/lib/mascots";

interface MascotReactionProps {
  subjectId: string;
  correct: boolean | null;
  show: boolean;
}

const reactions = {
  correct: ["Great job! 🎉", "Nailed it! ⭐", "Perfect! 💯", "You're on fire! 🔥"],
  incorrect: ["Not quite — let's review! 📖", "Keep going, you'll get it! 💪", "Almost there! Try again 🧠"],
};

export function MascotReaction({ subjectId, correct, show }: MascotReactionProps) {
  const mascot = getMascot(subjectId);
  if (!show || correct === null) return null;

  const msgs = correct ? reactions.correct : reactions.incorrect;
  const msg = msgs[Math.floor(Math.random() * msgs.length)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="flex items-center gap-3 rounded-xl border border-border/40 bg-card p-3 shadow-md"
    >
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl">
        <img src={mascot.image} alt={mascot.name} className="h-full w-full object-cover" />
      </div>
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{mascot.name}</span>
        <p className="text-sm font-medium">{msg}</p>
      </div>
    </motion.div>
  );
}
