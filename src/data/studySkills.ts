/**
 * Original, student-friendly strategies, informed by the linked public guidance.
 * These are not diagnoses, clinical instructions, exam-board question banks or
 * a guarantee of results. No behavioural or wellbeing data is stored.
 */
export type StudyCategory = "start" | "remember" | "understand" | "exam" | "body" | "pressure";
export type StudyLanguage = "en" | "de" | "fr";
export type StudySource = "eef" | "nhs" | "ofqual" | "aqa";
export interface LocalisedStudyText {
  title: string;
  summary: string;
  steps: readonly [string, string, string];
}
export interface StudySkill {
  id: string;
  category: StudyCategory;
  source: StudySource;
  content: Record<StudyLanguage, LocalisedStudyText>;
}
const skill = (
  id: string, category: StudyCategory, source: StudySource,
  en: LocalisedStudyText, de: LocalisedStudyText, fr: LocalisedStudyText,
): StudySkill => ({ id, category, source, content: { en, de, fr } });

export const studyCategories: StudyCategory[] = ["start", "remember", "understand", "exam", "body", "pressure"];

export const studySources: Record<StudySource, { title: string; url: string }> = {
  eef: { title: "Education Endowment Foundation — Metacognition and self-regulated learning", url: "https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition" },
  nhs: { title: "NHS — Tips on preparing for exams", url: "https://www.nhs.uk/mental-health/children-and-young-adults/help-for-teenagers-young-adults-and-students/tips-on-preparing-for-exams/" },
  ofqual: { title: "Ofqual — Coping with exam pressure", url: "https://www.gov.uk/government/publications/coping-with-exam-pressure-a-guide-for-students" },
  aqa: { title: "AQA — How to manage exam stress", url: "https://www.aqa.org.uk/student-and-parent-support/managing-stress" },
};

export const studySkills: StudySkill[] = [
  skill("small-start", "start", "eef",
    {title:"Start with one small task",summary:"Make the first step so clear that you can begin without waiting for motivation.",steps:["Choose one topic and write a goal such as 'solve two equations'.","Set a short, realistic work block; gather only what you need.","Afterwards, note one thing you understood and your next step."]},
    {title:"Mit einem kleinen Schritt beginnen",summary:"Eine klare erste Aufgabe hilft beim Anfangen.",steps:["Wähle ein Thema und ein kleines Ziel, etwa zwei Gleichungen lösen.","Plane eine kurze, realistische Lernphase und lege Material bereit.","Notiere danach, was du verstanden hast und was als Nächstes kommt."]},
    {title:"Commencer par une petite tâche",summary:"Une première étape claire facilite le démarrage.",steps:["Choisis un sujet et un petit objectif, comme résoudre deux équations.","Prévois une séance courte et réaliste avec ton matériel.","Note ensuite une chose comprise et la prochaine étape."]}),
  skill("realistic-week", "start", "nhs",
    {title:"Plan a realistic revision week",summary:"Study in manageable chunks and leave room for ordinary life.",steps:["List upcoming topics and dates, then pick the most important few.","Spread subjects over available days; include breaks and rest.","Check your plan each evening and reduce it if it is too ambitious."]},
    {title:"Eine realistische Lernwoche planen",summary:"Kleine Einheiten mit Platz für Erholung.",steps:["Notiere Themen und Termine und wähle die wichtigsten aus.","Verteile Fächer auf die Woche und plane Pausen ein.","Prüfe den Plan abends und kürze ihn bei Bedarf."]},
    {title:"Planifier une semaine réaliste",summary:"Des étapes gérables avec du temps pour se reposer.",steps:["Note les sujets et échéances, puis choisis les priorités.","Répartis les matières en prévoyant des pauses.","Réévalue chaque soir et allège le programme si nécessaire."]}),
  skill("quiet-setup", "start", "nhs",
    {title:"Make it easier to focus",summary:"Reduce avoidable interruptions without needing a perfect study space.",steps:["Put your next task and materials in sight.","Silence non-essential notifications if practical.","If distracted, return to the single next action rather than restarting everything."]},
    {title:"Konzentration erleichtern",summary:"Weniger Ablenkung, ohne den perfekten Arbeitsplatz.",steps:["Lege Aufgabe und Material bereit.","Schalte unwichtige Benachrichtigungen möglichst stumm.","Wenn du abgelenkt bist, kehre zum nächsten kleinen Schritt zurück."]},
    {title:"Faciliter la concentration",summary:"Réduire les distractions sans exiger un espace parfait.",steps:["Prépare la tâche et le matériel nécessaire.","Coupe les notifications non essentielles si possible.","Après une distraction, reprends simplement à la prochaine étape."]}),
  skill("active-recall", "remember", "eef",
    {title:"Test yourself from memory",summary:"Retrieval practice checks what you can recall, not just what looks familiar.",steps:["Read a short section, then close your notes.","Write or say what you remember without peeking.","Check, correct gaps and try a different question later."]},
    {title:"Wissen aus dem Gedächtnis abrufen",summary:"Aktives Erinnern statt bloßem Wiedererkennen.",steps:["Lies einen kurzen Abschnitt und schließe die Notizen.","Erkläre oder notiere aus dem Gedächtnis, was du weißt.","Prüfe die Lücken und wiederhole später mit anderer Frage."]},
    {title:"Se rappeler sans regarder",summary:"L'évocation active vérifie ce que tu sais réellement.",steps:["Lis un court passage puis ferme tes notes.","Écris ou explique de mémoire ce que tu as retenu.","Vérifie les oublis puis réessaie plus tard avec une autre question."]}),
  skill("spaced-review", "remember", "eef",
    {title:"Return to learning over time",summary:"Short revisits across days can be more useful than one long cram.",steps:["Review today with a question or brief explanation.","Revisit after a gap, especially where you made mistakes.","Adjust the next gap according to what you could recall unaided."]},
    {title:"Mit Abstand wiederholen",summary:"Kurze Wiederholungen an mehreren Tagen.",steps:["Prüfe das Gelernte heute mit einer Frage.","Kehre nach einer Pause zurück, besonders zu Fehlern.","Passe den nächsten Abstand an dein Erinnern an."]},
    {title:"Réviser à intervalles",summary:"De courts rappels répartis sur plusieurs jours.",steps:["Vérifie aujourd'hui une idée avec une question.","Reviens-y après un délai, surtout sur les erreurs.","Adapte le prochain délai selon tes souvenirs sans aide."]}),
  skill("mixed-practice", "remember", "eef",
    {title:"Mix related question types",summary:"Practise choosing the method, not just repeating the same example.",steps:["Learn each method with a worked example first.","Try a short mixture of related topics or question types.","After each answer, explain how you decided which method to use."]},
    {title:"Verwandte Aufgabentypen mischen",summary:"Übe die Wahl des Lösungswegs.",steps:["Lerne jede Methode zunächst mit einem Beispiel.","Mische dann wenige verwandte Aufgabentypen.","Erkläre anschließend, warum du eine Methode gewählt hast."]},
    {title:"Mélanger des questions liées",summary:"S'entraîner à choisir la bonne méthode.",steps:["Apprends d'abord chaque méthode avec un exemple.","Mélange ensuite quelques types de questions proches.","Explique après chaque réponse le choix de ta méthode."]}),
  skill("worked-example", "understand", "eef",
    {title:"Follow a worked example",summary:"Understand each step before trying a similar problem independently.",steps:["Read one explained solution and name the rule used at each stage.","Cover the answer and complete a similar task.","Compare your reasoning and ask for clarification on any unclear step."]},
    {title:"Ein durchgerechnetes Beispiel nutzen",summary:"Schritte verstehen, dann selbst anwenden.",steps:["Lies eine Lösung und benenne die Regel pro Schritt.","Decke die Antwort ab und löse eine ähnliche Aufgabe.","Vergleiche die Begründung und kläre unverständliche Stellen."]},
    {title:"Suivre un exemple résolu",summary:"Comprendre chaque étape avant d'essayer seul.",steps:["Lis une solution expliquée et repère la règle à chaque étape.","Cache la réponse et résous une question semblable.","Compare le raisonnement et demande de l'aide si nécessaire."]}),
  skill("error-notes", "understand", "eef",
    {title:"Turn mistakes into useful notes",summary:"An error is a clue about the next concept to practise.",steps:["After checking a question, write the type of mistake, not personal criticism.","Record the correct method and one reminder.","Try a new example later to see if the method sticks."]},
    {title:"Aus Fehlern lernen",summary:"Ein Fehler zeigt den nächsten Lernschritt.",steps:["Notiere die Fehlerart ohne Selbstvorwürfe.","Schreibe die richtige Methode und einen Hinweis auf.","Teste sie später mit einer neuen Aufgabe."]},
    {title:"Apprendre de ses erreurs",summary:"Une erreur indique une notion à retravailler.",steps:["Note le type d'erreur sans te juger.","Écris la bonne méthode et un rappel simple.","Essaie plus tard une nouvelle question pour vérifier."]}),
  skill("teach-back", "understand", "eef",
    {title:"Explain it to someone else",summary:"Put a concept into your own words to reveal hidden gaps.",steps:["Pick one idea from today's lesson.","Explain it simply aloud or to a friend, including an example.","If you get stuck, check the source and try again without notes."]},
    {title:"Jemand anderem erklären",summary:"Eigene Worte machen Wissenslücken sichtbar.",steps:["Wähle eine Idee aus dem heutigen Stoff.","Erkläre sie einfach mit einem Beispiel.","Prüfe bei Unsicherheit den Stoff und versuche es ohne Notizen erneut."]},
    {title:"Expliquer à quelqu'un",summary:"Tes propres mots font apparaître les lacunes.",steps:["Choisis une idée étudiée aujourd'hui.","Explique-la simplement à voix haute avec un exemple.","Si tu bloques, vérifie le cours puis recommence sans notes."]}),
  skill("practice-paper", "exam", "nhs",
    {title:"Practise using exam-style questions",summary:"Rehearse the layout and time demands before the real exam.",steps:["Choose questions from the right course, board and specification.","Try a manageable timed section with permitted equipment.","Mark against appropriate guidance and revise the misunderstanding."]},
    {title:"Prüfungsaufgaben üben",summary:"Aufbau und Zeitdruck vor der Prüfung kennenlernen.",steps:["Wähle Aufgaben aus dem passenden Kurs und Prüfungsrahmen.","Übe einen kurzen Abschnitt mit passender Zeitvorgabe.","Prüfe deine Antworten und wiederhole Missverständnisse."]},
    {title:"S'exercer aux questions d'examen",summary:"Se familiariser avec la forme et la durée.",steps:["Choisis des questions adaptées au programme et à l'organisme.","Entraîne-toi sur une petite partie chronométrée.","Corrige et révise les notions mal comprises."]}),
  skill("command-words", "exam", "eef",
    {title:"Decode the question first",summary:"Make sure you answer what the examiner is asking.",steps:["Underline the instruction word: describe, explain, compare or evaluate.","Note the evidence, calculation or examples requested.","Plan a short response, then check that each part of the question is covered."]},
    {title:"Aufgabenstellung richtig lesen",summary:"Antworte genau auf die Anforderung.",steps:["Markiere Operatoren wie beschreiben, erklären oder vergleichen.","Notiere, welche Belege oder Berechnungen gebraucht werden.","Plane eine kurze Antwort und prüfe alle Teilaufgaben."]},
    {title:"Décoder la consigne",summary:"Répondre exactement à ce qui est demandé.",steps:["Repère le verbe : décrire, expliquer, comparer ou évaluer.","Note les preuves, calculs ou exemples demandés.","Prépare une courte réponse, puis vérifie chaque partie."]}),
  skill("exam-day", "exam", "ofqual",
    {title:"Keep exam day practical",summary:"Simple preparation reduces avoidable last-minute uncertainty.",steps:["Check the time, place, travel, identification and permitted materials.","Read instructions and plan approximate time per question.","If stuck, move to an accessible question and return if time allows."]},
    {title:"Prüfungstag gut vorbereiten",summary:"Einfache Planung vermeidet letzte Unsicherheiten.",steps:["Prüfe Zeit, Ort, Anreise, Ausweis und erlaubte Materialien.","Lies Anweisungen und teile die Zeit für Aufgaben ein.","Bei Blockade bearbeite zuerst eine andere Aufgabe."]},
    {title:"Préparer le jour de l'examen",summary:"Une organisation simple limite les imprévus.",steps:["Vérifie horaire, lieu, transport, identité et matériel autorisé.","Lis les consignes et répartis ton temps entre les questions.","Si tu bloques, passe à une autre question puis reviens si possible."]}),
  skill("regular-sleep", "body", "nhs",
    {title:"Protect rest and sleep",summary:"Avoid late-night cramming that leaves you exhausted.",steps:["Aim for a reasonably consistent sleep and wake routine.","Allow time to wind down away from revision before bed.","If tired, shorten the session rather than forcing more work."]},
    {title:"Schlaf und Erholung schützen",summary:"Langes Nachtlernen kann erschöpfen.",steps:["Halte Schlaf- und Aufstehzeiten möglichst regelmäßig.","Plane vor dem Schlafengehen eine ruhige Phase ein.","Bei Müdigkeit kürze die Lerneinheit statt dich zu überfordern."]},
    {title:"Préserver le sommeil",summary:"Éviter les révisions qui épuisent la nuit.",steps:["Garde des horaires de sommeil assez réguliers.","Prévois une période calme avant le coucher.","Si tu es épuisé, raccourcis la séance plutôt que forcer."]}),
  skill("movement-food", "body", "nhs",
    {title:"Look after your body",summary:"Ordinary food, water and comfortable movement belong in a study routine.",steps:["Keep water accessible and make time for regular meals.","Move or stretch in a way that is comfortable and suitable for you.","If you need a rest, take it—do not treat exercise or study as a punishment."]},
    {title:"Auf den Körper achten",summary:"Essen, Trinken und passende Bewegung gehören zum Lernen.",steps:["Trinke regelmäßig und nimm dir Zeit für Mahlzeiten.","Bewege oder dehne dich, soweit es angenehm und für dich geeignet ist.","Erlaube dir Pausen, ohne Druck daraus zu machen."]},
    {title:"Prendre soin de son corps",summary:"Repas, eau et mouvement adapté font partie de l'étude.",steps:["Garde de l'eau à portée et prends le temps de manger.","Bouge ou étire-toi selon ce qui est confortable pour toi.","Accorde-toi une pause sans la vivre comme un échec."]}),
  skill("planned-breaks", "body", "aqa",
    {title:"Use breaks without guilt",summary:"A pause is part of a sustainable plan, not a reward you must earn.",steps:["Try a work block you can manage, for example 20–25 minutes.","Stop for a brief break, look away from the screen or change activity.","Resume with one specific next task; adjust the rhythm to your needs."]},
    {title:"Pausen ohne schlechtes Gewissen",summary:"Pausen gehören zu einem guten Lernplan.",steps:["Wähle einen machbaren Block, etwa 20 bis 25 Minuten.","Lege eine kurze Pause ein und wechsle die Tätigkeit.","Starte mit einem klaren nächsten Schritt und passe den Rhythmus an."]},
    {title:"Faire des pauses sans culpabilité",summary:"Une pause fait partie d'un rythme soutenable.",steps:["Choisis une période gérable, par exemple 20 à 25 minutes.","Fais une courte pause et change d'activité.","Reprends une tâche précise en adaptant le rythme à tes besoins."]}),
  skill("grounding", "pressure", "aqa",
    {title:"Find a calmer next moment",summary:"When pressure rises, try a gentle grounding exercise if it feels comfortable.",steps:["Pause and let your shoulders relax; breathe at an easy pace without forcing it.","Notice five things you can see or hear around you.","Choose just one practical next step, or ask someone for support."]},
    {title:"Einen ruhigeren Moment finden",summary:"Bei Druck kann eine sanfte Orientierung helfen.",steps:["Halte kurz inne, lockere die Schultern und atme angenehm.","Nimm fünf Dinge wahr, die du sehen oder hören kannst.","Wähle einen kleinen nächsten Schritt oder bitte um Unterstützung."]},
    {title:"Retrouver un instant plus calme",summary:"Un exercice d'ancrage peut aider si tu es à l'aise.",steps:["Arrête-toi un instant, relâche les épaules et respire naturellement.","Observe cinq choses que tu vois ou entends.","Choisis une petite prochaine étape ou demande de l'aide."]}),
  skill("less-pressure", "pressure", "aqa",
    {title:"Choose progress over perfection",summary:"An exam result does not measure your worth or your whole future.",steps:["Replace 'I must do everything' with one achievable priority.","Compare your progress with your own previous attempts, not classmates.","After an exam, take a break instead of replaying every answer."]},
    {title:"Fortschritt statt Perfektion",summary:"Ein Prüfungsergebnis bestimmt nicht deinen Wert.",steps:["Ersetze 'alles schaffen' durch eine erreichbare Priorität.","Vergleiche dich mit deinen früheren Versuchen statt mit anderen.","Gönne dir nach einer Prüfung eine Pause."]},
    {title:"Viser le progrès, pas la perfection",summary:"Une note ne définit pas ta valeur.",steps:["Remplace 'tout réussir' par une priorité réalisable.","Compare tes progrès à tes essais précédents, pas aux autres.","Après une épreuve, fais une pause sans repasser toutes les réponses."]}),
  skill("support", "pressure", "nhs",
    {title:"Ask for help early",summary:"You do not have to manage persistent exam pressure on your own.",steps:["Tell a trusted adult, friend, teacher or tutor what is difficult.","Ask for a practical change such as help planning or a quieter study space.","If stress is affecting sleep, daily life or your ability to cope, seek help from a GP or suitable support service."]},
    {title:"Frühzeitig Hilfe holen",summary:"Anhaltenden Prüfungsdruck musst du nicht allein tragen.",steps:["Sprich mit einer vertrauten Person oder Lehrkraft.","Bitte um konkrete Hilfe, etwa bei der Planung.","Wenn Stress Schlaf oder Alltag beeinträchtigt, hol ärztlichen oder passenden fachlichen Rat."]},
    {title:"Demander de l'aide tôt",summary:"Tu n'as pas à gérer seul une pression persistante.",steps:["Parle à un proche, un adulte de confiance ou un enseignant.","Demande une aide pratique, par exemple pour planifier.","Si le stress affecte le sommeil ou la vie quotidienne, consulte un professionnel de santé ou un service adapté."]}),
];

export const studyChecklist = {
  before: {
    en: ["Choose a specific topic and realistic time block", "Have learning materials and water ready", "Test yourself without notes", "Finish by recording one next action"],
    de: ["Ein konkretes Thema und ein machbares Zeitfenster wählen", "Lernmaterial und Wasser bereitlegen", "Ohne Notizen selbst testen", "Einen nächsten Schritt festhalten"],
    fr: ["Choisir un sujet précis et une durée réaliste", "Préparer matériel et eau", "Se tester sans les notes", "Noter la prochaine action"],
  },
  evening: {
    en: ["Confirm exam place and permitted materials", "Pack what you need ahead of time", "Stop intensive revision and wind down", "Allow sufficient time for sleep"],
    de: ["Prüfungsort und erlaubtes Material prüfen", "Benötigte Sachen vorab einpacken", "Intensives Lernen beenden und entspannen", "Genügend Zeit für Schlaf lassen"],
    fr: ["Vérifier le lieu et le matériel autorisé", "Préparer les affaires à l'avance", "Arrêter la révision intensive et se détendre", "Garder assez de temps pour dormir"],
  },
  exam: {
    en: ["Leave enough time for the journey", "Read all instructions and command words", "Allocate time and return to tough questions if possible", "Afterwards rest and focus on what comes next"],
    de: ["Genügend Zeit für die Anreise lassen", "Anweisungen und Operatoren genau lesen", "Zeit einteilen und schwierige Aufgaben später erneut ansehen", "Danach ausruhen und nach vorne schauen"],
    fr: ["Prévoir assez de temps pour le trajet", "Lire les consignes et les verbes de commande", "Répartir le temps et revenir aux questions difficiles si possible", "Après, se reposer et penser à la suite"],
  },
} as const;

export type ChecklistKind = keyof typeof studyChecklist;

export function validStudyCategory(value: string | null): StudyCategory | "all" {
  return value !== null && studyCategories.some((candidate) => candidate === value) ? value as StudyCategory : "all";
}
