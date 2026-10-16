import { reorderVerifiedSources, type GroundedEvidence } from "./qaRetrieval.ts";

/**
 * Omniqora Intelligence education reranker adapter.
 * Disabled until the real gateway URL, API key and matching contract are
 * configured server-side. It NEVER receives a learner message, user ID,
 * assessment answer, email, JWT or institution membership data.
 *
 * Contract: omniqora.education.source-rerank.v1
 * Request: {contract, corpus, classification, subject, curriculum,
 *           candidates:[{id,title,excerpt}]}
 * Response: {contract, rankedIds:string[]}
 */
export async function rerankWithOmniqora(
  evidence: GroundedEvidence[],
  subject: string,
  curriculum: string,
): Promise<GroundedEvidence[]> {
  const enabled = Deno.env.get("OMNIQORA_INTELLIGENCE_RERANK_ENABLED") === "true";
  const endpoint = Deno.env.get("OMNIQORA_INTELLIGENCE_RERANK_URL");
  const key = Deno.env.get("OMNIQORA_INTELLIGENCE_API_KEY");
  if (!enabled || !endpoint || !key || evidence.length < 2) return evidence;

  let target: URL;
  try {
    target = new URL(endpoint);
    if (target.protocol !== "https:" || target.username || target.password ||
        target.hash || target.search || !target.hostname || target.port) return evidence;
  } catch {
    return evidence;
  }

  const contract = "omniqora.education.source-rerank.v1";
  // External traffic consists of public authored lesson excerpts ONLY.
  const body = {
    contract,
    corpus: "stemcoach-public-tutorials",
    classification: "public-education-draft",
    subject,
    curriculum,
    candidates: evidence.slice(0, 5).map((doc) => ({
      id: doc.id,
      title: doc.title,
      excerpt: doc.content.slice(0, 300),
    })),
  };

  try {
    const response = await fetch(target.toString(), {
      method: "POST",
      signal: AbortSignal.timeout(1400),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) return evidence;
    const length = Number(response.headers.get("content-length") || 0);
    if (length > 16384) return evidence;
    const payload = await response.json();
    if (!payload || payload.contract !== contract || !Array.isArray(payload.rankedIds))
      return evidence;
    return reorderVerifiedSources(evidence, payload.rankedIds);
  } catch {
    // No third-party error or response data is exposed to learners.
    return evidence;
  }
}
