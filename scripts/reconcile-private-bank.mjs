import { createHash } from "node:crypto";
import { readFile, stat, writeFile, realpath } from "node:fs/promises";
import { dirname, resolve, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { validateBatches } from "./validate-private-content.mjs";

const TRACKS = new Set(["mathematics","physics","chemistry","biology","english-language","ielts","german","german-visa-preparation","artificial-intelligence","coding","cyber-security","cloud-computing","commerce","accounting","business-studies","economics","arabic","urdu","welsh","english-literature","psychology","geography","general-science"]);
const EXPECTED_LANG = new Map([["arabic",["ar"]],["urdu",["ur"]],["welsh",["en","cy"]],["german",["de"]],["german-visa-preparation",["de"]],["ielts",["en"]],["english-language",["en"]],["english-literature",["en"]]]);
const REGION = new Set(["PK","GB","DE"]);
const MAX_ROWS = 250000;
const MAX_BYTES = 128 * 1024 * 1024;
const text = value => typeof value === "string" && value.trim().length > 0;
const regionsOf = item => item.markets ?? item.candidateMarkets;
const normalise = value => value.normalize("NFKC").toLowerCase().trim().replace(/\s+/gu," ");
const fingerprint = value => createHash("sha256").update(normalise(value)).digest("hex");
const isEnvelope = value => value && value.schemaVersion === 1 && Array.isArray(value.items);
const empty = () => ({ schemaVersion: 1, items: [] });
const safeDraft = item => item.status === "draft" && item.published !== true && item.approved !== true && item.countsTowardApprovedTarget !== true;

// Archived records are still validated for duplication and reference integrity.
// They are excluded from all launch counts and from the local review index.
function scopeOf(item) {
  const regions = regionsOf(item);
  if (!Array.isArray(regions) || !regions.length || new Set(regions).size !== regions.length || regions.some(r => !REGION.has(r))) return null;
  if (item.markets && item.candidateMarkets && JSON.stringify([...item.markets].sort()) !== JSON.stringify([...item.candidateMarkets].sort())) return null;
  if (item.track === "turkish") return ["en","tr"].includes(item.language) && regions.every(r => r === "PK") ? "archived" : null;
  if (!TRACKS.has(item.track) || !(EXPECTED_LANG.get(item.track) ?? ["en","de"]).includes(item.language)) return null;
  if (["arabic","urdu"].includes(item.track) && regions.some(r => r !== "PK")) return null;
  if (item.track === "welsh" && regions.includes("DE")) return null;
  return "launch";
}

export function reconcilePrivatePacks(packs) {
  const report = {
    valid: false, packCount: 0, checkedQuestions: 0,
    launch: { originals: 0, variants: 0, quizzes: 0, lessons: 0, candidateMappings: 0 },
    archived: { originals: 0, variants: 0, quizzes: 0, lessons: 0 },
    byTrack: Object.create(null), errors: [], errorCount: 0,
    approvedCount: 0, publishedCount: 0, productionImportPerformed: false,
  };
  const fail = message => { report.errorCount++; if (report.errors.length < 50) report.errors.push(message); };
  const result = index => ({ report: { ...report, valid: report.errorCount === 0 }, reviewIndex: report.errorCount === 0 ? index : [] });
  if (!Array.isArray(packs) || !packs.length || packs.length > 200) { fail("Provide 1–200 private packs."); return result([]); }
  report.packCount = packs.length;
  const questionBatches = [], index = [], ids = new Map(), resourceIds = new Set();
  let totalRows = 0;
  for (const [p,pack] of packs.entries()) {
    for (const kind of ["originals","variants","quizzes","lessons"]) {
      if (!isEnvelope(pack?.[kind])) { fail("Pack "+(p+1)+": invalid "+kind+" envelope."); continue; }
      totalRows += pack[kind].items.length;
      if (kind === "originals" || kind === "variants") questionBatches.push(pack[kind]);
    }
  }
  if (totalRows > MAX_ROWS) fail("Exceeds 250,000 records per reconciliation run.");
  if (report.errorCount) return result([]);
  // Existing structural validator checks answer keys and exact stems across every batch.
  const structural = validateBatches(questionBatches);
  if (!structural.valid) {
    report.errorCount = structural.errors.length;
    report.errors = structural.errors.slice(0,50);
    return result([]);
  }
  for (const [p,pack] of packs.entries()) {
    for (const kind of ["originals","variants"]) {
      for (const [i,item] of pack[kind].items.entries()) {
        const label = "Pack "+(p+1)+" "+kind+" row "+(i+1);
        const scope = scopeOf(item);
        if (!scope || !safeDraft(item) || (kind === "variants" ? item.variant !== true : item.variant !== undefined && item.variant !== false)) {
          fail(label+": invalid scope, draft status or variant classification."); continue;
        }
        if (item.difficulty !== undefined && (!Number.isInteger(item.difficulty) || item.difficulty < 1 || item.difficulty > 5)) { fail(label+": invalid difficulty."); continue; }
        if (ids.has(item.id)) { fail(label+": duplicate record ID."); continue; }
        const regions = regionsOf(item);
        ids.set(item.id,{ track:item.track, scope, regions });
        report.checkedQuestions++;
        report[scope][kind]++;
        if (scope === "launch") {
          const track = report.byTrack[item.track] ??= { originals: 0, variants: 0, quizzes: 0, lessons: 0 };
          track[kind]++;
          const mapping = item.curriculumOutcome;
          const mapped = !!(mapping && text(mapping.code) && text(mapping.specificationVersion) && text(mapping.sourceUrl));
          if (mapped) report.launch.candidateMappings++;
          index.push({ id:item.id, pack:p+1, kind, row:i+1, track:item.track, language:item.language, candidateMarkets:regions, fingerprint:fingerprint(item.text), status:"draft", requiresAcademicReview:true, candidateMappingPresent:mapped });
        }
      }
    }
  }
  for (const [p,pack] of packs.entries()) {
    for (const kind of ["quizzes","lessons"]) {
      for (const [i,item] of pack[kind].items.entries()) {
        const label = "Pack "+(p+1)+" "+kind+" row "+(i+1);
        if (!item || typeof item !== "object" || !text(item.id) || ids.has(item.id) || resourceIds.has(item.id) || !text(item.title) || !safeDraft(item) ||
            !Array.isArray(item.questionIds) || !item.questionIds.length || new Set(item.questionIds).size !== item.questionIds.length ||
            (kind === "lessons" && !text(item.body)) || (item.questionCount !== undefined && item.questionCount !== item.questionIds.length)) {
          fail(label+": invalid resource or duplicate ID."); continue;
        }
        const refs = item.questionIds.map(id => ids.get(id));
        if (refs.some(ref => !ref || ref.track !== item.track || ref.scope !== refs[0]?.scope)) { fail(label+": missing or incompatible question reference."); continue; }
        const regions = regionsOf(item);
        if (regions !== undefined && (!Array.isArray(regions) || !regions.length || new Set(regions).size !== regions.length ||
            regions.some(region => !refs.every(ref => ref.regions.includes(region))))) {
          fail(label+": resource market not supported by linked questions."); continue;
        }
        if (item.language !== undefined && !(item.track === "turkish" ? ["tr","en"] : EXPECTED_LANG.get(item.track) ?? ["en","de"]).includes(item.language)) {
          fail(label+": incompatible resource language."); continue;
        }
        resourceIds.add(item.id);
        const scope = refs[0].scope;
        report[scope][kind]++;
        if (scope === "launch") report.byTrack[item.track][kind]++;
      }
    }
  }
  return result(index);
}

async function loadPack(dir) {
  async function load(name, optional = false) {
    const path = resolve(dir,name);
    try {
      if ((await stat(path)).size > MAX_BYTES) throw new Error("oversize");
      return JSON.parse(await readFile(path,"utf8"));
    } catch (e) { if (optional && e?.code === "ENOENT") return empty(); throw e; }
  }
  return {
    originals: await load("original-drafts.json"),
    variants: await load("formative-variants.json",true),
    quizzes: await load("quiz-drafts.json",true),
    lessons: await load("lesson-drafts.json",true),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    let output = null;
    if (args[0] === "--index") { args.shift(); output = args.shift(); if (!output) throw new Error("missing output"); }
    if (!args.length || args.length > 200 || args.some(arg => arg.startsWith("--"))) throw new Error("usage");
    const packs = [];
    for (const dir of args) packs.push(await loadPack(dir));
    const { report, reviewIndex } = reconcilePrivatePacks(packs);
    if (output && report.valid) {
      // Require an existing destination directory outside the repository, and never overwrite.
      const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)),".."));
      const target = resolve(await realpath(dirname(resolve(output))),resolve(output).split(/[\\/]/).pop());
      const rel = relative(root,target);
      if (!rel.startsWith("..") || !rel.startsWith(".."+(process.platform === "win32" ? "\\" : "/")) || isAbsolute(rel)) throw new Error("private output required");
      await writeFile(target,JSON.stringify({schemaVersion:1,status:"draft-review-index",approvedCount:0,publishedCount:0,items:reviewIndex}),{flag:"wx",mode:0o600});
    }
    process.stdout.write(JSON.stringify(report,null,2)+"\n");
    if (!report.valid) process.exitCode = 1;
  } catch {
    console.error("Unable to reconcile private packs. Use extracted pack directories and, optionally, --index NEW_PRIVATE_FILE outside the repository. No answer text is logged.");
    process.exitCode = 1;
  }
}
