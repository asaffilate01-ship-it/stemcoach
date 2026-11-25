/** Idealised teaching calculations. No physical experiment or safety instructions. */
function boundedInteger(label:string,n:number,min:number,max:number){
  if(!Number.isSafeInteger(n)||n<min||n>max)throw new RangeError(label+" outside model range");
}
/** Uniform solid object, water of density 1 g/cm³, g = 9.81 m/s².
 * Floating equilibrium ignores surface tension, trapped air and container boundaries. */
export function buoyancyModel(massGrams:number,volumeCm3:number){
  boundedInteger("Mass",massGrams,50,2000);
  boundedInteger("Volume",volumeCm3,100,2000);
  const density=massGrams/volumeCm3;
  const state=massGrams<volumeCm3?"floats":massGrams===volumeCm3?"neutral":"sinks";
  const displacedCm3=Math.min(massGrams,volumeCm3);
  return {density,state,displacedCm3,submergedPercent:100*displacedCm3/volumeCm3,weight:massGrams*9.81/1000,buoyantForce:displacedCm3*9.81/1000};
}
export const materialHeatCapacity={water:4180,aluminium:900,iron:450} as const;
export type HeatMaterial=keyof typeof materialHeatCapacity;
/** Approximate constant heat capacities; no heat loss or phase change. */
export function thermalEnergyModel(material:HeatMaterial,massGrams:number,temperatureRise:number){
  if(!Object.prototype.hasOwnProperty.call(materialHeatCapacity,material))throw new RangeError("Unknown material");
  boundedInteger("Mass",massGrams,100,2000);
  boundedInteger("Temperature change",temperatureRise,0,40);
  const specificHeat=materialHeatCapacity[material],energyJ=massGrams*specificHeat*temperatureRise/1000;
  return {specificHeat,energyJ,energyKJ:energyJ/1000};
}
