export interface StudentProgress {
  totalQuestionsAnswered: number;
  correctAnswers: number;
  streak: number;
  xp: number;
  level: number;
  subjectProgress: SubjectProgress[];
  weakTopics: WeakTopic[];
  recentActivity: ActivityItem[];
  badges: Badge[];
}

export interface SubjectProgress {
  subject: string;
  accuracy: number;
  questionsCompleted: number;
  readinessScore: number;
}

export interface WeakTopic {
  subject: string;
  topic: string;
  accuracy: number;
  recommended: string;
}

export interface ActivityItem {
  date: string;
  subject: string;
  topic: string;
  score: number;
  total: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  earned: boolean;
  requirement: string;
}

export const mockProgress: StudentProgress = {
  totalQuestionsAnswered: 847,
  correctAnswers: 672,
  streak: 12,
  xp: 4250,
  level: 8,
  subjectProgress: [
    { subject: "Mathematics", accuracy: 82, questionsCompleted: 234, readinessScore: 78 },
    { subject: "Physics", accuracy: 75, questionsCompleted: 198, readinessScore: 71 },
    { subject: "Chemistry", accuracy: 88, questionsCompleted: 176, readinessScore: 85 },
    { subject: "Biology", accuracy: 91, questionsCompleted: 145, readinessScore: 89 },
    { subject: "Computer Science", accuracy: 79, questionsCompleted: 94, readinessScore: 74 },
  ],
  weakTopics: [
    { subject: "Physics", topic: "Circular Motion", accuracy: 42, recommended: "Practice 10 questions on centripetal force" },
    { subject: "Mathematics", topic: "Integration", accuracy: 55, recommended: "Review integration by parts technique" },
    { subject: "Chemistry", topic: "Electrochemistry", accuracy: 48, recommended: "Study electrode potentials and cell diagrams" },
    { subject: "Physics", topic: "Magnetic Fields", accuracy: 51, recommended: "Focus on Fleming's rules and motor effect" },
  ],
  recentActivity: [
    { date: "2026-03-15", subject: "Physics", topic: "Mechanics", score: 8, total: 10 },
    { date: "2026-03-14", subject: "Mathematics", topic: "Calculus", score: 7, total: 10 },
    { date: "2026-03-14", subject: "Chemistry", topic: "Bonding", score: 9, total: 10 },
    { date: "2026-03-13", subject: "Biology", topic: "Genetics", score: 10, total: 10 },
    { date: "2026-03-13", subject: "Computer Science", topic: "Algorithms", score: 6, total: 10 },
  ],
  badges: [
    { id: "b1", name: "First Steps", icon: "🎯", earned: true, requirement: "Answer 10 questions" },
    { id: "b2", name: "Century", icon: "💯", earned: true, requirement: "Answer 100 questions" },
    { id: "b3", name: "Week Warrior", icon: "🔥", earned: true, requirement: "7-day streak" },
    { id: "b4", name: "Physics Pro", icon: "⚛️", earned: false, requirement: "90% accuracy in Physics" },
    { id: "b5", name: "Math Master", icon: "∑", earned: false, requirement: "Complete all Calculus topics" },
    { id: "b6", name: "Perfect Score", icon: "⭐", earned: true, requirement: "10/10 in any quiz" },
  ],
};
