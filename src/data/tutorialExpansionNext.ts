import type { Tutorial } from "./tutorials";
import { nextQAExpansionA } from "./tutorialExpansionNextA";
import { nextQAExpansionB } from "./tutorialExpansionNextB";

/** Student revision drafts; they have not been independently exam-board verified. */
export const nextQAExpansion: Tutorial[] = [...nextQAExpansionA, ...nextQAExpansionB];
