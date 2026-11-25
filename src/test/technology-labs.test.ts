import {describe,expect,it} from "vitest";
import {subnetModel,cloudCapacityModel,policyModel,policyRoles,policyActions} from "@/lib/technologyLabs";

describe("technology teaching models",()=>{
  it("checks conventional IPv4 capacity across all seven prefix sizes",()=>{
    for(let prefix=24;prefix<=30;prefix++){
      const total=2**(32-prefix),usable=total-2;
      expect(subnetModel(prefix,usable)).toEqual({totalAddresses:total,usableHosts:usable,remainingHosts:0,shortfall:0,fits:true});
      if(usable<254)expect(subnetModel(prefix,usable+1).shortfall).toBe(1);
    }
    expect(subnetModel(27,50)).toMatchObject({usableHosts:30,shortfall:20,fits:false});
    expect(subnetModel(26,50).remainingHosts).toBe(12);
  });
  it("accounts for failed capacity, unmet demand and zero capacity",()=>{
    expect(cloudCapacityModel(4,100,250,1)).toMatchObject({healthy:3,available:300,served:250,unserved:0,headroom:50,requiredHealthyInstances:3,survivesOneMoreFailure:false});
    expect(cloudCapacityModel(5,100,250,1).survivesOneMoreFailure).toBe(true);
    expect(cloudCapacityModel(4,100,250,4)).toMatchObject({available:0,served:0,unserved:250,demandToCapacity:null});
    expect(cloudCapacityModel(1,50,0,1).unserved).toBe(0);
    expect(cloudCapacityModel(2,100,300,0).demandToCapacity).toBe(150);
    for(let i=1;i<=20;i++)for(let f=0;f<=i;f++){
      const m=cloudCapacityModel(i,100,777,f);
      expect(m.served+m.unserved).toBe(777);
      expect(m.served+m.headroom).toBe(m.available);
    }
  });
  it("denies cross-scope and unpublished access under every example role",()=>{
    for(const r of policyRoles)for(const a of policyActions){
      expect(policyModel(r,a,false,true)).toBe("deniedScope");
      if(a==="publishQuestion")expect(policyModel(r,a,true,true)).toBe("deniedRole");
    }
    expect(policyModel("learner","readOwnProgress",true,false)).toBe("allowed");
    expect(policyModel("learner","readClassProgress",true,true)).toBe("deniedRole");
    expect(policyModel("teacher","readClassProgress",true,false)).toBe("allowed");
    expect(policyModel("reviewer","submitReview",true,false)).toBe("deniedMfa");
    expect(policyModel("reviewer","submitReview",true,true)).toBe("allowed");
  });
  it("rejects unsupported or invalid model inputs",()=>{
    expect(()=>subnetModel(31,2)).toThrow();
    expect(()=>subnetModel(26,NaN)).toThrow();
    expect(()=>cloudCapacityModel(2,100,100,3)).toThrow();
    expect(()=>cloudCapacityModel(0,100,100,0)).toThrow();
    expect(()=>cloudCapacityModel(2,100,1.5,0)).toThrow();
    expect(()=>policyModel("admin" as "learner","publishQuestion",true,true)).toThrow();
  });
});
