import { useCallback, useEffect, useState } from "react";
import { loadStudentDashboard } from "@/lib/loadStudentDashboard";

type Snapshot={accountId:string;attempt:number;status:"ready";data:Awaited<ReturnType<typeof loadStudentDashboard>>}|{accountId:string;attempt:number;status:"error"};

export function useStudentDashboard(accountId:string|undefined){
  const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[attempt,setAttempt]=useState(0);
  const retry=useCallback(()=>setAttempt(n=>n+1),[]);
  useEffect(()=>{
    if(!accountId){setSnapshot(null);return;}
    let active=true;
    void loadStudentDashboard(accountId).then(data=>{
      if(active)setSnapshot({accountId,attempt,status:"ready",data});
    }).catch(()=>{
      if(active)setSnapshot({accountId,attempt,status:"error"});
    });
    return ()=>{active=false;};
  },[accountId,attempt]);
  const current=accountId&&snapshot?.accountId===accountId&&snapshot.attempt===attempt?snapshot:null;
  return {data:current?.status==="ready"?current.data:null,loading:!current,error:current?.status==="error",retry};
}
