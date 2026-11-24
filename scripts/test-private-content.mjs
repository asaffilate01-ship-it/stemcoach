import assert from "node:assert/strict";
import test from "node:test";
import { generateDrafts } from "./generate-formative-drafts.mjs";
import { validateBatches } from "./validate-private-content.mjs";

test("full generator capacity stays unique, draft-only and structurally valid", () => {
  const items = generateDrafts(10000);
  assert.equal(items.length, 24805);
  const report = validateBatches([{ schemaVersion: 1, items }]);
  assert.equal(report.valid, true, report.errors.slice(0, 4).join("; "));
  assert.equal(report.stats.variants, 24805);
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
