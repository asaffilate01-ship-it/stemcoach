import type { Tutorial } from "./tutorials";
import { largeSTEMExpansion } from "./tutorialExpansionLargeSTEM";
import { largeHumanitiesExpansion } from "./tutorialExpansionLargeHumanities";
import { largeLanguagesExpansion } from "./tutorialExpansionLargeLanguages";

/** 14 original formative tutorials, 140 deterministic questions; board review outstanding. */
export const largeQAExpansion: Tutorial[] = [
  ...largeSTEMExpansion,
  ...largeHumanitiesExpansion,
  ...largeLanguagesExpansion,
];
