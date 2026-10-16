/**
 * Browser-safe projection of the backend's tenant-scoped Omniqora response.
 * Never accept backend-supplied URLs; all citations resolve to canonical
 * STEMCoach tutorial routes by a bounded lesson identifier.
 */
export type KnowledgeMode = "rag" | "hybrid" | "graph";
export type RetrievalMethod = "lexical_bm25" | "bm25_vector_rrf" | "graph_only" | "unavailable";

export interface LessonEvidence {
  citationId: string;
  lessonId: string;
  title: string;
  revision: number;
  excerpt: string;
}
export interface GraphRelation {
  source: string;
  relation: string;
  target: string;
  citationId: string;
}
export interface EvidenceResult {
  status: "draft" | "evidence_only" | "insufficient_evidence";
  evidence: LessonEvidence[];
  graphPaths: Array<{ nodes: string[]; edges: GraphRelation[] }>;
  claims: Array<{ text: string; citations: string[] }>;
  method: RetrievalMethod;
  mode: KnowledgeMode;
  reviewRequired: true;
  provider: "Omniqora Knowledge Core";
  sourceClassification: "authored_unreviewed";
}

export function safeLessonHref(lessonId: string): string | null {
  return /^[a-z0-9][a-z0-9-]{1,79}$/.test(lessonId)
    ? "/tutorials?tutorial=" + encodeURIComponent(lessonId) : null;
}

export function parseEvidenceResult(payload: unknown): EvidenceResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid source response");
  const result = payload as Partial<EvidenceResult>;
  if (result.provider !== "Omniqora Knowledge Core" ||
      result.sourceClassification !== "authored_unreviewed" || result.reviewRequired !== true ||
      !["draft", "evidence_only", "insufficient_evidence"].includes(String(result.status)) ||
      !["rag", "graph", "hybrid"].includes(String(result.mode)) ||
      !["lexical_bm25", "bm25_vector_rrf", "graph_only", "unavailable"].includes(String(result.method)) ||
      !Array.isArray(result.evidence) || result.evidence.length > 8 ||
      !Array.isArray(result.graphPaths) || result.graphPaths.length > 6 ||
      !Array.isArray(result.claims) || result.claims.length > 12) throw new Error("Invalid source response");

  const refs = new Set<string>();
  for (const item of result.evidence) {
    if (!item || typeof item !== "object" || !/^C[1-8]$/.test(item.citationId) ||
        refs.has(item.citationId) || !safeLessonHref(item.lessonId) ||
        typeof item.title !== "string" || item.title.length > 180 ||
        typeof item.excerpt !== "string" || item.excerpt.length > 900 ||
        !Number.isInteger(item.revision) || item.revision < 1) throw new Error("Invalid citation");
    refs.add(item.citationId);
  }
  for (const claim of result.claims) {
    if (!claim || typeof claim.text !== "string" || claim.text.length > 650 ||
        !Array.isArray(claim.citations) || !claim.citations.length ||
        claim.citations.some((id) => !refs.has(id))) throw new Error("Unattributed claim");
  }
  if (result.status !== "draft" && result.claims.length) throw new Error("Unexpected claims");
  for (const path of result.graphPaths) {
    if (!path || !Array.isArray(path.nodes) || path.nodes.length > 5 ||
        !Array.isArray(path.edges) || path.edges.length > 3 ||
        path.edges.some((edge) => !edge || !refs.has(edge.citationId) ||
          typeof edge.source !== "string" || edge.source.length > 200 ||
          typeof edge.target !== "string" || edge.target.length > 200 ||
          typeof edge.relation !== "string" || edge.relation.length > 80)) {
      throw new Error("Unattributed graph connection");
    }
  }
  return result as EvidenceResult;
}
