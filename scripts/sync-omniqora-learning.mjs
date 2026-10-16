#!/usr/bin/env node
/**
 * Operator-only, repeatable synchronisation of authored STEMCoach lessons to
 * the existing Omniqora Knowledge Core. Nothing runs during site builds.
 *
 * npm run knowledge:preview              -> offline counts / source manifest
 * npm run knowledge:sync                 -> requires server credentials
 *
 * The import contains PUBLIC authored lesson copy only. No learners, school
 * memberships, attempts, conversations or personal information are exported.
 */
import { build } from "esbuild";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const COLLECTION = "stemcoach-lessons";
const STATE_FILE = resolve(process.env.OMNIQORA_STEMCOACH_STATE_FILE || "var/omniqora-stemcoach-revisions.json");
const apply = process.argv.includes("--apply");

async function loadTutorials() {
  // Compile static TypeScript lesson data only; importing the web app would
  // unintentionally load client providers, session state and hidden secrets.
  const result = await build({
    entryPoints: [resolve("src/data/tutorials.ts")],
    bundle: true, write: false, platform: "node", format: "esm", target: "es2022",
    logLevel: "silent",
  });
  const encoded = Buffer.from(result.outputFiles[0].contents).toString("base64");
  const { tutorials } = await import("data:text/javascript;base64," + encoded);
  if (!Array.isArray(tutorials) || tutorials.length < 57) throw new Error("Tutorial source catalogue is incomplete");
  return tutorials;
}

function sourceOf(tutorial) {
  const text = [
    "Source classification: STEMCoach authored study draft; not independently academically reviewed.",
    "Lesson: " + tutorial.title,
    "Subject: " + tutorial.subject,
    "Level: " + tutorial.level,
    "Summary: " + tutorial.summary,
    ...(tutorial.objectives || []).map((objective) => "Learning objective: " + objective),
    ...(tutorial.lesson || []).map((paragraph) => "Teaching note: " + paragraph),
    "Worked example: " + tutorial.workedExample,
    "Exam technique suggestion: " + (tutorial.examTip || "Check the relevant awarding body's official specification."),
    "Common learning error: " + (tutorial.commonMistake || "Compare the explanation with the worked example."),
    ...[tutorial.checkpoint, ...(tutorial.practice || [])].flatMap((question, i) => [
      "Knowledge check " + (i + 1) + ": " + question.question,
      "Authored answer " + (i + 1) + ": " + question.answer,
      "Authored explanation " + (i + 1) + ": " + question.explanation,
    ]),
  ].join("\n");
  return {
    id: "lesson-" + tutorial.id,
    title: tutorial.title,
    text,
    source_uri: "urn:stemcoach:tutorial:" + tutorial.id,
    language: "en",
    jurisdiction: "unspecified",
    valid_from: "2026-10-16",
  };
}

function edgesOf(tutorial) {
  return (tutorial.objectives || []).slice(0, 5).map((objective, index) => ({
    id: "lesson-link-" + tutorial.id + "-" + (index + 1),
    source: tutorial.title,
    relation: "teaches",
    target: objective,
    quote: "Learning objective: " + objective,
  }));
}

async function loadState() {
  try {
    const raw = JSON.parse(await readFile(STATE_FILE, "utf8"));
    if (raw.version !== 1 || raw.collection !== COLLECTION || typeof raw.revisions !== "object") {
      throw new Error("Unexpected revision state file; review manually before continuing");
    }
    return raw.revisions;
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

async function saveState(revisions) {
  await mkdir(dirname(STATE_FILE), { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify({ version: 1, collection: COLLECTION, revisions }, null, 2) + "\n", { mode: 0o600 });
}

function endpointConfig() {
  const url = process.env.OMNIQORA_KNOWLEDGE_URL;
  const token = process.env.OMNIQORA_STEMCOACH_INGEST_TOKEN;
  const collection = process.env.OMNIQORA_STEMCOACH_COLLECTION || COLLECTION;
  if (!url || !token || token.length < 32 || collection !== COLLECTION) {
    throw new Error("Explicit HTTPS URL, scoped ingest-only token and exact stemcoach-lessons collection are required");
  }
  const u = new URL(url);
  if (u.protocol !== "https:" || u.username || u.password || u.search || u.hash ||
      u.pathname !== "/" || u.port || !u.hostname.includes(".") ||
      u.hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)) {
    throw new Error("The Omniqora endpoint must be an approved HTTPS origin");
  }
  return { url: u.origin, token };
}

async function request(base, token, path, payload) {
  const answer = await fetch(base + path, {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(25000),
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ collection: COLLECTION, ...payload }),
  });
  if (!answer.ok) throw new Error("Knowledge Core " + path + " returned status " + answer.status);
  return await answer.json();
}

const tutorials = await loadTutorials();
const ids = new Set(tutorials.map((item) => item.id));
if (ids.size !== tutorials.length) throw new Error("Duplicate lesson identifier in catalogue");
const documents = tutorials.map(sourceOf);
const graphEdges = tutorials.reduce((sum, item) => sum + edgesOf(item).length, 0);
if (!apply) {
  process.stdout.write(JSON.stringify({
    mode: "dry-run", collection: COLLECTION, documents: documents.length, proposedSourceEdges: graphEdges,
    subjects: [...new Set(tutorials.map((item) => item.subject))].sort(),
    sourceClassification: "authored_unreviewed", personalDataIncluded: false,
  }, null, 2) + "\n");
  process.exit(0);
}

const { url, token } = endpointConfig();
const revisions = await loadState();
let ingested = 0, indexed = 0;
for (const tutorial of tutorials) {
  const document = sourceOf(tutorial);
  const expected_revision = Number(revisions[document.id] || 0);
  if (!Number.isSafeInteger(expected_revision) || expected_revision < 0) throw new Error("Corrupt local source revision for " + document.id);
  const result = await request(url, token, "/v1/documents/upsert", { ...document, expected_revision });
  if (!Number.isInteger(result.revision) || result.revision < 1) throw new Error("Invalid document revision for " + document.id);
  revisions[document.id] = result.revision;
  await saveState(revisions); // Safe resumability on any later partial failure.
  ingested++;
  for (const edge of edgesOf(tutorial)) {
    await request(url, token, "/v1/graph/edges/upsert", {
      ...edge, document_id: document.id, document_revision: result.revision,
    });
    indexed++;
  }
}
process.stdout.write(JSON.stringify({
  status: "indexed", documents: ingested, edges: indexed, collection: COLLECTION,
  statePath: STATE_FILE,
}) + "\n");
