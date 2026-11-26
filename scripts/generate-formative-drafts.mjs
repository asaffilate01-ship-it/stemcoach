// Deterministic formative practice generator. No database writes or publication.
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const families = [
 {id:'linear-equation',track:'mathematics',topic:'Algebra',make:(i)=>{const a=2+i%19,x=1+Math.floor(i/19)%40,b=1+Math.floor(i/760)%13;return [`Solve ${a}x + ${b} = ${a*x+b}.`,x,`Subtract ${b}, then divide by ${a}.`,[x+1,x-1,x+2]]}},
 {id:'force',track:'physics',topic:'Mechanics',make:(i)=>{const m=2+i%49,a=2+Math.floor(i/49)%25;return [`An object of mass ${m} kg accelerates at ${a} m/s². Calculate its net force in N.`,m*a,`F = ma = ${m} × ${a} N.`,[m*a+1,m*a-1,m*a+2]]}},
 {id:'mass-number',track:'chemistry',topic:'Atomic structure',make:(i)=>{const p=1+i%20,n=p+Math.floor(i/20)%5;return [`A hypothetical nucleus contains ${p} protons and ${n} neutrons. Calculate its nucleon number.`,p+n,`Add the proton and neutron counts: ${p} + ${n}.`,[p+n+1,p+n-1,p+n+2]]}},
 {id:'gross-profit',track:'accounting',topic:'Gross profit',make:(i)=>{const c=100+10*(i%90),p=10+10*(Math.floor(i/90)%40);return [`Revenue is ${c+p} currency units and cost of goods sold is ${c}. Calculate gross profit in currency units.`,p,`Revenue minus cost of goods sold = ${c+p} − ${c}.`,[p+10,p-10,p+20]]}},
 {id:'break-even',track:'business-studies',topic:'Break-even',make:(i)=>{const c=2+i%20,v=3+Math.floor(i/20)%20,q=10+Math.floor(i/400)%20;return [`Fixed costs are ${q*c}, selling price per unit is ${v+c} and variable cost per unit is ${v}, all in currency units. Find break-even output in units.`,q,`Contribution per unit is ${c}; divide fixed costs ${q*c} by ${c}.`,[q+1,q-1,q+2]]}},
 {id:'integer-division',track:'coding',topic:'Python arithmetic',make:(i)=>{const d=2+i%20,q=1+Math.floor(i/20)%50,r=Math.floor(i/1000);return [`Evaluate the Python expression ${q*d+r} // ${d}.`,q,`Floor division returns the integer quotient, ${q}.`,[q+1,q-1,q+2]]}},

 {id:'percentage-discount',track:'mathematics',topic:'Percentages',make:(i)=>{const price=10*(2+i%80),discount=10*(1+Math.floor(i/80)),answer=price*(100-discount)/100;return [`An item costs ${price} currency units and is discounted by ${discount}%. Find the new price in currency units.`,answer,`Multiply ${price} by (${100-discount}/100) to obtain ${answer}.`,[answer+1,answer-1,answer+2]]}},
 {id:'average-power',track:'physics',topic:'Energy and power',make:(i)=>{const t=2+i%40,p=2+Math.floor(i/40);return [`A device transfers ${t*p} joules in ${t} seconds. Calculate its average power in watts.`,p,`Power equals energy divided by time: ${t*p} / ${t} = ${p} W.`,[p+1,p-1,p+2]]}},
 {id:'population-density',track:'biology',topic:'Ecology',make:(i)=>{const area=1+i%30,density=2+Math.floor(i/30);return [`A survey counts ${area*density} plants in a plot of ${area} square metres. Calculate the observed density in plants per square metre.`,density,`Divide the plant count by the area: ${area*density} / ${area} = ${density}.`,[density+1,density-1,density+2]]}},
 {id:'amount-of-substance',track:'chemistry',topic:'Moles',make:(i)=>{const molar=10+i%25,n=1+Math.floor(i/25);return [`A pure substance has mass ${molar*n} grams and molar mass ${molar} grams per mole. Calculate the amount in moles.`,n,`Amount equals mass divided by molar mass: ${molar*n} / ${molar} = ${n} mol.`,[n+1,n-1,n+2]]}},
 {id:'integer-remainder',track:'coding',topic:'Python arithmetic',make:(i)=>{const d=5+i%20,q=1+Math.floor(i/20)%30,remainder=1+Math.floor(i/600);return [`Evaluate the Python expression ${q*d+remainder} % ${d}.`,remainder,`The modulo operator returns the remainder after division: ${q*d+remainder} = ${q} × ${d} + ${remainder}.`,[remainder-1,remainder+1,remainder+2]]}},

 {id:'arithmetic-sequence',track:'mathematics',topic:'Sequences',make:(i)=>{const first=2+i%50,step=1+Math.floor(i/50)%8,n=2+Math.floor(i/400),answer=first+(n-1)*step;return [`An arithmetic sequence has first term ${first} and common difference ${step}. Find term number ${n}.`,answer,`Use a+(n−1)d: ${first}+(${n}−1)×${step}=${answer}.`,[answer+step,answer-step,answer+2*step]]}},
 {id:'series-resistance',track:'physics',topic:'Electrical circuits',make:(i)=>{const a=1+i%60,b=61+Math.floor(i/60),answer=a+b;return [`Resistors of ${a} ohms and ${b} ohms are connected in series. Find their total resistance in ohms.`,answer,`Series resistances add: ${a}+${b}=${answer} ohms.`,[answer+1,answer-1,answer+2]]}},
 {id:'classification-accuracy',track:'artificial-intelligence',topic:'Model evaluation',make:(i)=>{const total=100*(1+i%60),percent=40+Math.floor(i/60),correct=total*percent/100;return [`A classifier predicts ${correct} labels correctly out of ${total} predictions. What is its accuracy as a percentage?`,percent,`Accuracy equals correct predictions divided by total predictions, multiplied by 100: ${correct}/${total}×100=${percent}%.`,[percent+1,percent-1,percent+2]]}},
 {id:'metered-cloud-cost',track:'cloud-computing',topic:'Usage-based billing',make:(i)=>{const rate=1+i%60,hours=1+Math.floor(i/60),answer=rate*hours;return [`A cloud instance costs ${rate} minor currency units per hour and runs for ${hours} whole hours. Ignoring all other charges, find its total cost in minor currency units.`,answer,`Multiply the hourly charge by usage: ${rate}×${hours}=${answer}.`,[answer+1,answer-1,answer+2]]}},
 {id:'unit-purchase-cost',track:'commerce',topic:'Purchasing',make:(i)=>{const quantity=2+i%60,price=1+Math.floor(i/60),total=quantity*price;return [`A retailer pays ${total} currency units for ${quantity} identical items. Excluding other costs, find the purchase price per item in currency units.`,price,`Divide total purchase cost by quantity: ${total}/${quantity}=${price}.`,[price+1,price-1,price+2]]}},
 {id:'price-index-change',track:'economics',topic:'Inflation and price indices',make:(i)=>{const initial=100*(1+i%40),percent=1+Math.floor(i/40),next=initial*(100+percent)/100;return [`A price index rises from ${initial} to ${next}. What is the percentage increase relative to its initial value?`,percent,`Percentage increase = (${next}−${initial})/${initial}×100=${percent}%.`,[percent+1,percent-1,percent+2]]}},
 {id:'straight-line-depreciation',track:'accounting',topic:'Non-current assets',make:(i)=>{const life=2+i%20,residual=100*(1+Math.floor(i/20)%10),annual=100*(1+Math.floor(i/200)),cost=residual+annual*life;return [`An asset costs ${cost} currency units, has residual value ${residual}, and useful life ${life} years. Calculate annual straight-line depreciation in currency units.`,annual,`Subtract residual value and divide by useful life: (${cost}−${residual})/${life}=${annual}.`,[annual+100,annual-100,annual+200]]}},
 {id:'microscope-magnification',track:'biology',topic:'Microscopy',make:(i)=>{const actual=10*(1+i%50),answer=100*(1+Math.floor(i/50)),image=actual*answer/1000;return [`An image measures ${image} millimetres and the actual specimen measures ${actual} micrometres. Calculate the magnification factor.`,answer,`Convert the image to micrometres, then divide by actual size: ${image}×1000/${actual}=${answer}.`,[answer+100,answer-50,answer+50]]}},
];
const capacity={'linear-equation':9880,force:1225,'mass-number':100,'gross-profit':3600,'break-even':8000,'integer-division':2000,'percentage-discount':720,'average-power':2000,'population-density':1200,'amount-of-substance':1000,'integer-remainder':1200,'arithmetic-sequence':4000,'series-resistance':3600,'classification-accuracy':3000,'metered-cloud-cost':2400,'unit-purchase-cost':3000,'price-index-change':2000,'straight-line-depreciation':4000,'microscope-magnification':2000};
const hash=s=>createHash('sha256').update(s).digest('hex');
export function getDraftFamilyCatalog() {
 return families.map(({id,track,topic})=>({id,track,topic,capacity:capacity[id]}));
}
export function generateDrafts(limitPerFamily=100, selectedFamilyIds) {
 if(!Number.isSafeInteger(limitPerFamily)||limitPerFamily<1)throw Error('Positive integer limit required');
 if(selectedFamilyIds!==undefined && (!Array.isArray(selectedFamilyIds)||!selectedFamilyIds.length||new Set(selectedFamilyIds).size!==selectedFamilyIds.length||selectedFamilyIds.some(id=>typeof id!=='string'||!Object.hasOwn(capacity,id))))throw Error('Select unique known family IDs');
 const selection=selectedFamilyIds===undefined?null:new Set(selectedFamilyIds);
 const seen=new Set(), items=[];
 for(const f of families.filter(f=>!selection||selection.has(f.id)))for(let i=0;i<Math.min(limitPerFamily,capacity[f.id]);i++){
  const [text,answer,explanation,wrong]=f.make(i);
  const fingerprint=hash(text.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim());
  if(seen.has(fingerprint))throw Error('Duplicate stem in family '+f.id+' at index '+i);
  seen.add(fingerprint);
  const options=wrong.map(String);options.splice(i%4,0,String(answer));
  if(new Set(options).size!==4||!options.includes(String(answer)))throw Error('Invalid choices');
  items.push({id:'variant-'+fingerprint.slice(0,24),fingerprint,family:f.id,track:f.track,topic:f.topic,text,options,correctAnswer:String(answer),explanation,type:'mcq',language:'en',candidateMarkets:['PK','GB','DE'],status:'draft',curriculumOutcome:null,boards:[],variant:true,countsTowardApprovedTarget:false});
 }
 return items;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const items=generateDrafts(Number(process.argv[2]??100));
 await mkdir('content/generated',{recursive:true});
 await writeFile('content/generated/formative-variants.json',JSON.stringify({schemaVersion:1,status:'draft',count:items.length,items},null,2)+'\n');
 console.log(JSON.stringify({draftVariants:items.length,approvedQuestions:0}));
}
