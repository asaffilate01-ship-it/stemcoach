import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { labels, latestAttempt, nextLearningTask, type Plan, type Task, type Attempt, type Roster, parseRows } from './model';
const db = supabase as unknown as SupabaseClient;
const input = 'block w-full rounded border bg-background p-2 my-2';
const button = 'rounded border px-4 py-2 disabled:opacity-50';
async function rpc(name: string, args: Record<string, unknown> = {}) { const r = await db.rpc(name, args); if (r.error) throw r.error; return r.data; }
async function rows<T>(table: string, kind: 'plan'|'task'|'attempt', field?: string, ids?: string[]): Promise<T[]> {
  const all: T[] = []; const groups = ids ? Array.from({length: Math.ceil(ids.length / 50)}, (_, i) => ids.slice(i * 50, i * 50 + 50)) : [null];
  for (const group of groups) for (let offset = 0; ; offset += 250) {
    let q = db.from(table).select('*').order('id').range(offset, offset + 249);
    if (group && field) q = q.in(field, group);
    const r = await q; if (r.error) throw r.error;
    const page = parseRows(r.data, kind) as T[]; all.push(...page); if (page.length < 250) break;
  }
  return all;
}
export default function TuitionWorkspace() {
  const [identity, setIdentity] = useState<string|null|undefined>(undefined);
  useEffect(() => { let live = true; let changed = false;
    const {data:{subscription}} = db.auth.onAuthStateChange((_event, session) => { changed = true; if(live) setIdentity(session?.user.id ?? null); });
    void db.auth.getSession().then(({data,error}) => { if(live && !changed) setIdentity(error ? null : data.session?.user.id ?? null); });
    return () => {live = false; subscription.unsubscribe();};
  }, []);
  return <main className="mx-auto max-w-5xl p-4 md:p-8"><Link className="underline" to="/dashboard">Back to dashboard</Link><h1 className="my-4 text-2xl font-bold">Personal learning plans</h1>
    {identity === undefined ? <p role="status">Checking your account…</p> : identity ? <Workspace key={identity} userId={identity}/> : <p><Link className="underline" to={'/auth'}>Sign in to view your learning plans</Link></p>}
  </main>;
}
function Workspace({userId}:{userId:string}) {
  const [version,setVersion] = useState(0), [loading,setLoading] = useState(true), [error,setError] = useState('');
  const [plans,setPlans] = useState<Plan[]>([]),[tasks,setTasks] = useState<Task[]>([]),[attempts,setAttempts] = useState<Attempt[]>([]),[roster,setRoster] = useState<Roster[]>([]);
  const [selected,setSelected] = useState(''),[search,setSearch] = useState(''),[page,setPage] = useState(0),[shared,setShared] = useState(false),[helpOnly,setHelpOnly] = useState(false);
  useEffect(() => {let live=true; setLoading(true);setError('');setPlans([]);setTasks([]);setAttempts([]);setRoster([]);
    void (async()=>{try {
      const [p,r] = await Promise.all([rows<Plan>('tuition_learning_plans','plan'),rpc('get_tuition_roster')]);
      const safeRoster=parseRows(r,'roster') as Roster[];
      const t=await rows<Task>('tuition_learning_tasks','task','plan_id',p.map(x=>x.id));
      const a=await rows<Attempt>('tuition_learning_attempts','attempt','task_id',t.map(x=>x.id));
      if(live){setPlans(p);setTasks(t);setAttempts(a);setRoster(safeRoster);setSelected(old=>p.some(x=>x.id===old)?old:p[0]?.id||'');}
    }catch{if(live)setError('Learning plans could not be verified. Refresh to try again.');}finally{if(live)setLoading(false);}})();return()=>{live=false;};
  },[version]);
  const reload=()=>setVersion(v=>v+1);
  const title=(p:Plan)=>{const r=roster.find(x=>x.module_id===p.module_id&&x.student_id===p.student_id);return r?`${r.module_title} · ${r.student_name}`:'Learning plan';};
  const teachingPlans=new Set(plans.filter(p=>p.student_id!==userId&&roster.some(r=>r.module_id===p.module_id&&r.student_id===p.student_id&&r.can_teach)).map(p=>p.id));
  const pending=attempts.filter(a=>!a.outcome&&tasks.some(t=>t.id===a.task_id&&teachingPlans.has(t.plan_id)));
  const helpPlans=new Set(tasks.filter(t=>pending.some(a=>a.task_id===t.id&&a.help_requested)).map(t=>t.plan_id));
  const filtered=plans.filter(p=>(!helpOnly||helpPlans.has(p.id))&&`${title(p)} ${p.goal}`.toLowerCase().includes(search.toLowerCase()));
  const plan=filtered.find(p=>p.id===selected);
  const canTeach=!!plan&&plan.student_id!==userId&&roster.some(r=>r.module_id===plan.module_id&&r.student_id===plan.student_id&&r.can_teach);
  const ownTasks=tasks.filter(t=>t.plan_id===plan?.id).sort((a,b)=>a.position-b.position);
  const next=nextLearningTask(ownTasks,attempts);
  return <><p className="mb-4 text-muted-foreground">Tutor-recorded diagnostics, individual practice and reviewed understanding. These are formative observations, separate from official grades and certificates.</p>
    <nav className="flex flex-wrap gap-3 mb-4"><button className={button} disabled={loading} onClick={reload}>Refresh</button><button className={button} onClick={()=>setShared(s=>!s)}>{shared?'My learning workspace':'Shared guardian summaries'}</button></nav>
    {shared?<Guardian key={version}/>:<>{loading&&<p role="status">Loading authorised learning records…</p>}{error&&<p role="alert">{error}</p>}
    {!loading&&!error&&<>
    {teachingPlans.size>0&&<section className="my-4 rounded border p-4"><p>{pending.filter(a=>a.help_requested).length} help requests · {pending.length} attempts awaiting review</p><label><input type="checkbox" checked={helpOnly} onChange={e=>{setHelpOnly(e.target.checked);setPage(0);}}/> Show learners requesting help</label></section>}
    {roster.some(r=>r.can_teach&&r.student_id!==userId)&&<details className="border rounded p-4 my-4"><summary>Create or open a learner plan</summary><Action key={`create:${version}`} label="Create or open plan" name="create_tuition_learning_plan" saved={reload} payload={f=>{const r=roster.find(x=>`${x.module_id}:${x.student_id}`===f.get('learner')&&x.can_teach);if(!r)throw Error('Choose a learner');return {p_module:r.module_id,p_student:r.student_id,p_goal:f.get('goal')};}}>
      <label>Learner and course/class<select name="learner" required className={input}><option value="">Choose a learner</option>{roster.filter(r=>r.can_teach&&r.student_id!==userId).map(r=><option key={`${r.module_id}:${r.student_id}`} value={`${r.module_id}:${r.student_id}`}>{r.module_title} · {r.student_name}</option>)}</select></label><Text name="goal" label="Agreed learning goal" min={10} max={2000}/><p>Existing plans reopen without overwriting their goal.</p></Action></details>}
    <label>Find a plan<input className={input} value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/></label>
    {!filtered.length&&<p>No learning plans match. Your tutor can create a plan after enrolment.</p>}
    <div className="flex flex-wrap gap-2 my-3">{filtered.slice(page*20,page*20+20).map(p=><button className={button} key={p.id} aria-pressed={p.id===selected} onClick={()=>setSelected(p.id)}>{title(p)}</button>)}</div>
    {filtered.length>20&&<div className="flex gap-3"><button className={button} disabled={!page} onClick={()=>setPage(p=>p-1)}>Previous</button><span>{page+1} / {Math.ceil(filtered.length/20)}</span><button className={button} disabled={(page+1)*20>=filtered.length} onClick={()=>setPage(p=>p+1)}>Next</button></div>}
    {plan&&<section key={`${plan.id}:${version}`}><h2 className="text-xl font-semibold mt-6">{title(plan)}</h2><p className="whitespace-pre-wrap my-3">{plan.goal}</p><p>{ownTasks.filter(t=>latestAttempt(t.id,attempts)?.outcome==='independent').length} of {ownTasks.length} skills demonstrated independently on the latest attempt.</p>
      {!canTeach&&<p className="my-2">{next?`Suggested next activity: ${next.skill}`:'Your tutor will review pending work or set your next activity.'}</p>}
      {canTeach?<details className="border rounded p-4 my-4"><summary>Record diagnostic evidence and assign practice</summary><Action label="Assign practice" name="add_tuition_learning_task" saved={reload} payload={(f,id)=>({p_plan:plan.id,p_id:id,p_skill:f.get('skill'),p_baseline:f.get('baseline'),p_diagnostic:f.get('diagnostic'),p_instruction:f.get('instruction')})}>
        <Text name="skill" label="Skill / curriculum outcome" min={3} max={160}/><Outcome name="baseline" baseline/><Text name="diagnostic" label="Diagnostic evidence, date and observations"/><Text name="instruction" label="Practice instructions and evidence expected" max={6000}/></Action></details>:<Sharing plan={plan.id}/>}
      {ownTasks.map(t=>{const last=latestAttempt(t.id,attempts);return <article key={t.id} className="border rounded p-4 my-4"><h3 className="font-bold">{t.position}. {t.skill}</h3><p>Starting point: {labels[t.baseline]} · Latest: {last?.outcome?labels[last.outcome]:last?'Awaiting review':'No reviewed attempt'}</p><details className="my-3"><summary>Diagnostic evidence</summary><p className="whitespace-pre-wrap">{t.diagnostic_evidence}</p></details><p className="whitespace-pre-wrap my-3">{t.instruction}</p>
        {attempts.filter(a=>a.task_id===t.id).sort((a,b)=>b.submitted_at.localeCompare(a.submitted_at)||b.id.localeCompare(a.id)).map(a=><section className="border-t py-3" key={a.id}><p>{new Date(a.submitted_at).toLocaleString()}{a.help_requested?' · Help requested':''}</p><p className="whitespace-pre-wrap">{a.response||'Help requested before attempting this activity.'}</p>{a.outcome?<><strong>{labels[a.outcome]}</strong><p className="whitespace-pre-wrap">{a.feedback}</p></>:canTeach?<Action label="Confirm teaching review" name="review_tuition_learning_attempt" saved={reload} expected={a.id} payload={f=>({p_attempt:a.id,p_outcome:f.get('outcome'),p_feedback:f.get('feedback')})}><Outcome name="outcome"/><Text name="feedback" label="Evidence observed and next steps"/></Action>:<p>Awaiting tutor review</p>}</section>)}
        {!canTeach&&(!last||last.outcome)&&<Action label="Send work or request help" name="submit_tuition_learning_attempt" saved={reload} payload={(f,id)=>({p_task:t.id,p_id:id,p_response:f.get('response'),p_help:f.get('help')==='on'})}><label>Your working and explanation<textarea name="response" className={input} maxLength={12000}/></label><label><input type="checkbox" name="help"/> I need tutor help</label><p>Enter at least 10 characters or request help.</p></Action>}
      </article>;})}
    </section>}
    </>}
    </>}
  </>;
}
function Text({name,label,min=15,max=4000}:{name:string;label:string;min?:number;max?:number}){return <label className="block my-3">{label}<textarea className={input} name={name} required minLength={min} maxLength={max}/></label>;}
function Outcome({name,baseline=false}:{name:string;baseline?:boolean}){return <label className="block my-3">Observed understanding<select name={name} className={input}>{Object.entries(labels).filter(([k])=>baseline||k!=='not_assessed').map(([k,v])=><option value={k} key={k}>{v}</option>)}</select></label>;}
export function Action({children,name,payload,saved,label,expected}:{children:ReactNode;name:string;payload:(f:FormData,id:string)=>Record<string,unknown>;saved:()=>void;label:string;expected?:string}){
  const [id]=useState(()=>crypto.randomUUID()),[pending,setPending]=useState<Record<string,unknown>|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const alive=useRef(true),running=useRef(false);useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  return <form className="my-4" onSubmit={async e=>{e.preventDefault();if(running.current)return;let args;try{args=pending??payload(new FormData(e.currentTarget),id);}catch{setError('Choose valid details first.');return;}setPending(args);setBusy(true);setError('');running.current=true;
    try{const result=await rpc(name,args);if(!alive.current)return;const target=expected??(args.p_id as string|undefined);if(typeof result!=='string'||!/^[-a-f0-9]{36}$/i.test(result)||(target&&result!==target))throw Error('Unconfirmed receipt');saved();}
    catch{if(alive.current)setError('Save was not confirmed. Retry the unchanged request, or refresh to check the saved record.');}
    finally{running.current=false;if(alive.current)setBusy(false);}}}>
    <fieldset disabled={busy||!!pending}>{children}</fieldset><button className={button} disabled={busy} type="submit">{busy?'Saving…':pending?'Retry unchanged request':label}</button>{error&&<p role="alert">{error}</p>}
  </form>;
}
type Share={id:string;name:string;verified:boolean;shared:boolean};
function Sharing({plan}:{plan:string}){
 const [options,setOptions]=useState<Share[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false),[version,setVersion]=useState(0),[pending,setPending]=useState<{id:string;value:boolean}|null>(null);const live=useRef(true);
 useEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
 useEffect(()=>{let active=true;setLoading(true);setOptions([]);void rpc('get_tuition_learning_share_options',{p_plan:plan}).then(data=>{if(!Array.isArray(data)||data.some(x=>typeof x.id!=='string'||typeof x.shared!=='boolean'||typeof x.verified!=='boolean'))throw Error();if(active){setOptions(data);setPending(cur=>cur&&data.some(x=>x.id===cur.id&&x.shared===cur.value)?null:cur);}}).catch(()=>{if(active)setError('Sharing permissions could not be verified.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[plan,version]);
 async function change(id:string,value:boolean){if(busy)return;setPending({id,value});setBusy(true);setError('');try{const r=await rpc('set_tuition_learning_share',{p_plan:plan,p_link:id,p_share:value});if(!live.current)return;if(r!==value)throw Error();setPending(null);setVersion(v=>v+1);}catch{if(live.current)setError('Permission change was not confirmed. Retry the same choice or refresh.');}finally{if(live.current)setBusy(false);}}
 return <section className="border rounded p-4 my-4"><h3 className="font-semibold">Guardian progress sharing</h3><p>Share only this plan’s goal, skills and reviewed outcomes. Answers, diagnostic notes and feedback remain private. A verified guardian relationship must first be recorded by your platform operator.</p>{options.map(o=><label className="block my-2" key={o.id}><input type="checkbox" checked={o.shared} disabled={busy||!!pending||(!o.verified&&!o.shared)} onChange={e=>void change(o.id,e.target.checked)}/> {o.name}</label>)}{loading&&<p role="status">Loading sharing permissions…</p>}{!loading&&!options.length&&!error&&<p>No verified guardian links are available.</p>}{pending&&<button className={button} disabled={busy} onClick={()=>void change(pending.id,pending.value)}>Retry permission change</button>}<button className={button} disabled={busy} onClick={()=>{setError('');setVersion(v=>v+1);}}>Refresh permissions</button>{error&&<p role="alert">{error}</p>}</section>;
}
function Guardian(){const [data,setData]=useState<Array<{id:string;student_name:string;goal:string;skills:Array<{skill:string;outcome:string|null}>}>|null>(null),[error,setError]=useState('');useEffect(()=>{let live=true;void rpc('get_tuition_guardian_learning').then(r=>{if(!Array.isArray(r)||r.some(x=>typeof x.id!=='string'||typeof x.goal!=='string'||!Array.isArray(x.skills)))throw Error();if(live)setData(r);}).catch(()=>{if(live)setError('Shared progress could not be verified. Refresh to try again.');});return()=>{live=false;};},[]);return <section><h2 className="text-xl font-semibold">Shared learning progress</h2>{error?<p role="alert">{error}</p>:!data?<p role="status">Loading shared summaries…</p>:!data.length?<p>No learner has shared a verified plan with this account.</p>:data.map(p=><article className="border rounded p-4 my-4" key={p.id}><h3>{p.student_name}</h3><p>{p.goal}</p><ul>{p.skills.map((s,i)=><li key={i}>{s.skill}: {s.outcome?labels[s.outcome]:'Not yet reviewed'}</li>)}</ul></article>)}</section>;}
