import type { Tutorial } from "./tutorials";
import { mcq, numeric, short, multi, trueFalse, match, order, fillBlanks, diagramLabel } from "./tutorialQuestions";

/** Teaching drafts for self-check revision. Not independently accredited or exam-board verified. */
export const nextQAExpansionB: Tutorial[] = [
  {
    id: "retrieval-practice-memory", subject: "psychology", title: "Retrieval Practice and Long-Term Memory", level: "Foundation", minutes: 15,
    summary: "Distinguish retrieval practice from rereading and plan a fair learning comparison.",
    objectives: ["Define retrieval practice", "Explain why delay matters in a memory test", "Identify a simple confound"],
    lesson: [
      "Retrieval practice means trying to recall previously studied material from memory, with feedback afterwards.",
      "Simply rereading notes provides another exposure, but a delayed recall test provides a way to assess lasting learning.",
      "To compare study methods fairly, keep the material, total study time, test difficulty and time until testing comparable.",
    ],
    workedExample: "Two groups learn the same 20 definitions. One rereads notes and the other practises recalling the definitions; both are tested a week later under similar conditions. The later test gives stronger evidence about retention than an immediate score alone.",
    examTip: "A fair comparison needs controlled conditions and a clearly measurable memory outcome.",
    commonMistake: "Assuming a study technique is better simply because it feels easier during practice.",
    checkpoint: mcq("Which activity is retrieval practice?", ["Recall an answer without looking, then check it", "Read the same paragraph continuously", "Highlight every sentence", "Copy the glossary without testing yourself"], "Recall an answer without looking, then check it", "Retrieval practice requires recalling information from memory rather than merely recognising it on the page.", "Which task actively tests memory?"),
    practice: [
      fillBlanks("Complete the research terms used in studying memory.", [
        ["iv", "The study method manipulated by the researcher is the ____ variable.", "independent"],
        ["dv", "The number of correctly recalled items is the ____ variable.", "dependent"],
      ], "The study strategy is the independent variable; recall performance is the dependent variable.", "One variable is changed; the other is measured."),
      trueFalse("An immediate feeling of familiarity guarantees good recall one week later.", false, "Familiarity from exposure does not guarantee retrieval after a delay.", "Recognition while reading differs from recall."),
      order("Arrange the steps of a simple retrieval-practice comparison.", ["Assign comparable learning material", "Use the chosen study methods", "Wait the same interval", "Test recall under comparable conditions"], "To compare long-term recall, groups must study equivalent material, follow methods, wait equally and then be assessed consistently.", "A delayed test comes after studying."),
    ],
  },
  {
    id: "water-cycle-labelling", subject: "geography", title: "The Water Cycle: Processes and Diagram Labels", level: "Foundation", minutes: 16,
    summary: "Recognise evaporation, condensation and precipitation in a simple water-cycle diagram.",
    objectives: ["Identify evaporation from surface water", "Recognise condensation in cloud formation", "Trace precipitation back toward surface stores"],
    lesson: [
      "Solar energy helps water evaporate from oceans, lakes and other wet surfaces into water vapour.",
      "As moist air cools, water vapour can condense into tiny liquid droplets; cloud formation often involves this process.",
      "Precipitation falls when droplets or ice particles grow sufficiently; water returns to rivers, soils and surface stores.",
    ],
    workedExample: "Water evaporates from a lake, then moist rising air cools and forms cloud droplets through condensation. Rain returns water to the ground and lake, completing a simple cycle.",
    examTip: "Describe each process and the direction of water movement, rather than listing nouns alone.",
    commonMistake: "Calling cloud formation evaporation when it involves condensation of vapour.",
    checkpoint: diagramLabel("On the simplified water-cycle diagram, identify processes A, B and C.", "water-cycle", [
      ["A", 145, 45, "Condensation"], ["B", 80, 136, "Evaporation"], ["C", 255, 116, "Precipitation"],
    ], ["Evaporation", "Precipitation", "Condensation"], "A is cloud formation by condensation; B shows water rising as vapour through evaporation; C depicts rainfall as precipitation.", "Think upward movement, cloud formation, then falling water."),
    practice: [
      fillBlanks("Complete two definitions of the water cycle.", [
        ["liquid", "The change from liquid water into vapour is ____.", "evaporation"],
        ["gas", "Vapour cooling to form liquid droplets is ____.", "condensation"],
      ], "Evaporation forms vapour from liquid water; condensation forms droplets from vapour.", "One process changes liquid to gas; the other reverses it."),
      match("Match the process with a simple example.", [["Evaporation", "Liquid lake water becomes vapour"], ["Condensation", "Cloud droplets form from vapour"], ["Precipitation", "Rain falls to the ground"]], "The three processes describe liquid-to-vapour, vapour-to-droplets and water falling to the surface.", "Focus on the state and direction of each change."),
      trueFalse("Water in the water cycle is continuously created from nothing when it rains.", false, "The water cycle transfers and changes the state of existing water rather than creating it from nothing.", "Water is conserved across the cycle."),
    ],
  },
  {
    id: "business-swot-decision", subject: "business-studies", title: "Using SWOT to Evaluate a Business Choice", level: "Intermediate", minutes: 16,
    summary: "Distinguish internal strengths and weaknesses from external opportunities and threats.",
    objectives: ["Classify each SWOT category", "Support a business choice with evidence", "Recognise uncertainty in predictions"],
    lesson: [
      "Strengths and weaknesses are internal characteristics of the business, such as staff skills or high operating costs.",
      "Opportunities and threats arise from the external environment, such as an expanding local market or a new competitor.",
      "A SWOT framework organises factors, but a good decision still needs evidence, priorities, costs and likely consequences.",
    ],
    workedExample: "A small bakery considers a delivery service: strong recipes are a strength, limited kitchen capacity a weakness, growing demand an opportunity and a rival's lower delivery fees a threat.",
    examTip: "Classify the factor before explaining how it could affect a real decision.",
    commonMistake: "Calling a competitor an internal weakness when competition is outside the firm's direct control.",
    checkpoint: mcq("A firm's experienced staff are usually which SWOT category?", ["Strength", "Threat", "Opportunity", "External regulation"], "Strength", "Skilled staff are an internal resource that can improve the firm's performance.", "Identify whether the factor is inside or outside the firm."),
    practice: [
      fillBlanks("Complete the distinction between internal and external SWOT factors.", [
        ["inside", "Strengths and weaknesses are primarily ____ factors.", "internal"],
        ["outside", "Opportunities and threats are primarily ____ factors.", "external"],
      ], "Strengths and weaknesses describe the business internally; opportunities and threats arise from outside.", "Classify by source, not whether a factor is favourable."),
      multi("Which are likely external threats to a café?", ["A new rival opening next door", "An increase in local commercial rents", "Employees lacking training", "Unexpected regulatory costs"], ["A new rival opening next door", "An increase in local commercial rents", "Unexpected regulatory costs"], "Competition, market rents and regulation are external; staff training is an internal weakness.", "Think about factors outside management's direct control."),
      trueFalse("A SWOT list by itself proves that an investment will be profitable.", false, "SWOT highlights considerations but does not replace forecasts, costs, market evidence or risk analysis.", "Classification is not the same as financial proof."),
    ],
  },
  {
    id: "ielts-paraphrasing", subject: "ielts", title: "Paraphrasing without Changing Meaning", level: "Intermediate", minutes: 15,
    summary: "Rewrite academic statements accurately while retaining key qualifications and numbers.",
    objectives: ["Identify the original claim", "Preserve comparisons and numbers", "Avoid exaggerating uncertainty"],
    lesson: [
      "A good paraphrase expresses the original meaning in different wording or structure without strengthening its claims.",
      "Quantifiers matter: 'some' is not the same as 'all', and 'may' is weaker than 'will'.",
      "Replace natural collocations rather than every word separately, and keep dates, quantities and comparisons accurate.",
    ],
    workedExample: "Original: 'Some commuters may benefit from more frequent trains.' A fair paraphrase is: 'Increasing train frequency could help certain passengers.' It does not claim that all commuters definitely benefit.",
    examTip: "Check modal verbs and quantifiers when comparing the paraphrase with the source.",
    commonMistake: "Turning 'could improve' into 'will always improve', which changes the certainty.",
    checkpoint: mcq("Which paraphrase best preserves 'Some students may prefer online lessons'?", ["Certain learners might favour remote classes", "Every learner definitely prefers remote classes", "No student likes remote classes", "All students must attend classes online"], "Certain learners might favour remote classes", "Certain and might preserve the limited group and uncertain preference.", "Keep both 'some' and 'may' in meaning."),
    practice: [
      fillBlanks("Fill the two words that best preserve the original level of certainty and quantity.", [
        ["quantity", "'Some' is closer in meaning to '____'.", "certain"],
        ["certainty", "'May' is closer in meaning to '____'.", "might"],
      ], "Certain refers to a subset and might expresses possibility rather than certainty.", "Neither word makes a universal guarantee."),
      multi("Which substitutions can change the meaning of a cautious claim?", ["Replacing 'may' with 'will'", "Replacing 'some' with 'all'", "Changing 'purchase' to 'buy' in context", "Changing 'approximately' to 'exactly'"], ["Replacing 'may' with 'will'", "Replacing 'some' with 'all'", "Changing 'approximately' to 'exactly'"], "Modals, quantities and precision affect truth conditions; purchase and buy are often close synonyms.", "Ask whether the strength of the claim changes."),
      trueFalse("An accurate paraphrase can use a different sentence structure while preserving meaning.", true, "Reordering clauses and using appropriate synonyms can preserve the same claim.", "Paraphrasing is not simply substituting every word."),
    ],
  },
  {
    id: "celta-lesson-stage-plan", subject: "celta", title: "Planning a Simple Language Lesson", level: "Intermediate", minutes: 16,
    summary: "Sequence aims, context, clarification, practice and feedback in a coherent lesson.",
    objectives: ["Specify a learning aim", "Sequence controlled and freer practice", "Select appropriate concept checks"],
    lesson: [
      "State a measurable language-learning aim before choosing activities, materials or timing.",
      "Context can establish meaning; clarification then explores meaning, form and pronunciation before controlled practice.",
      "Freer practice can allow learners to communicate more independently; feedback should address the task aim and observed difficulties.",
    ],
    workedExample: "For a beginners' past-simple lesson: establish a yesterday context, clarify form and meaning, check understanding, provide controlled sentence practice, then offer a short communicative task and feedback.",
    examTip: "Explain how each stage supports the chosen lesson aim and learners' needs.",
    commonMistake: "Adding many fun activities without checking whether they build the target learning outcome.",
    checkpoint: mcq("Which should normally guide the choice of a lesson's activities?", ["The lesson's learning aim", "Only the teacher's favourite game", "Random textbook page numbers", "The number of decorations in the room"], "The lesson's learning aim", "Activities are selected to support intended learning outcomes and students' needs.", "Think about what learners should be able to do."),
    practice: [
      order("Put these stages of a simple language lesson in a coherent sequence.", ["Establish a meaningful context", "Clarify meaning and form", "Provide controlled practice", "Give freer practice", "Provide feedback"], "Context and clarification support initial understanding; practice becomes more independent before feedback.", "Start by making the target meaningful."),
      fillBlanks("Complete two common teacher-training terms.", [
        ["ccq", "A question used to check meaning is a ____.", "CCQ"],
        ["icq", "A question used to check task instructions is an ____.", "ICQ"],
      ], "CCQ means concept-checking question; ICQ means instruction-checking question.", "Meaning and task procedure require different questions."),
      trueFalse("A lesson plan's activity sequence should be evaluated against its learning aims.", true, "Alignment between aim, input, practice and feedback makes the lesson purposeful.", "Activities are tools for achieving the aim."),
    ],
  },
  {
    id: "french-negation-simple", subject: "french", title: "French Negation with ne … pas", level: "Foundation", minutes: 16,
    summary: "Form simple French negative sentences and identify the conjugated verb.",
    objectives: ["Place ne and pas around a finite verb", "Apply elision before a vowel", "Convert a basic affirmative sentence into a negative one"],
    lesson: [
      "In standard written French, ne precedes the finite verb and pas usually follows it.",
      "Before a vowel or mute h, ne is usually shortened to n', as in je n'aime pas.",
      "In a compound tense, ne and pas usually surround the conjugated auxiliary: je n'ai pas parlé.",
    ],
    workedExample: "Je parle français becomes Je ne parle pas français. J'aime les pommes becomes Je n'aime pas les pommes.",
    examTip: "Find the finite verb or auxiliary first, then place ne and pas around it.",
    commonMistake: "Writing je pas parle or forgetting n' before a vowel in formal written French.",
    checkpoint: mcq("Which is a correct standard written negative sentence?", ["Je ne parle pas anglais.", "Je pas parle anglais.", "Je ne pas parle anglais.", "Je parle ne pas anglais."], "Je ne parle pas anglais.", "Ne appears before parle, while pas follows the conjugated verb.", "Keep the verb between ne and pas."),
    practice: [
      fillBlanks("Complete the two parts of a standard written French negative.", [
        ["first", "____ precedes the finite verb.", "ne"],
        ["second", "____ follows the finite verb in a simple present-tense negative.", "pas"],
      ], "The usual written pattern is ne + finite verb + pas.", "One element goes before and one after the verb."),
      short("Complete: 'Je ___ aime pas' with the elided form of ne before a vowel. Write the missing characters only.", "n'", "Before a vowel, ne normally contracts to n', giving Je n'aime pas.", "The vowel in aime triggers elision.", ["n’"]),
      trueFalse("In standard written French, ne usually changes to n' before a verb beginning with a vowel.", true, "Elision replaces the vowel in ne before a vowel sound, as in n'aime.", "Think about the form before aime."),
    ],
  },
  {
    id: "german-modal-verbs", subject: "german", title: "German Modal Verbs and Final Infinitives", level: "Intermediate", minutes: 16,
    summary: "Use basic modal verbs with a finite modal and an infinitive at the end of a main clause.",
    objectives: ["Conjugate common modals", "Recognise the final infinitive", "Distinguish ability and obligation"],
    lesson: [
      "Modal verbs such as können (can) and müssen (must) express ability, obligation and related meanings.",
      "In a simple German main clause the modal is finite and usually occupies second position, while the other verb remains an infinitive near the end.",
      "For example, 'Ich kann Deutsch sprechen' uses kann as the finite modal and sprechen as the infinitive.",
    ],
    workedExample: "'Wir müssen heute lernen' means 'We must study today'. Müssen is conjugated for wir; lernen stays in the infinitive at the end of the clause.",
    examTip: "Look for the second verb and check that it stays in its infinitive form.",
    commonMistake: "Conjugating both verbs, for example 'Ich kann spreche' instead of 'Ich kann sprechen'.",
    checkpoint: mcq("Which sentence correctly says 'I can speak German'?", ["Ich kann Deutsch sprechen.", "Ich können Deutsch spreche.", "Ich kann spreche Deutsch.", "Ich sprechen kann Deutsch."], "Ich kann Deutsch sprechen.", "The finite modal kann occurs in second position; sprechen remains the infinitive at the end.", "Choose kann with ich and keep sprechen in the infinitive."),
    practice: [
      fillBlanks("Complete two German sentences containing modal verbs.", [
        ["can", "Ich ____ Deutsch sprechen.", "kann"],
        ["must", "Wir ____ heute lernen.", "müssen"],
      ], "The first-person singular of können is kann, and wir uses müssen.", "Focus on conjugating the modal rather than the final infinitive."),
      match("Match common German modals to their core meaning in these simple examples.", [["können", "can / be able to"], ["müssen", "must / have to"], ["dürfen", "may / be allowed to"]], "The meanings differ: ability, obligation and permission.", "Permission is not the same as ability."),
      trueFalse("In 'Wir müssen heute lernen', lernen remains an infinitive.", true, "Müssen is conjugated, while lernen retains its infinitive form.", "Identify the finite modal and the final verb."),
    ],
  },
];
