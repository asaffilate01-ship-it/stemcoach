import type { Tutorial } from "./tutorials";
import { novemberSTEM } from "./tutorialExpansionNovemberSTEM";
import { novemberHumanities } from "./tutorialExpansionNovemberHumanities";
import { novemberLanguages } from "./tutorialExpansionNovemberLanguages";

/** Original additional formative lessons: editorial and syllabus reviews pending. */
export const novemberQAExpansion: Tutorial[] = [
  ...novemberSTEM,
  ...novemberHumanities,
  ...novemberLanguages,
];
