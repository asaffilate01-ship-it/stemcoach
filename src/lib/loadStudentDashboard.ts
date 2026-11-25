import { supabase } from "@/integrations/supabase/client";
import { DASHBOARD_ATTEMPT_LIMIT, summariseDashboardProgress, validStudentStats, type QuestionMetadata, type StudentStats } from "./dashboardProgress";

/** Account-filtered reads only; server RLS remains authoritative. Never fetch answer keys. */
export async function loadStudentDashboard(accountId:string){
  const [statsRes,attemptsRes,badgesRes]=await Promise.all([
    supabase.from("user_stats").select("user_id,total_questions,correct_answers,streak,xp").eq("user_id",accountId).maybeSingle(),
    supabase.from("attempts").select("id,user_id,correct,created_at,question_id").eq("user_id",accountId).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(DASHBOARD_ATTEMPT_LIMIT),
    supabase.from("user_badges").select("id,user_id,earned_at,badges(name,icon)").eq("user_id",accountId).order("earned_at",{ascending:false}).limit(12),
  ]);
  if(statsRes.error||attemptsRes.error||badgesRes.error||!Array.isArray(attemptsRes.data)||!Array.isArray(badgesRes.data))throw new Error("Dashboard data unavailable");
  if(statsRes.data&&(statsRes.data.user_id!==accountId||!validStudentStats(statsRes.data)))throw new Error("Invalid dashboard totals");
  if(attemptsRes.data.some(row=>row.user_id!==accountId)||badgesRes.data.some(row=>row.user_id!==accountId))throw new Error("Dashboard account mismatch");
  const attempts=attemptsRes.data;
  const qIds=[...new Set(attempts.map(a=>a.question_id))];
  const metadata:QuestionMetadata[]=[];
  let metadataError=false;
  const chunks=Array.from({length:Math.ceil(qIds.length/100)},(_,i)=>qIds.slice(i*100,(i+1)*100));
  await Promise.all(chunks.map(async ids=>{
    try{
      const result=await supabase.from("questions_safe").select("id,subject,topic").in("id",ids);
      if(result.error||!Array.isArray(result.data))throw new Error("Metadata unavailable");
      const allowed=new Set(ids);
      metadata.push(...result.data.filter(row=>row.id&&allowed.has(row.id)));
    }catch{metadataError=true;}
  }));
  const stats:StudentStats|null=statsRes.data?{total_questions:statsRes.data.total_questions,correct_answers:statsRes.data.correct_answers,streak:statsRes.data.streak,xp:statsRes.data.xp}:null;
  return {stats,badges:badgesRes.data,metadataError,...summariseDashboardProgress(attempts,metadata)};
}
