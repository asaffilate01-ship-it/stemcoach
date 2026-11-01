import type { Tutorial } from "./tutorials";
import { mcq, trueFalse, multi, order, match, fillBlanks, short } from "./tutorialQuestions";

/** Original language and teacher-training self-checks; not official exam papers. */
export const phaseNextLanguages: Tutorial[] = [
  {
    id: "ielts-reading-skimming-scanning", subject: "ielts",
    title: "IELTS Reading: Skimming, Scanning and Inference", level: "Intermediate", minutes: 16,
    summary: "Find a text's central purpose, locate details and distinguish a supported inference from guesswork.",
    objectives: ["Distinguish skimming and scanning", "Identify textual evidence for answers", "Avoid unsupported inferences and word-limit errors"],
    lesson: [
      "Skimming means reading quickly for broad meaning and structure, such as a main topic, paragraph purpose or overall argument. It does not require understanding every individual word.",
      "Scanning means searching a text for specific details such as names, years, figures or key phrases. Related wording and paraphrases may be used instead of exact repeated words.",
      "An inference is a conclusion supported by what the text says, not merely a plausible outside fact. Follow each question's instructions, particularly a permitted number of answer words."
    ],
    workedExample: "An original passage states: 'The library once closed at five. After students requested evening access, the centre began opening until eight.' A supported inference is that the change responded to students' requests; a claim about the library's annual budget is unsupported.",
    examTip: "Locate the sentence that supports an answer and check the question's permitted number of words before writing.",
    commonMistake: "Selecting an answer because it sounds generally reasonable even though the passage does not support it.",
    checkpoint: mcq("Which reading technique helps you locate a specific date quickly?", ["Scanning", "Skimming for an overall thesis", "Reading every line aloud", "Guessing from outside knowledge"], "Scanning", "Scanning searches for a particular detail such as a date or name, rather than summarising the whole passage.", "Think of finding an exact item in a text."),
    practice: [
      trueFalse("A sensible inference must be supported by details in the supplied passage.", true, "An inference goes beyond direct quotation but still needs textual evidence rather than unsupported outside assumptions.", "Ask what the writer's words allow you to conclude."),
      multi("Which behaviours can improve accuracy in a reading task?", ["Check the question's word limit", "Look for paraphrases of key ideas", "Verify the location of supporting evidence", "Invent extra details to fill any gaps"], ["Check the question's word limit", "Look for paraphrases of key ideas", "Verify the location of supporting evidence"], "Answering according to instructions, identifying paraphrases and checking evidence are helpful; invented claims are not.", "One choice adds information not in the text."),
      match("Match the reading task with the best strategy.", [["Find a year mentioned in a paragraph", "scan for a specific detail"], ["Identify the main purpose of an article", "skim for overall meaning"], ["Judge a claim about a writer's attitude", "inspect relevant evidence and wording"]], "The best reading approach depends on whether the task asks for a detail, overview or interpretation.", "Distinguish searching, surveying and analysing."),
      order("Put these actions in a sensible sequence for answering a text-based question.", ["Read the question and its instructions", "Find the relevant passage evidence", "Check the answer against the passage and word limit"], "Instructions define the task, textual evidence supports the answer, and a final check prevents avoidable errors.", "Start with what the question is actually asking."),
      fillBlanks("Name two complementary reading strategies.", [["overview", "Rapid reading for overall meaning is:", "skimming"], ["detail", "Searching for a specific named detail is:", "scanning"]], "Skimming builds a broad understanding; scanning locates targeted details such as dates or names.", "Use an overview strategy first and a search strategy second.")
    ]
  },
  {
    id: "celta-pronunciation-stress-minimal-pairs", subject: "celta",
    title: "Teaching Pronunciation: Word Stress and Minimal Pairs", level: "Intermediate", minutes: 16,
    summary: "Plan pronunciation awareness and correction around stress, syllables and meaningful sound contrasts.",
    objectives: ["Distinguish sounds from spelling", "Identify word stress in common examples", "Explain why minimal pairs can support listening discrimination"],
    lesson: [
      "English spelling and pronunciation do not always correspond one-to-one. A phoneme is a contrastive speech sound in a language, while a grapheme is a written symbol.",
      "A word with more than one syllable may have a more prominent stressed syllable. Stress patterns can influence how easily a listener recognises a word.",
      "Minimal pairs differ by a single phoneme in the same position, such as 'pat' and 'bat' in many English accents. Teachers may use listening discrimination, modelling and contextualised practice rather than correction without explanation."
    ],
    workedExample: "In many standard pronunciations, the word 'TAble' has stress on its first syllable, whereas 'aBOUT' has stress on the second. Comparing 'pat' and 'bat' can draw attention to the /p/ versus /b/ initial contrast.",
    examTip: "Check an appropriate pronunciation reference and identify a learner's target contrast before deciding on a drilling activity.",
    commonMistake: "Assuming English word stress is always predicted by spelling or that repeating an inaccurate model guarantees learning.",
    checkpoint: mcq("In the common pronunciation of 'table', which syllable receives primary stress?", ["First syllable", "Second syllable", "Both equally", "Neither syllable can carry stress"], "First syllable", "The commonly taught pronunciation is TA-ble, with primary stress on the initial syllable.", "Say TA-ble aloud and notice which part is prominent."),
    practice: [
      trueFalse("Minimal pairs can differ by one phoneme while otherwise sounding alike.", true, "Pairs such as 'pat' and 'bat' contrast the initial consonant while keeping the remaining sound sequence comparable.", "Compare one sound position at a time."),
      multi("Which approaches can help learners notice pronunciation contrasts?", ["Listen and discriminate between targeted sound pairs", "Provide a clear spoken model", "Use communicative practice after noticing the sound", "Assume spelling alone always reveals pronunciation"], ["Listen and discriminate between targeted sound pairs", "Provide a clear spoken model", "Use communicative practice after noticing the sound"], "Listening, modelling and meaningful use can support pronunciation work; English spelling alone is not fully reliable.", "One option ignores inconsistent spelling–sound relationships."),
      match("Match pronunciation terms with simple meanings.", [["Phoneme", "contrastive speech sound"], ["Grapheme", "written letter or letter group"], ["Word stress", "relative prominence of a syllable"]], "A phoneme is a language sound distinction, a grapheme is written, and stress marks syllable prominence.", "Decide whether each concept concerns sound, writing or rhythm."),
      order("Arrange a possible progression for a focused pronunciation activity.", ["Let learners hear the target sound contrast", "Check whether they can identify it when listening", "Practise producing the target sounds in meaningful words"], "Auditory noticing can be followed by discrimination and production practice; teachers adapt the order to context.", "Recognise the target contrast before practising output."),
      short("What is the teaching term for a pair such as 'pat' and 'bat' that differs in one phoneme?", "minimal pair", "A minimal pair contains words differentiated by a single phoneme, making it useful for highlighting sound contrasts.", "The term consists of the adjective minimal and a noun.", ["a minimal pair", "minimal pairs"])
    ]
  },
  {
    id: "french-imparfait-passe-compose", subject: "french",
    title: "Imparfait et passé composé: Context and Events", level: "Intermediate", minutes: 17,
    summary: "Contrast background descriptions and ongoing habits with bounded past events in French.",
    objectives: ["Choose the imperfect for habitual or background situations", "Recognise the passé composé for completed events", "Explain when both tenses appear in one narrative"],
    lesson: [
      "The imparfait often describes ongoing background circumstances, repeated past habits or descriptions without presenting a precise endpoint.",
      "The passé composé often presents completed past events as bounded actions. Exact choice depends on perspective and context rather than rigid one-word time clues.",
      "The two tenses frequently occur together: Je lisais quand le téléphone a sonné describes an ongoing reading situation interrupted by a completed phone-ring event."
    ],
    workedExample: "Quand j'étais petit, je jouais au parc chaque samedi expresses a past habit using the imparfait. Hier, j'ai joué au parc presents yesterday's play as a completed occurrence using the passé composé.",
    examTip: "Identify whether the clause establishes continuing background or reports a bounded past event before selecting a tense.",
    commonMistake: "Assuming every past action with a time expression requires one particular tense without checking context.",
    checkpoint: mcq("Complete the background situation: 'Je ___ quand le téléphone a sonné.'", ["lisais", "ai lu", "lirai", "lis"], "lisais", "Je lisais presents the reading as an ongoing background action when the telephone rang.", "An ongoing background action normally favours the imperfect here."),
    practice: [
      trueFalse("The imparfait can describe repeated habits in the past.", true, "The imparfait commonly presents repeated background habits, such as an activity performed every weekend.", "Think about what someone regularly used to do."),
      multi("Which examples can naturally describe a past habit using the imparfait?", ["Chaque été, nous allions à la mer", "Quand j'étais jeune, je jouais dehors", "Tous les dimanches, elle lisait", "Hier, il a acheté un billet une seule fois"], ["Chaque été, nous allions à la mer", "Quand j'étais jeune, je jouais dehors", "Tous les dimanches, elle lisait"], "The first three depict repeated habits or background conditions, whereas the last reports one completed purchase.", "Spot recurring time frames such as chaque and tous les."),
      match("Match the French form with a simple function in context.", [["je lisais", "ongoing past background"], ["j'ai lu", "completed past reading event"], ["je lirai", "future reading"]], "The imperfect sets background, the passé composé presents a completed past action and the simple future refers ahead.", "Distinguish background past, bounded past and future."),
      order("Arrange these actions for selecting a French narrative tense.", ["Identify whether the event is background or bounded", "Choose the appropriate past tense for the meaning", "Conjugate the verb and check the complete sentence"], "A meaningful tense decision precedes conjugating the verb, with context and agreement checked at the end.", "Interpret the story before choosing the form."),
      fillBlanks("Complete the past habit and a bounded event.", [["habit", "Quand j'étais petit, je ___ au parc chaque samedi. (jouer)", "jouais"], ["event", "Hier, j'___ au parc. (jouer, passé composé)", "ai joué"]], "Je jouais describes a repeated childhood habit; j'ai joué describes a completed event yesterday.", "Use imperfect for repeated habit and passé composé for yesterday's event.")
    ]
  },
  {
    id: "german-modal-verbs-word-order", subject: "german",
    title: "German Modal Verbs and Word Order", level: "Foundation", minutes: 15,
    summary: "Use können and müssen correctly with a main-verb infinitive at the end of a clause.",
    objectives: ["Conjugate common modal verbs", "Place infinitives at the end of main clauses", "Distinguish ability and necessity"],
    lesson: [
      "Common German modal verbs include können for ability and müssen for necessity. Their conjugations differ from regular verb patterns.",
      "In a basic main-clause statement, the conjugated modal occupies the finite-verb position and the main verb remains an infinitive towards the end: Ich kann schwimmen.",
      "Match the modal to the subject, for example ich muss, du musst, wir müssen; ich kann, du kannst, wir können. A modal can change the meaning of an otherwise identical action."
    ],
    workedExample: "Wir müssen heute lernen means 'We have to study today': wir takes müssen and lernen stays an infinitive at the end. Du kannst morgen spielen means 'You can play tomorrow'.",
    examTip: "Check the subject–modal agreement and move the second verb into the final infinitive position.",
    commonMistake: "Conjugating both verbs, for example writing 'Ich kann schwimme' instead of 'Ich kann schwimmen'.",
    checkpoint: mcq("Which German sentence correctly means 'I can swim'?", ["Ich kann schwimmen", "Ich können schwimmen", "Ich kann schwimme", "Ich schwimmen kann"], "Ich kann schwimmen", "Ich takes kann and the main verb schwimmen remains an infinitive in the normal final position.", "Only the modal is conjugated."),
    practice: [
      trueFalse("In 'Wir müssen lernen', lernen is an infinitive rather than a conjugated verb.", true, "The modal müssen agrees with wir while lernen stays in its infinitive form at the end.", "Look at the verb that agrees with wir."),
      multi("Which sentences use the modal and infinitive patterns correctly?", ["Du kannst spielen", "Wir müssen lernen", "Ich kann lesen", "Er können gehen"], ["Du kannst spielen", "Wir müssen lernen", "Ich kann lesen"], "Du takes kannst, wir takes müssen and ich takes kann; er instead takes kann, not können.", "Check third-person singular agreement."),
      match("Match each pronoun with the present tense of können.", [["ich", "kann"], ["du", "kannst"], ["wir", "können"]], "Ich kann, du kannst and wir können use different person forms of the same modal verb.", "Notice the change from singular forms to plural."),
      order("Put the steps for constructing a basic modal-verb sentence in order.", ["Choose the subject and intended meaning", "Conjugate the modal verb for that subject", "Put the main-verb infinitive at the end"], "The modal carries the person marking, while the main lexical verb stays as an infinitive at the end.", "First decide who acts and whether it is possible or necessary."),
      fillBlanks("Complete two common German modal-verb sentences.", [["ability", "Du ___ gut schwimmen. (können)", "kannst"], ["need", "Wir ___ für die Prüfung lernen. (müssen)", "müssen"]], "Du requires kannst for ability and wir requires müssen for necessity, with both second verbs infinitive.", "Match each present-tense modal to its subject.")
    ]
  },
];
