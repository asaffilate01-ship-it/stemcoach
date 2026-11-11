import type { Tutorial } from "./tutorials";
import { nextReasoningMathsPhysics } from "./nextReasoningMathsPhysics";
import { nextReasoningPhysicalScience } from "./nextReasoningPhysicalScience";
import { nextReasoningBioComputing } from "./nextReasoningBioComputing";

/** 12 original formative lessons, eight checks per lesson. Qualified academic review outstanding. */
export const nextReasoningExpansion: Tutorial[] = [
  ...nextReasoningMathsPhysics,
  ...nextReasoningPhysicalScience,
  ...nextReasoningBioComputing,
];
