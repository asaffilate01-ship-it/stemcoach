import type { Tutorial } from "./tutorials";
import { phaseNextSTEM } from "./tutorialExpansionPhaseNextSTEM";
import { phaseNextHumanities } from "./tutorialExpansionPhaseNextHumanities";
import { phaseNextLanguages } from "./tutorialExpansionPhaseNextLanguages";

/** Original formative teaching material — academic and board mapping review outstanding. */
export const phaseNextQAExpansion: Tutorial[] = [
  ...phaseNextSTEM,
  ...phaseNextHumanities,
  ...phaseNextLanguages,
];
