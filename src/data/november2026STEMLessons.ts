import type { Tutorial } from "./tutorials";
import { newMathematicsLessons } from "./november2026MathsLessons";
import { newPhysicsLessons } from "./november2026PhysicsLessons";
import { newChemistryLessons } from "./november2026ChemistryLessons";
import { newBiologyLessons } from "./november2026BiologyLessons";
import { newComputingLessons } from "./november2026ComputingLessons";

/** 20 authored lessons and 160 formative checks; not independently moderated. */
export const november2026STEMLessons: Tutorial[] = [
  ...newMathematicsLessons,
  ...newPhysicsLessons,
  ...newChemistryLessons,
  ...newBiologyLessons,
  ...newComputingLessons,
];
