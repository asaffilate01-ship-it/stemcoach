// Deterministic formative practice generator. No database writes or publication.
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, writeFile, rename, rm } from 'node:fs/promises';
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

 {id:'rectangle-area',track:'mathematics',topic:'Mensuration',make:(i)=>{const w=2+i%50,l=52+Math.floor(i/50),answer=w*l;return [`A rectangle is ${w} centimetres wide and ${l} centimetres long. Find its area in square centimetres.`,answer,`Area = width × length = ${w} × ${l} = ${answer} cm².`,[answer+1,answer-1,answer+2]]}},
 {id:'electric-charge',track:'physics',topic:'Electricity',make:(i)=>{const current=1+i%50,seconds=2+Math.floor(i/50),answer=current*seconds;return [`A constant current of ${current} amperes flows for ${seconds} seconds. Calculate the charge transferred in coulombs.`,answer,`Q = It = ${current} × ${seconds} = ${answer} C.`,[answer+1,answer-1,answer+2]]}},
 {id:'mass-concentration',track:'chemistry',topic:'Solutions',make:(i)=>{const volume=1+i%50,conc=1+Math.floor(i/50),mass=volume*conc;return [`A solution contains ${mass} grams of dissolved solute in ${volume} litres of solution. Find the mass concentration in grams per litre.`,conc,`Mass concentration is solute mass divided by solution volume: ${mass}/${volume}=${conc} g/L.`,[conc+1,conc-1,conc+2]]}},
 {id:'germination-rate',track:'biology',topic:'Plant biology',make:(i)=>{const total=100*(1+i%100),rate=20+Math.floor(i/100),germinated=total*rate/100;return [`Of ${total} seeds tested, ${germinated} germinated. Calculate the percentage germination.`,rate,`Percentage germination = ${germinated}/${total} × 100 = ${rate}%.`,[rate+1,rate-1,rate+2]]}},
 {id:'nested-loop-count',track:'coding',topic:'Iteration',make:(i)=>{const outer=1+i%50,inner=1+Math.floor(i/50),answer=outer*inner;return [`In Python, a loop runs ${outer} times and an inner loop runs ${inner} times for every outer iteration. How many times does a statement in the inner loop execute?`,answer,`Multiply the two iteration counts: ${outer} × ${inner} = ${answer}.`,[answer+1,answer-1,answer+2]]}},
 {id:'working-capital',track:'accounting',topic:'Liquidity',make:(i)=>{const liabilities=100*(1+i%50),working=100*(1+Math.floor(i/50)),assets=liabilities+working;return [`Current assets are ${assets} currency units and current liabilities are ${liabilities} currency units. Calculate net working capital in currency units.`,working,`Current assets minus current liabilities = ${assets} − ${liabilities} = ${working}.`,[working+100,working-100,working+200]]}},
 {id:'labour-productivity',track:'business-studies',topic:'Operations',make:(i)=>{const hours=1+i%50,rate=1+Math.floor(i/50),output=hours*rate;return [`A factory makes ${output} items in ${hours} total labour hours. Calculate output per labour hour.`,rate,`Labour productivity = output / total labour hours = ${output}/${hours} = ${rate}.`,[rate+1,rate-1,rate+2]]}},
 {id:'cloud-storage-cost',track:'cloud-computing',topic:'Storage pricing',make:(i)=>{const gb=1+i%100,rate=1+Math.floor(i/100),answer=gb*rate;return [`A storage service charges ${rate} minor currency units per gigabyte per month. A customer stores a constant ${gb} gigabytes for the month. Ignoring other charges, find the storage bill in minor currency units.`,answer,`Multiply stored gigabytes by the monthly unit price: ${gb} × ${rate} = ${answer}.`,[answer+1,answer-1,answer+2]]}},
 {id:'backup-recovery-gap',track:'cyber-security',topic:'Backup and recovery',make:(i)=>{const start=1+i%60,gap=1+Math.floor(i/60),end=start+gap;return [`A successful backup captures data at minute ${start} of a timeline. A failure occurs at minute ${end}; no newer copy exists. How many minutes separate the backup from the failure?`,gap,`Subtract the backup timestamp from the failure timestamp: ${end} − ${start} = ${gap} minutes.`,[gap+1,gap-1,gap+2]]}},
 {id:'nominal-output-value',track:'economics',topic:'Output valuation',make:(i)=>{const quantity=1+i%60,price=1+Math.floor(i/60),answer=quantity*price;return [`An economy produces ${quantity} units of a final good this period, each valued at ${price} currency units. Find the nominal value of this output in currency units.`,answer,`Value at current prices = quantity × price = ${quantity} × ${price} = ${answer}.`,[answer+1,answer-1,answer+2]]}},

 {id:'simultaneous-equations',track:'mathematics',topic:'Simultaneous equations',make:(i)=>{const y=1+i%80,d=1+Math.floor(i/80),x=y+d,sum=x+y;return [`Solve for x given x + y = ${sum} and x − y = ${d}.`,x,`Add the two equations to obtain 2x = ${sum+d}; divide by 2 to obtain x = ${x}.`,[x+1,x-1,x+2]]}},
 {id:'kinetic-energy',track:'physics',topic:'Kinetic energy',make:(i)=>{const m=2*(1+i%50),v=1+Math.floor(i/50),answer=m*v*v/2;return [`An object of mass ${m} kilograms moves at ${v} metres per second. Find its kinetic energy in joules using the classical formula.`,answer,`Kinetic energy is half the mass times speed squared: ${m} × ${v} × ${v} / 2 = ${answer} J.`,[answer+1,answer-1,answer+2]]}},
 {id:'percentage-yield',track:'chemistry',topic:'Reaction yield',make:(i)=>{const theoretical=100*(1+i%100),p=20+Math.floor(i/100),actual=theoretical*p/100;return [`A reaction has a theoretical product yield of ${theoretical} grams and produces ${actual} grams of that product. Calculate the percentage yield.`,p,`Divide actual yield by theoretical yield, then multiply by 100: ${actual}/${theoretical} × 100 = ${p}%.`,[p+1,p-1,p+2]]}},
 {id:'cardiac-output',track:'biology',topic:'Circulatory system',make:(i)=>{const stroke=40+i%60,rate=50+Math.floor(i/60),answer=stroke*rate;return [`In a physiological calculation, stroke volume is ${stroke} millilitres per beat and heart rate is ${rate} beats per minute. Find cardiac output in millilitres per minute.`,answer,`Multiply stroke volume by heart rate: ${stroke} × ${rate} = ${answer} mL/min.`,[answer+1,answer-1,answer+2]]}},
 {id:'classification-recall',track:'artificial-intelligence',topic:'Recall and sensitivity',make:(i)=>{const actual=100*(1+i%80),p=20+Math.floor(i/80),tp=actual*p/100;return [`A labelled evaluation set contains ${actual} actual positive cases. A classifier correctly identifies ${tp} of them as positive. Calculate positive-class recall as a percentage.`,p,`Recall equals true positives divided by actual positives, times 100: ${tp}/${actual} × 100 = ${p}%.`,[p+1,p-1,p+2]]}},
 {id:'python-slice-length',track:'coding',topic:'List slicing',make:(i)=>{const start=1+i%100,answer=1+Math.floor(i/100),stop=start+answer;return [`In Python, a list contains 200 elements. How many elements are returned by items[${start}:${stop}]?`,answer,`The start index is included and the stop index is excluded, so the length is ${stop} − ${start} = ${answer}.`,[answer+1,answer-1,answer+2]]}},
 {id:'gross-profit-margin',track:'accounting',topic:'Profitability ratios',make:(i)=>{const sales=100*(1+i%100),p=20+Math.floor(i/100),profit=sales*p/100;return [`Revenue is ${sales} currency units and gross profit is ${profit} currency units. Calculate gross profit margin as a percentage.`,p,`Gross profit margin equals gross profit divided by revenue times 100: ${profit}/${sales} × 100 = ${p}%.`,[p+1,p-1,p+2]]}},
 {id:'inventory-reorder-level',track:'business-studies',topic:'Inventory management',make:(i)=>{const daily=1+i%50,lead=1+Math.floor(i/50)%12,safety=10*(1+Math.floor(i/600)),answer=daily*lead+safety;return [`A shop sells ${daily} units per day at a constant rate. Replenishment takes ${lead} days, and its target safety stock is ${safety} units. Find the reorder level in units.`,answer,`Reorder level = expected lead-time demand + safety stock = ${daily} × ${lead} + ${safety} = ${answer}.`,[answer+1,answer-1,answer+2]]}},
 {id:'service-availability',track:'cyber-security',topic:'Resilience and availability',make:(i)=>{const total=100*(1+i%100),p=58+Math.floor(i/100),up=total*p/100;return [`A monitored service is observed for ${total} minutes and is available for ${up} of those minutes. Calculate its observed availability as a percentage.`,p,`Availability is available time divided by observed time, times 100: ${up}/${total} × 100 = ${p}%.`,[p+1,p-1,p+2]]}},
 {id:'replicated-storage',track:'cloud-computing',topic:'Storage replication',make:(i)=>{const gb=1+i%1000,copies=2+Math.floor(i/1000),answer=gb*copies;return [`A dataset occupies ${gb} gigabytes. A system stores ${copies} full copies in total, including the original. Ignoring compression and metadata, find total storage in gigabytes.`,answer,`Multiply dataset size by the total number of copies: ${gb} × ${copies} = ${answer} GB.`,[answer+1,answer-1,answer+2]]}},

 {id:'trapezium-area',track:'mathematics',topic:'Mensuration',make:(i)=>{const a=2+i%100,b=a+1+Math.floor(i/100)%10,h=2*(1+Math.floor(i/1000)),answer=(a+b)*h/2;return [`A trapezium has parallel sides of ${a} and ${b} centimetres and perpendicular height ${h} centimetres. Find its area in square centimetres.`,answer,`Area = half the sum of the parallel sides times perpendicular height: (${a}+${b}) × ${h}/2 = ${answer}.`,[answer*2,answer-1,answer+1]]}},
 {id:'specific-heat-energy',track:'physics',topic:'Thermal physics',make:(i)=>{const m=2+i%50,c=100*(1+Math.floor(i/1000)),t=2+Math.floor(i/50)%20,answer=m*c*t;return [`A substance of mass ${m} kilograms has specific heat capacity ${c} joules per kilogram per kelvin. Its temperature rises by ${t} kelvin without changing phase. Find the thermal energy gained in joules.`,answer,`Energy change = mass × specific heat capacity × temperature change = ${m} × ${c} × ${t} = ${answer}.`,[answer/2,answer*2,answer+c]]}},
 {id:'solution-dilution',track:'chemistry',topic:'Dilution',make:(i)=>{const v=10*(1+i%100),target=1+Math.floor(i/100)%10,factor=2+Math.floor(i/1000),c=target*factor,end=v*factor;return [`A solution of concentration ${c} grams per litre has volume ${v} millilitres. Water is added until the volume is ${end} millilitres, without losing solute. Calculate the final concentration in grams per litre.`,target,`Solute mass is conserved, so initial concentration × initial volume = final concentration × final volume. ${c} × ${v}/${end} = ${target}.`,[c,c+1,target+1===c?target-1:target+1]]}},
 {id:'trophic-energy-transfer',track:'biology',topic:'Food chains and energy',make:(i)=>{const e=10000*(1+i%100),p=10+Math.floor(i/100)%10,q=10+Math.floor(i/1000),answer=e*p*q/10000;return [`The first trophic level in a food chain contains ${e} kilojoules of energy. ${p}% is transferred to the second level and then ${q}% of that amount to the third. Find energy transferred to the third level in kilojoules.`,answer,`Apply the two transfer efficiencies successively: ${e} × ${p}/100 × ${q}/100 = ${answer}.`,[e*p/100,answer*2,answer+1]]}},
 {id:'python-range-count',track:'coding',topic:'Iteration and range',make:(i)=>{const start=1+i%100,step=2+Math.floor(i/100)%10,count=1+Math.floor(i/1000),stop=start+step*count-1;return [`How many values does Python range(${start}, ${stop}, ${step}) produce?`,count,`The stop is excluded. Starting at ${start}, adding ${step} until reaching or exceeding ${stop} produces ${count} values.`,[count+1,count-1,count+2]]}},
 {id:'classification-precision',track:'artificial-intelligence',topic:'Precision and false positives',make:(i)=>{const base=1+i%200,p=20+Math.floor(i/200),tp=base*p,fp=base*(100-p);return [`A classifier produces ${tp} true positives and ${fp} false positives. Calculate its positive-class precision as a percentage.`,p,`Precision = true positives / (true positives + false positives) × 100 = ${tp}/(${tp}+${fp}) × 100 = ${p}%.`,[p+1,p-1,p+2]]}},
 {id:'closing-cash-balance',track:'accounting',topic:'Cash flow',make:(i)=>{const opening=100*(1+i%100),receipts=50*(1+Math.floor(i/100)%10),payments=10*(1+Math.floor(i/1000)),answer=opening+receipts-payments;return [`Opening cash is ${opening} currency units, cash receipts are ${receipts} currency units and cash payments are ${payments} currency units. Calculate closing cash, assuming no other movements.`,answer,`Closing cash = opening cash + receipts − payments = ${opening}+${receipts}−${payments} = ${answer}.`,[opening+receipts,opening+receipts+payments,answer-10]]}},
 {id:'capacity-utilisation',track:'business-studies',topic:'Operations and capacity',make:(i)=>{const max=100*(1+i%200),p=20+Math.floor(i/200),actual=max*p/100;return [`A factory can produce ${max} units in a period and actually produces ${actual} units. Calculate capacity utilisation as a percentage.`,p,`Capacity utilisation = actual output / maximum output × 100 = ${actual}/${max} × 100 = ${p}%.`,[p+1,p-1,p+2]]}},
 {id:'trade-balance',track:'economics',topic:'International trade',make:(i)=>{const exports=100*(101+i%100),imports=100*(1+Math.floor(i/100)),answer=exports-imports;return [`A country's merchandise exports are worth ${exports} currency units and merchandise imports are worth ${imports} currency units. Calculate its merchandise trade balance in currency units.`,answer,`Merchandise trade balance = merchandise exports − merchandise imports = ${exports}−${imports} = ${answer}.`,[exports+imports,answer-100,answer+100]]}},
 {id:'purchase-invoice-total',track:'commerce',topic:'Invoices and delivery costs',make:(i)=>{const qty=1+i%100,price=10+Math.floor(i/100)%10,fee=1+Math.floor(i/1000),subtotal=qty*price,answer=subtotal+fee;return [`A retailer buys ${qty} items at ${price} currency units per item and pays a single delivery fee of ${fee} currency units. Ignoring taxes and discounts, find the total invoice amount in currency units.`,answer,`Multiply quantity by unit price and add the single delivery charge: ${qty} × ${price} + ${fee} = ${answer}.`,[subtotal,answer+fee,answer+fee+1]]}},

 {id:'compound-percentage',track:'mathematics',topic:'Successive percentage changes',make:(i)=>{const start=10000*(1+i%100),rise=1+Math.floor(i/100)%10,fall=1+Math.floor(i/1000),answer=start*(100+rise)*(100-fall)/10000;return [`A value of ${start} rises by ${rise}% and then falls by ${fall}% of its new value. What is the final value?`,answer,`Apply both multipliers in order: ${start} × (100+${rise})/100 × (100−${fall})/100 = ${answer}.`,[start*(100+rise-fall)/100,answer-1,answer-2]]}},
 {id:'gravitational-work',track:'physics',topic:'Work and gravitational energy',make:(i)=>{const m=1+i%100,h=1+Math.floor(i/100),answer=m*h*10;return [`A mass of ${m} kilograms is lifted vertically by ${h} metres. Take gravitational field strength as ${10} newtons per kilogram. Find the gain in gravitational potential energy in joules.`,answer,`Use mgh = ${m} × ${10} × ${h} = ${answer} J.`,[answer+1,answer-1,answer/10]]}},
 {id:'molar-concentration',track:'chemistry',topic:'Amount concentration',make:(i)=>{const v=1+i%100,c=1+Math.floor(i/100),n=v*c;return [`A solution contains ${n} moles of solute in a total solution volume of ${v} litres. Find the amount concentration in moles per litre.`,c,`Amount concentration = amount of solute / solution volume = ${n}/${v} = ${c} mol/L.`,[c+1,c-1,c+2]]}},
 {id:'population-growth',track:'biology',topic:'Population change',make:(i)=>{const start=1000+10*(i%100),births=1+Math.floor(i/100)%10,deaths=1+Math.floor(i/1000),answer=start+births-deaths;return [`An isolated animal population starts with ${start} individuals. During a survey period, ${births} individuals are born and ${deaths} die. Assuming no migration, what is the final population?`,answer,`Final population = starting population + births − deaths = ${start}+${births}−${deaths} = ${answer}.`,[start+births,answer-1,answer-2]]}},
 {id:'python-affine-loop',track:'coding',topic:'Accumulator variables',make:(i)=>{const start=1+i%100,step=1+Math.floor(i/100)%10,repeats=1+Math.floor(i/1000),answer=start+step*repeats;return [`A Python variable starts at ${start}. A loop adds ${step} to the variable on each of ${repeats} iterations. What is the final value?`,answer,`Multiply the increment by the number of iterations and add the starting value: ${start}+${step}×${repeats} = ${answer}.`,[answer+step,answer-step,answer+2*step]]}},
 {id:'classifier-error-count',track:'artificial-intelligence',topic:'Classification errors',make:(i)=>{const total=10000+100*(i%100),correct=100*(1+Math.floor(i/100)),answer=total-correct;return [`A classifier makes ${total} predictions, of which ${correct} are correct. Find the number of incorrect predictions.`,answer,`Incorrect predictions = all predictions − correct predictions = ${total}−${correct} = ${answer}.`,[answer+1,answer===0?answer+3:answer-1,answer+2]]}},
 {id:'operating-profit',track:'accounting',topic:'Income statements',make:(i)=>{const cost=100*(1+i%100),expense=10*(1+Math.floor(i/100)%10),profit=100*(1+Math.floor(i/1000)),sales=cost+expense+profit;return [`A business has revenue of ${sales}, cost of sales of ${cost}, and other operating expenses of ${expense}, all in currency units. Find operating profit assuming no other operating income or expenses.`,profit,`Operating profit = revenue − cost of sales − other operating expenses = ${sales}−${cost}−${expense} = ${profit}.`,[profit+expense,profit+cost+expense,profit-10]]}},
 {id:'contribution-total',track:'business-studies',topic:'Contribution and profit',make:(i)=>{const qty=10+i%100,cost=1+Math.floor(i/100)%10,margin=1+Math.floor(i/1000),price=cost+margin,answer=qty*margin;return [`A business sells ${qty} units at ${price} currency units per unit. Variable cost is ${cost} currency units per unit. Calculate total contribution before fixed costs.`,answer,`Contribution per unit = selling price − variable cost. Total contribution = ${qty} × (${price}−${cost}) = ${answer}.`,[qty*price,answer+1,answer-1]]}},
 {id:'network-throughput',track:'cloud-computing',topic:'Data transfer',make:(i)=>{const rate=1+i%100,seconds=1+Math.floor(i/100),answer=rate*seconds;return [`A cloud connection transfers ${rate} megabytes per second at a constant rate for ${seconds} seconds. Ignoring overhead, how many megabytes are transferred?`,answer,`Transferred data = transfer rate × elapsed time = ${rate} × ${seconds} = ${answer} MB.`,[answer+1,answer-1,answer+2]]}},
 {id:'security-training-coverage',track:'cyber-security',topic:'Security awareness',make:(i)=>{const total=100*(1+i%200),p=20+Math.floor(i/200),completed=total*p/100;return [`An organisation has ${total} employees and ${completed} have completed required security awareness training. Calculate the completion rate as a percentage.`,p,`Completion rate = employees who completed training / total employees × 100 = ${completed}/${total} × 100 = ${p}%.`,[p+1,p-1,p+2]]}},
];
const capacity={'linear-equation':9880,force:1225,'mass-number':100,'gross-profit':3600,'break-even':8000,'integer-division':2000,'percentage-discount':720,'average-power':2000,'population-density':1200,'amount-of-substance':1000,'integer-remainder':1200,'arithmetic-sequence':4000,'series-resistance':3600,'classification-accuracy':3000,'metered-cloud-cost':2400,'unit-purchase-cost':3000,'price-index-change':2000,'straight-line-depreciation':4000,'microscope-magnification':2000,'rectangle-area':5000,'electric-charge':5000,'mass-concentration':5000,'germination-rate':5000,'nested-loop-count':5000,'working-capital':5000,'labour-productivity':5000,'cloud-storage-cost':5000,'backup-recovery-gap':3000,'nominal-output-value':3000,'simultaneous-equations':4800,'kinetic-energy':5000,'percentage-yield':6000,'cardiac-output':6000,'classification-recall':4800,'python-slice-length':5000,'gross-profit-margin':6000,'inventory-reorder-level':6000,'service-availability':4000,'replicated-storage':5000,'trapezium-area':10000,'specific-heat-energy':10000,'solution-dilution':10000,'trophic-energy-transfer':10000,'python-range-count':10000,'classification-precision':10000,'closing-cash-balance':10000,'capacity-utilisation':10000,'trade-balance':10000,'purchase-invoice-total':10000,'compound-percentage':10000,'gravitational-work':10000,'molar-concentration':10000,'population-growth':10000,'python-affine-loop':10000,'classifier-error-count':10000,'operating-profit':10000,'contribution-total':10000,'network-throughput':10000,'security-training-coverage':10000};
const hash=s=>createHash('sha256').update(s).digest('hex');
export function getDraftFamilyCatalog() {
 return families.map(({id,track,topic})=>({id,track,topic,capacity:capacity[id]}));
}
// Metadata only: lets operators identify coverage gaps without generating answers.
export function getDraftCoverage(limitPerFamily=10000,selectedFamilyIds){
 assertLimit(limitPerFamily);
 const tracks=new Map();
 let total=0;
 const selected=selectFamilies(selectedFamilyIds);
 for(const f of selected){
  const count=Math.min(limitPerFamily,capacity[f.id]);
  const row=tracks.get(f.track)??{track:f.track,families:0,variants:0};
  row.families++;row.variants+=count;total+=count;
  tracks.set(f.track,row);
 }
 return {familyCount:selected.length,trackCount:tracks.size,totalVariants:total,tracks:[...tracks.values()],approvedQuestions:0,publishedQuestions:0};
}
// Use a private temporary directory and atomic rename to avoid half-written review packs.
async function writePrivatePack(output,pack){
 const dir='content/generated';
 await mkdir(dir,{recursive:true,mode:0o700});
 const temp=await mkdtemp(dir+'/.review-');
 try{
  const staged=temp+'/pack.json';
  await writeFile(staged,JSON.stringify(pack,null,2)+'\n',{mode:0o600,flag:'wx'});
  await rename(staged,output);
 }finally{
  await rm(temp,{recursive:true,force:true});
 }
}
function selectFamilies(selectedFamilyIds) {
 if(selectedFamilyIds!==undefined && (!Array.isArray(selectedFamilyIds)||!selectedFamilyIds.length||new Set(selectedFamilyIds).size!==selectedFamilyIds.length||Array.from(selectedFamilyIds).some(id=>typeof id!=='string'||!Object.hasOwn(capacity,id))))throw Error('Select unique known family IDs');
 const selection=selectedFamilyIds===undefined?null:new Set(selectedFamilyIds);
 return families.filter(f=>!selection||selection.has(f.id));
}
function makeItem(f,i){
 const [text,answer,explanation,wrong]=f.make(i);
 const fingerprint=hash(text.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim());
 const options=wrong.map(String);options.splice(i%4,0,String(answer));
 if(new Set(options).size!==4||!options.includes(String(answer)))throw Error('Invalid choices');
 return {id:'variant-'+fingerprint.slice(0,24),fingerprint,family:f.id,track:f.track,topic:f.topic,text,options,correctAnswer:String(answer),explanation,type:'mcq',language:'en',candidateMarkets:['PK','GB','DE'],status:'draft',curriculumOutcome:null,boards:[],variant:true,countsTowardApprovedTarget:false};
}
function assertLimit(limitPerFamily){
 if(!Number.isSafeInteger(limitPerFamily)||limitPerFamily<1)throw Error('Positive integer limit required');
}
function addItem(items,seen,f,i){
 const item=makeItem(f,i);
 if(seen.has(item.fingerprint))throw Error('Duplicate stem in family '+f.id+' at index '+i);
 seen.add(item.fingerprint);
 items.push(item);
}
export function generateDrafts(limitPerFamily=100, selectedFamilyIds) {
 assertLimit(limitPerFamily);
 const seen=new Set(), items=[];
 for(const f of selectFamilies(selectedFamilyIds))for(let i=0;i<Math.min(limitPerFamily,capacity[f.id]);i++){
  addItem(items,seen,f,i);
 }
 return items;
}
// Bounded private review pages: skip unrelated families and construct only requested items.
export function generateDraftPage({limitPerFamily=100,selectedFamilyIds,offset=0,pageSize=100}={}){
 assertLimit(limitPerFamily);
 if(!Number.isSafeInteger(offset)||offset<0)throw Error('Nonnegative integer offset required');
 if(!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>1000)throw Error('Page size must be 1–1000');
 const selected=selectFamilies(selectedFamilyIds);
 const total=selected.reduce((sum,f)=>sum+Math.min(limitPerFamily,capacity[f.id]),0);
 const items=[],seen=new Set();
 let remainingOffset=offset;
 for(const f of selected){
  const count=Math.min(limitPerFamily,capacity[f.id]);
  if(remainingOffset>=count){remainingOffset-=count;continue;}
  const end=Math.min(count,remainingOffset+pageSize-items.length);
  for(let i=remainingOffset;i<end;i++)addItem(items,seen,f,i);
  remainingOffset=0;
  if(items.length===pageSize)break;
 }
 return {items,total,offset,nextOffset:offset+items.length<total?offset+items.length:null};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv[2]==='--list' && process.argv.length===3){
  const catalogue=getDraftFamilyCatalog();
  console.log(JSON.stringify({families:catalogue,capacity:catalogue.reduce((sum,f)=>sum+f.capacity,0)},null,2));
 }else if(process.argv[2]==='--coverage'){
  const args=process.argv.slice(3);
  if(args.length && !/^\d+$/.test(args[0]))throw Error('Usage: --coverage [LIMIT_PER_FAMILY [FAMILY_ID ...]]');
  console.log(JSON.stringify(getDraftCoverage(args.length?Number(args[0]):10000,args.length>1?args.slice(1):undefined),null,2));
 }else if(process.argv[2]==='--page'){
  const args=process.argv.slice(3);
  if(args.length<3||args.slice(0,3).some(v=>!/^\d+$/.test(v)))throw Error('Usage: --page OFFSET SIZE LIMIT_PER_FAMILY [FAMILY_ID ...]');
  const [offset,pageSize,limitPerFamily]=args.slice(0,3).map(Number);
  const selectedFamilyIds=args.length>3?args.slice(3):undefined;
  const page=generateDraftPage({offset,pageSize,limitPerFamily,selectedFamilyIds});
  const familyIds=selectFamilies(selectedFamilyIds).map(f=>f.id);
  const batchKey=hash(JSON.stringify({familyIds,limitPerFamily,offset,pageSize})).slice(0,20);
  const output='content/generated/formative-review-page-'+batchKey+'.json';
  await writePrivatePack(output,{schemaVersion:1,status:'draft',count:page.items.length,total:page.total,offset:page.offset,nextOffset:page.nextOffset,items:page.items});
  console.log(JSON.stringify({draftVariants:page.items.length,total:page.total,offset:page.offset,nextOffset:page.nextOffset,approvedQuestions:0,familyIds,output}));
 }else{
  const selected=process.argv.slice(3);
  const limitPerFamily=Number(process.argv[2]??100);
  const items=generateDrafts(limitPerFamily,selected.length?selected:undefined);
  const familyIds=getDraftFamilyCatalog().filter(f=>!selected.length||selected.includes(f.id)).map(f=>f.id);
  const filename=selected.length?'formative-variants-'+hash(JSON.stringify({familyIds,limitPerFamily})).slice(0,12)+'.json':'formative-variants.json';
  await writePrivatePack('content/generated/'+filename,{schemaVersion:1,status:'draft',count:items.length,items});
  console.log(JSON.stringify({draftVariants:items.length,approvedQuestions:0,familyIds,output:'content/generated/'+filename}));
 }
}
