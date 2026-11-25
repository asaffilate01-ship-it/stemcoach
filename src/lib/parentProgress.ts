import {supabase} from "@/integrations/supabase/client";
import {validStudentStats} from "./dashboardProgress";

export type LinkedChild={id:string;name:string};
export const PARENT_LINK_LIMIT=50;
export type ChildSummary={
  stats:{total_questions:number;correct_answers:number;streak:number;xp:number;level:number;longest_streak:number;perfect_scores:number;last_active_date:string|null}|null;
  badges:number|null;certificates:number|null;
};
export function recordedAccuracy(stats:ChildSummary["stats"]):number|null{
  return stats&&validStudentStats(stats)&&stats.total_questions>0?Math.round(100*stats.correct_answers/stats.total_questions):null;
}
function checkedCount(result:{count:number|null;error:unknown}):number|null{
  return !result.error&&Number.isSafeInteger(result.count)&&result.count!>=0?result.count:null;
}
export async function loadApprovedChildren(accountId:string){
  const links=await supabase.from("parent_links").select("parent_id,child_id,status").eq("parent_id",accountId).eq("status","approved").order("child_id").limit(PARENT_LINK_LIMIT+1);
  if(links.error||!Array.isArray(links.data)||links.data.some(l=>l.parent_id!==accountId||l.status!=="approved"||!l.child_id))throw new Error("Approved links unavailable");
  const capped=links.data.length>PARENT_LINK_LIMIT;
  const ids=[...new Set(links.data.map(l=>l.child_id))].slice(0,PARENT_LINK_LIMIT);
  if(!ids.length)return {children:[] as LinkedChild[],capped:false,namesUnavailable:false};
  const names=await supabase.rpc("get_display_names",{_user_ids:ids});
  const map=new Map((!names.error&&Array.isArray(names.data)?names.data:[]).filter(r=>ids.includes(r.user_id)).map(r=>[r.user_id,r.display_name]));
  return {children:ids.map(id=>({id,name:map.get(id)||""})),capped,namesUnavailable:Boolean(names.error)||map.size!==ids.length};
}
async function verifyLink(accountId:string,childId:string){
  const link=await supabase.from("parent_links").select("parent_id,child_id,status").eq("parent_id",accountId).eq("child_id",childId).eq("status","approved").maybeSingle();
  if(link.error||!link.data||link.data.parent_id!==accountId||link.data.child_id!==childId||link.data.status!=="approved")throw new Error("Child link not verified");
}
export async function loadChildSummary(accountId:string,childId:string):Promise<ChildSummary>{
  await verifyLink(accountId,childId);
  const [stats,badges,certificates]=await Promise.all([
    supabase.from("user_stats").select("user_id,total_questions,correct_answers,streak,xp,level,longest_streak,perfect_scores,last_active_date").eq("user_id",childId).maybeSingle(),
    supabase.from("user_badges").select("id",{count:"exact",head:true}).eq("user_id",childId),
    supabase.from("certificates").select("id",{count:"exact",head:true}).eq("user_id",childId),
  ]);
  await verifyLink(accountId,childId);
  if(stats.data&&stats.data.user_id!==childId)throw new Error("Summary account mismatch");
  const row=stats.data;
  const valid=!stats.error&&row&&validStudentStats(row)&&[row.level,row.longest_streak,row.perfect_scores].every(v=>Number.isSafeInteger(v)&&v>=0);
  return {stats:valid?row:null,badges:checkedCount(badges),certificates:checkedCount(certificates)};
}
