import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { generateDrafts, getDraftFamilyCatalog, generateDraftPage, getDraftCoverage, generateDraftReviewSample, iterateDrafts } from "./generate-formative-drafts.mjs";
import { validateBatches, validateDraftShardManifest } from "./validate-private-content.mjs";

test("full generator capacity stays unique, draft-only and structurally valid", () => {
  function* batches() {
    let items=[];
    for(const item of iterateDrafts(10000)){
      items.push(item);
      if(items.length===1000){yield {schemaVersion:1,items};items=[];}
    }
    if(items.length)yield {schemaVersion:1,items};
  }
  const report = validateBatches(batches());
  assert.equal(report.valid, true, report.errors.slice(0, 4).join("; "));
  assert.equal(report.stats.variants, 1003717);
  assert.equal(report.stats.originals, 0);
  assert.equal(report.approvedCount, 0);
  assert.equal(report.publishedCount, 0);
});

const languageScopes={
 "english-irregular-plurals":["english-language","en",["PK","GB","DE"],"children","child"],
 "ielts-paraphrase-vocabulary":["ielts","en",["PK","GB","DE"],"in short supply","scarce"],
 "german-everyday-nouns":["german","de",["PK","GB","DE"],"der Tisch","the table"],
 "german-visa-daily-phrases":["german-visa-preparation","de",["PK","GB","DE"],"Wo ist der Bahnhof?","Where is the station?"],
 "arabic-basic-nouns":["arabic","ar",["PK"],"كتاب","book"],
 "urdu-basic-nouns":["urdu","ur",["PK"],"کتاب","book"],
 "turkish-basic-nouns":["turkish","tr",["PK"],"kitap","book"],
 "welsh-basic-nouns":["welsh","en",["PK","GB"],"llyfr","book"]
};
function* allDraftItems() {
  yield* iterateDrafts(10000,getDraftFamilyCatalog().filter(f=>!Object.hasOwn(languageScopes,f.id)).map(f=>f.id));
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
      case "compound-percentage": expected = nums[0]*(100+nums[1])*(100-nums[2])/10000; break;
      case "gravitational-work": expected = nums[0]*nums[1]*nums[2]; break;
      case "molar-concentration": expected = nums[0]/nums[1]; break;
      case "population-growth": expected = nums[0]+nums[1]-nums[2]; break;
      case "python-affine-loop": expected = nums[0]+nums[1]*nums[2]; break;
      case "classifier-error-count": expected = nums[0]-nums[1]; break;
      case "operating-profit": expected = nums[0]-nums[1]-nums[2]; break;
      case "contribution-total": expected = nums[0]*(nums[1]-nums[2]); break;
      case "network-throughput": expected = nums[0]*nums[1]; break;
      case "security-training-coverage": expected = nums[1]*100/nums[0]; break;
      case "simple-interest": expected = nums[0]*nums[1]*nums[2]/100; break;
      case "number-line-midpoint": expected = (nums[0]+nums[1])/2; break;
      case "bulk-density": expected = nums[0]/nums[1]; break;
      case "contact-pressure": expected = nums[0]/nums[1]; break;
      case "percentage-purity": expected = nums[1]*100/nums[0]; break;
      case "ammonia-limiting-reactant": expected = 2*Math.min(nums[0],nums[1]/3); break;
      case "minute-ventilation": expected = nums[0]*nums[1]; break;
      case "quadrat-population-estimate": expected = nums[0]*nums[1]; break;
      case "python-list-repetition": expected = nums[0]*nums[1]; break;
      case "classifier-specificity": expected = nums[1]*100/nums[0]; break;
      case "accounting-equity": expected = nums[0]-nums[1]; break;
      case "margin-of-safety-units": expected = nums[0]-nums[1]; break;
      case "net-units-sold": expected = nums[0]-nums[1]; break;
      case "constant-price-output": expected = nums[0]*nums[2]+nums[1]*nums[3]; break;
      case "unremediated-patches": expected = nums[0]-nums[1]; break;
      case "triangle-area": expected = nums[0]*nums[1]/2; break;
      case "electrical-energy-wh": expected = nums[0]*nums[1]; break;
      case "atom-economy": expected = nums[1]*100/nums[0]; break;
      case "water-uptake-rate": expected = nums[0]/nums[1]; break;
      case "python-string-repeat": expected = nums[0]*nums[1]; break;
      case "dataset-training-split": expected = nums[0]*nums[1]/100; break;
      case "current-ratio": expected = nums[0]/nums[1]; break;
      case "sales-commission": expected = nums[0]*nums[1]/100; break;
      case "cloud-cpu-hours": expected = nums[0]*nums[1]; break;
      case "restore-completion": expected = nums[0]+nums[1]; break;
      case "ratio-allocation": expected = nums[0]*nums[1]/(nums[1]+nums[2]); break;
      case "linear-momentum": expected = nums[0]*nums[1]; break;
      case "reaction-gas-rate": expected = nums[0]/nums[1]; break;
      case "cell-count-percent-increase": expected = nums[0]*(100+nums[1])/100; break;
      case "python-list-length-update": expected = nums[0]+nums[1]-nums[2]; break;
      case "two-case-mae": expected = (nums[0]+nums[1])/2; break;
      case "net-book-value": expected = nums[0]-nums[1]; break;
      case "profit-after-fixed-costs": expected = nums[0]*nums[1]-nums[2]; break;
      case "fleet-compute-cost": expected = nums[0]*nums[1]*nums[2]; break;
      case "retained-incremental-backups": expected = nums[0]*nums[1]; break;
      case "weighted-mean-two-groups": expected = nums[0]*nums[1]+nums[2]*nums[3]; break;
      case "constant-speed-distance": expected = nums[0]*nums[1]; break;
      case "solution-solute-mass": expected = nums[0]*nums[1]; break;
      case "transpiration-mass-loss": expected = nums[0]-nums[1]; break;
      case "python-queue-length": expected = nums[0]-nums[1]; break;
      case "dataset-holdout-count": expected = nums[0]*(100-nums[1])/100; break;
      case "net-revenue-discount": expected = nums[0]*(100-nums[1])/100; break;
      case "inventory-count-adjustment": expected = nums[0]-nums[1]; break;
      case "total-variable-cost": expected = nums[0]*nums[1]; break;
      case "cloud-compute-credit-balance": expected = nums[0]-nums[1]; break;
      case "arithmetic-series-sum": expected = nums[2]*(2*nums[0]+(nums[2]-1)*nums[1])/2; break;
      case "cylinder-volume-coefficient": expected = nums[0]**2*nums[1]; break;
      case "origin-line-gradient": expected = nums[1]/nums[0]; break;
      case "ohmic-potential-difference": expected = nums[0]*nums[1]; break;
      case "wave-speed-frequency": expected = nums[0]*nums[1]; break;
      case "substance-mass-from-moles": expected = nums[0]*nums[1]; break;
      case "excess-reactant-after-reaction": expected = nums[0]-nums[1]; break;
      case "specimen-size-from-magnification": expected = nums[0]*1000/nums[1]; break;
      case "net-photosynthetic-oxygen": expected = nums[0]-nums[1]; break;
      case "python-arithmetic-precedence": expected = nums[0]+nums[1]*nums[2]; break;
      case "python-negative-index": expected = nums[0]-nums[1]; break;
      case "classifier-false-positive-rate": expected = nums[0]*100/(nums[0]+nums[1]); break;
      case "two-case-mse": expected = (nums[0]**2+nums[1]**2)/2; break;
      case "incident-average-resolution": expected = (nums[0]+nums[1])/2; break;
      case "recovery-objective-overrun": expected = nums[1]-nums[0]; break;
      case "cloud-reserved-memory": expected = nums[0]*nums[1]; break;
      case "unit-selling-price-markup": expected = nums[0]*(100+nums[1])/100; break;
      case "prepaid-rent-balance": expected = nums[0]*(nums[1]-nums[2])/nums[1]; break;
      case "target-profit-output": expected = (nums[0]+nums[2])/nums[1]; break;
      case "market-excess-supply": expected = nums[0]-nums[1]; break;
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
    "purchase-invoice-total": 10000,
    "compound-percentage": 10000, "gravitational-work": 10000, "molar-concentration": 10000,
    "population-growth": 10000, "python-affine-loop": 10000, "classifier-error-count": 10000,
    "operating-profit": 10000, "contribution-total": 10000, "network-throughput": 10000,
    "security-training-coverage": 10000,
    "simple-interest": 10000, "number-line-midpoint": 10000, "bulk-density": 10000,
    "contact-pressure": 10000, "percentage-purity": 10000, "ammonia-limiting-reactant": 10000,
    "minute-ventilation": 10000, "quadrat-population-estimate": 10000, "python-list-repetition": 10000,
    "classifier-specificity": 10000, "accounting-equity": 10000, "margin-of-safety-units": 10000,
    "net-units-sold": 10000, "constant-price-output": 10000, "unremediated-patches": 10000,
    "triangle-area": 10000, "electrical-energy-wh": 10000, "atom-economy": 10000,
    "water-uptake-rate": 10000, "python-string-repeat": 10000, "dataset-training-split": 10000,
    "current-ratio": 10000, "sales-commission": 10000, "cloud-cpu-hours": 10000, "restore-completion": 10000,
    "english-irregular-plurals":24,"ielts-paraphrase-vocabulary":24,"german-everyday-nouns":24,
    "german-visa-daily-phrases":24,"arabic-basic-nouns":24,"urdu-basic-nouns":24,
    "turkish-basic-nouns":24,"welsh-basic-nouns":24,
    "ratio-allocation":10000,"linear-momentum":10000,"reaction-gas-rate":10000,"cell-count-percent-increase":10000,
    "python-list-length-update":10000,"two-case-mae":10000,"net-book-value":10000,"profit-after-fixed-costs":10000,
    "fleet-compute-cost":10000,"retained-incremental-backups":10000,
    "weighted-mean-two-groups":10000,"constant-speed-distance":10000,"solution-solute-mass":10000,
    "transpiration-mass-loss":10000,"python-queue-length":10000,"dataset-holdout-count":10000,
    "net-revenue-discount":10000,"inventory-count-adjustment":10000,"total-variable-cost":10000,"cloud-compute-credit-balance":10000,
    "arithmetic-series-sum":10000,
    "cylinder-volume-coefficient":10000,
    "origin-line-gradient":10000,
    "ohmic-potential-difference":10000,
    "wave-speed-frequency":10000,
    "substance-mass-from-moles":10000,
    "excess-reactant-after-reaction":10000,
    "specimen-size-from-magnification":10000,
    "net-photosynthetic-oxygen":10000,
    "python-arithmetic-precedence":10000,
    "python-negative-index":10000,
    "classifier-false-positive-rate":10000,
    "two-case-mse":10000,
    "incident-average-resolution":10000,
    "recovery-objective-overrun":10000,
    "cloud-reserved-memory":10000,
    "unit-selling-price-markup":10000,
    "prepaid-rent-balance":10000,
    "target-profit-output":10000,
    "market-excess-supply":10000
  })) {
    const items = generateDrafts(10000,[family]);
    assert.equal(items.length, count, family);
    assert.ok(items.every(item => item.status === "draft" && item.countsTowardApprovedTarget === false));
  }
  assert.deepEqual(generateDrafts(3), generateDrafts(3));
  assert.equal(generateDrafts(1).length, 132);
  assert.throws(() => generateDrafts(0));
});

test("catalogue reports exact capacity and returns independent metadata", () => {
  const catalogue = getDraftFamilyCatalog();
  assert.equal(catalogue.length, 132);
  assert.equal(new Set(catalogue.map(f => f.id)).size, 132);
  assert.equal(catalogue.reduce((sum, f) => sum+f.capacity, 0), 1003717);
  assert.equal(new Set(catalogue.map(f => f.track)).size, 20);
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
    assert.equal(catalogue.capacity, 1003717);
    assert.equal(catalogue.families.length, 132);
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
    assert.equal(full.items.length, 264);
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
  const p = generateDraftPage({limitPerFamily:10000,offset:1003712,pageSize:100});
  assert.equal(p.total,1003717);
  assert.equal(p.items.length,5);
  assert.equal(p.nextOffset,null);
  assert.ok(p.items.every(q=>q.family==="market-excess-supply"));
  assert.deepEqual(p.items,generateDrafts(10000,["market-excess-supply"]).slice(-5));
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
  assert.equal(report.totalVariants,1003717);
  assert.equal(report.familyCount,132);
  assert.equal(report.trackCount,20);
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

test("new applied questions have four distinct finite numeric options",()=>{
 for(const family of ["compound-percentage","gravitational-work","molar-concentration","population-growth","python-affine-loop","classifier-error-count","operating-profit","contribution-total","network-throughput","security-training-coverage"]){
   const items=generateDrafts(10000,[family]);
   assert.equal(items.length,10000);
   for(const q of items){
     assert.equal(new Set(q.options).size,4,q.id);
     assert.ok(q.options.every(o=>Number.isSafeInteger(Number(o))&&Number(o)>=0),q.id);
     if(family==="security-training-coverage")assert.ok(q.options.every(o=>Number(o)<=100),q.id);
   }
 }
});

test("stratified samples are reproducible, capped and cover every selected family range",()=>{
 const selectedFamilyIds=["force","compound-percentage"];
 const settings={selectedFamilyIds,samplesPerFamily:7,limitPerFamily:25,seed:"review-2026"};
 const sample=generateDraftReviewSample(settings);
 assert.equal(sample.count,14);
 assert.equal(sample.approvedQuestions,0);
 assert.equal(sample.status,"draft");
 assert.deepEqual(sample,generateDraftReviewSample({...settings,selectedFamilyIds:[...selectedFamilyIds].reverse()}));
 assert.equal(new Set(sample.items.map(q=>q.id)).size,14);
 for(const family of selectedFamilyIds){
   const all=generateDrafts(25,[family]),positions=new Map(all.map((q,i)=>[q.id,i]));
   const rows=sample.items.filter(q=>q.family===family);
   for(const [i,q] of rows.entries()){
     assert.ok(positions.get(q.id)>=Math.floor(i*25/7));
     assert.ok(positions.get(q.id)<Math.floor((i+1)*25/7));
     assert.equal(q.countsTowardApprovedTarget,false);
   }
 }
 assert.notDeepEqual(sample.items.map(q=>q.id),generateDraftReviewSample({...settings,seed:"another-review"}).items.map(q=>q.id));
 assert.equal(generateDraftReviewSample({limitPerFamily:2,samplesPerFamily:100}).count,264);
 assert.equal(generateDraftReviewSample().count,660);
 for(const n of [0,101,1.5,Infinity])assert.throws(()=>generateDraftReviewSample({samplesPerFamily:n}),/Samples per family/);
 for(const seed of ["",null,"x".repeat(129)])assert.throws(()=>generateDraftReviewSample({seed}),/Seed/);
 assert.throws(()=>generateDraftReviewSample({selectedFamilyIds:["unknown"]}),/unique known/);
});

test("review sample CLI writes isolated private packs with metadata-only stdout",()=>{
 const cwd=mkdtempSync(join(tmpdir(),"stemcoach-review-sample-"));
 const script=fileURLToPath(new URL("./generate-formative-drafts.mjs",import.meta.url));
 const run=(...args)=>JSON.parse(execFileSync(process.execPath,[script,...args],{cwd,encoding:"utf8"}));
 try{
  const a=run("--sample","3","20","review-a","compound-percentage","force");
  const b=run("--sample","3","20","review-a","force","compound-percentage");
  assert.equal(a.output,b.output);
  assert.equal(a.draftVariants,6);
  assert.equal(a.approvedQuestions,0);
  assert.ok(!Object.hasOwn(a,"items"));
  const pack=JSON.parse(readFileSync(join(cwd,a.output),"utf8"));
  assert.deepEqual(pack,generateDraftReviewSample({samplesPerFamily:3,limitPerFamily:20,seed:"review-a",selectedFamilyIds:["force","compound-percentage"]}));
  const c=run("--sample","3","20","review-b","force","compound-percentage");
  assert.notEqual(c.output,a.output);
  assert.throws(()=>execFileSync(process.execPath,[script,"--sample","101","20","review-a"],{cwd,stdio:"pipe"}));
 }finally{rmSync(cwd,{recursive:true,force:true});}
});

test("incremental validation catches duplicates across batches without leaking text",()=>{
 const item=generateDrafts(1,["simple-interest"])[0];
 function* batches(){yield {schemaVersion:1,items:[item]};yield {schemaVersion:1,items:[{...item,id:"synthetic-duplicate"}]};}
 const report=validateBatches(batches());
 assert.equal(report.valid,false);
 assert.equal(report.stats.structurallyValid,1);
 assert.ok(report.errors.some(e=>e.includes("batch 1 item 0: duplicate normalised stem")));
 assert.ok(report.errors.every(e=>!e.includes(item.text)));
});
test("streamed export crosses buffer boundaries and matches existing question records",()=>{
 const cwd=mkdtempSync(join(tmpdir(),"stemcoach-stream-"));
 const script=fileURLToPath(new URL("./generate-formative-drafts.mjs",import.meta.url));
 try{
  const result=JSON.parse(execFileSync(process.execPath,[script,"600","simple-interest","ammonia-limiting-reactant"],{cwd,encoding:"utf8"}));
  const pack=JSON.parse(readFileSync(join(cwd,result.output),"utf8"));
  assert.equal(result.draftVariants,1200);
  assert.equal(pack.count,1200);
  assert.equal(pack.status,"draft");
  assert.ok(statSync(join(cwd,result.output)).size>524288);
  assert.deepEqual(pack.items,generateDrafts(600,["simple-interest","ammonia-limiting-reactant"]));
  if(process.platform!=="win32")assert.equal(statSync(join(cwd,result.output)).mode&0o777,0o600);
  assert.ok(readdirSync(join(cwd,"content/generated")).every(name=>!name.startsWith(".review-")));
 }finally{rmSync(cwd,{recursive:true,force:true});}
});
test("advanced calculations have finite unique answers and percentage bounds",()=>{
 for(const id of ["simple-interest","number-line-midpoint","bulk-density","contact-pressure","percentage-purity","ammonia-limiting-reactant","minute-ventilation","quadrat-population-estimate","python-list-repetition","classifier-specificity","accounting-equity","margin-of-safety-units","net-units-sold","constant-price-output","unremediated-patches"]){
  for(const q of iterateDrafts(10000,[id])){
   assert.equal(new Set(q.options).size,4);
   assert.ok(q.options.every(o=>Number.isSafeInteger(Number(o))&&Number(o)>=0));
   if(id==="percentage-purity"||id==="classifier-specificity")assert.ok(q.options.every(o=>Number(o)<=100));
  }
 }
});

test("multilingual recall preserves bidirectional keys, unique choices and market scope",()=>{
 for(const [family,[track,language,markets,firstAnswer,reverseAnswer]] of Object.entries(languageScopes)){
  const rows=generateDrafts(10000,[family]);
  assert.equal(rows.length,24);
  assert.equal(rows[0].correctAnswer,firstAnswer);
  assert.equal(rows[12].correctAnswer,reverseAnswer);
  for(let i=0;i<12;i++){
   const forward=rows[i],reverse=rows[i+12];
   const quoted=q=>q.text.match(/[“«](.+)[”»]/u)?.[1];
   assert.equal(quoted(forward),reverse.correctAnswer);
   assert.equal(quoted(reverse),forward.correctAnswer);
   for(const q of [forward,reverse]){
    assert.equal(q.language,language);
    assert.equal(q.track,track);
    assert.deepEqual(q.candidateMarkets,markets);
    assert.equal(new Set(q.options).size,4);
    assert.ok(q.options.includes(q.correctAnswer));
    assert.equal(q.status,"draft");
    assert.equal(q.countsTowardApprovedTarget,false);
   }
  }
 }
 const report=validateBatches([{schemaVersion:1,items:generateDrafts(10000,Object.keys(languageScopes))}]);
 assert.equal(report.valid,true,report.errors.join("; "));
 assert.equal(report.stats.variants,192);
 assert.equal(report.approvedCount,0);
});
test("new numerical and multilingual families coexist in a private review sample",()=>{
 const pack=generateDraftReviewSample({limitPerFamily:10000,samplesPerFamily:10,seed:"mixed-review",selectedFamilyIds:["atom-economy","urdu-basic-nouns"]});
 assert.equal(pack.count,20);
 assert.equal(pack.items.filter(q=>q.language==="ur").length,10);
 assert.ok(pack.items.filter(q=>q.family==="atom-economy").every(q=>q.options.every(o=>Number(o)>=0&&Number(o)<=100)));
 assert.equal(validateBatches([pack]).valid,true);
});

test("new reasoning options remain distinct and physically meaningful",()=>{
 const ids=["ratio-allocation","linear-momentum","reaction-gas-rate","cell-count-percent-increase","python-list-length-update","two-case-mae","net-book-value","profit-after-fixed-costs","fleet-compute-cost","retained-incremental-backups"];
 for(const family of ids){
  let count=0;
  for(const q of iterateDrafts(10000,[family])){
   count++;
   assert.equal(new Set(q.options).size,4,q.id);
   assert.ok(q.options.every(o=>Number.isSafeInteger(Number(o))&&Number(o)>=0),q.id);
   assert.ok(q.options.includes(q.correctAnswer));
   assert.equal(q.status,"draft");
  }
  assert.equal(count,10000,family);
 }
});

test("rejects false draft metadata, mismatched counts and forged fingerprints",()=>{
 const q=generateDrafts(1,["force"])[0];
 for(const extra of [{fingerprint:"bad"},{id:"forged-id"},{approved:true},{published:true},{variant:"false"},{difficulty:6},{countsTowardApprovedTarget:true},{markets:["PK"]}]){
  const report=validateBatches([{schemaVersion:1,items:[{...q,...extra}]}]);
  assert.equal(report.valid,false);
  assert.equal(report.stats.structurallyValid,0);
  assert.ok(report.errors.every(e=>!e.includes(q.text)));
 }
 assert.equal(validateBatches([{schemaVersion:1,count:2,items:[q]}]).valid,false);
 assert.equal(validateBatches([{schemaVersion:1,count:1,items:[{...q,markets:["DE","GB","PK"]}]}]).valid,true);
});
test("shard exports are bounded, complete, private and verified sequentially",()=>{
 const cwd=mkdtempSync(join(tmpdir(),"stemcoach-shards-"));
 const script=fileURLToPath(new URL("./generate-formative-drafts.mjs",import.meta.url));
 const validator=fileURLToPath(new URL("./validate-private-content.mjs",import.meta.url));
 const run=(...args)=>JSON.parse(execFileSync(process.execPath,[script,...args],{cwd,encoding:"utf8"}));
 try{
  const result=run("--shards","2","3","ratio-allocation","force");
  assert.equal(result.draftVariants,6);
  assert.equal(result.shardCount,3);
  const manifestPath=join(cwd,result.manifest);
  const manifest=JSON.parse(readFileSync(manifestPath,"utf8"));
  assert.equal(manifest.count,6);
  const items=manifest.shards.flatMap(shard=>JSON.parse(readFileSync(join(dirname(manifestPath),shard.name),"utf8")).items);
  assert.deepEqual(items,generateDrafts(3,["force","ratio-allocation"]));
  const report=validateDraftShardManifest(manifestPath);
  assert.equal(report.valid,true);
  assert.equal(report.stats.variants,6);
  assert.equal(JSON.parse(execFileSync(process.execPath,[validator,"--manifest",manifestPath],{cwd,encoding:"utf8"})).valid,true);
  if(process.platform!=="win32"){
    assert.equal(statSync(manifestPath).mode&0o777,0o600);
    assert.equal(statSync(join(dirname(manifestPath),manifest.shards[0].name)).mode&0o777,0o600);
  }
  const partPath=join(dirname(manifestPath),manifest.shards[1].name);
  const original=readFileSync(partPath);
  writeFileSync(partPath,Buffer.concat([original,Buffer.from(" ")]));
  assert.throws(()=>validateDraftShardManifest(manifestPath),/checksum mismatch/);
  writeFileSync(partPath,original);
  const pack=JSON.parse(original.toString("utf8"));
  pack.items[0]=items[0];
  const changed=JSON.stringify(pack);
  writeFileSync(partPath,changed);
  manifest.shards[1].sha256=createHash("sha256").update(changed).digest("hex");
  writeFileSync(manifestPath,JSON.stringify(manifest));
  const duplicated=validateDraftShardManifest(manifestPath);
  assert.equal(duplicated.valid,false);
  assert.ok(duplicated.errors.some(e=>e.includes("duplicate normalised stem")));
  manifest.shards[1].name="../outside.json";
  writeFileSync(manifestPath,JSON.stringify(manifest));
  assert.throws(()=>validateDraftShardManifest(manifestPath),/Invalid shard entry/);
  assert.throws(()=>execFileSync(process.execPath,[script,"--shards","10001","3"],{cwd,stdio:"pipe"}));
  assert.ok(readdirSync(join(cwd,"content/generated")).every(name=>!name.startsWith(".review-")));
 }finally{rmSync(cwd,{recursive:true,force:true});}
});

test("new applied families have nonnegative integer choices and exact draft metadata",()=>{
 const ids=["weighted-mean-two-groups","constant-speed-distance","solution-solute-mass","transpiration-mass-loss","python-queue-length","dataset-holdout-count","net-revenue-discount","inventory-count-adjustment","total-variable-cost","cloud-compute-credit-balance"];
 for(const family of ids){
  let count=0;
  for(const q of iterateDrafts(10000,[family])){
   count++;
   assert.equal(new Set(q.options).size,4,q.id);
   assert.ok(q.options.every(o=>Number.isSafeInteger(Number(o))&&Number(o)>=0),q.id);
   assert.ok(q.options.includes(q.correctAnswer));
   assert.equal(q.status,"draft");
   assert.equal(q.countsTowardApprovedTarget,false);
  }
  assert.equal(count,10000,family);
 }
});

test("original similarity audit flags exact, numeric-template and near duplicates without returning private text",async()=>{
 const {auditOriginalSimilarity}=await import("./audit-original-similarity.mjs");
 const mk=(text,extra={})=>({text,track:"mathematics",language:"en",status:"draft",...extra});
 const q1="A shop buys 12 boxes and each box contains 4 pencils. Find the total pencil count.";
 const q2="A shop buys 15 boxes and each box contains 6 pencils. Find the total pencil count.";
 const q3="A shop buys 12 boxes and each box contains 4 pencils. Find the total pencil count!";
 const q4="A shop buys 12 boxes and each box contains 4 pencils. Find the total pencil count today.";
 const result=auditOriginalSimilarity([
  {schemaVersion:1,items:[mk(q1),mk(q1,{variant:true}),mk("Which triangle has three equal sides?")]},
  {schemaVersion:1,items:[mk(q2),mk(q3),mk(q4),mk(q1,{track:"commerce"})]},
 ]);
 assert.equal(result.checkedOriginals,6);
 assert.equal(result.excludedVariants,1);
 assert.ok(result.flags.some(f=>f.kind==="numeric-template"&&f.left.batch===1&&f.right.batch===2));
 assert.ok(result.flags.some(f=>f.kind==="normalized-stem"));
 assert.ok(result.flags.some(f=>f.kind==="similar-stem"));
 assert.equal(result.approvedQuestions,0);
 assert.ok(result.requiresHumanReview);
 assert.ok(!JSON.stringify(result).includes(q1));
 assert.ok(result.flags.every(f=>f.left.row!==2||f.left.batch!==1));
 assert.ok(result.flags.every(f=>f.right.row!==4||f.right.batch!==2));
});
test("original similarity audit handles Unicode, rejects malformed input, and caps findings",async()=>{
 const {auditOriginalSimilarity}=await import("./audit-original-similarity.mjs");
 const mk=text=>({text,track:"german",language:"de",status:"draft"});
 const batch={schemaVersion:1,items:[mk("Wähle den richtigen Artikel: Übung."),mk("WÄHLE DEN RICHTIGEN ARTIKEL: U\u0308bung!")]};
 assert.equal(auditOriginalSimilarity([batch]).flagCount,1);
 assert.throws(()=>auditOriginalSimilarity([batch],{threshold:NaN}),/Threshold/);
 assert.throws(()=>auditOriginalSimilarity([{...batch,count:1}]),/count mismatch/);
 assert.throws(()=>auditOriginalSimilarity([{schemaVersion:1,items:[{...mk("question"),status:"published"}]}]),/draft records/);
 const repeated={schemaVersion:1,items:Array.from({length:25},()=>mk("A synthetic duplicate stem for review."))};
 const result=auditOriginalSimilarity([repeated]);
 assert.equal(result.flagCount,300);
 assert.equal(result.flags.length,200);
 assert.equal(result.truncated,true);
});
test("similarity CLI emits row references and never includes question content",async()=>{
 const fs=await import("node:fs/promises");
 const path=await import("node:path");
 const os=await import("node:os");
 const cp=await import("node:child_process");
 const root=await fs.mkdtemp(path.join(os.tmpdir(),"stemcoach-sim-"));
 try{
  const filename=path.join(root,"private.json");
  const stem="Distinct private question text used as a synthetic fixture.";
  const item={text:stem,track:"mathematics",language:"en",status:"draft"};
  await fs.writeFile(filename,JSON.stringify({schemaVersion:1,items:[item,item]}));
  const run=cp.spawnSync(process.execPath,["scripts/audit-original-similarity.mjs",filename],{encoding:"utf8"});
  assert.equal(run.status,2,run.stderr);
  const report=JSON.parse(run.stdout);
  assert.equal(report.flagCount,1);
  assert.ok(!run.stdout.includes(stem));
  assert.equal(run.stderr,"");
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

test("milestone families use unique, finite choices with valid answer bounds",()=>{
 for(const family of ["arithmetic-series-sum","cylinder-volume-coefficient","origin-line-gradient","ohmic-potential-difference","wave-speed-frequency","substance-mass-from-moles","excess-reactant-after-reaction","specimen-size-from-magnification","net-photosynthetic-oxygen","python-arithmetic-precedence","python-negative-index","classifier-false-positive-rate","two-case-mse","incident-average-resolution","recovery-objective-overrun","cloud-reserved-memory","unit-selling-price-markup","prepaid-rent-balance","target-profit-output","market-excess-supply"]){
  let count=0;
  for(const q of iterateDrafts(10000,[family])){
   count++;
   assert.equal(new Set(q.options).size,4,q.id);
   assert.ok(q.options.every(o=>Number.isSafeInteger(Number(o))&&Number(o)>=0),q.id);
   assert.ok(q.options.includes(q.correctAnswer));
   if(family==="classifier-false-positive-rate")assert.ok(q.options.every(o=>Number(o)<=100));
   assert.equal(q.status,"draft");
   assert.equal(q.countsTowardApprovedTarget,false);
  }
  assert.equal(count,10000,family);
 }
});
