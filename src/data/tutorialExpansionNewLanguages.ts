import type { Tutorial } from "./tutorials";
import { italianExpansion } from "./tutorialExpansionItalian";
import { spanishExpansion } from "./tutorialExpansionSpanish";
import { arabicExpansion } from "./tutorialExpansionArabic";

/** 90 authored formative checks. Not imported into formal exam grading. */
export const newLanguageExpansion: Tutorial[] = [
  ...italianExpansion, ...spanishExpansion, ...arabicExpansion,
];
export const NEW_LANGUAGE_SUBJECTS = ["italian", "spanish", "arabic"] as const;
