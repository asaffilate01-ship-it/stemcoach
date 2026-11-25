/** Short illustrative listening prompts, not protected question-bank records.
 * Independent native-language review is required before using them in examinations.
 */
export type StudyLanguage = "en" | "de" | "ar" | "ur" | "cy";
type Phrase = { text:string; meaningEn:string; meaningDe:string };
type Track = { id:StudyLanguage; name:string; native:string; locale:string; rtl:boolean; coach:string; phrases:readonly Phrase[] };
export const listeningTracks: readonly Track[] = [
  {id:"en",name:"English",native:"English",locale:"en-GB",rtl:false,coach:"ielts",phrases:[
    {text:"Could you repeat that, please?",meaningEn:"A polite request to hear something again.",meaningDe:"Eine höfliche Bitte, etwas zu wiederholen."},
    {text:"The library closes at six.",meaningEn:"The library shuts at six o'clock.",meaningDe:"Die Bibliothek schließt um sechs Uhr."},
    {text:"I would like to make an appointment.",meaningEn:"The speaker wants to arrange a meeting.",meaningDe:"Ich möchte einen Termin vereinbaren."},
    {text:"Which platform does the train leave from?",meaningEn:"The speaker is asking for the train's departure platform.",meaningDe:"Von welchem Gleis fährt der Zug ab?"},
  ]},
  {id:"de",name:"German",native:"Deutsch",locale:"de-DE",rtl:false,coach:"german",phrases:[
    {text:"Könnten Sie das bitte wiederholen?",meaningEn:"Could you repeat that, please?",meaningDe:"Eine höfliche Bitte um Wiederholung."},
    {text:"Ich möchte einen Termin vereinbaren.",meaningEn:"I would like to make an appointment.",meaningDe:"Die Person möchte einen Termin ausmachen."},
    {text:"Die Bibliothek schließt um sechs Uhr.",meaningEn:"The library closes at six.",meaningDe:"Um sechs Uhr endet die Öffnungszeit der Bibliothek."},
    {text:"Wann fährt der nächste Zug?",meaningEn:"When does the next train leave?",meaningDe:"Die Person fragt nach der Abfahrtszeit des nächsten Zuges."},
  ]},
  {id:"ar",name:"Arabic",native:"العربية",locale:"ar-SA",rtl:true,coach:"arabic",phrases:[
    {text:"أَيْنَ الْمَكْتَبَةُ؟",meaningEn:"Where is the library?",meaningDe:"Wo ist die Bibliothek?"},
    {text:"أُرِيدُ كُوبًا مِنَ الْمَاءِ.",meaningEn:"I want a cup of water.",meaningDe:"Ich möchte einen Becher Wasser."},
    {text:"مَتَى يَبْدَأُ الدَّرْسُ؟",meaningEn:"When does the lesson begin?",meaningDe:"Wann beginnt der Unterricht?"},
    {text:"شُكْرًا عَلَى مُسَاعَدَتِكَ.",meaningEn:"Thank you for your help (addressing a man).",meaningDe:"Danke für deine Hilfe (an einen Mann gerichtet)."},
  ]},
  {id:"ur",name:"Urdu",native:"اردو",locale:"ur-PK",rtl:true,coach:"urdu",phrases:[
    {text:"کتب خانہ کہاں ہے؟",meaningEn:"Where is the library?",meaningDe:"Wo ist die Bibliothek?"},
    {text:"مجھے ایک گلاس پانی چاہیے۔",meaningEn:"I need a glass of water.",meaningDe:"Ich brauche ein Glas Wasser."},
    {text:"کلاس کب شروع ہوگی؟",meaningEn:"When will the class begin?",meaningDe:"Wann beginnt der Unterricht?"},
    {text:"آپ کی مدد کا شکریہ۔",meaningEn:"Thank you for your help.",meaningDe:"Danke für Ihre Hilfe."},
  ]},
  {id:"cy",name:"Welsh",native:"Cymraeg",locale:"cy-GB",rtl:false,coach:"welsh",phrases:[
    {text:"Ble mae'r llyfrgell?",meaningEn:"Where is the library?",meaningDe:"Wo ist die Bibliothek?"},
    {text:"Ga i wydraid o ddŵr, os gwelwch yn dda?",meaningEn:"May I have a glass of water, please?",meaningDe:"Darf ich bitte ein Glas Wasser haben?"},
    {text:"Pryd mae'r wers yn dechrau?",meaningEn:"When does the lesson start?",meaningDe:"Wann beginnt der Unterricht?"},
    {text:"Diolch am eich help.",meaningEn:"Thank you for your help.",meaningDe:"Danke für Ihre Hilfe."},
  ]},
];

export function chooseLocalVoice<T extends { lang:string; localService:boolean; default?:boolean }>(voices:readonly T[], locale:string):T|null {
  const normalise=(value:string)=>value.toLowerCase().replace(/_/g,"-");
  const desired=normalise(locale), base=desired.split("-")[0];
  const candidates=voices.filter(v=>v.localService===true&&normalise(v.lang).split("-")[0]===base);
  return candidates.find(v=>normalise(v.lang)===desired&&v.default)??candidates.find(v=>normalise(v.lang)===desired)??candidates.find(v=>v.default)??candidates[0]??null;
}

/** Track the current utterance, preventing stale speech events after a stop or switch. */
export class ListeningPlayback {
  private current: SpeechSynthesisUtterance|null=null;
  private engine: SpeechSynthesis|null=null;
  stop() {
    const engine=this.engine, active=this.current;
    this.current=null; this.engine=null;
    if(active&&engine) {
      active.onend=null;active.onerror=null;
      try { engine.cancel(); } catch { /* device speech service may have closed */ }
    }
  }
  play(engine:SpeechSynthesis,utterance:SpeechSynthesisUtterance,onFinish:(failed:boolean)=>void) {
    this.stop();
    this.current=utterance;this.engine=engine;
    const finish=(failed:boolean)=>{
      if(this.current!==utterance)return;
      this.current=null;this.engine=null;
      utterance.onend=null;utterance.onerror=null;
      onFinish(failed);
    };
    utterance.onend=()=>finish(false);
    utterance.onerror=()=>finish(true);
    try { engine.speak(utterance); } catch { this.stop();onFinish(true); }
  }
}
