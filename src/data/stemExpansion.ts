import type { Tutorial } from "./tutorials";
import { mathsScienceExpansion } from "./tutorialExpansionMathScience";
import { socialExpansion } from "./tutorialExpansionSocial";
import { computingWorldExpansion } from "./tutorialExpansionComputingWorld";
import { languagesExpansion } from "./tutorialExpansionLanguages";

/** Draft teaching content, pending independent academic verification and board mapping. */
export const stemExpansion: Tutorial[] = [
  ...mathsScienceExpansion,
  ...socialExpansion,
  ...computingWorldExpansion,
  ...languagesExpansion,
];
