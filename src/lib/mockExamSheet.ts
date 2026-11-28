/** Validate and project the legacy question selector before opening the timer.
 * This does not authenticate publication, academic verification or a server session.
 * No correct-answer or explanation fields are retained from a question sheet.
 */
export interface MockExamQuestion {
  id: string;
  question_text: string;
  options: string[];
  topic: string;
  subject: string;
  difficulty: number;
  points: number;
}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const invalid=()=>new Error("Mock examination question sheet is incomplete or invalid");
function text(value:unknown,max:number):value is string {
  return typeof value==="string" && value.trim().length>0 && value.length<=max;
}

export function requireMockExamSheet(value:unknown, subject:string, requestedCount:number):MockExamQuestion[] {
  if (!text(subject,100) || !Number.isSafeInteger(requestedCount) || requestedCount<1 || requestedCount>100 ||
      !Array.isArray(value) || value.length!==requestedCount) throw invalid();
  const ids=new Set<string>();
  return value.map(item=>{
    if (!item || typeof item!=="object" || Array.isArray(item)) throw invalid();
    const {id,question_text,topic,difficulty,points}=item;
    if (typeof id!=="string" || !UUID.test(id) || ids.has(id.toLowerCase()) ||
        item.subject!==subject || !text(question_text,12000) || !text(topic,1000) ||
        !Number.isSafeInteger(difficulty) || difficulty<1 || difficulty>5 ||
        !Number.isSafeInteger(points) || points<1 || points>10000) throw invalid();
    let options:unknown=item.options;
    if(typeof options==="string"){
      if(options.length>100000)throw invalid();
      try{options=JSON.parse(options);}catch{throw invalid();}
    }
    if(!Array.isArray(options)||options.length<2||options.length>8||
       !options.every(option=>text(option,2000)))throw invalid();
    const choices=options as string[];
    const comparable=choices.map(option=>option.normalize("NFKC").trim().toLowerCase());
    if(new Set(comparable).size!==choices.length)throw invalid();
    ids.add(id.toLowerCase());
    return {id:id.toLowerCase(),question_text,topic,subject,difficulty,points,options:[...choices]};
  });
}

/** A client deadline prevents late selections from entering the pending payload.
 * The server still needs an authoritative deadline before formal exam enforcement.
 */
export function acceptsExamAnswer(deadline:number|null, submitted:boolean, now=Date.now()):boolean {
  return !submitted && deadline!==null && Number.isFinite(deadline) &&
    Number.isFinite(now) && now<deadline;
}
