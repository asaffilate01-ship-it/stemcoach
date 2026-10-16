import type { Tutorial } from "./tutorials";
import { deeperMathScience } from "./tutorialDeepMathScience";
import { deeperComputingHumanities } from "./tutorialDeepComputingHumanities";
import { deeperGeographyBusinessIELTS } from "./tutorialDeepGeographyBusinessIELTS";
import { deeperLanguagePedagogy } from "./tutorialDeepLanguages";

/** Author-drafted lessons; pending independent curriculum-specific academic approval. */
export const deepQAExpansion: Tutorial[] = [
  ...deeperMathScience,
  ...deeperComputingHumanities,
  ...deeperGeographyBusinessIELTS,
  ...deeperLanguagePedagogy,
];
