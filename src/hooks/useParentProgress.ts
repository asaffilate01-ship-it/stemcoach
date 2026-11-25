import {useCallback,useEffect,useState} from "react";
import {loadApprovedChildren,loadChildSummary} from "@/lib/parentProgress";

type Snapshot<T>={key:string;attempt:number;data:T;error:false}|{key:string;attempt:number;data:null;error:true};
function useScopedRead<T>(key:string|null,read:()=>Promise<T>){
  const [snapshot,setSnapshot]=useState<Snapshot<T>|null>(null);
  const [attempt,setAttempt]=useState(0);
  const retry=useCallback(()=>setAttempt(n=>n+1),[]);
  useEffect(()=>{
    if(!key)return;
    let active=true;
    void read().then(data=>{if(active)setSnapshot({key,attempt,data,error:false});}).catch(()=>{if(active)setSnapshot({key,attempt,data:null,error:true});});
    return()=>{active=false;};
  },[key,attempt,read]);
  const current=key&&snapshot?.key===key&&snapshot.attempt===attempt?snapshot:null;
  return {data:current?.data??null,error:current?.error??false,loading:Boolean(key&&!current),retry};
}
export function useApprovedChildren(accountId:string|undefined){
  const read=useCallback(()=>loadApprovedChildren(accountId!),[accountId]);
  return useScopedRead(accountId??null,read);
}
export function useChildSummary(accountId:string|undefined,childId:string|null){
  const read=useCallback(()=>loadChildSummary(accountId!,childId!),[accountId,childId]);
  return useScopedRead(accountId&&childId?JSON.stringify([accountId,childId]):null,read);
}
