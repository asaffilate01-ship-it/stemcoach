import { isLaunchCurriculum, launchSubjects } from "@/lib/launchDiscovery";
import { buildPracticePath, validPracticeTopic } from "@/lib/launchPractice";

export interface MasteryRow {
  curriculum:string;
  subject:string;
  topic:string;
  mastery_score:number;
  confidence_score:number;
  attempts:number;
  correct_attempts:number;
  correct_streak:number;
  last_practised_at:string|null;
  next_review_at:string;
  mastery_level:"new"|"developing"|"secure"|"mastered";
}
const levels=["new","developing","secure","mastered"];
const subjects=new Set(launchSubjects.map(s=>s.id));
const score=(n:unknown)=>typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=100;
const count=(n:unknown)=>typeof n==="number"&&Number.isSafeInteger(n)&&n>=0;
const timestamp=(n:unknown)=>typeof n==="string"&&Number.isFinite(Date.parse(n));

/** Never turn a malformed, cross-curriculum or failed response into empty progress. */
export function validateMasteryRows(value:unknown,curriculum:string):MasteryRow[]{
  if(!isLaunchCurriculum(curriculum)||!Array.isArray(value))throw new Error("Invalid mastery response");
  const seen=new Set<string>(),rows:MasteryRow[]=[];
  for(const raw of value){
    if(!raw||typeof raw!=="object"||raw.curriculum!==curriculum||typeof raw.subject!=="string"||!raw.subject.trim()||
       !validPracticeTopic(raw.topic)||!score(raw.mastery_score)||!score(raw.confidence_score)||!count(raw.attempts)||
       !count(raw.correct_attempts)||raw.correct_attempts>raw.attempts||!count(raw.correct_streak)||raw.correct_streak>raw.correct_attempts||
       !timestamp(raw.next_review_at)||(raw.last_practised_at!==null&&!timestamp(raw.last_practised_at))||!levels.includes(raw.mastery_level)){
      throw new Error("Invalid mastery row");
    }
    const key=JSON.stringify([raw.subject,raw.topic]);
    if(seen.has(key))throw new Error("Duplicate mastery row");
    seen.add(key);
    if(subjects.has(raw.subject))rows.push(raw as MasteryRow);
  }
  return rows;
}

export function prioritiseMastery(rows:readonly MasteryRow[],now:number){
  return [...rows].sort((a,b)=>{
    const ad=Date.parse(a.next_review_at)<=now,bd=Date.parse(b.next_review_at)<=now;
    return Number(bd)-Number(ad)||a.mastery_score-b.mastery_score||a.confidence_score-b.confidence_score||
      Date.parse(a.next_review_at)-Date.parse(b.next_review_at)||a.subject.localeCompare(b.subject)||a.topic.localeCompare(b.topic);
  });
}
export function masteryPracticePath(subject:string,curriculum:string,topic?:string){
  if(!isLaunchCurriculum(curriculum))throw new Error("Choose a launch curriculum");
  const path=buildPracticePath(subject,[curriculum],[],null);
  const url=new URL(path,"https://stemcoach.invalid");
  url.searchParams.set("mode","focus");
  if(topic!==undefined){
    if(!validPracticeTopic(topic))throw new Error("Invalid topic");
    url.searchParams.set("topic",topic);
  }
  return url.pathname+url.search;
}
