import { motion } from "framer-motion";
import { getMascot } from "@/lib/mascots";

interface MascotReactionProps {
  subjectId: string;
  correct: boolean | null;
  show: boolean;
  reactionKey?: string;
}

const reactions = {
  correct: ["Great job! 🎉", "Nailed it! ⭐", "Perfect! 💯", "You're on fire! 🔥"],
  incorrect: ["Not quite — let's review! 📖", "Keep going, you'll get it! 💪", "Almost there! Try again 🧠"],
};

function stableIndex(value: string, length: number): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  return Math.abs(hash) % length;
}

export function MascotReaction({ subjectId, correct, show, reactionKey = "default" }: MascotReactionProps) {
  const mascot = getMascot(subjectId);
  if (!show || correct === null) return null;

  const msgs = correct ? reactions.correct : reactions.incorrect;
  const msg = msgs[stableIndex(`${subjectId}:${reactionKey}:${correct}`, msgs.length)];

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
