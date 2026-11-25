import {describe,expect,it} from "vitest";
import {LAB_CATALOGUE,filterLabCatalogue,parseLabSelection} from "@/lib/labCatalogue";

const entries=LAB_CATALOGUE.map(item=>({...item,title:item.id,subjectLabel:item.subject}));

describe("lab catalogue discovery",()=>{
  it("retains every existing simulation with a unique known id",()=>{
    expect(LAB_CATALOGUE).toHaveLength(22);
    expect(new Set(LAB_CATALOGUE.map(lab=>lab.id)).size).toBe(22);
    for(const lab of LAB_CATALOGUE)expect(parseLabSelection(lab.id)).toBe(lab.id);
    for(const value of [null,undefined,"",42,"CIRCUIT","../../admin","https://example.com","__proto__"])expect(parseLabSelection(value)).toBe("circuit");
  });
  it("filters all twenty-two entries by stable subject groups",()=>{
    expect(filterLabCatalogue(entries,"all","")).toHaveLength(22);
    expect(filterLabCatalogue(entries,"science","").map(x=>x.id)).toEqual(["circuit","motion","dilution","inheritance","buoyancy","thermalEnergy"]);
    expect(filterLabCatalogue(entries,"maths","").map(x=>x.id)).toEqual(["quadratic","statistics"]);
    expect(filterLabCatalogue(entries,"technology","")).toHaveLength(5);
    expect(filterLabCatalogue(entries,"business","")).toHaveLength(5);
    expect(filterLabCatalogue(entries,"humanities","").map(x=>x.id)).toEqual(["mapScale","population","confounding","closeReading"]);
  });
  it("matches case-insensitive topic words and German diacritics",()=>{
    expect(filterLabCatalogue(entries,"technology","AI confusion").map(x=>x.id)).toEqual(["classifier"]);
    expect(filterLabCatalogue(entries,"science","VERDUNNUNG").map(x=>x.id)).toEqual(["dilution"]);
    expect(filterLabCatalogue(entries,"maths","ausreißer").map(x=>x.id)).toEqual(["statistics"]);
    expect(filterLabCatalogue(entries,"business","cash flow").map(x=>x.id)).toEqual(["cashAccrual"]);
    expect(filterLabCatalogue(entries,"science","cash flow")).toEqual([]);
    expect(filterLabCatalogue(entries,"all","not-a-laboratory")).toEqual([]);
  });
});
