import { QA_KNOWLEDGE_CATALOG, QA_KNOWLEDGE_VERSION, type PublicLessonEvidence } from "./qaKnowledgeCatalog.ts";
import { QA_CONCEPT_EDGES, type LessonConceptEdge } from "./qaConceptGraph.ts";

/**
 * Grounded retrieval over public authored teaching excerpts. Local lexical
 * ranking plus explicit two-hop GraphRAG. This is not an embeddings/vector
 * index, nor official exam-board-verified knowledge.
 */
const stopWords = new Set([
  "about","all","and","are","because","can","could","does","for","from",
  "has","how","into","its","please","should","that","the","their","there",
  "these","this","use","uses","using","what","when","which","why","with",
  "you","your","answer","question","correct","solve","explain","step","steps",
]);

function tokenize(value: string): string[] {
  const normalized = value.normalize("NFKD").toLowerCase();
  const words = normalized.match(/[\p{L}\p{N}]{3,}/gu) || [];
  return [...new Set(words.filter((word) => !stopWords.has(word)).map((word) =>
    word.length > 5 && word.endsWith("s") ? word.slice(0, -1) : word
  ))].slice(0, 48);
}

const evidenceById = new Map(QA_KNOWLEDGE_CATALOG.map((item) => [item.id, item]));
const termsById = new Map(QA_KNOWLEDGE_CATALOG.map((item) => [
  item.id, {
    title: new Set(tokenize(item.title)),
    body: new Set(tokenize(item.content)),
  },
]));

export interface KnowledgeLookup {
  query: string;
  subject: string;
  focusId?: string;
  limit?: number;
}

export interface GroundedEvidence extends PublicLessonEvidence {
  score: number;
  href: string;
}

export interface GraphConnection {
  lessonId: string;
  title: string;
  subject: string;
  kind: LessonConceptEdge["kind"];
  reason: string;
  distance: 1 | 2;
  via?: string;
  href: string;
}

export interface KnowledgeResult {
  version: string;
  evidence: GroundedEvidence[];
  graph: GraphConnection[];
  corpusStatus: "authored-not-academically-verified";
}

const lessonHref = (id: string) => "/tutorials?tutorial=" + encodeURIComponent(id);

export function retrieveGroundedKnowledge({
  query, subject, focusId, limit = 3,
}: KnowledgeLookup): KnowledgeResult {
  const words = tokenize(String(query || "").slice(0, 500));
  const ranked: GroundedEvidence[] = QA_KNOWLEDGE_CATALOG
    .filter((doc) => doc.subject === subject)
    .map((doc) => {
      const index = termsById.get(doc.id)!;
      const score = words.reduce((sum, word) =>
        sum + (index.title.has(word) ? 5 : 0) + (index.body.has(word) ? 1.5 : 0), 0
      ) + (doc.id === focusId ? 18 : 0);
      return { ...doc, score, href: lessonHref(doc.id) };
    })
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, Math.max(0, Math.min(limit, 5)));

  const seed = focusId && ranked.some((item) => item.id === focusId)
    ? focusId
    : ranked[0]?.id;
  const graph: GraphConnection[] = [];

  if (seed) {
    // A directly relevant cited source can also be a meaningful graph neighbor.
    const visited = new Set([seed]);
    const addConnections = (origin: string, distance: 1 | 2, via?: string): string[] => {
      const newIds: string[] = [];
      for (const edge of QA_CONCEPT_EDGES) {
        const target = edge.from === origin ? edge.to
          : edge.to === origin ? edge.from
          : undefined;
        if (!target || visited.has(target)) continue;
        const evidence = evidenceById.get(target);
        if (!evidence) continue;
        visited.add(target);
        graph.push({
          lessonId: target,
          title: evidence.title,
          subject: evidence.subject,
          kind: edge.kind,
          reason: edge.reason,
          distance,
          via,
          href: lessonHref(target),
        });
        newIds.push(target);
        if (graph.length === 5) break;
      }
      return newIds;
    };

    const firstHop = addConnections(seed, 1);
    for (const neighbor of firstHop.slice(0, 2)) {
      if (graph.length >= 5) break;
      addConnections(neighbor, 2, neighbor);
    }
  }

  return {
    version: QA_KNOWLEDGE_VERSION,
    evidence: ranked,
    graph,
    corpusStatus: "authored-not-academically-verified",
  };
}

/**
 * An untrusted remote gateway can reorder local candidates but cannot add
 * source text or introduce another learner/tenant's evidence.
 */
export function reorderVerifiedSources(
  entries: GroundedEvidence[], candidateIds: unknown,
): GroundedEvidence[] {
  if (!Array.isArray(candidateIds)) return entries;
  const allowed = new Map(entries.map((entry) => [entry.id, entry]));
  const reordered: GroundedEvidence[] = [];
  for (const value of candidateIds.slice(0, 8)) {
    if (typeof value !== "string" || !allowed.has(value)) continue;
    const entry = allowed.get(value)!;
    if (!reordered.includes(entry)) reordered.push(entry);
  }
  return [...reordered, ...entries.filter((entry) => !reordered.includes(entry))];
}

export function buildCitationContext(result: KnowledgeResult): string {
  if (result.evidence.length === 0) {
    return "No relevant authored STEMCoach lesson excerpts were retrieved.";
  }
  const chunks = result.evidence.slice(0, 3).map((doc) =>
    "[LESSON:" + doc.id + "] " + doc.title + " (" + doc.provenance + ")\n" +
    doc.content.slice(0, 680)
  );
  const edges = result.graph.slice(0, 3).map((edge) =>
    edge.lessonId + " (" + edge.kind + "): " + edge.reason
  );
  return "Authored learning excerpts (NOT independently exam-board verified):\n" +
    chunks.join("\n\n") +
    "\n\nCurated GraphRAG concept links (learning suggestions, not scientific proofs):\n" +
    (edges.join("\n") || "No direct concept links.");
}
