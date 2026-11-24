import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const markets = new Set(["PK", "GB", "DE"]);
const localLanguages = new Set(["arabic", "urdu", "turkish"]);
const normalise = value => value.normalize("NFKC").toLowerCase().trim().replace(/\s+/gu, " ");
const text = value => typeof value === "string" && value.trim().length > 0;
const fingerprint = stem => createHash("sha256").update(normalise(stem)).digest("hex");

// Structural checks only; a valid file is NOT proof of academic accuracy or permission to publish.
export function validateBatches(batches) {
  const errors = [], ids = new Set(), stems = new Set();
  const stats = { originals: 0, variants: 0, structurallyValid: 0, metadataReadyForReview: 0, byTrack: {} };
  for (const [batchIndex, batch] of batches.entries()) {
    if (!batch || batch.schemaVersion !== 1 || !Array.isArray(batch.items)) {
      errors.push("batch " + batchIndex + ": invalid envelope"); continue;
    }
    for (const [index, item] of batch.items.entries()) {
      const prefix = "batch " + batchIndex + " item " + index;
      const fail = message => errors.push(prefix + ": " + message);
      const before = errors.length;
      if (!item || typeof item !== "object") { fail("invalid record"); continue; }
      if (!text(item.id) || ids.has(item.id)) fail("missing or duplicate ID"); else ids.add(item.id);
      if (!text(item.text)) fail("missing stem");
      else {
        const hash = fingerprint(item.text);
        if (stems.has(hash)) fail("duplicate normalised stem"); else stems.add(hash);
      }
      if (!text(item.track) || !text(item.topic) || !text(item.language) || !text(item.explanation)) fail("missing learning metadata");
      if (item.status !== "draft") fail("only draft records accepted by this tool");
      const regions = item.markets ?? item.candidateMarkets;
      if (!Array.isArray(regions) || !regions.length || new Set(regions).size !== regions.length || regions.some(m => !markets.has(m))) fail("invalid market scope");
      else if (localLanguages.has(item.track) && regions.some(m => m !== "PK")) fail("additional language outside configured market");
      if (item.type === "mcq") {
        if (!Array.isArray(item.options) || item.options.length !== 4 || item.options.some(o => !text(o))) fail("MCQ requires four nonempty choices");
        else if (new Set(item.options.map(normalise)).size !== 4 || !item.options.includes(item.correctAnswer)) fail("duplicate choices or answer missing");
      } else if (!["short-answer", "numerical", "essay", "true-false", "multi-select"].includes(item.type)) fail("unsupported question type");
      else if (!text(item.correctAnswer) && !(Array.isArray(item.correctAnswers) && item.correctAnswers.length && item.correctAnswers.every(text))) fail("missing answer key");
      if (item.variant && item.countsTowardApprovedTarget !== false) fail("variants cannot count toward original approved target");
      if (errors.length !== before) continue;
      stats.structurallyValid++;
      if (item.variant) stats.variants++; else stats.originals++;
      stats.byTrack[item.track] = (stats.byTrack[item.track] ?? 0) + 1;
      if (item.curriculumOutcome && text(item.curriculumOutcome.code) && text(item.curriculumOutcome.specificationVersion) && text(item.curriculumOutcome.sourceUrl)) stats.metadataReadyForReview++;
    }
  }
  return { valid: errors.length === 0, errors, stats, approvedCount: 0, publishedCount: 0 };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const paths = process.argv.slice(2);
    if (!paths.length) throw Error("Supply private JSON batch paths");
    const batches = await Promise.all(paths.map(async p => JSON.parse(await readFile(p, "utf8"))));
    const report = validateBatches(batches);
    console.log(JSON.stringify(report, null, 2));
    if (!report.valid) process.exitCode = 1;
  } catch {
    // Never print source file contents or a parser error containing commercial answers.
    console.error("Unable to read or validate private batch input.");
    process.exitCode = 1;
  }
}
