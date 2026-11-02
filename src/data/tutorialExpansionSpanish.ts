import type { AuthorLesson } from "./tutorialExpansionLargeAuthoring";
import { authorTenCheckLesson } from "./tutorialExpansionLargeAuthoring";

/** Original Spanish teaching drafts. A language expert must check before verified publication. */
const specs: AuthorLesson[] = [
  {
    id:"spanish-ser-estar",subject:"spanish",title:"Spanish Ser and Estar in Everyday Speech",level:"Foundation",
    summary:"Distinguish common uses of the two Spanish verbs meaning 'to be'.",
    objectives:["Recognise present forms of ser","Recognise present forms of estar","Choose a form based on the meaning"],
    lesson:["Ser commonly expresses identity, origin and defining characteristics: soy, eres, es, somos, sois, son.","Estar commonly expresses location and states: estoy, estás, está, estamos, estáis, están.","The choice can change the meaning; learn phrases in context rather than treating the difference as permanently fixed versus temporary."],
    workedExample:"Soy estudiante means I am a student (identity); estoy en la biblioteca means I am at the library (location). Mi amigo es simpático describes a trait; hoy está cansado describes his state today.",
    examTip:"Look for whether the sentence describes identity, a location or a condition; then conjugate for the subject.",
    commonMistake:"Assuming all permanent conditions take ser and all temporary situations take estar; events, locations and traits need more precise rules.",
    checks:[
      ["Which sentence means 'I am a student'?",["Estoy estudiante","Soy estudiante","Es estudiante","Estás estudiante"],1,"Ser is used to express identity or occupation; the first person is soy."],
      ["Choose the natural phrase: 'I am at home'.",["Estoy en casa","Soy en casa","Eres en casa","Estamos en casa"],0,"Location ordinarily uses estar; first-person singular is estoy."],
      ["Complete: Ella ___ de México.",["estoy","está","es","eres"],2,"Origin is commonly expressed with ser; ella takes es."],
      ["Which form means 'we are' with estar?",["estoy","estás","están","estamos"],3,"Nosotros estamos is the first-person plural form of estar."],
      ["Complete: Los libros ___ en la mesa.",["es","están","son","estoy"],1,"A location is generally expressed with estar and plural books require están."],
      ["Which form of ser agrees with 'tú'?",["eres","es","somos","soy"],0,"The second-person familiar singular present form is eres."],
      ["What is the correct translation for 'he is tired'?",["Él son cansado","Él es cansado hoy","Él está cansado","Él estoy cansado"],2,"A current tired state is described using está with the third-person singular subject él."],
      ["Which phrase means 'They are doctors'?",["Ellos están médicos","Ellos somos médicos","Ellos es médicos","Ellos son médicos"],3,"Profession or identity normally uses ser, with plural form son."]
    ],
    truth:["The same English verb 'to be' can be translated using either ser or estar in Spanish.",true,"Ser and estar cover different common functions that English often expresses with the single verb to be."],
    recall:["What is the Spanish first-person singular present form of 'estar'?", "estoy","Estoy is the form with yo; for example yo estoy bien means I am well.",["yo estoy"]]
  },
  {
    id:"spanish-present-regular-verbs",subject:"spanish",title:"Spanish Present-Tense Regular Verbs",level:"Foundation",
    summary:"Form common present-tense patterns for -ar, -er and -ir verbs.",
    objectives:["Identify an infinitive ending","Match familiar subjects to verb endings","Use verbs in everyday statements"],
    lesson:["Regular -ar verbs such as hablar use endings -o, -as, -a, -amos, -áis, -an for yo, tú, él/ella, nosotros, vosotros, ellos/ellas.","Regular -er verbs such as comer use -o, -es, -e, -emos, -éis, -en.","Regular -ir verbs such as vivir use -o, -es, -e, -imos, -ís, -en. Pronouns are often omitted when the verb form is clear."],
    workedExample:"Hablar → hablo (I speak), hablas (you speak), hablamos (we speak). Comer → comemos (we eat). Vivir → vivimos (we live).",
    examTip:"Remove the infinitive ending first, then use the ending that matches the subject and verb group.",
    commonMistake:"Using -amos for every 'we' form: regular -er verbs take -emos, and regular -ir verbs take -imos.",
    checks:[
      ["How do you say 'I speak' using hablar?",["habla","hablo","hablamos","hablan"],1,"The regular first-person singular present ending for -ar verbs is -o: hablo."],
      ["Complete: Nosotros ___ español.",["hablamos","hablan","habla","hablas"],0,"Nosotros uses the regular -ar ending -amos, giving hablamos."],
      ["Which form means 'they eat'?",["comemos","como","comen","comes"],2,"Ellos/ellas take -en with regular -er verbs: comen."],
      ["Complete: Yo ___ en Madrid.",["vives","vivimos","viven","vivo"],3,"The first-person singular of vivir is vivo."],
      ["Which infinitive ends in -er?",["hablar","comer","vivir","estudiar"],1,"Comer is an -er verb and uses -er present-tense patterns."],
      ["Choose the correct phrase for 'we live'.",["vivimos","viven","vives","vivo"],0,"Nosotros takes the -imos ending for regular -ir verbs: vivimos."],
      ["Complete: Ella ___ una carta. (escribir)",["escriben","escribimos","escribe","escribo"],2,"Escribir is an -ir verb, and ella takes the singular third-person ending -e."],
      ["Which is the informal singular 'you eat' form?",["como","comen","come","comes"],3,"Tú comes uses the second-person singular ending -es with comer."]
    ],
    truth:["All regular Spanish verbs ending in -ar have the same present-tense endings for a given person.",true,"Regular -ar verbs share the present-tense ending pattern, although irregular verbs must be learned separately."],
    recall:["What is the present-tense first-person singular of 'comer'?", "como","Yo como means I eat; regular -er verbs use -o for this person.",["yo como"]]
  },
  {
    id:"spanish-travel-shopping",subject:"spanish",title:"Spanish Questions, Travel and Shopping",level:"Foundation",
    summary:"Use simple question words, prices and polite travel phrases.",
    objectives:["Recognise useful question words","Request common items politely","Understand basic price and direction questions"],
    lesson:["Dónde means where, cuándo means when and cuánto means how much/how many, changing form according to context.","Por favor is a polite request marker; gracias expresses thanks and de nada is a common reply.","A common travel or shopping question is ¿Cuánto cuesta? (How much does it cost?). ¿Dónde está la estación? asks where the station is."],
    workedExample:"At a ticket counter: Un billete, por favor. Then ask: ¿Cuánto cuesta? To ask for a station, say ¿Dónde está la estación?",
    examTip:"In standard Spanish writing, use opening ¿ and closing ? question marks as well as accents on question words.",
    commonMistake:"Confusing dónde (where) with cuándo (when), and omitting the written accent from an interrogative word.",
    checks:[
      ["Which word means 'where' in a direct Spanish question?",["cuándo","dónde","por qué","quién"],1,"Dónde asks for a place, as in ¿Dónde vives?"],
      ["Which phrase means 'thank you'?",["gracias","de nada","hasta luego","lo siento"],0,"Gracias is a standard way to thank someone in Spanish."],
      ["What does '¿Cuánto cuesta?' ask?",["Who is it?","When is it?","How much does it cost?","Where is it?"],2,"Cuánto cuesta requests a price or cost."],
      ["Which phrase means 'a ticket, please'?",["Un agua, gracias","¿Dónde está?","Una tienda","Un billete, por favor"],3,"Billete can mean a ticket in transport contexts and por favor adds politeness."],
      ["Which word asks 'when'?",["dónde","cuándo","cómo","qué"],1,"Cuándo is used to ask about time."],
      ["Which is the Spanish word for a railway station?",["estación","hospital","tienda","escuela"],0,"Estación means station; estación de tren specifies a train station."],
      ["Which written form is a correctly punctuated question?",["Donde está la estación.","?Dónde está la estación¿","¿Dónde está la estación?","¿Dónde está la estación."],2,"Spanish direct questions normally use the initial inverted question mark and a final question mark."],
      ["Which phrase commonly means 'you're welcome'?",["por favor","gracias","perdón","de nada"],3,"De nada is a common response after someone says gracias."]
    ],
    truth:["The written word '¿Dónde?' is used to ask where something is.",true,"Dónde means where and carries an accent in a direct question."],
    recall:["Which Spanish phrase means 'please'?", "por favor","Por favor is a polite phrase commonly added to requests.",["Por favor"]]
  }
];
export const spanishExpansion=specs.map(authorTenCheckLesson);
