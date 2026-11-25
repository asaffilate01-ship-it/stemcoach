import { masteryPracticePath, prioritiseMastery, validateMasteryRows, type MasteryRow } from "@/lib/masteryRevision";
import { localDateKey } from "@/lib/studyCalendar";

export const REVISION_MINUTES_PER_TOPIC = 15;
export type MasteryTask = {key:string;topic:string;subject:string;mastery:number;dueAt:string;overdue:boolean;practicePath:string};
export type MasteryDay = {date:string;tasks:MasteryTask[];estimatedMinutes:number};
export type MasteryWeek = {days:MasteryDay[];scheduled:number;unscheduled:number;outsideWindow:number;estimatedMinutes:number};

/** A suggested local schedule from saved evidence, never completion or a new review date.
 * Each topic appears at most once. Work is not scheduled before its recorded review day.
 * Backlogged work is ranked by existing mastery priorities; capacity overflow stays visible.
 */
export function buildMasteryWeek(rows:readonly MasteryRow[],curriculum:string,now:Date,maxDaily:number):MasteryWeek {
  if(!Number.isFinite(now.getTime())||!Number.isInteger(maxDaily)||maxDaily<1||maxDaily>4)throw new RangeError("Invalid schedule settings");
  const validated=validateMasteryRows(rows,curriculum);
  const start=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);
  const days:MasteryDay[]=Array.from({length:7},(_,offset)=>{
    const date=new Date(start);date.setDate(date.getDate()+offset);
    return {date:localDateKey(date),tasks:[],estimatedMinutes:0};
  });
  const today=days[0].date,lastDay=days[6].date;
  const dayKeys=days.map(d=>d.date);
  const ranked=prioritiseMastery(validated,now.getTime()).map(row=>({row,dueDay:localDateKey(new Date(row.next_review_at))}));
  const within=ranked.filter(x=>x.dueDay<=lastDay).sort((a,b)=>{
    const aDay=a.dueDay<=today?today:a.dueDay;
    const bDay=b.dueDay<=today?today:b.dueDay;
    return aDay.localeCompare(bDay);
  });
  let scheduled=0;
  for(const {row,dueDay} of within){
    const earliest=dueDay<=today?0:dayKeys.indexOf(dueDay);
    const day=days.find((d,i)=>i>=earliest&&d.tasks.length<maxDaily);
    if(!day)continue;
    day.tasks.push({key:JSON.stringify([row.subject,row.topic]),topic:row.topic,subject:row.subject,mastery:row.mastery_score,dueAt:row.next_review_at,overdue:Date.parse(row.next_review_at)<now.getTime(),practicePath:masteryPracticePath(row.subject,curriculum,row.topic)});
    day.estimatedMinutes+=REVISION_MINUTES_PER_TOPIC;
    scheduled++;
  }
  return {days,scheduled,unscheduled:within.length-scheduled,outsideWindow:validated.length-within.length,estimatedMinutes:scheduled*REVISION_MINUTES_PER_TOPIC};
}
