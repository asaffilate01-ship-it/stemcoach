/** Map of subject id → mascot image path, name, and personality */
export interface MascotInfo {
  image: string;
  name: string;
  emoji: string;
  personality: string;
  bio: string;
  catchphrase: string;
  traits: string[];
  tips: string[];
  streakLostMessage: string;
  cheerMessage: string;
}

const mascotMap: Record<string, MascotInfo> = {
  mathematics: {
    image: "/assets/mathmax.png",
    name: "MathMax",
    emoji: "🧮",
    personality: "The Problem Solver",
    bio: "MathMax loves numbers and patterns. He can break down even the toughest equations into simple steps. Fast, logical, and precise — he'll help you master maths with confidence and speed.",
    catchphrase: "I'll show you the fastest way.",
    traits: ["Analytical", "Fast-thinking", "Confident"],
    tips: [
      "Always show your working — examiners award method marks!",
      "Check your answer by substituting it back into the equation",
      "Draw a diagram whenever the question involves shapes or graphs",
      "Practice mental maths daily to speed up your calculations",
    ],
    streakLostMessage: "Hey, no worries! Even the best mathematicians take breaks. Let's pick up where we left off — I've got some fun problems waiting!",
    cheerMessage: "Your maths skills are adding up! 🎉",
  },
  physics: {
    image: "/assets/physix.png",
    name: "PhysiX",
    emoji: "⚡",
    personality: "The Explainer",
    bio: "PhysiX makes complex concepts feel simple. From forces to energy, he explains everything clearly and visually so you truly understand how the world works.",
    catchphrase: "Let's break this down simply.",
    traits: ["Curious", "Clear-thinking", "Practical"],
    tips: [
      "Always include units in your answers — it's free marks!",
      "Draw force diagrams before attempting mechanics questions",
      "Learn your key equations — but also understand what they mean",
      "Use SUVAT equations systematically for kinematics problems",
    ],
    streakLostMessage: "A body at rest stays at rest unless acted upon… Let me be that force! Come back and let's get moving again! ⚡",
    cheerMessage: "You're an unstoppable force! ⚡",
  },
  chemistry: {
    image: "/assets/chemi.png",
    name: "Chemi",
    emoji: "🧪",
    personality: "The Experimenter",
    bio: "Chemi brings reactions to life. She helps you understand formulas, elements, and experiments with fun and clarity — making chemistry exciting and easy to remember.",
    catchphrase: "Let's test it!",
    traits: ["Energetic", "Creative", "Precise"],
    tips: [
      "Balance your equations before doing any calculations",
      "Learn functional groups — they're the key to organic chemistry",
      "Use mnemonic devices for the reactivity series",
      "Always consider state symbols in your equations",
    ],
    streakLostMessage: "Every great reaction needs a catalyst — let me be yours! Come back and let's create some chemistry! 🧪",
    cheerMessage: "You've got perfect chemistry with this subject! 🧪",
  },
  biology: {
    image: "/assets/biobee.png",
    name: "BioBee",
    emoji: "🌿",
    personality: "The Explorer",
    bio: "BioBee explores the living world — from cells to ecosystems. She helps you understand how life works with curiosity and real-world connections.",
    catchphrase: "Let's see how it works.",
    traits: ["Curious", "Observant", "Nature-loving"],
    tips: [
      "Draw and label diagrams — they're worth loads of marks!",
      "Learn key definitions word-for-word for definition questions",
      "Understand processes step-by-step, not just the end result",
      "Link structure to function — examiners love this!",
    ],
    streakLostMessage: "The hive misses you! 🌿 Every bee counts, and so does every study session. Let's get buzzing again!",
    cheerMessage: "You're buzzing through biology! 🌿",
  },
  "computer-science": {
    image: "/assets/codey.png",
    name: "Codey",
    emoji: "💻",
    personality: "The Builder",
    bio: "Codey turns ideas into reality through code. Whether it's logic, programming, or systems, he helps you think like a developer and solve problems step by step.",
    catchphrase: "Let's crack this code.",
    traits: ["Logical", "Innovative", "Focused"],
    tips: [
      "Trace through your code line by line to find logic errors",
      "Break complex problems into smaller sub-problems",
      "Learn Big O notation — it comes up in almost every exam",
      "Practice pseudocode — it helps structure your thinking",
    ],
    streakLostMessage: "Error 404: Streak not found! 😄 But don't worry — let's reboot and start a new one together!",
    cheerMessage: "Your code is compiling perfectly! 💻",
  },
  ielts: {
    image: "/assets/lexi.png",
    name: "Lexi",
    emoji: "🌍",
    personality: "The Communicator",
    bio: "Lexi helps you express yourself clearly and confidently. From essays to speaking skills, she makes language simple, powerful, and effective.",
    catchphrase: "Let's express it perfectly.",
    traits: ["Expressive", "Supportive", "Articulate"],
    tips: [
      "Read the questions before the passage in Reading tasks",
      "Use a range of sentence structures in Writing Task 2",
      "Practice speaking for 2 minutes on random topics daily",
      "Learn collocations, not just individual vocabulary words",
    ],
    streakLostMessage: "Words are waiting to be discovered! 🌍 Let's get back to building your vocabulary and confidence!",
    cheerMessage: "Your language skills are eloquent! 🌍",
  },
  celta: {
    image: "/assets/lexi.png",
    name: "Lexi",
    emoji: "🌍",
    personality: "The Communicator",
    bio: "Lexi also coaches future teachers! From lesson planning to classroom management, she knows exactly what it takes to become an outstanding English language teacher.",
    catchphrase: "Let's express it perfectly.",
    traits: ["Expressive", "Supportive", "Articulate"],
    tips: [
      "Always plan your concept checking questions in advance",
      "Reduce your Teacher Talking Time — let students discover!",
      "Grade your language to match your learners' level",
      "Reflect on every lesson — what worked and what didn't?",
    ],
    streakLostMessage: "The best teachers never stop learning! Come back and let's polish those teaching skills! 🎓",
    cheerMessage: "You're becoming an amazing teacher! 🎓",
  },
  economics: {
    image: "/assets/econiq.png",
    name: "EconiQ",
    emoji: "📈",
    personality: "The Strategist",
    bio: "EconiQ understands how money, markets, and systems work. He helps you think critically about supply, demand, and real-world economics with clarity and insight.",
    catchphrase: "Let's understand the system.",
    traits: ["Strategic", "Logical", "Big-picture thinker"],
    tips: ["Always draw diagrams — they're worth easy marks!", "Link theory to real-world examples", "Learn key definitions precisely", "Practice essay structure: Define, Explain, Diagram, Evaluate"],
    streakLostMessage: "The market for knowledge never closes! Come back and invest in yourself! 📈",
    cheerMessage: "Your economic understanding is booming! 📈",
  },
  "english-literature": {
    image: "/assets/litera.png",
    name: "Litera",
    emoji: "📚",
    personality: "The Storyteller",
    bio: "Litera brings stories, poetry, and texts to life. She helps you understand themes, characters, and meaning in a way that makes literature engaging and powerful.",
    catchphrase: "Let's explore the meaning.",
    traits: ["Creative", "Thoughtful", "Insightful"],
    tips: ["Always embed short quotations into your sentences", "Use PEAL paragraphs for structured analysis", "Comment on the writer's methods, not just what happens", "Link to historical and social context"],
    streakLostMessage: "Every great story has a comeback chapter — let this be yours! 📚",
    cheerMessage: "Your analytical skills are truly poetic! 📚",
  },
  psychology: {
    image: "/assets/pysche.png",
    name: "Psyche",
    emoji: "🧠",
    personality: "The Thinker",
    bio: "Psyche helps you understand how the mind works — from behaviour to emotions. She breaks down complex theories into simple ideas you can relate to.",
    catchphrase: "Let's understand how we think.",
    traits: ["Insightful", "Calm", "Observant"],
    tips: ["Always include evaluation points (strengths & limitations)", "Learn key study details: aim, method, results, conclusion", "Use psychological terminology precisely", "Apply theories to real-life scenarios"],
    streakLostMessage: "Your brain is wired for learning — let's activate those neurons again! 🧠",
    cheerMessage: "Your psychological insight is remarkable! 🧠",
  },
  geography: {
    image: "/assets/geo.png",
    name: "Geo",
    emoji: "🌎",
    personality: "The Explorer",
    bio: "Geo takes you around the world — from landscapes to climate systems. He connects what you learn to real-world environments and global issues.",
    catchphrase: "Let's explore the world.",
    traits: ["Adventurous", "Curious", "Real-world thinker"],
    tips: ["Always use specific case study examples", "Include facts and figures in your answers", "Draw annotated diagrams for physical processes", "Link physical and human factors together"],
    streakLostMessage: "The world is waiting to be explored — one topic at a time! 🌎",
    cheerMessage: "You're mapping your way to success! 🌎",
  },
  "business-studies": {
    image: "/assets/bizpro.png",
    name: "BizPro",
    emoji: "💼",
    personality: "The Entrepreneur",
    bio: "BizPro is all about ideas, growth, and success. He teaches you how businesses work — from startups to global companies — and how to think like a leader.",
    catchphrase: "Let's build something big.",
    traits: ["Ambitious", "Confident", "Practical"],
    tips: ["Always show your calculations clearly in finance questions", "Use the context of the business in the case study", "Evaluate both sides before making a judgement", "Learn key ratios and what they tell you"],
    streakLostMessage: "Every successful business pivots — let's pivot back to studying! 💼",
    cheerMessage: "You're a business mastermind! 💼",
  },
  french: {
    image: "/assets/francois.png",
    name: "François",
    emoji: "🇫🇷",
    personality: "The Artiste",
    bio: "François brings the beauty of French language and culture to life. From grammar to literature, he helps you express yourself with elegance, precision, and a touch of Parisian flair.",
    catchphrase: "Allons-y — let's master it with style.",
    traits: ["Charming", "Cultured", "Expressive"],
    tips: [
      "Learn verb conjugations in groups — patterns make it easier",
      "Read French texts aloud to improve pronunciation and flow",
      "Use connecting words (cependant, néanmoins) to elevate your writing",
      "Practice dictée regularly — it sharpens spelling and listening",
    ],
    streakLostMessage: "La langue française t'attend! Come back and let's make your French magnifique! 🇫🇷",
    cheerMessage: "Ton français est magnifique! 🇫🇷",
  },
  german: {
    image: "/assets/hans.png",
    name: "Hans",
    emoji: "🇩🇪",
    personality: "The Engineer",
    bio: "Hans approaches German with structure and precision. From grammar cases to essay writing, he breaks down the language systematically so you can build fluency with confidence.",
    catchphrase: "Schritt für Schritt — step by step to fluency.",
    traits: ["Precise", "Methodical", "Encouraging"],
    tips: [
      "Master the four cases (Nominativ, Akkusativ, Dativ, Genitiv) early",
      "Learn nouns with their articles — der, die, das matter!",
      "Practice word order rules — the verb position is key",
      "Use compound words to expand your vocabulary quickly",
    ],
    streakLostMessage: "Übung macht den Meister! Practice makes perfect — let's get back to it! 🇩🇪",
    cheerMessage: "Dein Deutsch ist ausgezeichnet! 🇩🇪",
  },
};
export function getMascot(subjectId: string): MascotInfo {
  return mascotMap[subjectId] || getCoachStem();
}

export function getCoachStem(): MascotInfo {
  return {
    image: "/assets/coach-stem.png",
    name: "STEMCoach",
    emoji: "👨‍🏫",
    personality: "The Mentor",
    bio: "STEMCoach is your ultimate guide — calm, intelligent, and always one step ahead. With years of knowledge across every subject, he helps you build the right strategy, stay focused, and succeed in exams. Whether you're stuck or aiming for top grades, STEMCoach keeps you on track.",
    catchphrase: "Let's get you exam-ready.",
    traits: ["Wise", "Supportive", "Strategic"],
    tips: [
      "Consistency beats cramming — study a little every day",
      "Teach what you've learned to someone else — it's the best test",
      "Take breaks — your brain needs time to consolidate",
      "Focus on understanding, not just memorising",
    ],
    streakLostMessage: "The whole Squad is waiting for you! Let's get back on track together — one question at a time! 🚀",
    cheerMessage: "The Squad is proud of you! 🌟",
  };
}

export function getAllMascots(): MascotInfo[] {
  return [...Object.values(mascotMap), getCoachStem()];
}

export function getSquadMembers(): (MascotInfo & { subjectId: string })[] {
  return Object.entries(mascotMap).map(([id, info]) => ({ ...info, subjectId: id }));
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

/** Get a mascot by guessing the subject from text (badge name, notification, etc.) */
export function guessMascotFromText(text: string): MascotInfo {
  const lower = text.toLowerCase();
  if (lower.includes("math") || lower.includes("algebra") || lower.includes("calculus")) return getMascot("mathematics");
  if (lower.includes("physics") || lower.includes("force") || lower.includes("energy")) return getMascot("physics");
  if (lower.includes("chem") || lower.includes("reaction") || lower.includes("element")) return getMascot("chemistry");
  if (lower.includes("bio") || lower.includes("cell") || lower.includes("organism")) return getMascot("biology");
  if (lower.includes("code") || lower.includes("comput") || lower.includes("program")) return getMascot("computer-science");
  if (lower.includes("ielts") || lower.includes("language")) return getMascot("ielts");
  if (lower.includes("celta") || lower.includes("teach")) return getMascot("celta");
  if (lower.includes("econ") || lower.includes("market") || lower.includes("supply")) return getMascot("economics");
  if (lower.includes("litera") || lower.includes("english") || lower.includes("poetry") || lower.includes("novel")) return getMascot("english-literature");
  if (lower.includes("psych") || lower.includes("behav") || lower.includes("mental")) return getMascot("psychology");
  if (lower.includes("geog") || lower.includes("climate") || lower.includes("continent")) return getMascot("geography");
  if (lower.includes("business") || lower.includes("entrepreneur") || lower.includes("market")) return getMascot("business-studies");
  return getCoachStem();
}
