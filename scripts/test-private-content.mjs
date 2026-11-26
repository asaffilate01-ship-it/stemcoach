import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateDrafts, getDraftFamilyCatalog } from "./generate-formative-drafts.mjs";
import { validateBatches } from "./validate-private-content.mjs";

test("full generator capacity stays unique, draft-only and structurally valid", () => {
  const items = generateDrafts(10000);
  assert.equal(items.length, 100925);
  const report = validateBatches([{ schemaVersion: 1, items }]);
  assert.equal(report.valid, true, report.errors.slice(0, 4).join("; "));
  assert.equal(report.stats.variants, 100925);
  assert.equal(report.stats.originals, 0);
  assert.equal(report.approvedCount, 0);
  assert.equal(report.publishedCount, 0);
});

test("independent arithmetic checks across every generated question", () => {
  const items = generateDrafts(10000);
  for (const item of items) {
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
  const all = generateDrafts(10000);
  for (const [family, count] of Object.entries({
    "percentage-discount": 720, "average-power": 2000, "population-density": 1200,
    "amount-of-substance": 1000, "integer-remainder": 1200, "arithmetic-sequence": 4000, "series-resistance": 3600,
    "classification-accuracy": 3000, "metered-cloud-cost": 2400, "unit-purchase-cost": 3000,
    "price-index-change": 2000, "straight-line-depreciation": 4000, "microscope-magnification": 2000,
    "rectangle-area": 5000, "electric-charge": 5000, "mass-concentration": 5000,
    "germination-rate": 5000, "nested-loop-count": 5000, "working-capital": 5000,
    "labour-productivity": 5000, "cloud-storage-cost": 5000,
    "backup-recovery-gap": 3000, "nominal-output-value": 3000
  })) {
    const items = all.filter(item => item.family === family);
    assert.equal(items.length, count, family);
    assert.ok(items.every(item => item.status === "draft" && item.countsTowardApprovedTarget === false));
  }
  assert.deepEqual(generateDrafts(3), generateDrafts(3));
  assert.equal(generateDrafts(1).length, 29);
  assert.throws(() => generateDrafts(0));
});

test("catalogue reports exact capacity and returns independent metadata", () => {
  const catalogue = getDraftFamilyCatalog();
  assert.equal(catalogue.length, 29);
  assert.equal(new Set(catalogue.map(f => f.id)).size, 29);
  assert.equal(catalogue.reduce((sum, f) => sum+f.capacity, 0), 100925);
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
    assert.equal(catalogue.capacity, 100925);
    assert.equal(catalogue.families.length, 29);
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
    assert.equal(full.items.length, 58);
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
