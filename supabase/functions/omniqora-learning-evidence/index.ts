import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { TUTORIAL_CONTEXTS } from "../_shared/tutorialCatalog.ts";

/**
 * STEMCoach → Omniqora Knowledge Core.
 *
 * No free-form question, chat history, account email, school/tenant ID or
 * learner answers are sent to Omniqora. An authenticated caller selects one
 * canonical authored tutorial + an allowed retrieval mode. The backend
 * derives the exact source query and a fixed shared curriculum collection.
 *
 * This endpoint does not activate an Omniqora AI Factory worker or claim that
 * any model, vector index, credentials or institution is provisioned.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") || "https://stemcoach.lovable.app",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

type Mode = "rag" | "graph" | "hybrid";
const modes = new Set<Mode>(["rag", "graph", "hybrid"]);
const tutorials = new Map<string, { id: string; title: string; subject: string }>(
  TUTORIAL_CONTEXTS.map((item) => [item.id, item]),
);
const response = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: corsHeaders });

async function readLimitedJSON(req: Request): Promise<unknown> {
  const reader = req.body?.getReader();
  if (!reader) throw new Error("invalid_body");
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 2048) { await reader.cancel(); throw new Error("too_large"); }
    chunks.push(value);
  }
  const all = new Uint8Array(bytes);
  let position = 0;
  for (const chunk of chunks) { all.set(chunk, position); position += chunk.length; }
  return JSON.parse(new TextDecoder().decode(all));
}

function configuredEndpoint(): { url: string; token: string; collection: string } | null {
  const raw = Deno.env.get("OMNIQORA_KNOWLEDGE_URL") || "";
  const token = Deno.env.get("OMNIQORA_STEMCOACH_QUERY_TOKEN") || "";
  const collection = Deno.env.get("OMNIQORA_STEMCOACH_COLLECTION") || "stemcoach-lessons";
  if (!raw || token.length < 32 || collection !== "stemcoach-lessons") return null;
  try {
    const u = new URL(raw);
    // Host is controlled by a deployment secret; never allow browser URLs,
    // HTTP, embedded credentials, redirects, local networks or URL parameters.
    const host = u.hostname.toLowerCase();
    if (u.protocol !== "https:" || u.username || u.password || u.search || u.hash ||
        (u.pathname !== "/" && u.pathname !== "") || u.port ||
        !host.includes(".") || host === "localhost" || host.endsWith(".localhost") ||
        host.endsWith(".local") || host.startsWith("127.") ||
        host.startsWith("10.") || host.startsWith("192.168.") ||
        host.startsWith("172.") || /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
        host === "::1" || host.startsWith("[")) return null;
    return { url: u.origin, token, collection };
  } catch {
    return null;
  }
}

function safeEvidence(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("invalid_evidence");
  const row = input as Record<string, unknown>;
  if (typeof row.citation_id !== "string" || !/^C[1-8]$/.test(row.citation_id) ||
      typeof row.document_id !== "string" || !row.document_id.startsWith("lesson-") ||
      typeof row.source_uri !== "string" || typeof row.title !== "string" ||
      typeof row.quote !== "string" || (typeof row.revision !== "number" || !Number.isInteger(row.revision)) ||
      Number(row.revision) < 1 || row.title.length > 180 || row.quote.length > 4000) {
    throw new Error("invalid_evidence");
  }
  const lessonId = row.document_id.slice(7);
  if (!tutorials.has(lessonId) ||
      row.source_uri !== "urn:stemcoach:tutorial:" + lessonId) {
    // Hard boundary: do not relay cross-collection or tenant documents.
    throw new Error("foreign_evidence");
  }
  return {
    citationId: row.citation_id,
    lessonId,
    title: row.title,
    revision: Number(row.revision),
    excerpt: row.quote.slice(0, 900),
  };
}

function parseKnowledgeResult(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("invalid_response");
  const body = input as Record<string, unknown>;
  const status = body.status;
  if (!["draft", "evidence_only", "insufficient_evidence"].includes(String(status)) ||
      !Array.isArray(body.evidence) || body.evidence.length > 8 ||
      !Array.isArray(body.graph_paths) || body.graph_paths.length > 24 ||
      body.review_required !== true) throw new Error("invalid_response");

  const evidence = body.evidence.map(safeEvidence);
  const citations = new Set(evidence.map((item) => item.citationId));
  if (citations.size !== evidence.length) throw new Error("duplicate_citation");

  const graphPaths = body.graph_paths.slice(0, 6).map((path: unknown) => {
    if (!path || typeof path !== "object") throw new Error("invalid_graph");
    const graph = path as Record<string, unknown>;
    if (!Array.isArray(graph.nodes) || graph.nodes.length > 5 ||
        !Array.isArray(graph.edges) || graph.edges.length > 3) throw new Error("invalid_graph");
    const nodes = graph.nodes.map((node: unknown) => {
      if (typeof node !== "string" || node.length > 200) throw new Error("invalid_graph");
      return node;
    });
    const edges = graph.edges.map((raw: unknown) => {
      if (!raw || typeof raw !== "object") throw new Error("invalid_graph");
      const edge = raw as Record<string, unknown>;
      if (typeof edge.source !== "string" || typeof edge.target !== "string" ||
          typeof edge.relation !== "string" || typeof edge.citation_id !== "string" ||
          edge.source.length > 200 || edge.target.length > 200 ||
          edge.relation.length > 80 || !citations.has(edge.citation_id)) {
        throw new Error("invalid_graph");
      }
      return {
        source: edge.source,
        relation: edge.relation,
        target: edge.target,
        citationId: edge.citation_id,
      };
    });
    return { nodes, edges };
  });

  const claims: Array<{ text: string; citations: string[] }> = [];
  if (status === "draft") {
    if (!Array.isArray(body.claims) || body.claims.length < 1 || body.claims.length > 12) {
      throw new Error("unsupported_claim");
    }
    for (const raw of body.claims) {
      if (!raw || typeof raw !== "object") throw new Error("unsupported_claim");
      const claim = raw as Record<string, unknown>;
      if (typeof claim.text !== "string" || claim.text.length > 3000 ||
          !Array.isArray(claim.citations) || claim.citations.length < 1 ||
          claim.citations.length > 8 || !claim.citations.every((id) => typeof id === "string" && citations.has(id))) {
        throw new Error("unsupported_claim");
      }
      claims.push({ text: claim.text.slice(0, 650), citations: claim.citations as string[] });
    }
  }

  const trace = body.trace && typeof body.trace === "object"
    ? body.trace as Record<string, unknown> : {};
  const retrieval = trace.retrieval && typeof trace.retrieval === "object"
    ? trace.retrieval as Record<string, unknown> : {};
  const method = typeof retrieval.method === "string" && ["lexical_bm25", "bm25_vector_rrf", "graph_only"].includes(retrieval.method)
    ? retrieval.method : "unavailable";

  return { status, evidence, graphPaths, claims, method, reviewRequired: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "POST required" }, 405);
  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return response({ error: "Sign in required" }, 401);
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return response({ error: "Service unavailable" }, 503);
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7));
    if (authError || !user) return response({ error: "Sign in required" }, 401);

    let incoming: unknown;
    try { incoming = await readLimitedJSON(req); } catch {
      return response({ error: "Invalid or oversized request" }, 400);
    }
    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
      return response({ error: "Invalid request" }, 400);
    }
    const body = incoming as Record<string, unknown>;
    if (Object.keys(body).some((field) => !["tutorialId", "mode", "checkIndex"].includes(field)) ||
        typeof body.tutorialId !== "string" ||
        typeof body.mode !== "string" || !modes.has(body.mode as Mode) ||
        (typeof body.checkIndex !== "number" || !Number.isInteger(body.checkIndex)) || Number(body.checkIndex) < 0 || Number(body.checkIndex) > 3) {
      return response({ error: "Invalid tutorial or retrieval mode" }, 422);
    }
    const lesson = tutorials.get(body.tutorialId);
    if (!lesson) return response({ error: "Tutorial not found" }, 404);

    // Same entitlements as STEMCoach's existing AI coaching. This is a
    // read-only intelligence add-on, not a new credit or answer-bank grant.
    const [quota, rate] = await Promise.all([
      supabase.from("user_quotas").select("total_questions, subjects").eq("user_id", user.id).maybeSingle(),
      supabase.rpc("consume_coach_rate_limit", { _user_id: user.id, _max_requests: 20, _window_seconds: 60 }),
    ]);
    if (rate.error || rate.data !== true) return response({ error: "Coaching rate limit or verification unavailable" }, rate.error ? 503 : 429);
    if (quota.error) return response({ error: "Entitlement unavailable" }, 503);
    if (!quota.data || quota.data.total_questions <= 0 ||
        (quota.data.subjects?.length && !quota.data.subjects.includes(lesson.subject))) {
      return response({ error: "An eligible STEMCoach question pack is required" }, 403);
    }

    const provider = configuredEndpoint();
    if (!provider) return response({ error: "Omniqora Knowledge Core is not provisioned for STEMCoach" }, 503);
    // Intentionally derived from *published application metadata*, not a
    // browser-provided prompt. No student question text, answer, ID or email.
    const canonicalQuery =
      lesson.title + " — explain this lesson's main concept, worked example, and knowledge check "
      + (Number(body.checkIndex) + 1) + " with supporting source excerpts.";
    let upstream: Response;
    try {
      upstream = await fetch(provider.url + "/v1/query", {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(12000),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + provider.token,
        },
        body: JSON.stringify({
          collection: provider.collection,
          question: canonicalQuery,
          mode: body.mode,
          seeds: body.mode === "rag" ? [] : [lesson.title],
          hops: 2,
          top_k: 6,
          language: "en",
        }),
      });
    } catch {
      return response({ error: "Source retrieval temporarily unavailable" }, 502);
    }
    if (!upstream.ok) return response({ error: "Omniqora source retrieval unavailable" }, 502);
    const raw = await upstream.text();
    if (raw.length > 64000) return response({ error: "Invalid knowledge response" }, 502);
    let result: ReturnType<typeof parseKnowledgeResult>;
    try { result = parseKnowledgeResult(JSON.parse(raw)); } catch {
      return response({ error: "Invalid or foreign source evidence" }, 502);
    }
    return response({
      ...result,
      mode: body.mode,
      provider: "Omniqora Knowledge Core",
      sourceClassification: "authored_unreviewed",
    });
  } catch {
    return response({ error: "Source retrieval temporarily unavailable" }, 503);
  }
});
