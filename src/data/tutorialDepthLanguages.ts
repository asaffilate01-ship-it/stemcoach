import type { Tutorial } from "./tutorials";
import { italianDepthExpansion } from "./tutorialDepthItalian";
import { spanishDepthExpansion } from "./tutorialDepthSpanish";
import { arabicDepthExpansion } from "./tutorialDepthArabic";

/** Original formative content awaiting native-language/academic review. */
export const additionalLanguageDepth: Tutorial[] = [
  ...italianDepthExpansion, ...spanishDepthExpansion, ...arabicDepthExpansion,
];
