// Deterministic formative practice generator. No database writes or publication.
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const families = [
 {id:'linear-equation',track:'mathematics',topic:'Algebra',make:(i)=>{const a=2+i%19,x=1+Math.floor(i/19)%40,b=1+Math.floor(i/760)%13;return [`Solve ${a}x + ${b} = ${a*x+b}.`,x,`Subtract ${b}, then divide by ${a}.`,[x+1,x-1,x+2]]}},
 {id:'force',track:'physics',topic:'Mechanics',make:(i)=>{const m=2+i%49,a=2+Math.floor(i/49)%25;return [`An object of mass ${m} kg accelerates at ${a} m/s². Calculate its net force in N.`,m*a,`F = ma = ${m} × ${a} N.`,[m*a+1,m*a-1,m*a+2]]}},
 {id:'mass-number',track:'chemistry',topic:'Atomic structure',make:(i)=>{const p=1+i%20,n=p+Math.floor(i/20)%5;return [`A hypothetical nucleus contains ${p} protons and ${n} neutrons. Calculate its nucleon number.`,p+n,`Add the proton and neutron counts: ${p} + ${n}.`,[p+n+1,p+n-1,p+n+2]]}},
 {id:'gross-profit',track:'accounting',topic:'Gross profit',make:(i)=>{const c=100+10*(i%90),p=10+10*(Math.floor(i/90)%40);return [`Revenue is ${c+p} currency units and cost of goods sold is ${c}. Calculate gross profit in currency units.`,p,`Revenue minus cost of goods sold = ${c+p} − ${c}.`,[p+10,p-10,p+20]]}},
 {id:'break-even',track:'business-studies',topic:'Break-even',make:(i)=>{const c=2+i%20,v=3+Math.floor(i/20)%20,q=10+Math.floor(i/400)%20;return [`Fixed costs are ${q*c}, selling price per unit is ${v+c} and variable cost per unit is ${v}, all in currency units. Find break-even output in units.`,q,`Contribution per unit is ${c}; divide fixed costs ${q*c} by ${c}.`,[q+1,q-1,q+2]]}},
 {id:'integer-division',track:'coding',topic:'Python arithmetic',make:(i)=>{const d=2+i%20,q=1+Math.floor(i/20)%50,r=1+Math.floor(i/1000)%(d-1);return [`Evaluate the Python expression ${q*d+r} // ${d}.`,q,`Floor division returns the integer quotient, ${q}.`,[q+1,q-1,q+2]]}},
];
const capacity={'linear-equation':9880,force:1225,'mass-number':100,'gross-profit':3600,'break-even':8000,'integer-division':2000};
const hash=s=>createHash('sha256').update(s).digest('hex');
export function generateDrafts(limitPerFamily=100) {
 if(!Number.isSafeInteger(limitPerFamily)||limitPerFamily<1)throw Error('Positive integer limit required');
 const seen=new Set(), items=[];
 for(const f of families)for(let i=0;i<Math.min(limitPerFamily,capacity[f.id]);i++){
  const [text,answer,explanation,wrong]=f.make(i);
  const fingerprint=hash(text.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim());
  if(seen.has(fingerprint))throw Error('Duplicate stem: '+text);
  seen.add(fingerprint);
  const options=wrong.map(String);options.splice(i%4,0,String(answer));
  if(new Set(options).size!==4||!options.includes(String(answer)))throw Error('Invalid choices');
  items.push({id:'variant-'+fingerprint.slice(0,24),fingerprint,family:f.id,track:f.track,topic:f.topic,text,options,correctAnswer:String(answer),explanation,type:'mcq',language:'en',candidateMarkets:['PK','GB','DE'],status:'draft',curriculumOutcome:null,boards:[],variant:true,countsTowardApprovedTarget:false});
 }
 return items;
}
if(process.argv[1] && resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
 const items=generateDrafts(Number(process.argv[2]??100));
 await mkdir('content/generated',{recursive:true});
 await writeFile('content/generated/formative-variants.json',JSON.stringify({schemaVersion:1,status:'draft',count:items.length,items},null,2)+'\n');
 console.log(JSON.stringify({draftVariants:items.length,approvedQuestions:0}));
}
