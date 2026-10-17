import {revisionPriorities, type MasteryEvidence, type RevisionPriority} from "./educationBridge";

export interface ScheduledRevision {
  id: string;
  subject: string;
  topic: string;
  mastery: number;
  practicePath: string;
  reason: "due" | "focus" | "follow-up";
  estimatedMinutes: number;
}
export interface RevisionDay {
  date: string;
  tasks: ScheduledRevision[];
  minutes: number;
}
export interface RevisionWeek {
  dates: RevisionDay[];
  totalTopics: number;
  estimatedMinutes: number;
}

/** Deterministic local plan: not a formal assignment, exam grade or completion. */
export function buildRevisionWeek(
  rows: MasteryEvidence[], now: Date, maxDaily = 3,
): RevisionWeek {
  if (!Number.isFinite(now.getTime())) throw new Error("A valid date is required");
  const max = Number.isSafeInteger(maxDaily) ? Math.min(4, Math.max(1, maxDaily)) : 3;
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dates: RevisionDay[] = Array.from({length: 7}, (_, offset) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + offset);
    return {date: day.toISOString().slice(0,10), tasks: [], minutes: 0};
  });
  const priorities = revisionPriorities(rows, now, 10);
  const seen = new Set<string>();
  const firstDay = new Map<string,number>();
  const makeTask = (p: RevisionPriority, reason: ScheduledRevision["reason"], offset: number):ScheduledRevision => ({
    id: p.subject + ":" + p.topic + ":" + offset,
    subject:p.subject,topic:p.topic,mastery:p.mastery,
    practicePath:p.practicePath, reason, estimatedMinutes:15,
  });
  for(const [index,p] of priorities.entries()){
    const key=p.subject+"\x1f"+p.topic;
    if(seen.has(key))continue;
    seen.add(key);
    const preferred=Math.min(6,Math.floor(index/2));
    const destination=dates.findIndex((d,i)=>i>=preferred&&d.tasks.length<max);
    if(destination<0)break;
    dates[destination].tasks.push(makeTask(p,p.due?"due":"focus",destination));
    firstDay.set(key,destination);
  }
  for(const p of priorities){
    if(!p.due && p.mastery>=65)continue;
    const key=p.subject+"\x1f"+p.topic;
    const original=firstDay.get(key);
    if(original===undefined)continue;
    const followUp=dates.findIndex((d,i)=>i>=original+3 && d.tasks.length<max
      && !d.tasks.some(t=>t.subject===p.subject&&t.topic===p.topic));
    if(followUp>=0)dates[followUp].tasks.push(makeTask(p,"follow-up",followUp));
  }
  for(const d of dates)d.minutes=d.tasks.reduce((sum,t)=>sum+t.estimatedMinutes,0);
  return {
    dates, totalTopics:firstDay.size,
    estimatedMinutes:dates.reduce((sum,d)=>sum+d.minutes,0),
  };
}
