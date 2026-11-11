import type { Tutorial } from "./tutorials";
import { milestoneMathsLessons } from "./milestoneMathsLessons";
import { milestonePhysicsLessons } from "./milestonePhysicsLessons";
import { milestoneChemistryLessons } from "./milestoneChemistryLessons";
import { milestoneBiologyLessons } from "./milestoneBiologyLessons";
import { milestoneComputingLessons } from "./milestoneComputingLessons";
import { milestoneHumanitiesLessons } from "./milestoneHumanitiesLessons";

/** 24 original formative teaching lessons with 8 self-checks each (192 checks). */
export const milestone200Lessons: Tutorial[] = [
  ...milestoneMathsLessons,
  ...milestonePhysicsLessons,
  ...milestoneChemistryLessons,
  ...milestoneBiologyLessons,
  ...milestoneComputingLessons,
  ...milestoneHumanitiesLessons,
];
