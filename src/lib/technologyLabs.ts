/** Deterministic classroom models, with no network traffic or real accounts. */
function integerIn(name:string,n:number,min:number,max:number){
  if(!Number.isSafeInteger(n)||n<min||n>max)throw new RangeError(name+" outside model range");
}
export function subnetModel(prefix:number,requiredHosts:number){
  integerIn("Prefix",prefix,24,30);
  integerIn("Host requirement",requiredHosts,1,254);
  const totalAddresses=2**(32-prefix);
  const usableHosts=totalAddresses-2;
  return {totalAddresses,usableHosts,remainingHosts:Math.max(0,usableHosts-requiredHosts),shortfall:Math.max(0,requiredHosts-usableHosts),fits:requiredHosts<=usableHosts};
}
/** Identical healthy instances and a fixed, synthetic capacity per instance.
 * Capacity is not a latency or availability prediction. */
export function cloudCapacityModel(instances:number,capacity:number,demand:number,failed:number){
  integerIn("Instances",instances,1,20);
  integerIn("Capacity",capacity,50,500);
  integerIn("Demand",demand,0,10000);
  integerIn("Failed instances",failed,0,instances);
  const healthy=instances-failed,available=healthy*capacity;
  return {healthy,available,served:Math.min(available,demand),unserved:Math.max(0,demand-available),headroom:Math.max(0,available-demand),
    demandToCapacity:available===0?null:100*demand/available,
    requiredHealthyInstances:Math.ceil(demand/capacity),
    survivesOneMoreFailure:Math.max(0,healthy-1)*capacity>=demand};
}

export const policyRoles=["learner","teacher","reviewer"] as const;
export const policyActions=["readOwnProgress","readClassProgress","submitReview","publishQuestion"] as const;
export type PolicyRole=typeof policyRoles[number];
export type PolicyAction=typeof policyActions[number];
const permissions:Record<PolicyRole,readonly PolicyAction[]>={
  learner:["readOwnProgress"],teacher:["readOwnProgress","readClassProgress"],reviewer:["submitReview"],
};
export type PolicyDecision="allowed"|"deniedScope"|"deniedRole"|"deniedMfa";
export function policyModel(role:PolicyRole,action:PolicyAction,inScope:boolean,mfa:boolean):PolicyDecision{
  if(!policyRoles.includes(role)||!policyActions.includes(action)||typeof inScope!=="boolean"||typeof mfa!=="boolean")throw new RangeError("Invalid fictional policy input");
  if(!inScope)return "deniedScope";
  if(!permissions[role].includes(action))return "deniedRole";
  if(action==="submitReview"&&!mfa)return "deniedMfa";
  return "allowed";
}
