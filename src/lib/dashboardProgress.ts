/** Summaries describe a bounded sample of saved attempts, not exam readiness. */
export const DASHBOARD_ATTEMPT_LIMIT = 500;
export type ProgressAttempt = { id:string; question_id:string; created_at:string; correct:boolean };
export type QuestionMetadata = { id:string|null; subject:string|null; topic:string|null };
export type StudentStats = {total_questions:number; correct_answers:number; streak:number; xp:number};

export function validStudentStats(value:unknown):value is StudentStats {
  if(!value || typeof value!=="object")return false;
  const row=value as StudentStats;
  return [row.total_questions,row.correct_answers,row.streak,row.xp].every(n=>Number.isSafeInteger(n)&&n>=0)&&row.correct_answers<=row.total_questions;
}
export function summariseDashboardProgress(attempts:readonly ProgressAttempt[],metadata:readonly QuestionMetadata[],now=new Date()){
  const dateKey=(date:Date)=>date.toISOString().slice(0,10);
  const days=new Map<string,{total:number;correct:number}>();
  for(let i=13;i>=0;i--){
    const date=new Date(now);date.setUTCDate(date.getUTCDate()-i);
    days.set(dateKey(date),{total:0,correct:0});
  }
  const qMap=new Map(metadata.filter(row=>row.id&&row.subject&&row.topic).map(row=>[row.id!,{subject:row.subject!,topic:row.topic!}]));
  const subjects=new Map<string,{total:number;correct:number}>();
  const topics=new Map<string,{subject:string;topic:string;total:number;correct:number}>();
  const recent=new Map<string,{subject:string;topic:string;date:string;score:number;total:number}>();
  const ordered=[...attempts].sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)||a.id.localeCompare(b.id));
  const ids=new Set<string>();
  let missingMetadata=0;
  const count=(row:{total:number;correct:number},correct:boolean)=>{row.total++;if(correct)row.correct++;};
  for(const [i,a] of ordered.entries()){
    const timestamp=Date.parse(a.created_at);
    if(!a.id||!a.question_id||ids.has(a.id)||!Number.isFinite(timestamp)||typeof a.correct!=="boolean")throw new Error("Invalid saved attempt");
    ids.add(a.id);
    const day=dateKey(new Date(timestamp)),d=days.get(day);
    if(d)count(d,a.correct); // activity never depends on question metadata
    const q=qMap.get(a.question_id);
    if(!q){missingMetadata++;continue;}
    const s=subjects.get(q.subject)??{total:0,correct:0};
    count(s,a.correct);subjects.set(q.subject,s);
    const key=JSON.stringify([q.subject,q.topic]);
    const t=topics.get(key)??{...q,total:0,correct:0};
    count(t,a.correct);topics.set(key,t);
    if(i<50){
      const recentKey=JSON.stringify([day,q.subject,q.topic]);
      const r=recent.get(recentKey)??{...q,date:day,score:0,total:0};
      r.total++;if(a.correct)r.score++;recent.set(recentKey,r);
    }
  }
  const accuracy=(r:{total:number;correct:number})=>Math.round(100*r.correct/r.total);
  return {
    sampleSize:ordered.length,
    sampleCapped:ordered.length>=DASHBOARD_ATTEMPT_LIMIT,
    missingMetadata,
    dailyData:[...days.entries()].map(([date,d])=>({date,questions:d.total,accuracy:d.total?accuracy(d):null})),
    subjectProgress:[...subjects.entries()].map(([subject,r])=>({subject,...r,accuracy:accuracy(r)})).sort((a,b)=>b.total-a.total),
    weakTopics:[...topics.values()].map(r=>({...r,accuracy:accuracy(r)})).filter(t=>t.total>=3&&t.accuracy<60).sort((a,b)=>a.accuracy-b.accuracy||b.total-a.total).slice(0,6),
    recentActivity:[...recent.values()].slice(0,8),
  };
}
