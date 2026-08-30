export interface MascotIdentity {
  name: string;
  emoji: string;
  image: string;
}

/** One identity catalogue shared by the web app and scheduled Edge Functions. */
export const MASCOT_IDENTITIES = {
  mathematics: { name: "MathMax", emoji: "🧮", image: "/assets/mathmax.png" },
  physics: { name: "PhysiX", emoji: "⚡", image: "/assets/physix.png" },
  chemistry: { name: "Chemi", emoji: "🧪", image: "/assets/chemi.png" },
  biology: { name: "BioBee", emoji: "🐝", image: "/assets/biobee.png" },
  "computer-science": { name: "Codey", emoji: "💻", image: "/assets/codey.png" },
  ielts: { name: "Lexi", emoji: "🌍", image: "/assets/lexi.png" },
  celta: { name: "Lexi", emoji: "🌍", image: "/assets/lexi.png" },
  economics: { name: "EconiQ", emoji: "📈", image: "/assets/econiq.png" },
  "english-literature": { name: "Litera", emoji: "📚", image: "/assets/litera.png" },
  psychology: { name: "Psyche", emoji: "🧠", image: "/assets/psyche.png" },
  geography: { name: "Geo", emoji: "🌎", image: "/assets/geo.png" },
  "business-studies": { name: "BizPro", emoji: "💼", image: "/assets/bizpro.png" },
  french: { name: "François", emoji: "🇫🇷", image: "/assets/francois.png" },
  german: { name: "Hans", emoji: "🇩🇪", image: "/assets/hans.png" },
} as const satisfies Record<string, MascotIdentity>;

export const STEMCOACH_IDENTITY = {
  name: "STEMCoach",
  emoji: "👨‍🏫",
  image: "/assets/coach-stem.png",
} as const satisfies MascotIdentity;
