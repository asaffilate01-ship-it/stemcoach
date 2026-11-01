import type { Tutorial } from "./tutorials";
import { mcq, trueFalse, multi, short, order, match, fillBlanks } from "./tutorialQuestions";

/** Authored formative questions; not representations of an awarding body's approved examination. */
export const novemberLanguages: Tutorial[] = [
  {
    id: "ielts-writing-argument-cohesion", subject: "ielts",
    title: "IELTS Writing: Argument and Cohesion", level: "Intermediate", minutes: 16,
    summary: "Organise a clear argument with relevant evidence, paragraphs and logical linking.",
    objectives: ["Distinguish a thesis from a topic label", "Use cohesive devices meaningfully", "Recognise relevant examples and concessions"],
    lesson: [
      "In an argumentative essay, an introduction identifies the issue and states an arguable position rather than merely repeating a topic.",
      "Each body paragraph should develop one main point with explanation and a relevant example. Cohesive phrases such as however and therefore must express the actual relationship between ideas.",
      "A concession acknowledges a reasonable opposing consideration without abandoning the overall argument. A conclusion synthesises the position instead of adding unsupported new claims."
    ],
    workedExample: "On the invented prompt 'Should cities invest in cycling routes?', a direct thesis might be 'Cities should prioritise safe cycling routes because they can improve travel choice and reduce traffic pressure.' A body paragraph then explains one mechanism and gives a relevant example.",
    examTip: "Prioritise a clear position, developed reasons and logical cohesion; memorised connectors cannot substitute for a coherent argument.",
    commonMistake: "Using however between two agreeing sentences or introducing an unrelated new argument in the conclusion.",
    checkpoint: mcq("Which introduction sentence states the clearest arguable thesis?", ["Transport is a popular subject", "There are buses and trains", "Cities should improve bus reliability to give residents more travel options", "The following essay has paragraphs"], "Cities should improve bus reliability to give residents more travel options", "A thesis takes a position and gives a reason that can be developed and supported.", "Look for a position with a reason."),
    practice: [
      trueFalse("The connector 'however' normally signals a contrast between ideas.", true, "However introduces contrast, qualification or an unexpected alternative rather than simple addition.", "Compare however with furthermore."),
      multi("Which choices are usually helpful in an argumentative essay?", ["One clear controlling idea in each body paragraph", "Relevant examples that support the point", "A conclusion that restates the position in fresh words", "Unrelated statistics invented to look authoritative"], ["One clear controlling idea in each body paragraph", "Relevant examples that support the point", "A conclusion that restates the position in fresh words"], "Developed paragraphs and relevant support aid coherence. Fabricated evidence undermines credibility.", "One option makes up supporting evidence."),
      match("Match these cohesive expressions with their main function.", [["However", "introduce contrast"], ["Therefore", "show a consequence"], ["For example", "introduce an illustration"]], "The logical function matters more than using a high number of connecting words.", "Each phrase links ideas in a different way."),
      order("Arrange these steps for planning a focused argument paragraph.", ["State a topic sentence supporting your thesis", "Explain the reasoning behind the claim", "Add a relevant illustration that supports the explanation"], "The topic sentence guides the paragraph, reasoning develops it and an example makes it concrete.", "Establish the claim before its example."),
      short("Which single word normally signals a contrast: 'therefore' or 'however'?", "however", "However expresses a contrast or qualification, whereas therefore generally introduces a consequence.", "One word signals opposition rather than an outcome."),
      fillBlanks("Choose suitable connecting words for two logical relationships.", [["contrast", "The plan could help; ___, it may cost more than expected.", "however"], ["result", "The service improved; ___, more people used it.", "therefore"]], "However signals a contrast or concession; therefore introduces a stated consequence.", "First look for contrast, then for a result."),
      mcq("What should a conclusion to a short argument usually do?", ["Introduce several unexamined new reasons", "Summarise the position and main reasoning", "Repeat every example word for word", "Avoid responding to the essay question"], "Summarise the position and main reasoning", "A focused conclusion synthesises the argument and returns to the question without opening an unsupported new debate.", "A conclusion should close the argument already developed.")
    ]
  },
  {
    id: "celta-instruction-checking-feedback", subject: "celta",
    title: "Instruction Checking and Formative Feedback", level: "Intermediate", minutes: 17,
    summary: "Use instruction-check questions, concept-check questions and feedback without giving away the task.",
    objectives: ["Distinguish ICQs from CCQs", "Check whether learners understand a task", "Choose responsive, appropriately timed feedback"],
    lesson: [
      "Instruction-check questions (ICQs) confirm what learners must do, who they work with and the time limit. They should be brief and relevant to potential confusion.",
      "Concept-check questions (CCQs) check the meaning of target language, not simply whether learners recognise a term. Design short questions that avoid repeating the target phrase.",
      "Formative feedback responds to evidence from learner work. During fluency practice, delayed correction may preserve the flow; during controlled accuracy practice, immediate correction may be appropriate."
    ],
    workedExample: "Before pairs compare answers for two minutes, the teacher might ask 'Are you working alone or in pairs?' and 'How long do you have?' A CCQ for 'used to live' might ask 'Does this describe the present or the past?'",
    examTip: "Match the checking question to its purpose: task procedures for ICQs, language meaning for CCQs.",
    commonMistake: "Asking 'Do you understand?' and treating a chorus of 'yes' as proof that instructions or language meaning are clear.",
    checkpoint: mcq("Before a timed pair activity, which is the most useful instruction-check question?", ["Do you understand?", "Are you working alone or with a partner?", "What is a past participle?", "Can you spell the lesson title?"], "Are you working alone or with a partner?", "An ICQ checks a concrete procedural requirement of the task rather than asking for a vague self-report.", "Check the grouping, timing or output."),
    practice: [
      trueFalse("A CCQ should primarily test meaning rather than simply invite repetition of the target phrase.", true, "CCQs probe the concept underlying target language using short, accessible questions.", "Repeating sounds does not demonstrate understanding of meaning."),
      multi("Which are sensible features of useful ICQs?", ["Check who is working together", "Clarify the task time limit when needed", "Confirm the required output", "Ask a long series of irrelevant grammar questions"], ["Check who is working together", "Clarify the task time limit when needed", "Confirm the required output"], "Task-relevant questions reduce procedural confusion without unnecessary teacher talk.", "Focus on task instructions, not unrelated terminology."),
      match("Match each technique to its purpose.", [["ICQ", "check task instructions"], ["CCQ", "check language meaning"], ["Delayed correction", "discuss selected errors after an activity"]], "Instruction checks, concept checks and feedback timing serve different teaching aims.", "Think procedure, meaning and feedback sequence."),
      order("Arrange these steps for checking a short speaking task.", ["Give concise task instructions and model when useful", "Ask a targeted ICQ to check task requirements", "Start the task once learners know what to do"], "ICQs are most useful before the task starts, so confusion can be corrected promptly.", "Check understanding before students begin."),
      short("What abbreviation refers to an instruction-check question?", "ICQ", "ICQ stands for instruction-check question and concerns the procedure for an activity.", "It is a three-letter abbreviation for instruction checking.", ["ICQs"]),
      fillBlanks("Complete the two standard classroom-checking abbreviations.", [["instruction", "An instruction-check question is an:", "ICQ"], ["concept", "A concept-check question is a:", "CCQ"]], "ICQs check what to do in a task; CCQs test the meaning of language.", "The first letter identifies instruction versus concept."),
      mcq("During a fluency task, a learner makes a minor mistake but communicates successfully. What is often a reasonable response?", ["Interrupt every sentence regardless of the task aim", "Note the issue and consider delayed correction", "Ignore all feedback permanently", "Stop the whole course"], "Note the issue and consider delayed correction", "Delayed feedback can protect fluent interaction, though the best timing depends on the task aim and severity of the error.", "Consider the difference between fluency and controlled accuracy tasks.")
    ]
  },
  {
    id: "french-futur-proche", subject: "french",
    title: "Le futur proche avec aller", level: "Foundation", minutes: 14,
    summary: "Describe near-future intentions using aller in the present followed by an infinitive.",
    objectives: ["Conjugate aller for common subjects", "Combine the auxiliary with an infinitive", "Form negatives around the present-tense auxiliary"],
    lesson: [
      "The futur proche commonly expresses an intention or a near-future event: subject + present tense of aller + infinitive of the main verb.",
      "Present-tense forms of aller include je vais, tu vas, il/elle va, nous allons, vous allez and ils/elles vont.",
      "In a basic negative sentence, ne ... pas surrounds the conjugated aller: Je ne vais pas travailler. The infinitive keeps its dictionary form."
    ],
    workedExample: "Nous allons visiter le musée means 'We are going to visit the museum.' Nous requires allons; visiter remains in the infinitive because aller is the conjugated verb.",
    examTip: "Conjugate aller for the subject, leave the main verb in the infinitive and place negation around aller.",
    commonMistake: "Conjugating both aller and the second verb, for example writing 'nous allons visitons' instead of 'nous allons visiter'.",
    checkpoint: mcq("Which French sentence correctly means 'We are going to visit'?", ["Nous allons visiter", "Nous vais visiter", "Nous allons visitons", "Nous êtes visiter"], "Nous allons visiter", "The subject nous takes allons, followed by the infinitive visiter.", "Only aller is conjugated here."),
    practice: [
      trueFalse("In 'Je vais étudier', étudier remains an infinitive.", true, "The futur proche uses conjugated aller followed by the uninflected infinitive of the main verb.", "The first verb carries the person and tense."),
      multi("Which examples correctly use the futur proche?", ["Je vais lire", "Tu vas partir", "Ils vont manger", "Elle allons jouer"], ["Je vais lire", "Tu vas partir", "Ils vont manger"], "Je takes vais, tu takes vas and ils takes vont; elle would take va.", "Match each subject to the form of aller."),
      match("Match subjects to their present-tense forms of aller.", [["nous", "allons"], ["vous", "allez"], ["ils", "vont"]], "The forms are nous allons, vous allez and ils vont.", "Remember the familiar conjugation of aller."),
      order("Arrange the basic futur-proche sentence-building steps.", ["Choose the subject pronoun", "Conjugate aller to match the subject", "Add the main verb in the infinitive"], "The sentence uses a subject, the correct present-tense aller and then the infinitive.", "The second verb is not conjugated."),
      short("Write the futur proche for 'I am going to study' using étudier.", "je vais étudier", "Je takes vais and the main verb étudier stays in the infinitive.", "Start with je vais, then add the infinitive."),
      fillBlanks("Complete two futur-proche sentences.", [["singular", "Elle ___ regarder le film.", "va"], ["plural", "Nous ___ jouer demain.", "allons"]], "Elle va is third-person singular; nous allons is first-person plural.", "Conjugate aller for each subject."),
      mcq("How do you say 'I am not going to work' with futur proche?", ["Je ne vais pas travailler", "Je vais ne travailler pas", "Je ne travailler vais pas", "Je suis pas travailler"], "Je ne vais pas travailler", "Ne and pas surround the conjugated auxiliary vais; travailler remains infinitive.", "Put ne ... pas around the form of aller.")
    ]
  },
  {
    id: "german-perfekt-auxiliaries", subject: "german",
    title: "German Perfekt with haben and sein", level: "Intermediate", minutes: 15,
    summary: "Form common conversational past-tense sentences with an auxiliary and past participle.",
    objectives: ["Identify common auxiliaries haben and sein", "Position a participle in the main clause", "Recognise regular and selected irregular participles"],
    lesson: [
      "German Perfekt is generally formed with a present-tense form of haben or sein plus a past participle. In a statement, the finite auxiliary normally occupies the second position, and the participle commonly comes at the end.",
      "Many activities use haben (ich habe gelernt, er hat gekocht), while many intransitive verbs of motion or change of state use sein (ich bin gegangen, wir sind gefahren). There are lexical exceptions.",
      "A common regular participle pattern is ge- + verb stem + -t (machen → gemacht). Irregular participles must be learned individually, such as gehen → gegangen."
    ],
    workedExample: "Wir sind nach Berlin gefahren means 'We travelled to Berlin' in conversational past. Wir takes sind and the participle gefahren appears at the end of the main clause.",
    examTip: "Check the auxiliary for the specific verb and subject, then position the participle at the end of the main clause.",
    commonMistake: "Assuming that every Perfekt verb always uses haben or that all past participles are formed by adding -t.",
    checkpoint: mcq("Which sentence correctly expresses 'I went' in German Perfekt?", ["Ich habe gegangen", "Ich bin gegangen", "Ich bist gehen", "Ich gegangen bin"], "Ich bin gegangen", "Gehen commonly takes sein in Perfekt and ich uses bin; gegangen is the participle.", "For intransitive movement with gehen, use sein."),
    practice: [
      trueFalse("German Perfekt main clauses often place the past participle at the end.", true, "The conjugated auxiliary typically takes the finite-verb position and the participle closes the clause.", "Compare 'Ich habe gestern gelernt'."),
      multi("Which sentences use the Perfekt form correctly?", ["Ich habe gearbeitet", "Wir sind gefahren", "Er hat gekocht", "Sie ist gespielt"], ["Ich habe gearbeitet", "Wir sind gefahren", "Er hat gekocht"], "Arbeiten, kochen and spielen typically take haben, while fahren in the given movement sense commonly takes sein.", "One sentence uses sein with a regular activity verb."),
      match("Match infinitives with a common third-person singular Perfekt form.", [["gehen", "ist gegangen"], ["machen", "hat gemacht"], ["lernen", "hat gelernt"]], "Gehen typically uses ist gegangen; machen and lernen generally use forms with haben.", "Check both the helping verb and the participle."),
      order("Order the basic actions for writing a German Perfekt statement.", ["Choose the subject and the main infinitive", "Choose and conjugate haben or sein", "Place the past participle at the end of the main clause"], "A valid Perfekt clause needs the right auxiliary and past participle arranged around the other clause elements.", "Remember that the auxiliary is the finite verb."),
      short("Translate 'I have learned' into German Perfekt using lernen.", "ich habe gelernt", "Lernen normally takes haben and its regular past participle is gelernt.", "Start ich habe and end with gelernt."),
      fillBlanks("Complete common Perfekt examples.", [["learning", "Ich ___ gestern gelernt.", "habe"], ["travelling", "Wir ___ nach Berlin gefahren.", "sind"]], "Lernen takes habe for ich; travel to a destination with fahren commonly uses sind for wir.", "Choose haben for learning and sein for this journey."),
      mcq("What is the regular past participle of machen?", ["machte", "gemacht", "machen", "gemachen"], "gemacht", "The regular past participle uses ge- plus the stem mach- and ending -t.", "For this regular verb, use the ge-...-t pattern.")
    ]
  }
];
