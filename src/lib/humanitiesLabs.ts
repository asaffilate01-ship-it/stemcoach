/** Fictional, deterministic geography and research-methods exercises.
 * No geolocation, actual population data or psychological assessment. */
function integerIn(name:string,value:number,min:number,max:number) {
  if(!Number.isSafeInteger(value)||value<min||value>max)throw new RangeError(name+" outside model range");
}
export const mapScales=[10000,25000,50000,100000,250000] as const;
export function mapScaleModel(scale:number,distanceMm:number,areaCm2:number) {
  if(!mapScales.some(v=>v===scale))throw new RangeError("Unsupported map scale");
  integerIn("Map distance in millimetres",distanceMm,10,200);
  integerIn("Map area in square centimetres",areaCm2,1,100);
  const groundMetres=distanceMm*scale/1000;
  const groundAreaKm2=areaCm2*(scale/100000)**2;
  return {groundMetres,groundKm:groundMetres/1000,groundAreaKm2};
}
export function populationModel(start:number,births:number,deaths:number,arrivals:number,departures:number){
  integerIn("Initial population",start,10000,100000);
  for(const [label,n] of [["Births",births],["Deaths",deaths],["Arrivals",arrivals],["Departures",departures]] as const)integerIn(label,n,0,5000);
  const naturalChange=births-deaths,netMigration=arrivals-departures;
  const totalChange=naturalChange+netMigration;
  return {naturalChange,netMigration,totalChange,endingPopulation:start+totalChange,percentageChange:100*totalChange/start};
}
/** Two fictional 100-case groups, each split by baseline familiarity.
 * Fixed success rates are 20%/80% in A and 30%/90% in B.
 * Use multiples of ten to keep every synthetic count integral.
 * This is a demonstration of confounding, not an empirical causal estimate. */
export function confoundingModel(highA:number,highB:number){
  integerIn("Higher familiarity group A",highA,10,90);
  integerIn("Higher familiarity group B",highB,10,90);
  if(highA%10||highB%10)throw new RangeError("Use multiples of ten");
  const make=(high:number,lowRate:number,highRate:number)=>{
    const low=100-high;
    const lowSuccess=low*lowRate/100,highSuccess=high*highRate/100;
    return {low,high,lowSuccess,highSuccess,lowRate,highRate,overall:lowSuccess+highSuccess};
  };
  const a=make(highA,20,80),b=make(highB,30,90);
  return {a,b,overallDifference:b.overall-a.overall,withinLowDifference:b.lowRate-a.lowRate,withinHighDifference:b.highRate-a.highRate,reversal:b.overall<a.overall};
}
