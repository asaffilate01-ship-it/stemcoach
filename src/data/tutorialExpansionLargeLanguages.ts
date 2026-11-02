import type { AuthorLesson } from "./tutorialExpansionLargeAuthoring";
import { authorTenCheckLesson } from "./tutorialExpansionLargeAuthoring";

/** Original language and teaching-skills formative drafts; not licensed examination papers. */
const specs: AuthorLesson[] = [
  {
    id: "ielts-task-two-reasoning", subject: "ielts", title: "IELTS Writing Task 2: Clear Arguments and Examples", level: "Intermediate",
    summary: "Plan a coherent response that answers the actual question and supports its claims.",
    objectives: ["Identify the question's position and task", "Write a clear topic sentence", "Explain relevant examples instead of listing them"],
    lesson: [
      "Read the task carefully: agree/disagree, discuss both views, causes/solutions and advantages/disadvantages require different responses.",
      "A body paragraph needs a central claim, an explanation and a specific relevant illustration; examples should serve the argument.",
      "Use logical linking phrases without relying on memorised templates. Revise for meaning, grammar and a consistent position."
    ],
    workedExample: "Prompt: Should cities expand cycling routes? A paragraph might argue that safe routes encourage some commuters to cycle, then explain how separated lanes reduce conflict with vehicles, using a plausible local example rather than claiming universal success.",
    examTip: "Write at least the specified minimum words, answer all parts and reserve time to check clarity.",
    commonMistake: "Listing impressive linking words without an argument, or giving a personal anecdote that does not support the topic.",
    checks: [
      ["Which opening is most directly relevant to an agree/disagree task?", ["Technology is interesting","This essay will discuss random themes","I largely agree because of two clear reasons","There are many words in this topic"],2,"An explicit position that anticipates supporting reasons directly addresses a position-based essay."],
      ["What is a topic sentence meant to do?", ["State the main idea of the paragraph","List every reference used","Repeat the entire prompt word for word","Introduce an unrelated example"],0,"The topic sentence signals the paragraph's principal claim so later evidence can support it."],
      ["Which pattern typically makes a body paragraph coherent?", ["Example, example, example","Claim, explanation, relevant example","Unconnected facts and a conclusion","A dictionary definition only"],1,"A clear claim followed by reasoning and an appropriate example forms a logical paragraph."],
      ["A prompt asks 'discuss both views and give your opinion'. What must the answer include?", ["Only the first view","Only a definition","A memorised quotation","Both views and the writer's position"],3,"The instruction explicitly requires treatment of two perspectives alongside the writer's view."],
      ["Which example best supports a claim about school transport?", ["A story about a famous chef","A paragraph about weather satellites","A realistic route and journey-time illustration","An irrelevant holiday memory"],2,"A route or journey-time example relates directly to transport and can show the mechanism of a claim."],
      ["Why should writers check the question's exact wording?", ["To ensure every required part is answered","To avoid any paragraph breaks","To replace the essay with bullet points","To copy the question as the full answer"],0,"Task response depends on addressing the specific question rather than a loosely related topic."],
      ["What should a conclusion usually achieve?", ["Introduce several unsupported new arguments","Summarise the position and main reasoning","Copy an entire body paragraph","Ignore the central question"],1,"A conclusion reconnects the main reasons to the stated overall position without introducing unrelated claims."],
      ["Which linking phrase best introduces a contrasting point?", ["For example","As a result","In addition","However"],3,"However signals a contrast, whereas the other phrases introduce examples, results or additions."]
    ],
    truth: ["A complex vocabulary word is always better than a precise familiar word in an IELTS essay.", false, "Precise, appropriate vocabulary is preferable to advanced words used inaccurately or unnaturally."],
    recall: ["What is the sentence usually called that introduces a body paragraph's main claim?", "topic sentence", "A topic sentence establishes the focus for the explanation and evidence in that paragraph.", ["a topic sentence"]]
  },
  {
    id: "celta-ccq-icq-feedback-practice", subject: "celta", title: "Language Teaching: Concept Checks and Feedback", level: "Intermediate",
    summary: "Use short concept-checking questions, clear instructions and feedback to support language learning.",
    objectives: ["Write concept-checking questions", "Distinguish checking meaning from checking instructions", "Offer specific corrective feedback"],
    lesson: [
      "Concept-checking questions (CCQs) help test whether learners understand meaning, use or a key distinction, not just whether they can repeat a rule.",
      "Instruction-checking questions (ICQs) confirm what learners should do, for how long, and with whom; keep checks brief and actionable.",
      "Effective feedback identifies what worked and one concrete improvement, with corrections appropriate to the lesson aim and learner needs."
    ],
    workedExample: "For 'I used to cycle to school', a teacher might ask: 'Did I cycle to school in the past?' (yes) and 'Does this sentence say I cycle there now?' (no). These questions probe the concept without repeating the target phrase.",
    examTip: "Design checks around likely learner misunderstandings, and avoid asking only 'Do you understand?'",
    commonMistake: "Confusing a task-direction question such as 'Work alone or in pairs?' with a meaning-focused CCQ.",
    checks: [
      ["What is the main purpose of a CCQ?", ["To assign homework","To check understanding of language meaning or use","To record attendance","To time a break"],1,"A concept-checking question tests whether a learner understands a target language concept."],
      ["Which is an instruction-checking question?", ["Did the event happen yesterday?","Is this action finished?","Is the speaker certain?","Are you working in pairs or alone?"],3,"The question confirms how the learning task should be done, rather than what a phrase means."],
      ["A teacher asks only 'Do you understand?'. What is the weakness?", ["It may not reveal a specific misconception","It always tests every nuance","It replaces all examples","It automatically gives reliable evidence"],0,"Learners may say yes without demonstrating understanding; a targeted CCQ checks a concrete distinction."],
      ["Which feedback is most actionable?", ["You are bad at this","Wrong, try harder","Your meaning is clear; check the past-tense verb here","Everything is perfect forever"],2,"The feedback names a strength and identifies one specific aspect to improve."],
      ["When teaching 'used to', which CCQ checks past habit meaning?", ["How many books are on the table?","Was this something that happened repeatedly in the past?","Who is in your group?","What time is the break?"],1,"The question directly tests whether a repeated past situation is understood."],
      ["What makes a helpful classroom instruction?", ["Short steps with a clear task and outcome","Several unrelated directions at once","Only speaking faster","Avoiding any example"],0,"Brief instructions, a clear goal and an example can make a task easier to follow."],
      ["Which is a reasonable way to check directions for a matching task?", ["Do you like English?","Is matching always easy?","Do you remember last week's lesson?","Are you writing full sentences or matching pairs?"],3,"An ICQ should check the learner knows the requested activity and its output."],
      ["When should feedback be selected?", ["Only at the end of the course","Without observing student responses","Based on lesson aims and learner evidence","Based only on teacher preferences"],2,"Feedback should relate to the learning objective and actual performance, not an arbitrary correction list."]
    ],
    truth: ["An instruction-checking question and a concept-checking question always serve identical purposes.", false, "ICQs clarify procedures while CCQs probe the meaning or use of target language."],
    recall: ["What three-letter abbreviation is used for a concept-checking question?", "CCQ", "CCQ abbreviates concept-checking question, a tool for testing meaning or use.", ["ccqs"]]
  },
  {
    id: "french-negation-questions", subject: "french", title: "French Negation and Everyday Question Forms", level: "Foundation",
    summary: "Build simple questions and negative statements using familiar present-tense structures.",
    objectives: ["Use ne ... pas around a simple conjugated verb", "Recognise common question patterns", "Select appropriate negative contractions"],
    lesson: [
      "In standard written French, ne ... pas generally surrounds a simple conjugated verb: Je ne parle pas. Before a vowel sound, ne becomes n'.",
      "A yes/no question may use rising intonation, est-ce que or inversion; these forms differ in register and structure.",
      "Question words such as où, pourquoi and quand ask where, why and when. In standard writing, keep accents where required."
    ],
    workedExample: "Positive: Il aime le café. Negative: Il n'aime pas le café. Question: Est-ce qu'il aime le café ? The n' occurs before the vowel of aime.",
    examTip: "Identify the conjugated verb first, then place the negative markers and choose the question form.",
    commonMistake: "Placing pas before the simple conjugated verb or forgetting n' before a vowel in standard written French.",
    checks: [
      ["Which is the standard written negative of 'Je parle français'?", ["Je pas parle français","Je parle ne pas français","Je ne parle pas français","Ne je parle français"],2,"Ne comes before the conjugated verb parle and pas comes after it in standard written French."],
      ["How does ne normally change before 'aime'?", ["n'","no","ni","pas"],0,"Ne elides to n' before a vowel sound, so 'il n'aime pas' is written with an apostrophe."],
      ["Which question means 'Where do you live?'", ["Pourquoi habites-tu ?","Où habites-tu ?","Quand habites-tu ?","Qui habites-tu ?"],1,"Où means where and habites-tu asks about the place in which someone lives."],
      ["Which phrase introduces a common yes/no question?", ["Parce que","Mais","Jamais","Est-ce que"],3,"Est-ce que introduces a question without needing subject–verb inversion."],
      ["What is the standard negative form of 'Il aime le sport'?", ["Il aime pas ne le sport","Il pas aime le sport","Il n'aime pas le sport","Il ne pas aime le sport"],2,"The conjugated verb aime sits between n' and pas, with n' before the vowel."],
      ["Which question word means 'why'?", ["Pourquoi","Où","Quand","Comment"],0,"Pourquoi asks for a reason, corresponding to why in English."],
      ["What does 'Quand' usually ask about?", ["Identity","Time","Location","Quantity"],1,"Quand means when and refers to the time of an event."],
      ["Which is a correctly formed inverted question?", ["Tu parles-est?","Parles est tu?","Parles-tu est?","Parles-tu français ?"],3,"A simple second-person singular inversion places the verb before the pronoun with a hyphen."]
    ],
    truth: ["In standard written French, 'Je ne travaille pas' is a correctly formed simple negative sentence.", true, "Ne appears before travaille and pas follows the conjugated verb."],
    recall: ["Which French question word means 'where'?", "où", "Où is used to ask about place or location; its accent distinguishes it from ou meaning 'or'.", ["où ?"]]
  },
  {
    id: "german-separable-verbs-main-clause", subject: "german", title: "German Separable Verbs and Main-Clause Order", level: "Intermediate",
    summary: "Apply verb-second word order and recognise separated prefixes in ordinary statements.",
    objectives: ["Identify common separable verbs", "Place the finite verb correctly in main clauses", "Recognise infinitive forms with modal verbs"],
    lesson: [
      "Many German verbs have separable prefixes, such as aufstehen (get up) and anrufen (telephone someone).",
      "In a simple main clause, the conjugated verb normally occupies second position and a separable prefix appears at the end: Ich stehe früh auf.",
      "With a modal verb in a main clause, the infinitive usually remains together at the end: Ich muss früh aufstehen."
    ],
    workedExample: "Infinitive: anrufen. Main clause: Ich rufe meine Freundin an. With modal: Ich möchte meine Freundin anrufen. The separable prefix is not detached from an infinitive.",
    examTip: "Locate the conjugated verb first; do not count the prefix as a separate conjugated verb.",
    commonMistake: "Keeping 'aufstehen' joined at the front of a simple finite main clause, or splitting its infinitive after a modal.",
    checks: [
      ["What is the correct simple main-clause form of 'I get up early'?", ["Ich aufstehe früh","Ich stehe früh auf","Ich früh aufstehen","Ich auf früh stehe"],1,"Stehe is the conjugated verb in second position and the separable prefix auf moves to the end."],
      ["Which is the infinitive of 'Ich rufe dich an'?", ["rufenan","angerufen","anrufe","anrufen"],3,"The separable verb is written as one infinitive with an- attached: anrufen."],
      ["Which main clause correctly uses a modal plus infinitive?", ["Ich muss früh aufstehen","Ich muss früh stehe auf","Ich auf muss stehen","Ich früh müssen aufsteht"],0,"With modal muss the full infinitive aufstehen stands at the end of the clause."],
      ["In 'Er kauft heute ein', where is the separable prefix?", ["Er","heute","ein","kauft"],2,"The prefix ein is detached from einkaufen and placed at the end of the simple main clause."],
      ["What position does a conjugated verb usually take in a German declarative main clause?", ["Last in every case","Second position","Third position","Before any subject in all statements"],1,"German main clauses generally place the finite verb in second position, even if another element begins the sentence."],
      ["Which sentence has the correct main-clause order?", ["Morgen stehe ich früh auf","Morgen ich stehe früh auf","Morgen auf ich stehe früh","Morgen früh ich aufstehe"],0,"Morgen occupies the first position, stehe is second and the separable prefix auf stays at the end."],
      ["What is the correct statement for 'She calls her brother'?", ["Sie anruft ihren Bruder","Sie rufen ihren Bruder an","Sie ruft an ihren Bruder","Sie ruft ihren Bruder an"],3,"Ruft is the conjugated verb and an is the separable prefix at the end."],
      ["Which statement about separable verbs is generally correct?", ["Their prefixes never move","They must always be in past tense","A simple finite main clause can move the prefix to its end","They are all modal verbs"],2,"In an ordinary simple main clause the prefix of a separable verb is commonly placed at the end."]
    ],
    truth: ["After a modal verb in a simple German main clause, 'aufstehen' is commonly kept together as an infinitive.", true, "The modal is conjugated and the full infinitive appears at the clause end."],
    recall: ["What is the German infinitive meaning 'to get up'?", "aufstehen", "Aufstehen is the infinitive; its prefix separates in 'Ich stehe früh auf'."]
  }
];
export const largeLanguagesExpansion = specs.map(authorTenCheckLesson);
