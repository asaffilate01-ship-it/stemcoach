import type { AuthorLesson } from "./tutorialExpansionLargeAuthoring";
import { authorTenCheckLesson } from "./tutorialExpansionLargeAuthoring";

/** Additional original formative teaching drafts; native-language review required. */
const specs: AuthorLesson[] = [
  {
    id: "italian-present-regular-verbs", subject: "italian", title: "Italian Regular Verbs in the Present Tense", level: "Foundation",
    summary: "Recognise common endings for regular -are, -ere and -ire verbs in everyday sentences.",
    objectives: ["Conjugate parlare with familiar subjects", "Recognise common -ere and -ire endings", "Use subject agreement in short statements"],
    lesson: [
      "A regular -are verb such as parlare uses parlo, parli, parla, parliamo, parlate, parlano in the present tense.",
      "A common regular -ere verb such as credere uses credo, credi, crede, crediamo, credete, credono.",
      "A regular -ire verb such as dormire uses dormo, dormi, dorme, dormiamo, dormite, dormono; some -ire verbs have an additional -isc- pattern, so check the verb.",
    ],
    workedExample: "Io parlo italiano means I speak Italian. Noi crediamo al risultato means we believe the result, and loro dormono means they sleep.",
    examTip: "Identify the infinitive group and subject before selecting a present-tense ending; practise with full sentences.",
    commonMistake: "Assuming all -ire verbs use identical stems; verbs such as capire use capisco, but dormire uses dormo.",
    checks: [
      ["Complete: Io ___ italiano. (parlare)", ["parli", "parlo", "parla", "parliamo"], 1, "Io takes -o in the regular present of parlare, giving parlo."],
      ["Which form means 'we speak'?", ["parliamo", "parlano", "parlate", "parlo"], 0, "Noi takes -iamo with parlare: parliamo."],
      ["Complete: Lei ___ in biblioteca. (studiare)", ["studio", "studi", "studia", "studiamo"], 2, "Third-person singular of studiare is studia, so lei studia."],
      ["Which means 'they sleep'?", ["dormiamo", "dormite", "dorme", "dormono"], 3, "Loro takes dormono with the regular -ire verb dormire."],
      ["Complete: Tu ___ alle otto. (dormire)", ["dormo", "dormi", "dorme", "dormono"], 1, "Second-person singular tu takes dormi."],
      ["Which form means 'you all believe' (voi)?", ["credete", "crediamo", "crede", "credono"], 0, "Voi takes the -ete ending with credere, resulting in credete."],
      ["Complete: Noi ___ al professore. (credere)", ["credo", "credono", "crediamo", "crede"], 2, "The regular first-person plural of credere is crediamo."],
      ["Which verb is commonly conjugated 'io capisco'?", ["parlare", "credere", "dormire", "capire"], 3, "Capire is an -ire verb that commonly inserts -isc- in several present-tense forms, including capisco."],
    ],
    truth: ["'Noi parliamo' means 'we speak' in Italian.", true, "Parliamo is the first-person plural present-tense form of parlare."],
    recall: ["Write the Italian first-person singular present form of 'parlare'.", "parlo", "The present-tense form with io is parlo, meaning I speak.", ["io parlo"]],
  },
  {
    id: "italian-adjective-agreement", subject: "italian", title: "Italian Adjectives and Noun Agreement", level: "Foundation",
    summary: "Use simple adjective endings to describe nouns of different genders and numbers.",
    objectives: ["Recognise common -o/-a adjective patterns", "Make simple plural agreements", "Interpret everyday noun–adjective pairs"],
    lesson: [
      "Many common descriptive adjectives ending in -o change to -a for feminine singular, -i for masculine plural and -e for feminine plural.",
      "Adjectives ending in -e often use the same singular form for masculine and feminine nouns, with -i in the plural.",
      "An adjective must describe the relevant noun; remember that some adjectives are irregular or follow different patterns.",
    ],
    workedExample: "Un libro nuovo means a new book; una casa nuova means a new house. I libri nuovi and le case nuove show the common masculine and feminine plural patterns.",
    examTip: "Identify the gender and number of the noun first, then apply the appropriate adjective ending.",
    commonMistake: "Leaving a singular -o adjective unchanged when the described noun is feminine or plural.",
    checks: [
      ["Complete: una casa ___. (nuovo)", ["nuovi", "nuova", "nuove", "nuovo"], 1, "Casa is feminine singular, so nuovo changes to nuova."],
      ["Which means 'new books'?", ["libri nuovi", "libri nuova", "libri nuove", "libri nuovo"], 0, "Libri is masculine plural, so the adjective takes the -i ending: nuovi."],
      ["Complete: le ragazze ___. (alto)", ["alta", "alti", "alte", "alto"], 2, "Ragazze is feminine plural, which takes alte."],
      ["What is the masculine singular form of 'bella'?", ["belli", "belle", "belloa", "bello"], 3, "Bello is the masculine singular base form corresponding to feminine bella."],
      ["Which phrase is grammatically concordant?", ["una ragazza alto", "una ragazza alta", "una ragazza alti", "una ragazza alte"], 1, "Ragazza and alta are both feminine singular."],
      ["Complete: un film ___. (interessante)", ["interessante", "interessanti", "interessanta", "interessanto"], 0, "Interessante ends in -e and works for masculine singular and feminine singular."],
      ["What is the regular plural of 'interessante'?", ["interessanta", "interessante", "interessanti", "interessanto"], 2, "Adjectives ending in -e commonly take -i in the plural."],
      ["Complete: i bambini ___. (piccolo)", ["piccola", "piccole", "piccolo", "piccoli"], 3, "Bambini is masculine plural, so piccolo becomes piccoli."],
    ],
    truth: ["'Le case nuove' uses a feminine plural adjective matching the noun.", true, "Case is feminine plural, and nuove matches its gender and number."],
    recall: ["Write the feminine plural form of 'nuovo'.", "nuove", "The adjective nuovo changes to nuove when describing feminine plural nouns.", ["Nuove"]],
  },
];
export const italianDepthExpansion = specs.map(authorTenCheckLesson);
