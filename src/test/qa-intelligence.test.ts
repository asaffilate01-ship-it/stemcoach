import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { tutorials } from "@/data/tutorials";
import { qaEntries } from "@/data/qaClinic";
import { QA_KNOWLEDGE_CATALOG } from "../../supabase/functions/_shared/qaKnowledgeCatalog";
import { QA_CONCEPT_EDGES } from "../../supabase/functions/_shared/qaConceptGraph";
import {
  retrieveGroundedKnowledge, reorderVerifiedSources, buildCitationContext,
} from "../../supabase/functions/_shared/qaRetrieval";

const file = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Omniqora Intelligence lesson retrieval and concept graph", () => {
  it("indexes only the public author-drafted lesson corpus, not paid bank answers or learner details", () => {
    expect(QA_KNOWLEDGE_CATALOG).toHaveLength(71);
    expect(tutorials).toHaveLength(71);
    expect(qaEntries).toHaveLength(216);
    expect(new Set(QA_KNOWLEDGE_CATALOG.map((doc) => doc.id)).size).toBe(71);
    expect(new Set(QA_KNOWLEDGE_CATALOG.map((doc) => doc.subject)).size).toBe(14);
    for (const doc of QA_KNOWLEDGE_CATALOG) {
      const lesson = tutorials.find((entry) => entry.id === doc.id);
      expect(lesson, doc.id).toBeDefined();
      expect(doc.subject).toBe(lesson!.subject);
      expect(doc.title).toBe(lesson!.title);
      expect(doc.content).toContain(lesson!.summary);
      expect(doc.content).toContain(lesson!.lesson[0]);
      expect(doc.content).toContain(lesson!.workedExample);
      expect(doc.provenance).toBe("stemcoach-authored-draft");
      expect(doc.content.length).toBeGreaterThan(100);
      expect(doc.content.length).toBeLessThan(1700);
    }
  });

  it("validates every editorial graph edge and prohibits phantom or self-loop lessons", () => {
    const ids = new Set(QA_KNOWLEDGE_CATALOG.map((doc) => doc.id));
    expect(QA_CONCEPT_EDGES).toHaveLength(46);
    const pairs = new Set<string>();
    for (const edge of QA_CONCEPT_EDGES) {
      expect(ids.has(edge.from)).toBe(true);
      expect(ids.has(edge.to)).toBe(true);
      expect(edge.from).not.toBe(edge.to);
      expect(edge.reason.length).toBeGreaterThan(35);
      expect(["builds-on", "applies-to", "related"]).toContain(edge.kind);
      const key = [edge.from, edge.to].sort().join("/");
      expect(pairs.has(key)).toBe(false);
      pairs.add(key);
    }
  });

  it("retrieves subject-scoped evidence, stable lesson citations and meaningful graph neighbors", () => {
    const result = retrieveGroundedKnowledge({
      query: "How does the triangle hypotenuse relate to opposite and adjacent?",
      subject: "mathematics",
      focusId: "triangle-diagram-labelling",
    });
    expect(result.evidence[0].id).toBe("triangle-diagram-labelling");
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.evidence.length).toBeLessThanOrEqual(3);
    expect(result.evidence.every((doc) => doc.subject === "mathematics")).toBe(true);
    expect(result.evidence[0].href).toBe("/tutorials?tutorial=triangle-diagram-labelling");
    expect(result.graph.some((edge) => edge.lessonId === "right-triangle-trigonometry")).toBe(true);
    expect(result.graph.every((edge) => edge.href.startsWith("/tutorials?tutorial="))).toBe(true);
    expect(result.corpusStatus).toBe("authored-not-academically-verified");
    expect(buildCitationContext(result)).toContain("[LESSON:triangle-diagram-labelling]");
    expect(buildCitationContext(result)).toContain("NOT independently exam-board verified");
  });

  it("can navigate two hops without claiming these connections are factual citations", () => {
    const graph = retrieveGroundedKnowledge({
      query: "rates of change and waves",
      subject: "mathematics",
      focusId: "arithmetic-sequences",
    });
    expect(graph.evidence[0].id).toBe("arithmetic-sequences");
    expect(graph.graph.some((edge) => edge.distance === 1)).toBe(true);
    expect(graph.graph.some((edge) => edge.distance === 2)).toBe(true);
    expect(graph.graph.every((edge) => Boolean(edge.reason))).toBe(true);
  });

  it("does not return another subject's evidence, or hallucinate a match for an irrelevant query", () => {
    const physics = retrieveGroundedKnowledge({
      query: "French modal verbs and classroom speech",
      subject: "physics",
      focusId: "german-modal-verbs",
    });
    expect(physics.evidence.every((doc) => doc.subject === "physics")).toBe(true);
    expect(physics.evidence.some((doc) => doc.id === "german-modal-verbs")).toBe(false);
    const irrelevant = retrieveGroundedKnowledge({
      query: "qwertyzzxxvvu12345", subject: "physics",
    });
    expect(irrelevant.evidence).toHaveLength(0);
    expect(irrelevant.graph).toHaveLength(0);
    expect(buildCitationContext(irrelevant)).toMatch(/No relevant authored/);
  });

  it("accepts only local source IDs from an optional remote Omniqora re-ranker", () => {
    const evidence = retrieveGroundedKnowledge({
      query: "cell membrane nucleus cytoplasm",
      subject: "biology", focusId: "animal-cell-diagram",
    }).evidence;
    expect(evidence.length).toBeGreaterThanOrEqual(2);
    const reordered = reorderVerifiedSources(evidence, [
      "unapproved-tenant-confidential-document",
      evidence[1].id, evidence[1].id, "user-123", evidence[0].id,
    ]);
    expect(reordered).toHaveLength(evidence.length);
    expect(reordered[0].id).toBe(evidence[1].id);
    expect(new Set(reordered.map((entry) => entry.id))).toEqual(new Set(evidence.map((entry) => entry.id)));
    expect(reorderVerifiedSources(evidence, { answer: "forged" })).toEqual(evidence);
  });

  it("passes only authored references to AI tutor and protects paid-assessment answer keys", () => {
    const source = file("supabase/functions/ai-chat/index.ts");
    const adapter = file("supabase/functions/_shared/omniqoraIntelligence.ts");
    const retrieval = file("supabase/functions/_shared/qaRetrieval.ts");
    expect(source).toContain("retrieveGroundedKnowledge");
    expect(source).toContain("buildCitationContext");
    expect(source).toContain("rerankWithOmniqora");
    expect(source).toContain("quotaResult.data.total_questions");
    expect(source).toContain('subject: subjectId,');
    expect(source).toContain("[LESSON:lesson-id]");
    expect(source).toContain("Grounding material");
    expect(adapter).toContain("OMNIQORA_INTELLIGENCE_RERANK_ENABLED");
    expect(adapter).toContain('=== "true"');
    expect(adapter).toContain('classification: "public-education-draft"');
    expect(adapter).toContain("return reorderVerifiedSources");
    expect(adapter).toContain("AbortSignal.timeout(1400)");
    expect(adapter).not.toContain("userId:");
    expect(adapter).not.toContain("student_answer");
    expect(adapter).not.toContain("req.headers");
    expect(retrieval).not.toContain("user_quotas");
    expect(retrieval).not.toContain("supabase.from");
    const ui = file("src/components/qa/KnowledgeConnections.tsx");
    expect(ui).toContain("retrieveGroundedKnowledge");
    expect(ui).toContain("qa.draftSourceNotice");
    expect(ui).toContain("qa.omniqoraEndorsement");
    expect(file("src/pages/QAClinic.tsx")).toContain("<KnowledgeConnections ");
    expect(file("src/pages/Tutorials.tsx")).toContain("<KnowledgeConnections ");
  });
});
