import { readFileSync, lstatSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_ORIGINALS = 20000;
const MAX_POSTING_HITS = 2000000;
const MAX_FILE_BYTES = 64 * 1024 * 1024;
const MAX_FLAGS = 200;
const words = stem => stem.normalize("NFKC").toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];
const numericShape = tokens => tokens.map(token => /^\p{N}+$/u.test(token) ? "#" : token);
const trigrams = tokens => new Set(tokens.slice(0,-2).map((_,i)=>tokens.slice(i,i+3).join("\u0001")));

// Editorial screening only. Similarity is not proof of plagiarism or academic quality.
// Only authored originals participate; generated variants are deliberately excluded.
export function auditOriginalSimilarity(batches,{threshold=0.72}={}){
 if(typeof threshold!=="number" || !Number.isFinite(threshold) || threshold<0.5 || threshold>1)throw Error("Threshold must be between 0.5 and 1");
 const groups=new Map(), flags=[];
 let checkedOriginals=0,excludedVariants=0,flagCount=0,postingHits=0,comparedPairs=0,batchIndex=0;
 const flag=(a,b,kind,similarity)=>{
  flagCount++;
  if(flags.length<MAX_FLAGS)flags.push({left:a.ref,right:b.ref,kind,similarity:Number(similarity.toFixed(4))});
 };
 for(const batch of batches){
  if(!batch || batch.schemaVersion!==1 || !Array.isArray(batch.items))throw Error("Invalid draft batch");
  if(batch.count!==undefined && batch.count!==batch.items.length)throw Error("Draft batch count mismatch");
  for(const [row,item] of batch.items.entries()){
   if(!item || typeof item!=="object" || item.status!=="draft" || item.approved===true || item.published===true ||
      (item.variant!==undefined && typeof item.variant!=="boolean"))throw Error("Expected draft records");
   if(item.variant===true){excludedVariants++;continue;}
   if(typeof item.text!=="string" || item.text.length>8000 ||
      typeof item.track!=="string" || !item.track || item.track.length>80 ||
      typeof item.language!=="string" || !item.language || item.language.length>20)throw Error("Invalid original question metadata");
   const tokens=words(item.text);
   if(!tokens.length || tokens.length>1000)throw Error("Invalid question stem token count");
   if(++checkedOriginals>MAX_ORIGINALS)throw Error("Audit exceeds original question limit; narrow the review scope");
   const normalized=tokens.join("\u0001");
   const shape=numericShape(tokens);
   const shaped=shape.join("\u0001");
   const grams=trigrams(shape);
   const ref={batch:batchIndex+1,row:row+1};
   const key=JSON.stringify([item.track,item.language]);
   let group=groups.get(key);
   if(!group){group={records:[],postings:new Map(),exact:new Map(),shape:new Map()};groups.set(key,group);}
   const current={ref,normalized,shaped,grams};
   const candidates=new Map();
   const add=(index,count=0)=>{
    if(++postingHits>MAX_POSTING_HITS)throw Error("Similarity comparison budget exceeded; narrow the review scope");
    candidates.set(index,(candidates.get(index)??0)+count);
   };
   for(const index of group.exact.get(normalized)??[])add(index);
   if(tokens.length>=5)for(const index of group.shape.get(shaped)??[])add(index);
   for(const gram of grams)for(const index of group.postings.get(gram)??[])add(index,1);
   for(const [index,overlap] of candidates){
    const prev=group.records[index];
    comparedPairs++;
    if(prev.normalized===normalized){flag(prev,current,"normalized-stem",1);continue;}
    if(tokens.length>=5 && prev.shaped===shaped){flag(prev,current,"numeric-template",1);continue;}
    const union=prev.grams.size+grams.size-overlap;
    const similarity=union===0?0:overlap/union;
    if(grams.size>=3 && prev.grams.size>=3 && similarity>=threshold)flag(prev,current,"similar-stem",similarity);
   }
   const index=group.records.length;
   group.records.push(current);
   const indexInto=(map,k)=>{const list=map.get(k)??[];list.push(index);map.set(k,list);};
   indexInto(group.exact,normalized);
   if(tokens.length>=5)indexInto(group.shape,shaped);
   for(const gram of grams)indexInto(group.postings,gram);
  }
  batchIndex++;
 }
 return {schemaVersion:1,kind:"original-similarity-audit",checkedOriginals,excludedVariants,comparedPairs,threshold,flagCount,flags,truncated:flagCount>flags.length,requiresHumanReview:true,approvedQuestions:0};
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=process.argv.slice(2);
  let threshold=0.72;
  if(args[0]==="--threshold"){threshold=Number(args[1]);args.splice(0,2);}
  if(!args.length)throw Error("Supply private original question batch paths");
  function* batches(){
   for(const path of args){
    const stat=lstatSync(path);
    if(!stat.isFile() || stat.size>MAX_FILE_BYTES)throw Error("Invalid private file");
    yield JSON.parse(readFileSync(path,"utf8"));
   }
  }
  const report=auditOriginalSimilarity(batches(),{threshold});
  console.log(JSON.stringify(report,null,2));
  // A finding is a request for review, not an academic rejection.
  if(report.flagCount)process.exitCode=2;
 }catch{
  console.error("Unable to complete private similarity audit.");
  process.exitCode=1;
 }
}
