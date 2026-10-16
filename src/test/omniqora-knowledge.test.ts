import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { parseEvidenceResult, safeLessonHref } from "@/lib/omniqoraEvidence";
import { tutorials } from "@/data/tutorials";
import { qaEntries } from "@/data/qaClinic";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const edgeFunction = read("supabase/functions/omniqora-learning-evidence/index.ts");

const valid = {
  provider: "Omniqora Knowledge Core",
  sourceClassification: "authored_unreviewed",
  reviewRequired: true,
  status: "draft",
  mode: "hybrid",
  method: "lexical_bm25",
  evidence: [{
    citationId: "C1", lessonId: "triangle-diagram-labelling",
    title: "Trigonometry: Label a Right Triangle", revision: 1,
    excerpt: "The hypotenuse is always opposite the right angle.",
  }],
  graphPaths: [{
    nodes: ["Trigonometry: Label a Right Triangle", "Identify the hypotenuse"],
    edges: [{
      source: "Trigonometry: Label a Right Triangle", relation: "teaches",
      target: "Identify the hypotenuse", citationId: "C1",
    }],
  }],
  claims: [{ text: "The hypotenuse is opposite the right angle.", citations: ["C1"] }],
};

describe("Omniqora Intelligence RAG/GraphRAG source boundary", () => {
  it("keeps the expanded lesson inventory as its only evidence source", () => {
    expect(tutorials.length).toBe(71);
    expect(qaEntries.length).toBe(216);
    expect(new Set(tutorials.map((t) => t.id)).size).toBe(tutorials.length);
    expect(safeLessonHref("triangle-diagram-labelling"))
      .toBe("/tutorials?tutorial=triangle-diagram-labelling");
    for (const unsafe of ["https://evil.example", "../admin", "math?next=evil", ""]) {
      expect(safeLessonHref(unsafe)).toBeNull();
    }
  });

  it("accepts only a locally attributable citation-bearing result", () => {
    const result = parseEvidenceResult(valid);
    expect(result.evidence[0].citationId).toBe("C1");
    expect(result.graphPaths[0].edges[0].citationId).toBe("C1");
    expect(result.status).toBe("draft");
    expect(result.method).toBe("lexical_bm25");
  });

  it("rejects unreviewed-source mislabelling, duplicated citations and unsupported claims", () => {
    expect(() => parseEvidenceResult({ ...valid, sourceClassification: "exam_board_verified" })).toThrow();
    expect(() => parseEvidenceResult({ ...valid, provider: "Unknown" })).toThrow();
    expect(() => parseEvidenceResult({ ...valid, evidence: [valid.evidence[0], valid.evidence[0]] })).toThrow();
    expect(() => parseEvidenceResult({ ...valid, claims: [{ text: "Uncited claim", citations: ["C2"] }] })).toThrow();
    expect(() => parseEvidenceResult({ ...valid, graphPaths: [{
      nodes: ["A", "B"], edges: [{ source: "A", relation: "X", target: "B", citationId: "C8" }],
    }] })).toThrow();
    expect(() => parseEvidenceResult({ ...valid, status: "evidence_only", claims: valid.claims })).toThrow();
  });

  it("authenticates before querying and derives source/tenant from server configuration", () => {
    expect(edgeFunction).toContain('supabase.auth.getUser(');
    expect(edgeFunction).toContain('supabase.from("user_quotas")');
    expect(edgeFunction).toContain('supabase.rpc("consume_coach_rate_limit"');
    expect(edgeFunction).toContain('TUTORIAL_CONTEXTS');
    expect(edgeFunction).toContain('tutorials.get(body.tutorialId)');
    expect(edgeFunction).toContain("!modes.has(body.mode as Mode)");
    expect(edgeFunction).toContain('collection !== "stemcoach-lessons"');
    expect(edgeFunction).toContain("provider.url + \"/v1/query\"");
    expect(edgeFunction).toContain("seeds: body.mode === \"rag\" ? [] : [lesson.title]");
    expect(edgeFunction).toContain('source_uri !== "urn:stemcoach:tutorial:" + lessonId');
    expect(edgeFunction).toContain('redirect: "error"');
    expect(edgeFunction).not.toContain("body.question");
    expect(edgeFunction).not.toContain("body.messages");
    expect(edgeFunction).not.toContain("raw_user_meta_data");
  });

  it("offers real dry-run source and graph manifest without calling a provider", () => {
    const preview = spawnSync(process.execPath, ["scripts/sync-omniqora-learning.mjs", "--dry-run"], {
      cwd: process.cwd(), encoding: "utf8", timeout: 15000,
      env: { ...process.env, OMNIQORA_STEMCOACH_INGEST_TOKEN: "" },
    });
    expect(preview.status, preview.stderr).toBe(0);
    const manifest = JSON.parse(preview.stdout);
    expect(manifest.mode).toBe("dry-run");
    expect(manifest.documents).toBe(tutorials.length);
    expect(manifest.proposedSourceEdges).toBeGreaterThan(150);
    expect(manifest.subjects).toHaveLength(14);
    expect(manifest.personalDataIncluded).toBe(false);
    expect(manifest.sourceClassification).toBe("authored_unreviewed");
  });

  it("keeps the privileged ingest credential out of the web bundle and student routes", () => {
    const ingester = read("scripts/sync-omniqora-learning.mjs");
    const panel = read("src/components/qa/OmniqoraEvidencePanel.tsx");
    const config = read("supabase/config.toml");
    expect(ingester).toContain('process.argv.includes("--apply")');
    expect(ingester).toContain("OMNIQORA_STEMCOACH_INGEST_TOKEN");
    expect(ingester).toContain("Learning objective: ");
    expect(ingester).toContain("/v1/graph/edges/upsert");
    expect(ingester).toContain("expected_revision");
    expect(panel).toContain('supabase.functions.invoke("omniqora-learning-evidence"');
    expect(panel).not.toContain("OMNIQORA_STEMCOACH_INGEST_TOKEN");
    expect(panel).not.toContain("OMNIQORA_STEMCOACH_QUERY_TOKEN");
    expect(panel).not.toContain("VITE_OMNIQORA");
    expect(config).toContain("[functions.omniqora-learning-evidence]");
  });
});
