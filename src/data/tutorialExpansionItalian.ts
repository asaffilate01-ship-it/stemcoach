import type { AuthorLesson } from "./tutorialExpansionLargeAuthoring";
import { authorTenCheckLesson } from "./tutorialExpansionLargeAuthoring";

/** Original introductory Italian practice; academic and language reviewer sign-off pending. */
const specs: AuthorLesson[] = [
  {
    id:"italian-essere-avere-present",subject:"italian",title:"Italian Essentials: Essere and Avere",level:"Foundation",
    summary:"Form everyday present-tense sentences with to be and to have.",
    objectives:["Recognise the present forms of essere","Use avere for possession and age","Choose subject-verb agreement"],
    lesson:["Essere means to be: io sono, tu sei, lui/lei è, noi siamo, voi siete, loro sono.","Avere means to have: io ho, tu hai, lui/lei ha, noi abbiamo, voi avete, loro hanno.","Italian often omits subject pronouns because the verb form shows the person. Age is expressed with avere, not essere."],
    workedExample:"To say 'We are students', use Noi siamo studenti. To say 'I am sixteen years old', use Ho sedici anni; Italian uses avere with age.",
    examTip:"Identify the subject before selecting sono, sei, è, siamo or siete, and remember that age uses avere.",
    commonMistake:"Translating the English expression 'I am sixteen' literally as sono sedici instead of using ho sedici anni.",
    checks:[
      ["Which Italian phrase means 'I am'?",["io hai","io sono","io siamo","io ha"],1,"The first-person singular present of essere is sono, used with io."],
      ["Complete: Tu ___ pronto.",["sei","è","siamo","sono"],0,"Tu takes sei, the second-person singular form of essere."],
      ["Which form means 'we have'?",["noi siete","noi sono","noi abbiamo","noi hanno"],2,"The first-person plural of avere is abbiamo, so noi abbiamo means we have."],
      ["Complete: Lei ___ un libro.",["ho","abbiamo","hanno","ha"],3,"Lei takes the third-person singular form ha for possession."],
      ["How do you say 'I am eighteen years old'?",["Sono diciotto anni","Ho diciotto anni","Hai diciotto anni","È diciotto anni"],1,"Italian uses avere when expressing age: ho diciotto anni."],
      ["Complete: Voi ___ italiani.",["siete","sei","è","siamo"],0,"Voi is second-person plural and takes siete with essere."],
      ["Which sentence correctly means 'They have a car'?",["Loro ha una macchina","Loro abbiamo una macchina","Loro hanno una macchina","Loro hai una macchina"],2,"The plural subject loro takes hanno in the present tense of avere."],
      ["Which expression means 'she is tired'?",["Lei sei stanca","Lei sono stanca","Lei ha stanca","Lei è stanca"],3,"Third-person singular essere is è, and stanca agrees with a feminine subject."]
    ],
    truth:["In standard Italian, 'Ho venti anni' expresses 'I am twenty years old'.",true,"Italian expresses age using avere: ho venti anni, commonly written ho vent'anni."],
    recall:["Which Italian verb means 'to have'?", "avere","The infinitive avere means to have; ho, hai, ha, abbiamo, avete and hanno are its present forms.",["Avere"]]
  },
  {
    id:"italian-articles-nouns",subject:"italian",title:"Italian Articles, Gender and Plurals",level:"Foundation",
    summary:"Select common definite and indefinite articles and notice typical noun endings.",
    objectives:["Recognise masculine and feminine nouns","Match common definite articles to nouns","Form basic plurals"],
    lesson:["Many singular nouns ending -o are masculine and become -i in the plural, while many ending -a are feminine and become -e; there are exceptions.","The singular definite articles include il, lo, l' and la. Their choice depends on gender and the word's opening sound.","Indefinite articles include un, uno and una; un' appears before a feminine noun beginning with a vowel."],
    workedExample:"Il libro becomes i libri; la casa becomes le case. An example with a vowel is l'amica (the female friend), while un'amica means a female friend.",
    examTip:"Check gender, number and first sound together. Do not assume all nouns obey the most common ending pattern.",
    commonMistake:"Treating an apostrophe in un'amica as optional or using un' before a masculine noun like amico.",
    checks:[
      ["What is the usual plural of 'libro'?",["libra","libri","libre","libros"],1,"A regular masculine noun ending in -o usually changes to -i: libro → libri."],
      ["What is the usual plural of 'casa'?",["case","casi","casas","caso"],0,"Many feminine nouns ending in -a take -e in the plural: casa → case."],
      ["Which article completes '___ ragazza' meaning 'the girl'?",["il","lo","la","gli"],2,"Ragazza is feminine singular, so the definite article is la."],
      ["Which phrase means 'the books'?",["le libri","gli libro","i libro","i libri"],3,"Libri is a regular masculine plural and commonly takes i."],
      ["Which phrase means 'a female friend'?",["un amica","un'amica","uno amica","una amico"],1,"Before a feminine noun beginning with a vowel, una elides to un'."],
      ["Which is a common masculine singular indefinite article?",["un","le","gli","la"],0,"Un is a common masculine singular indefinite article, as in un libro."],
      ["Which expression is the singular 'the book'?",["la libro","i libro","il libro","le libro"],2,"Libro is masculine singular and starts with an ordinary consonant, so it takes il."],
      ["Which is the usual plural of 'ragazza'?",["ragazzi","ragazzeo","ragazzas","ragazze"],3,"Regular feminine nouns ending -a generally form the plural in -e: ragazza → ragazze."]
    ],
    truth:["In Italian, all nouns ending with the letter -a are masculine.",false,"Many nouns ending -a are feminine, though grammatical gender is not determined by a single universal ending rule."],
    recall:["Which definite article is used for 'la casa' in the singular?", "la","Casa is feminine singular and takes la before its initial consonant.",["La"]]
  },
  {
    id:"italian-everyday-travel",subject:"italian",title:"Italian Everyday Questions and Travel",level:"Foundation",
    summary:"Practise polite phrases, everyday locations and useful travel questions.",
    objectives:["Ask simple where/when questions","Use polite requests and thanks","Recognise common travel words"],
    lesson:["Dove means where and quando means when; come means how in everyday questions.","Per favore adds politeness to a request; grazie expresses thanks and prego is often used in response.","Simple travel nouns include stazione (station), biglietto (ticket), treno (train) and autobus (bus)."],
    workedExample:"Dov'è la stazione? means Where is the station? For a polite request, say Un biglietto, per favore — a ticket, please.",
    examTip:"Read the whole question before selecting dove, quando or come; a small word changes the information requested.",
    commonMistake:"Confusing quando (when) with quanto (how much/how many), especially in travel and shopping situations.",
    checks:[
      ["Which Italian word means 'where'?",["quando","dove","come","perché"],1,"Dove asks for a place or location, unlike quando which asks for time."],
      ["Which phrase means 'thank you'?",["grazie","prego","scusa","salve"],0,"Grazie is the usual everyday Italian expression of thanks."],
      ["How do you ask 'Where is the station?'",["Quanto costa?","Quando parte?","Dov'è la stazione?","Come stai?"],2,"Dov'è combines dove and è, and stazione means station."],
      ["What does 'un biglietto' mean?",["a timetable","a platform","a suitcase","a ticket"],3,"Biglietto commonly means a ticket, such as a train or bus ticket."],
      ["Which word asks 'when'?",["dove","quando","come","chi"],1,"Quando asks about time, for example Quando parte il treno?"],
      ["Which phrase politely adds 'please'?",["per favore","arrivederci","prego","ciao"],0,"Per favore is a straightforward way to make a request polite."],
      ["What is the Italian word for 'train'?",["aereo","nave","treno","macchina"],2,"Treno means train; aereo means aircraft and nave means ship."],
      ["Which question asks 'How much does it cost?'",["Dove sei?","Come ti chiami?","Quando arrivi?","Quanto costa?"],3,"Quanto costa asks for the price of an item or service."]
    ],
    truth:["'Quando parte il treno?' asks when the train leaves.",true,"Quando is the time question word and parte is a form of partire, to depart."],
    recall:["What is the Italian word meaning 'station'?", "stazione","Stazione is used for a station, for example stazione ferroviaria for railway station.",["la stazione"]]
  }
];
export const italianExpansion=specs.map(authorTenCheckLesson);
