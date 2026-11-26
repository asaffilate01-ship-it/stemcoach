import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateDrafts, getDraftFamilyCatalog, generateDraftPage, getDraftCoverage } from "./generate-formative-drafts.mjs";
import { validateBatches } from "./validate-private-content.mjs";

test("full generator capacity stays unique, draft-only and structurally valid", () => {
  const items = generateDrafts(10000);
  assert.equal(items.length, 253525);
  const report = validateBatches([{ schemaVersion: 1, items }]);
  assert.equal(report.valid, true, report.errors.slice(0, 4).join("; "));
  assert.equal(report.stats.variants, 253525);
  assert.equal(report.stats.originals, 0);
  assert.equal(report.approvedCount, 0);
  assert.equal(report.publishedCount, 0);
});

function* allDraftItems() {
  for(const family of getDraftFamilyCatalog())yield* generateDrafts(family.capacity,[family.id]);
}

test("independent arithmetic checks across every generated question", () => {
  for (const item of allDraftItems()) {
    const nums = item.text.match(/\d+/g).map(Number);
    let expected;
    switch (item.family) {
      case "linear-equation": expected = (nums[2] - nums[1]) / nums[0]; break;
      case "force": expected = nums[0] * nums[1]; break;
      case "mass-number": expected = nums[0] + nums[1]; break;
      case "gross-profit": expected = nums[0] - nums[1]; break;
      case "break-even": expected = nums[0] / (nums[1] - nums[2]); break;
      case "integer-division": expected = Math.floor(nums[0] / nums[1]); break;
      case "percentage-discount": expected = nums[0] - nums[0] * nums[1] / 100; break;
      case "average-power": expected = nums[0] / nums[1]; break;
      case "population-density": expected = nums[0] / nums[1]; break;
      case "amount-of-substance": expected = nums[0] / nums[1]; break;
      case "integer-remainder": expected = nums[0] % nums[1]; break;
      case "arithmetic-sequence": expected = nums[0] + (nums[2]-1)*nums[1]; break;
      case "series-resistance": expected = nums[0]+nums[1]; break;
      case "classification-accuracy": expected = nums[0]*100/nums[1]; break;
      case "metered-cloud-cost": expected = nums[0]*nums[1]; break;
      case "unit-purchase-cost": expected = nums[0]/nums[1]; break;
      case "price-index-change": expected = (nums[1]-nums[0])*100/nums[0]; break;
      case "straight-line-depreciation": expected = (nums[0]-nums[1])/nums[2]; break;
      case "microscope-magnification": expected = nums[0]*1000/nums[1]; break;
      case "rectangle-area": expected = nums[0]*nums[1]; break;
      case "electric-charge": expected = nums[0]*nums[1]; break;
      case "mass-concentration": expected = nums[0]/nums[1]; break;
      case "germination-rate": expected = nums[1]*100/nums[0]; break;
      case "nested-loop-count": expected = nums[0]*nums[1]; break;
      case "working-capital": expected = nums[0]-nums[1]; break;
      case "labour-productivity": expected = nums[0]/nums[1]; break;
      case "cloud-storage-cost": expected = nums[0]*nums[1]; break;
      case "backup-recovery-gap": expected = nums[1]-nums[0]; break;
      case "nominal-output-value": expected = nums[0]*nums[1]; break;
      case "simultaneous-equations": expected = (nums[0]+nums[1])/2; break;
      case "kinetic-energy": expected = nums[0]*nums[1]**2/2; break;
      case "percentage-yield": expected = nums[1]*100/nums[0]; break;
      case "cardiac-output": expected = nums[0]*nums[1]; break;
      case "classification-recall": expected = nums[1]*100/nums[0]; break;
      case "python-slice-length": expected = nums[2]-nums[1]; break;
      case "gross-profit-margin": expected = nums[1]*100/nums[0]; break;
      case "inventory-reorder-level": expected = nums[0]*nums[1]+nums[2]; break;
      case "service-availability": expected = nums[1]*100/nums[0]; break;
      case "replicated-storage": expected = nums[0]*nums[1]; break;
      case "trapezium-area": expected = (nums[0]+nums[1])*nums[2]/2; break;
      case "specific-heat-energy": expected = nums[0]*nums[1]*nums[2]; break;
      case "solution-dilution": expected = nums[0]*nums[1]/nums[2]; break;
      case "trophic-energy-transfer": expected = nums[0]*nums[1]*nums[2]/10000; break;
      case "python-range-count": expected = Math.ceil((nums[1]-nums[0])/nums[2]); break;
      case "classification-precision": expected = nums[0]*100/(nums[0]+nums[1]); break;
      case "closing-cash-balance": expected = nums[0]+nums[1]-nums[2]; break;
      case "capacity-utilisation": expected = nums[1]*100/nums[0]; break;
      case "trade-balance": expected = nums[0]-nums[1]; break;
      case "purchase-invoice-total": expected = nums[0]*nums[1]+nums[2]; break;
      default: assert.fail("Unknown family");
    }
    assert.equal(Number(item.correctAnswer), expected, item.id);
  }
});

test("rejects duplicate, non-draft and malformed items without leaking stems", () => {
  const item = generateDrafts(1)[0];
  const report = validateBatches([{ schemaVersion: 1, items: [
    item, {...item, id: "duplicate"}, {...item, id: "other", text: "Synthetic fixture", status: "published"},
  ] }]);
  assert.equal(report.valid, false);
  assert.ok(report.errors.some(e => e.includes("duplicate normalised stem")));
  assert.ok(report.errors.some(e => e.includes("only draft")));
  assert.ok(report.errors.every(e => !e.includes(item.text)));
});

test("new families are bounded and deterministic with no approved-credit inflation", () => {
  for (const [family, count] of Object.entries({
    "percentage-discount": 720, "average-power": 2000, "population-density": 1200,
    "amount-of-substance": 1000, "integer-remainder": 1200, "arithmetic-sequence": 4000, "series-resistance": 3600,
    "classification-accuracy": 3000, "metered-cloud-cost": 2400, "unit-purchase-cost": 3000,
    "price-index-change": 2000, "straight-line-depreciation": 4000, "microscope-magnification": 2000,
    "rectangle-area": 5000, "electric-charge": 5000, "mass-concentration": 5000,
    "germination-rate": 5000, "nested-loop-count": 5000, "working-capital": 5000,
    "labour-productivity": 5000, "cloud-storage-cost": 5000,
    "backup-recovery-gap": 3000, "nominal-output-value": 3000,
    "simultaneous-equations": 4800, "kinetic-energy": 5000, "percentage-yield": 6000,
    "cardiac-output": 6000, "classification-recall": 4800, "python-slice-length": 5000,
    "gross-profit-margin": 6000, "inventory-reorder-level": 6000, "service-availability": 4000,
    "replicated-storage": 5000,
    "trapezium-area": 10000, "specific-heat-energy": 10000, "solution-dilution": 10000,
    "trophic-energy-transfer": 10000, "python-range-count": 10000, "classification-precision": 10000,
    "closing-cash-balance": 10000, "capacity-utilisation": 10000, "trade-balance": 10000,
    "purchase-invoice-total": 10000
  })) {
    const items = generateDrafts(10000,[family]);
    assert.equal(items.length, count, family);
    assert.ok(items.every(item => item.status === "draft" && item.countsTowardApprovedTarget === false));
  }
  assert.deepEqual(generateDrafts(3), generateDrafts(3));
  assert.equal(generateDrafts(1).length, 49);
  assert.throws(() => generateDrafts(0));
});

test("catalogue reports exact capacity and returns independent metadata", () => {
  const catalogue = getDraftFamilyCatalog();
  assert.equal(catalogue.length, 49);
  assert.equal(new Set(catalogue.map(f => f.id)).size, 49);
  assert.equal(catalogue.reduce((sum, f) => sum+f.capacity, 0), 253525);
  assert.equal(new Set(catalogue.map(f => f.track)).size, 12);
  catalogue[0].capacity = 0;
  assert.equal(getDraftFamilyCatalog()[0].capacity, 9880);
});

test("selective generation preserves stable IDs and canonical ordering", () => {
  const selected = ["microscope-magnification", "arithmetic-sequence"];
  const baseline = generateDrafts(5).filter(item => selected.includes(item.family));
  assert.deepEqual(generateDrafts(5, selected), baseline);
  assert.equal(generateDrafts(10000, ["series-resistance"]).length, 3600);
  for (const value of [[], null, "force", ["force","force"], ["missing"], ["__proto__"], [1], Array(1)]) {
    assert.throws(() => generateDrafts(3, value), /unique known family IDs/);
  }
});

test("classification choices remain physically valid percentages", () => {
  for (const item of generateDrafts(10000, ["classification-accuracy"])) {
    assert.ok(item.options.every(o => Number(o)>=0 && Number(o)<=100));
  }
});

test("CLI lists metadata and writes selected drafts separately from the default export", () => {
  const cwd = mkdtempSync(join(tmpdir(), "stemcoach-drafts-"));
  const script = fileURLToPath(new URL("./generate-formative-drafts.mjs", import.meta.url));
  const run = (...args) => JSON.parse(execFileSync(process.execPath, [script, ...args], {cwd, encoding: "utf8"}));
  try {
    const catalogue = run("--list");
    assert.equal(catalogue.capacity, 253525);
    assert.equal(catalogue.families.length, 49);
    const original = run("2");
    const selected = run("2", "force", "arithmetic-sequence");
    const reordered = run("2", "arithmetic-sequence", "force");
    assert.equal(original.output, "content/generated/formative-variants.json");
    assert.notEqual(selected.output, original.output);
    assert.equal(selected.output, reordered.output);
    assert.equal(selected.draftVariants, 4);
    assert.equal(selected.approvedQuestions, 0);
    const pack = JSON.parse(readFileSync(join(cwd, selected.output), "utf8"));
    assert.deepEqual(pack.items, generateDrafts(2, ["force", "arithmetic-sequence"]));
    const full = JSON.parse(readFileSync(join(cwd, original.output), "utf8"));
    assert.equal(full.items.length, 98);
  } finally {
    rmSync(cwd, {recursive: true, force: true});
  }
});

test("new percentage and positive-quantity choices stay in valid bounds", () => {
  const percent = generateDrafts(10000, ["germination-rate"]);
  assert.ok(percent.every(q => q.options.every(o => Number(o)>=0 && Number(o)<=100)));
  const selected = generateDrafts(10000, ["rectangle-area","electric-charge","nominal-output-value"]);
  assert.ok(selected.every(q => q.options.every(o => Number.isSafeInteger(Number(o)) && Number(o)>=0)));
});

test("review pages match full generation across family boundaries and preserve identifiers", () => {
  const selectedFamilyIds = ["force","rectangle-area","backup-recovery-gap"];
  const full = generateDrafts(9, selectedFamilyIds);
  let offset = 0;
  const collected = [];
  do {
    const page = generateDraftPage({limitPerFamily:9,selectedFamilyIds,offset,pageSize:7});
    assert.equal(page.total,27);
    assert.ok(page.items.length<=7);
    assert.equal(page.offset,offset);
    collected.push(...page.items);
    offset = page.nextOffset;
  } while(offset!==null);
  assert.deepEqual(collected,full);
  assert.deepEqual(generateDraftPage({limitPerFamily:9,selectedFamilyIds,offset:27}),{items:[],total:27,offset:27,nextOffset:null});
  assert.deepEqual(generateDraftPage({limitPerFamily:9,selectedFamilyIds,offset:99}),{items:[],total:27,offset:99,nextOffset:null});
});

test("late-page access is bounded and reports accurate capacity", () => {
  const p = generateDraftPage({limitPerFamily:10000,offset:253520,pageSize:100});
  assert.equal(p.total,253525);
  assert.equal(p.items.length,5);
  assert.equal(p.nextOffset,null);
  assert.ok(p.items.every(q=>q.family==="purchase-invoice-total"));
  assert.deepEqual(p.items,generateDrafts(10000,["purchase-invoice-total"]).slice(-5));
  for(const pageSize of [0,-1,1001,1.5,Infinity])assert.throws(()=>generateDraftPage({pageSize}),/Page size/);
  for(const offset of [-1,0.5,Infinity])assert.throws(()=>generateDraftPage({offset}),/offset/);
  assert.throws(()=>generateDraftPage({selectedFamilyIds:["unknown"]}),/unique known/);
  assert.throws(()=>generateDraftPage({limitPerFamily:0}),/Positive integer/);
});

test("applied percentage questions and distractors stay within 0–100%", () => {
  const selected = ["percentage-yield","classification-recall","gross-profit-margin","service-availability"];
  const items = generateDrafts(10000, selected);
  assert.equal(items.length,20800);
  assert.ok(items.every(q=>q.options.every(o=>Number.isInteger(Number(o)) && Number(o)>=0 && Number(o)<=100)));
});

test("operator CLI exports stable bounded pages separately, including the last page", () => {
  const cwd = mkdtempSync(join(tmpdir(), "stemcoach-review-page-"));
  const script = fileURLToPath(new URL("./generate-formative-drafts.mjs", import.meta.url));
  const run = (...args) => JSON.parse(execFileSync(process.execPath, [script, ...args], {cwd,encoding:"utf8"}));
  try {
    const a=run("--page","3","5","6","force","replicated-storage");
    const b=run("--page","3","5","6","replicated-storage","force");
    assert.equal(a.output,b.output);
    assert.equal(a.total,12);
    assert.equal(a.nextOffset,8);
    assert.equal(a.draftVariants,5);
    assert.equal(a.approvedQuestions,0);
    const saved=JSON.parse(readFileSync(join(cwd,a.output),"utf8"));
    assert.equal(saved.status,"draft");
    assert.deepEqual(saved.items,generateDrafts(6,["force","replicated-storage"]).slice(3,8));
    const last=run("--page","8","5","6","force","replicated-storage");
    assert.notEqual(last.output,a.output);
    assert.equal(last.draftVariants,4);
    assert.equal(last.nextOffset,null);
    assert.deepEqual(JSON.parse(readFileSync(join(cwd,last.output),"utf8")).items,generateDrafts(6,["force","replicated-storage"]).slice(8));
    const full=run("6","force","replicated-storage");
    assert.notEqual(full.output,last.output);
    const empty=run("--page","12","5","6","force","replicated-storage");
    assert.equal(empty.draftVariants,0);
    assert.equal(empty.nextOffset,null);
    assert.throws(()=>execFileSync(process.execPath,[script,"--page","-1","5","6"],{cwd,stdio:"pipe"}));
    assert.throws(()=>execFileSync(process.execPath,[script,"--page","0","1001","6"],{cwd,stdio:"pipe"}));
  }finally{rmSync(cwd,{recursive:true,force:true});}
});

test("new multi-step options are finite and distinct, with bounded percentage options", () => {
  for(const id of ["trapezium-area","specific-heat-energy","solution-dilution","trophic-energy-transfer","python-range-count","classification-precision","closing-cash-balance","capacity-utilisation","trade-balance","purchase-invoice-total"]){
    const items=generateDrafts(10000,[id]);
    assert.equal(items.length,10000);
    for(const q of items){
      assert.equal(new Set(q.options).size,4);
      assert.ok(q.options.every(o=>Number.isSafeInteger(Number(o))&&Number(o)>=0));
      if(id==="classification-precision"||id==="capacity-utilisation")assert.ok(q.options.every(o=>Number(o)<=100));
    }
  }
});

test("coverage reports capped family counts and contains no private content", () => {
  const report=getDraftCoverage();
  assert.equal(report.totalVariants,253525);
  assert.equal(report.familyCount,49);
  assert.equal(report.trackCount,12);
  assert.equal(report.approvedQuestions,0);
  assert.equal(report.publishedQuestions,0);
  assert.equal(report.tracks.reduce((sum,t)=>sum+t.variants,0),report.totalVariants);
  assert.deepEqual(getDraftCoverage(5,["trapezium-area","linear-equation","specific-heat-energy"]),{
    familyCount:3,trackCount:2,totalVariants:15,
    tracks:[{track:"mathematics",families:2,variants:10},{track:"physics",families:1,variants:5}],
    approvedQuestions:0,publishedQuestions:0
  });
  assert.throws(()=>getDraftCoverage(0),/Positive integer/);
  assert.throws(()=>getDraftCoverage(5,["missing"]),/unique known/);
  assert.ok(!JSON.stringify(report).includes("correctAnswer"));
});

test("selected exports with different limits are isolated and private",()=>{
  const cwd=mkdtempSync(join(tmpdir(),"stemcoach-private-export-"));
  const script=fileURLToPath(new URL("./generate-formative-drafts.mjs",import.meta.url));
  const run=(...args)=>JSON.parse(execFileSync(process.execPath,[script,...args],{cwd,encoding:"utf8"}));
  try{
    assert.deepEqual(run("--coverage","5","trapezium-area","specific-heat-energy"),getDraftCoverage(5,["trapezium-area","specific-heat-energy"]));
    const first=run("2","force","solution-dilution");
    const second=run("3","solution-dilution","force");
    assert.notEqual(first.output,second.output);
    assert.equal(JSON.parse(readFileSync(join(cwd,first.output),"utf8")).items.length,4);
    assert.equal(JSON.parse(readFileSync(join(cwd,second.output),"utf8")).items.length,6);
    const repeat=run("2","solution-dilution","force");
    assert.equal(repeat.output,first.output);
    if(process.platform!=="win32")assert.equal(statSync(join(cwd,first.output)).mode&0o777,0o600);
    assert.ok(readdirSync(join(cwd,"content/generated")).every(name=>!name.startsWith(".review-")));
  }finally{rmSync(cwd,{recursive:true,force:true});}
});
