import type { Tutorial, TutorialQuestionFormat } from "./tutorials";
import { mcq, trueFalse, short } from "./tutorialQuestions";

type FourChoices = [string, string, string, string];
export type AuthorChoice = [stem: string, choices: FourChoices, correctIndex: 0 | 1 | 2 | 3, explanation: string];
export interface AuthorLesson {
  id: string;
  subject: Tutorial["subject"];
  title: string;
  level: Tutorial["level"];
  summary: string;
  objectives: [string, string, string];
  lesson: [string, string, string];
  workedExample: string;
  examTip: string;
  commonMistake: string;
  checks: [AuthorChoice, AuthorChoice, AuthorChoice, AuthorChoice, AuthorChoice, AuthorChoice, AuthorChoice, AuthorChoice];
  truth: [stem: string, answer: boolean, explanation: string];
  recall: [stem: string, answer: string, explanation: string, accepted?: string[]];
}

/** Exactly 10 deterministic original formative checks per lesson; no generated or paid-AI answers. */
export function authorTenCheckLesson(spec: AuthorLesson): Tutorial {
  const hint = "Read the example, decide which rule applies, then check your reasoning.";
  const questions = [
    ...spec.checks.map(([stem, choices, correct, explanation]) =>
      mcq(stem, choices, choices[correct], explanation, hint)),
    trueFalse(spec.truth[0], spec.truth[1], spec.truth[2], hint),
    short(spec.recall[0], spec.recall[1], spec.recall[2], hint, spec.recall[3] || []),
  ];
  return {
    id: spec.id, subject: spec.subject, title: spec.title, level: spec.level,
    minutes: 18, summary: spec.summary, objectives: spec.objectives, lesson: spec.lesson,
    workedExample: spec.workedExample, examTip: spec.examTip,
    commonMistake: spec.commonMistake,
    checkpoint: questions[0], practice: questions.slice(1),
  };
}
