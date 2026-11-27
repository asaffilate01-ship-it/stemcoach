import { createHash } from "node:crypto";
import { readFileSync, lstatSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname, join } from "node:path";

const markets = new Set(["PK", "GB", "DE"]);
const localLanguages = new Set(["arabic", "urdu", "turkish"]);
const normalise = value => value.normalize("NFKC").toLowerCase().trim().replace(/\s+/gu, " ");
const text = value => typeof value === "string" && value.trim().length > 0;
const fingerprint = stem => createHash("sha256").update(normalise(stem)).digest("hex");

// Structural checks only; a valid file is NOT proof of academic accuracy or permission to publish.
export function validateBatches(batches) {
  const errors = [], ids = new Set(), stems = new Set();
  const stats = { originals: 0, variants: 0, structurallyValid: 0, metadataReadyForReview: 0, byTrack: Object.create(null) };
  let nextBatchIndex = 0;
  for (const batch of batches) {
    const batchIndex = nextBatchIndex++;
    if (!batch || batch.schemaVersion !== 1 || !Array.isArray(batch.items)) {
      errors.push("batch " + batchIndex + ": invalid envelope"); continue;
    }
    if (batch.count !== undefined && (!Number.isSafeInteger(batch.count) || batch.count !== batch.items.length)) errors.push("batch " + batchIndex + ": declared count mismatch");
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
        if (item.fingerprint !== undefined && item.fingerprint !== hash) fail("stem fingerprint mismatch");
        if (item.variant === true && item.fingerprint !== undefined && item.id !== "variant-" + hash.slice(0,24)) fail("variant identifier mismatch");
      }
      if (!text(item.track) || !text(item.topic) || !text(item.language) || !text(item.explanation)) fail("missing learning metadata");
      if (item.status !== "draft" || item.approved === true || item.published === true) fail("only draft records accepted by this tool");
      if (item.variant !== undefined && typeof item.variant !== "boolean") fail("invalid variant flag");
      if (item.difficulty !== undefined && (!Number.isInteger(item.difficulty) || item.difficulty < 1 || item.difficulty > 5)) fail("invalid difficulty");
      if (item.countsTowardApprovedTarget === true) fail("drafts cannot count toward approved target");
      const regions = item.markets ?? item.candidateMarkets;
      if (!Array.isArray(regions) || !regions.length || new Set(regions).size !== regions.length || regions.some(m => !markets.has(m))) fail("invalid market scope");
      else if (localLanguages.has(item.track) && regions.some(m => m !== "PK")) fail("additional language outside configured market");
      else if (item.track === "welsh" && regions.includes("DE")) fail("Welsh outside configured market");
      if (item.markets !== undefined && item.candidateMarkets !== undefined &&
          (!Array.isArray(item.markets) || !Array.isArray(item.candidateMarkets) ||
           JSON.stringify([...item.markets].sort()) !== JSON.stringify([...item.candidateMarkets].sort()))) fail("conflicting market scopes");
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

// Validate one shard at a time; retain global duplicate fingerprints across the entire manifest.
function readBoundedRegularFile(path,maxBytes){
 const stat=lstatSync(path);
 if(!stat.isFile() || stat.size>maxBytes)throw Error("Invalid private file");
 return readFileSync(path);
}
export function validateDraftShardManifest(path){
 const manifest=JSON.parse(readBoundedRegularFile(path,8*1024*1024).toString("utf8"));
 if(!manifest || manifest.schemaVersion!==1 || manifest.kind!=="formative-draft-shards" || manifest.status!=="draft" ||
    !Number.isSafeInteger(manifest.count) || manifest.count<1 ||
    !Number.isSafeInteger(manifest.shardSize) || manifest.shardSize<1 || manifest.shardSize>10000 ||
    !Array.isArray(manifest.shards) || manifest.shards.length>10000 ||
    manifest.shards.length!==Math.ceil(manifest.count/manifest.shardSize))throw Error("Invalid shard manifest");
 function* batches(){
  for(const [index,entry] of manifest.shards.entries()){
   const name="part-"+String(index+1).padStart(6,"0")+".json";
   const expectedCount=Math.min(manifest.shardSize,manifest.count-index*manifest.shardSize);
   if(!entry || entry.name!==name || entry.count!==expectedCount || typeof entry.sha256!=="string" || !/^[a-f0-9]{64}$/.test(entry.sha256))throw Error("Invalid shard entry");
   const bytes=readBoundedRegularFile(join(dirname(path),name),32*1024*1024);
   if(createHash("sha256").update(bytes).digest("hex")!==entry.sha256)throw Error("Shard checksum mismatch");
   const batch=JSON.parse(bytes.toString("utf8"));
   if(!batch || batch.schemaVersion!==1 || batch.status!=="draft" || batch.count!==expectedCount || !Array.isArray(batch.items) || batch.items.length!==expectedCount)throw Error("Shard envelope mismatch");
   yield batch;
  }
 }
 return validateBatches(batches());
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const paths = process.argv.slice(2);
    if (!paths.length) throw Error("Supply private JSON batch paths");
    let report;
    if(paths[0]==="--manifest"){
      if(paths.length!==2)throw Error("Supply one manifest path");
      report=validateDraftShardManifest(paths[1]);
    }else{
      function* batches(){for(const path of paths)yield JSON.parse(readFileSync(path,"utf8"));}
      report=validateBatches(batches());
    }
    console.log(JSON.stringify(report, null, 2));
    if (!report.valid) process.exitCode = 1;
  } catch {
    // Never print source file contents or a parser error containing commercial answers.
    console.error("Unable to read or validate private batch input.");
    process.exitCode = 1;
  }
}
