import type { AuthorLesson } from "./tutorialExpansionLargeAuthoring";
import { authorTenCheckLesson } from "./tutorialExpansionLargeAuthoring";

/** Modern Standard Arabic (MSA) introductory draft, subject to native-speaker review. */
const specs: AuthorLesson[] = [
  {
    id:"arabic-greetings-pronouns",subject:"arabic",title:"Modern Standard Arabic: Greetings and Pronouns",level:"Foundation",
    summary:"Recognise Arabic greetings and common independent subject pronouns.",
    objectives:["Read common greetings in Arabic script","Identify first- and second-person pronouns","Respond politely in familiar contexts"],
    lesson:["Modern Standard Arabic (MSA) is used in formal education and media; spoken dialects may use different expressions.","أَنَا (anā) means I, أَنْتَ (anta) is you addressing a male and أَنْتِ (anti) addresses a female.","مَرْحَبًا (marḥaban) means hello and شُكْرًا (shukran) means thank you. Greetings such as السَّلَامُ عَلَيْكُمْ are also widely used."],
    workedExample:"When meeting someone in an MSA-learning context, you can say مَرْحَبًا (hello). Respond to thanks شُكْرًا with عَفْوًا (you're welcome).",
    examTip:"Pay attention to Arabic letter shapes and vowel markings; distinguish formal MSA from regional spoken usage.",
    commonMistake:"Treating every Arabic-speaking region as having identical conversational dialect forms, or treating أَنْتَ and أَنْتِ as interchangeable.",
    checks:[
      ["ما معنى «مَرْحَبًا» بالإنجليزية؟",["goodbye","hello","ticket","school"],1,"مَرْحَبًا is a common greeting meaning hello in Modern Standard Arabic."],
      ["اختر الضمير الذي يعني «أنا» بالإنجليزية.",["أنا","هو","هي","هم"],0,"أَنَا is the first-person singular pronoun, equivalent to I in English."],
      ["Which Arabic form is used for 'thank you'?",["عفوًا","بيت","شكرًا","كتاب"],2,"شُكْرًا (shukran) is the common expression for thank you."],
      ["Which independent pronoun means 'he'?",["هي","أنا","نحن","هو"],3,"هُوَ (huwa) is the independent third-person masculine singular pronoun."],
      ["ما معنى «نَحْنُ»؟",["she","we","you (feminine)","they"],1,"نَحْنُ (naḥnu) means we in Modern Standard Arabic."],
      ["Which pronoun means 'she'?",["هي","هو","أنت","أنا"],0,"هِيَ (hiya) is the independent third-person feminine singular pronoun."],
      ["What does «عَفْوًا» commonly mean in response to thanks?",["please","when","you're welcome","where"],2,"عَفْوًا (ʿafwan) is often used to mean you're welcome after شُكْرًا."],
      ["Which Arabic pronoun addresses one female as 'you' in MSA?",["أنتَ","هو","أنتم","أنتِ"],3,"أَنْتِ (anti) addresses one female; أَنْتَ (anta) addresses one male."]
    ],
    truth:["In Modern Standard Arabic, 'أنا' is an independent pronoun meaning 'I'.",true,"أَنَا (anā) is the standard first-person singular independent pronoun."],
    recall:["اكتب الكلمة العربية التي تعني «كتاب» بالإنجليزية (book).", "كتاب","كِتَاب (kitāb) means book in Modern Standard Arabic.",["كِتَاب"]]
  },
  {
    id:"arabic-definite-article-nouns",subject:"arabic",title:"Modern Standard Arabic: Nouns and the Definite Article",level:"Foundation",
    summary:"Identify the definite article ال and recognise common classroom words.",
    objectives:["Identify the written definite article","Distinguish selected familiar nouns","Recognise simple definite expressions"],
    lesson:["The definite article is written ال and attaches to a noun, for example كتاب (a book/book) → الكتاب (the book).","Arabic script is written right to left; short vowels are often omitted in everyday unvowelled writing.","Some Arabic consonants affect pronunciation of the l in the article (sun letters); this does not change the basic attached spelling ال."],
    workedExample:"كِتَاب means book; الْكِتَاب means the book. Similarly مَدْرَسَة means school and الْمَدْرَسَة means the school.",
    examTip:"Identify the letters of the noun after the attached ال and check whether the question asks for definite or indefinite meaning.",
    commonMistake:"Writing the Arabic definite article as a separate English-style word, or reversing letter order when copying right-to-left script.",
    checks:[
      ["Which Arabic spelling means 'the book'?",["كتاب","الكتاب","كتب","مكتبة"],1,"الكتاب combines the attached definite article ال with كتاب (book)."],
      ["ما معنى كلمة «مَدْرَسَة»؟",["school","window","street","teacher"],0,"مَدْرَسَة (madrasa) means school in Modern Standard Arabic."],
      ["What is the attached definite article in written Arabic?",["ب","و","ال","في"],2,"ال (al-) is written attached to the noun as the Arabic definite article."],
      ["Which word means 'house'?",["قلم","باب","طالب","بيت"],3,"بَيْت (bayt) means a house or home."],
      ["ما معنى «قَلَم»؟",["student","pen","city","train"],1,"قَلَم (qalam) is a pen, a common classroom vocabulary item."],
      ["Which is the Arabic word for 'student' (masculine singular)?",["طالب","مدرسة","مدينة","سيارة"],0,"طَالِب (ṭālib) means a male student; the feminine form is طالبة."],
      ["Which form means 'the school'?",["مدرسة","الطالب","المدرسة","كتاب"],2,"المدرسة adds ال to مدرسة to mean the school."],
      ["Which direction is standard Arabic script written?",["top to bottom only","left to right","alternating direction","right to left"],3,"Arabic text runs from right to left, though embedded Western numbers and Latin text may differ."]
    ],
    truth:["In written Arabic, ال is generally attached to the beginning of its noun.",true,"The Arabic definite article is normally attached in writing, as in الكتاب."],
    recall:["اكتب كلمة «بيت» بالعربية من دون أداة التعريف.", "بيت","بَيْت means house; without ال the bare word is بيت.",["بَيْت"]]
  },
  {
    id:"arabic-simple-nominal-sentences",subject:"arabic",title:"Modern Standard Arabic: Simple Nominal Sentences",level:"Intermediate",
    summary:"Understand basic 'X is Y' statements without a present-tense written verb for is.",
    objectives:["Recognise a simple nominal sentence","Identify basic adjective agreement","Interpret common place vocabulary"],
    lesson:["In a simple present-tense affirmative nominal sentence, MSA often has no separate written verb meaning is: البَيْتُ كَبِيرٌ means the house is big.","An adjective normally agrees with its noun in grammatical gender; كبير is masculine and كبيرة feminine in simple forms.","هَذَا (hādhā) is a common masculine demonstrative this, while هَذِهِ (hādhihi) is a common feminine demonstrative this."],
    workedExample:"هَذَا بَيْتٌ means 'This is a house'. هَذِهِ مَدْرَسَةٌ means 'This is a school'. In each example the present-tense English verb 'is' need not appear as a separate Arabic word.",
    examTip:"Check whether a demonstrative and adjective match the noun's grammatical gender and avoid inserting an English-style present 'is'.",
    commonMistake:"Translating word for word and adding an unnecessary independent present-tense 'is' to every basic affirmative Arabic nominal sentence.",
    checks:[
      ["Which phrase means 'This is a house' in MSA?",["هذا مدرسة","هذا بيت","هذه بيت","هم بيت"],1,"هَذَا بَيْتٌ uses masculine demonstrative هذا with masculine بيت."],
      ["Which phrase means 'This is a school'?",["هذه مدرسة","هذا مدرسة","هذه بيت","هو مدرسة"],0,"مَدْرَسَة is grammatically feminine, so هَذِهِ is a natural demonstrative."],
      ["What does «كَبِير» mean?",["small","new","big","near"],2,"كَبِير (kabīr) is the masculine singular adjective big or large."],
      ["Which is a common feminine form of 'big'?",["قلم","بيت","كتاب","كبيرة"],3,"كَبِيرَة (kabīra) is the feminine singular form corresponding to كبير."],
      ["Which phrase means 'The house is big'?",["البيت صغيرة","البيت كبير","المدرسة كبير","هو قلم"],1,"البيت كبير is a common simple nominal sentence with a masculine predicate adjective."],
      ["Which Arabic word is a common feminine demonstrative meaning 'this'?",["هذه","هذا","هو","هم"],0,"هَذِهِ is commonly used with feminine singular nouns."],
      ["What does «صَغِير» mean?",["fast","tall","small","old"],2,"صَغِير (ṣaghīr) means small or little."],
      ["In a basic present-tense affirmative Arabic nominal sentence, what is commonly true?",["Every sentence must use 'كان'","The article is always omitted","The adjective never changes","No separate written present 'is' is required"],3,"A simple nominal statement such as البيت كبير conveys 'is' without a separate present-tense verb."]
    ],
    truth:["A basic affirmative MSA nominal sentence must always contain a separate written word equivalent to English 'is'.",false,"Simple present-tense affirmative nominal sentences typically omit an explicit copula equivalent to is."],
    recall:["اكتب اسم الإشارة للمفرد المؤنث الذي يعني «هذه».", "هذه","هَذِهِ is the feminine singular demonstrative 'this'.",["هَذِهِ"]]
  }
];
export const arabicExpansion=specs.map(authorTenCheckLesson);
