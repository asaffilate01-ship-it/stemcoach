import type { AuthorLesson } from "./tutorialExpansionLargeAuthoring";
import { authorTenCheckLesson } from "./tutorialExpansionLargeAuthoring";

/** Original Spanish formative drafts; human review required before authoritative reuse. */
const specs: AuthorLesson[] = [
  {
    id: "spanish-gustar-pronouns", subject: "spanish", title: "Spanish Gustar and Everyday Preferences", level: "Intermediate",
    summary: "Express likes with gusta/gustan and indirect-object pronouns in short sentences.",
    objectives: ["Distinguish gusta and gustan", "Use common indirect-object pronouns", "Understand the structure of expressing preferences"],
    lesson: [
      "Gustar often expresses what pleases someone. Me gusta el café means I like coffee, literally coffee pleases me.",
      "Use gusta with a singular thing or infinitive, and gustan with plural things: me gustan los libros.",
      "Common indirect-object pronouns include me, te, le, nos, os and les; the pronoun indicates the person experiencing the preference.",
    ],
    workedExample: "Me gusta leer means I like reading. A ella le gustan las películas means she likes films; películas is plural, so the verb is gustan.",
    examTip: "First identify what is liked and whether it is singular, plural or an infinitive, then choose the appropriate pronoun.",
    commonMistake: "Writing 'me gusto los libros' by conjugating gustar for the person rather than agreeing with the thing liked.",
    checks: [
      ["Complete: Me ___ el chocolate.", ["gustan", "gusta", "gustamos", "gusto"], 1, "El chocolate is singular, so use gusta with me."],
      ["Which phrase means 'I like books'?", ["Me gustan los libros", "Me gusta los libros", "Yo gusto los libros", "Me gusto libros"], 0, "Los libros is plural, so the standard phrase is me gustan los libros."],
      ["Complete: A ella ___ gustan las flores.", ["me", "nos", "le", "te"], 2, "The indirect-object pronoun le refers to ella in this construction."],
      ["Which form is usually used with an infinitive such as viajar?", ["gustan", "gusto", "gustas", "gusta"], 3, "An infinitive phrase generally takes singular gusta, as in me gusta viajar."],
      ["What does '¿Te gusta la música?' mean?", ["Do they like music?", "Do you like music?", "I like music", "We like music"], 1, "Te refers to the person addressed, so the question asks whether you like music."],
      ["Complete: Nos ___ las montañas.", ["gustan", "gusta", "gusto", "gustas"], 0, "Montañas is plural; nos gustan means we like the mountains."],
      ["Which pronoun commonly indicates 'we like' in gustar sentences?", ["le", "les", "nos", "me"], 2, "Nos is the indirect-object pronoun referring to us."],
      ["Choose a natural expression for 'She likes reading'.", ["Ella gusta leer", "A ella gustan leer", "A ella le gustan leer", "A ella le gusta leer"], 3, "The infinitive leer takes gusta, and le refers to the person who likes it."],
    ],
    truth: ["'Me gustan las manzanas' is correct when discussing liking several apples.", true, "Las manzanas is plural, so the verb in this construction is gustan."],
    recall: ["Write the Spanish form of gustar used with plural things.", "gustan", "Gustan agrees with plural things that are liked, as in me gustan los libros."],
  },
  {
    id: "spanish-past-preterite-regular", subject: "spanish", title: "Spanish Regular Preterite for Completed Events", level: "Intermediate",
    summary: "Recognise regular past forms used for completed events in simple narratives.",
    objectives: ["Recognise first-person regular -ar past forms", "Form third-person common -er/-ir past forms", "Distinguish present and completed past statements"],
    lesson: [
      "The preterite often presents an event as completed. Regular -ar verbs use endings such as -é (yo) and -ó (él/ella).",
      "Regular -er and -ir verbs commonly share -í (yo) and -ió (él/ella) in the preterite.",
      "Time expressions such as ayer (yesterday) can give context, but a full tense choice may depend on narrative meaning and aspect.",
    ],
    workedExample: "Ayer hablé con Ana means I spoke with Ana yesterday. Ella comió temprano means she ate early, and escribí una carta means I wrote a letter.",
    examTip: "Pay attention to written accents: hablo (present, I speak) and habló (preterite, he/she spoke) differ.",
    commonMistake: "Omitting the accent on habló or confusing first-person hablé with third-person habló.",
    checks: [
      ["Complete: Ayer yo ___ español. (hablar)", ["hablo", "hablé", "habló", "hablamos"], 1, "The regular first-person preterite of hablar is hablé."],
      ["Which means 'she spoke' in the preterite?", ["ella habló", "ella hablo", "ella hablaste", "ella hablan"], 0, "Ella habló takes the third-person singular regular -ar preterite ending -ó."],
      ["Complete: Yo ___ una pizza ayer. (comer)", ["como", "comeré", "comí", "comió"], 2, "The regular first-person preterite of comer is comí."],
      ["Which form means 'he lived' (completed past)?", ["vive", "viví", "viven", "vivió"], 3, "Él vivió is the regular third-person singular preterite of vivir."],
      ["What is the usual meaning of 'ayer'?", ["today", "yesterday", "tomorrow", "last month"], 1, "Ayer means yesterday and frequently appears with completed past events."],
      ["Which past form means 'I wrote'?", ["escribí", "escribo", "escribe", "escribió"], 0, "Escribir is an -ir verb; yo escribí is the regular preterite first person."],
      ["What distinguishes 'habló' from 'hablo' in writing?", ["Both are identical", "The number of letters", "The accent signals a different tense/person", "Only punctuation"], 2, "Habló has an accent and is third-person preterite; hablo is first-person present."],
      ["Which sentence uses a regular preterite form correctly?", ["Ayer ella comí", "Ayer yo comió", "Ayer ellos come", "Ayer ella comió"], 3, "Ella comió is the third-person singular preterite of comer."],
    ],
    truth: ["The forms 'hablo' and 'habló' are interchangeable in standard written Spanish.", false, "Hablo means I speak in the present; habló means he or she spoke in the preterite."],
    recall: ["Write the Spanish preterite first-person singular of 'hablar'.", "hablé", "Hablé means I spoke; the final vowel has an accent in standard Spanish."],
  },
];
export const spanishDepthExpansion = specs.map(authorTenCheckLesson);
