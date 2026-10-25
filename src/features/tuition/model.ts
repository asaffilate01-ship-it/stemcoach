export type Plan={id:string;module_id:string;student_id:string;goal:string};
export type Task={id:string;plan_id:string;skill:string;baseline:string;diagnostic_evidence:string;instruction:string;position:number};
export type Attempt={id:string;task_id:string;response:string;help_requested:boolean;submitted_at:string;outcome:string|null;feedback:string|null;reviewed_at:string|null};
export type Roster={module_id:string;module_title:string;student_id:string;student_name:string;can_teach:boolean};
export const labels:Record<string,string>={not_assessed:'Not yet assessed',needs_support:'Needs tutor support',with_hints:'Demonstrated with hints',independent:'Demonstrated independently'};
export function latestAttempt(taskId:string,attempts:Attempt[]){return attempts.filter(a=>a.task_id===taskId).sort((a,b)=>b.submitted_at.localeCompare(a.submitted_at)||b.id.localeCompare(a.id))[0];}
export function nextLearningTask(tasks:Task[],attempts:Attempt[]){const sorted=[...tasks].sort((a,b)=>a.position-b.position);return sorted.find(t=>{const a=latestAttempt(t.id,attempts);return a?.outcome&&a.outcome!=='independent';})||sorted.find(t=>!latestAttempt(t.id,attempts));}
export function parseRows(value:unknown,kind:'plan'|'task'|'attempt'|'roster'):unknown[]{
 if(!Array.isArray(value))throw Error('Missing rows');
 const fields={plan:['id','module_id','student_id','goal'],task:['id','plan_id','skill','baseline','diagnostic_evidence','instruction'],attempt:['id','task_id','response','submitted_at'],roster:['module_id','module_title','student_id','student_name']}[kind];
 for(const row of value){if(!row||typeof row!=='object'||fields.some(k=>typeof row[k]!=='string'))throw Error('Invalid row');
 if(kind==='task'&&(!Number.isInteger(row.position)||row.position<1||!Object.prototype.hasOwnProperty.call(labels,row.baseline)))throw Error('Invalid task');
 if(kind==='attempt'&&(typeof row.help_requested!=='boolean'||!Number.isFinite(Date.parse(row.submitted_at))||(row.outcome!==null&&(!['needs_support','with_hints','independent'].includes(row.outcome)||typeof row.feedback!=='string'))))throw Error('Invalid attempt');
 if(kind==='roster'&&typeof row.can_teach!=='boolean')throw Error('Invalid roster');
 }return value;
}
