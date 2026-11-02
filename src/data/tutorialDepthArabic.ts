import type { AuthorLesson } from "./tutorialExpansionLargeAuthoring";
import { authorTenCheckLesson } from "./tutorialExpansionLargeAuthoring";

/** Modern Standard Arabic introductory drafts; native-speaker review required. */
const specs: AuthorLesson[] = [
  {
    id: "arabic-question-words-locations", subject: "arabic", title: "Modern Standard Arabic: Questions and Places", level: "Foundation",
    summary: "Recognise common MSA question words and names of everyday places.",
    objectives: ["Use أين to ask where", "Identify من and متى in context", "Recognise common location vocabulary"],
    lesson: [
      "أَيْنَ (ayna) means where. أَيْنَ الْمَكْتَبَةُ؟ asks Where is the library?",
      "مَنْ (man) asks who, and مَتَى (matā) asks when. Short vowel marks may be omitted in ordinary written Arabic.",
      "Useful place nouns include مَدْرَسَة (school), مَكْتَبَة (library), مَطَار (airport) and مَحَطَّة (station).",
    ],
    workedExample: "أَيْنَ الْمَدْرَسَةُ؟ means Where is the school? مَنْ هَذَا؟ means Who is this? مَتَى يَبْدَأُ الدَّرْسُ؟ means When does the lesson begin?",
    examTip: "Identify the question word before interpreting the rest of the sentence, and check noun gender when forming a verb phrase.",
    commonMistake: "Confusing مَنْ (who) with مِنْ (from) when vowel marks are omitted; the grammatical context matters.",
    checks: [
      ["ما معنى «أَيْنَ» بالإنجليزية؟", ["when", "where", "how much", "who"], 1, "أَيْنَ (ayna) is the usual MSA question word meaning where."],
      ["Which Arabic question word asks 'who'?", ["مَنْ", "أَيْنَ", "مَتَى", "كَمْ"], 0, "مَنْ (man) is the interrogative meaning who."],
      ["Which question word means 'when'?", ["ماذا", "أين", "متى", "من"], 2, "مَتَى (matā) asks about time: when."],
      ["What does «مَكْتَبَة» mean?", ["airport", "house", "school", "library"], 3, "مَكْتَبَة (maktaba) is a library or bookshop depending on context; here the intended place is a library."],
      ["Which word commonly means 'airport'?", ["البيت", "المطار", "الكتاب", "القلم"], 1, "مَطَار (maṭār) means airport; المطار means the airport."],
      ["Which question most directly asks 'Where is the school?'", ["أين المدرسة؟", "متى المدرسة؟", "من المدرسة؟", "كم المدرسة؟"], 0, "أَيْنَ الْمَدْرَسَةُ؟ asks for the location of the school."],
      ["Which Arabic noun means 'station'?", ["مطار", "مكتبة", "محطة", "مدرسة"], 2, "مَحَطَّة (maḥaṭṭa) means station, such as a railway station."],
      ["What does «مَنْ هَذَا؟» ask?", ["Where is the house?", "When do we arrive?", "How much is this?", "Who is this?"], 3, "مَنْ asks who, while هَذَا means this for a masculine referent."],
    ],
    truth: ["'أين' asks for a place or location in Modern Standard Arabic.", true, "أَيْنَ is commonly used to ask where something or someone is."],
    recall: ["اكتب أداة الاستفهام التي تعني 'أين' (where).", "أين", "أَيْنَ is the common MSA question word meaning where.", ["أَيْنَ"]],
  },
  {
    id: "arabic-numbers-one-to-ten", subject: "arabic", title: "Modern Standard Arabic: Counting from One to Ten", level: "Foundation",
    summary: "Read Arabic number words and match them to the digits one through ten.",
    objectives: ["Recognise Arabic number words from one to ten", "Match Eastern Arabic-Indic digits with values", "Read simple numeric sequences"],
    lesson: [
      "Basic Arabic number words include واحد (one), اثنان (two), ثلاثة (three), أربعة (four) and خمسة (five).",
      "Six to ten include ستة, سبعة, ثمانية, تسعة and عشرة. These are standalone counting words; counting specific nouns has additional gender and case rules.",
      "Eastern Arabic-Indic digits often appear as ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩ ١٠; some regions commonly use Western digits instead.",
    ],
    workedExample: "Counting one to five as standalone words: واحد، اثنان، ثلاثة، أربعة، خمسة. The numeral ٧ is seven and ١٠ is ten; the form of number words with counted nouns can vary.",
    examTip: "Separate recognising a numeral's value from learning full agreement rules for counted nouns, which are more complex.",
    commonMistake: "Assuming the basic standalone number words always appear unchanged before every noun; Arabic numbers show agreement and case patterns.",
    checks: [
      ["ما قيمة الرقم «٣»؟", ["two", "three", "four", "five"], 1, "The Eastern Arabic-Indic numeral ٣ represents the number three."],
      ["Which Arabic word means 'one' in standalone counting?", ["واحد", "ثلاثة", "خمسة", "سبعة"], 0, "وَاحِد (wāḥid) is the common standalone masculine form meaning one."],
      ["What is the number value of «٨»?", ["6", "7", "8", "9"], 2, "The Eastern Arabic-Indic digit ٨ corresponds to eight."],
      ["Which standalone word corresponds to ten?", ["ستة", "تسعة", "اثنان", "عشرة"], 3, "عَشَرَة (ʿashara) is a common standalone form of ten."],
      ["ما قيمة الرقم «٥»؟", ["four", "five", "six", "seven"], 1, "The digit ٥ is five."],
      ["Which Arabic counting word corresponds to two?", ["اثنان", "أربعة", "ثمانية", "ستة"], 0, "اثنان (ithnān) is a common standalone nominative form of two."],
      ["Which numeral represents seven?", ["٦", "٨", "٧", "٩"], 2, "٧ is the Eastern Arabic-Indic digit for seven."],
      ["Which pair has the same numeric value?", ["٢ and خمسة", "٤ and ستة", "٩ and ثلاثة", "٩ and تسعة"], 3, "Both ٩ and تسعة express the value nine."],
    ],
    truth: ["The Arabic numeral '١٠' represents ten.", true, "The two-character Eastern Arabic-Indic numeral ١٠ means ten."],
    recall: ["اكتب كلمة «ثلاثة» (three) دون حركات.", "ثلاثة", "ثلاثة is the standalone Arabic counting form for three, without optional short vowel marks.", ["ثَلَاثَة"]],
  },
];
export const arabicDepthExpansion = specs.map(authorTenCheckLesson);
