/** Map of subject id → mascot image path, name, and personality */
export interface MascotInfo {
  image: string;
  name: string;
  emoji: string;
  personality: string;
  bio: string;
  tips: string[];
  streakLostMessage: string;
  cheerMessage: string;
}

const mascotMap: Record<string, MascotInfo> = {
  mathematics: {
    image: "/assets/mathmax.png",
    name: "MathMax",
    emoji: "🧮",
    personality: "The logical problem-solver who loves patterns",
    bio: "MathMax lives and breathes numbers. From algebra to calculus, he's your go-to guide for breaking down complex problems into simple, step-by-step solutions. His motto: 'Every problem has a pattern — let's find it!'",
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
    personality: "The energetic force of nature who makes physics exciting",
    bio: "PhysiX brings energy to everything — literally! Whether it's forces, waves, or electricity, he'll help you understand how the universe works with real-world examples and explosive demonstrations.",
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
    personality: "The curious scientist who loves reactions and discoveries",
    bio: "Chemi is always mixing things up! She'll guide you through organic, inorganic, and physical chemistry with crystal-clear explanations. Her lab coat has seen a few explosions, but that's how the best discoveries happen!",
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
    emoji: "🐝",
    personality: "The nature-loving explorer who buzzes with curiosity",
    bio: "BioBee pollinates knowledge across all areas of biology! From cells to ecosystems, she'll help you understand the living world. She's always buzzing with facts and loves making connections between topics.",
    tips: [
      "Draw and label diagrams — they're worth loads of marks!",
      "Learn key definitions word-for-word for definition questions",
      "Understand processes step-by-step, not just the end result",
      "Link structure to function — examiners love this!",
    ],
    streakLostMessage: "The hive misses you! 🐝 Every bee counts, and so does every study session. Let's get buzzing again!",
    cheerMessage: "You're buzzing through biology! 🐝",
  },
  "computer-science": {
    image: "/assets/codey.png",
    name: "Codey",
    emoji: "💻",
    personality: "The tech-savvy coder who speaks in algorithms",
    bio: "Codey can debug anything! From Python to data structures, he'll help you think like a programmer. He believes every bug is just an undiscovered feature and every problem can be solved with the right algorithm.",
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
    emoji: "📚",
    personality: "The wordsmith who makes language learning fun",
    bio: "Lexi is a language enthusiast who's mastered the art of communication. She'll help you ace your IELTS with vocabulary tricks, grammar hacks, and speaking confidence boosters.",
    tips: [
      "Read the questions before the passage in Reading tasks",
      "Use a range of sentence structures in Writing Task 2",
      "Practice speaking for 2 minutes on random topics daily",
      "Learn collocations, not just individual vocabulary words",
    ],
    streakLostMessage: "Words are waiting to be discovered! 📚 Let's get back to building your vocabulary and confidence!",
    cheerMessage: "Your language skills are eloquent! 📚",
  },
  celta: {
    image: "/assets/lexi.png",
    name: "Lexi",
    emoji: "🎓",
    personality: "The teaching expert who helps you help others",
    bio: "Lexi also coaches future teachers! From lesson planning to classroom management, she knows exactly what it takes to become an outstanding English language teacher.",
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
    personality: "The market-savvy analyst who makes economics click",
    bio: "EconiQ sees supply and demand in everything! From micro to macro, he'll help you understand how economies work with real-world examples and sharp analysis.",
    tips: ["Always draw diagrams — they're worth easy marks!", "Link theory to real-world examples", "Learn key definitions precisely", "Practice essay structure: Define, Explain, Diagram, Evaluate"],
    streakLostMessage: "The market for knowledge never closes! Come back and invest in yourself! 📈",
    cheerMessage: "Your economic understanding is booming! 📈",
  },
  "english-literature": {
    image: "/assets/litera.png",
    name: "Litera",
    emoji: "📖",
    personality: "The literary enthusiast who finds meaning in every word",
    bio: "Litera devours books and poetry alike. She'll help you analyse texts with precision, embed quotations seamlessly, and write essays that examiners love.",
    tips: ["Always embed short quotations into your sentences", "Use PEAL paragraphs for structured analysis", "Comment on the writer's methods, not just what happens", "Link to historical and social context"],
    streakLostMessage: "Every great story has a comeback chapter — let this be yours! 📖",
    cheerMessage: "Your analytical skills are truly poetic! 📖",
  },
  psychology: {
    image: "/assets/pysche.png",
    name: "Pysche",
    emoji: "🧠",
    personality: "The curious mind reader who decodes human behaviour",
    bio: "Pysche is fascinated by why people think, feel, and behave the way they do. From Milgram to memory models, he makes psychology engaging and exam-ready.",
    tips: ["Always include evaluation points (strengths & limitations)", "Learn key study details: aim, method, results, conclusion", "Use psychological terminology precisely", "Apply theories to real-life scenarios"],
    streakLostMessage: "Your brain is wired for learning — let's activate those neurons again! 🧠",
    cheerMessage: "Your psychological insight is remarkable! 🧠",
  },
  geography: {
    image: "/assets/geo.png",
    name: "Geo",
    emoji: "🌍",
    personality: "The globe-trotting explorer who connects places and processes",
    bio: "Geo has explored every continent! He helps you understand physical and human geography through case studies, data analysis, and spatial thinking.",
    tips: ["Always use specific case study examples", "Include facts and figures in your answers", "Draw annotated diagrams for physical processes", "Link physical and human factors together"],
    streakLostMessage: "The world is waiting to be explored — one topic at a time! 🌍",
    cheerMessage: "You're mapping your way to success! 🌍",
  },
  "business-studies": {
    image: "/assets/bizpro.png",
    name: "BizPro",
    emoji: "💼",
    personality: "The entrepreneurial thinker who turns theory into strategy",
    bio: "BizPro thinks like a CEO! From break-even analysis to marketing strategy, he'll help you apply business theory to real-world scenarios and nail those exam essays.",
    tips: ["Always show your calculations clearly in finance questions", "Use the context of the business in the case study", "Evaluate both sides before making a judgement", "Learn key ratios and what they tell you"],
    streakLostMessage: "Every successful business pivots — let's pivot back to studying! 💼",
    cheerMessage: "You're a business mastermind! 💼",
  },
};

export function getMascot(subjectId: string): MascotInfo {
  return mascotMap[subjectId] || getCoachStem();
}

export function getCoachStem(): MascotInfo {
  return {
    image: "/assets/coach-stem.png",
    name: "Coach Stem",
    emoji: "🧑‍🔬",
    personality: "The wise mentor who leads the STEM Squad",
    bio: "Coach Stem is the mastermind behind the STEM Squad. With years of experience across all STEM subjects, he guides each mascot and every student towards exam success. He believes everyone can excel with the right support.",
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
