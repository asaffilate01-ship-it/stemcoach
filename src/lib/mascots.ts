import { subjects } from "@/data/questions";

/** Map of subject id → mascot image path */
const mascotMap: Record<string, { image: string; name: string }> = {
  mathematics: { image: "/assets/mathmax.png", name: "MathMax" },
  physics: { image: "/assets/physix.png", name: "PhysiX" },
  chemistry: { image: "/assets/chemi.png", name: "Chemi" },
  biology: { image: "/assets/biobee.png", name: "BioBee" },
  "computer-science": { image: "/assets/codey.png", name: "Codey" },
  ielts: { image: "/assets/lexi.png", name: "Lexi" },
  celta: { image: "/assets/lexi.png", name: "Lexi" },
};

export function getMascot(subjectId: string) {
  return mascotMap[subjectId] || { image: "/assets/coach-stem.png", name: "Coach Stem" };
}

export function getCoachStem() {
  return { image: "/assets/coach-stem.png", name: "Coach Stem" };
}

const motivationalMessages = [
  "Every question you answer takes you one step closer to exam success! 💪",
  "Consistency beats intensity. Keep showing up! 🔥",
  "Mistakes are proof you're trying. Let's turn them into lessons! 🧠",
  "The STEM Squad believes in you — let's crush today's goals! 🚀",
  "Small progress is still progress. You've got this! ⭐",
  "Your future self will thank you for studying today! 📚",
  "Champions aren't born — they practice. Let's go! 🏆",
  "One more topic mastered is one less worry on exam day! ✅",
  "The best time to study was yesterday. The next best time is now! ⏰",
  "You're building something amazing — one question at a time! 🌟",
];

export function getDailyMotivation(): string {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return motivationalMessages[dayOfYear % motivationalMessages.length];
}
