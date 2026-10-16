import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookMarked, ChevronDown, ChevronUp, CircleHelp, ExternalLink, GitBranch, Loader2, SearchCheck, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { parseEvidenceResult, safeLessonHref, type EvidenceResult, type KnowledgeMode } from "@/lib/omniqoraEvidence";

interface Props {
  tutorialId: string;
  checkIndex: number;
}

const modes: KnowledgeMode[] = ["hybrid", "rag", "graph"];

/** The only upstream request identifies an approved authored lesson + check index. */
export function OmniqoraEvidencePanel({ tutorialId, checkIndex }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [opened, setOpened] = useState(false);
  const [mode, setMode] = useState<KnowledgeMode>("hybrid");
  const [resultByMode, setResultByMode] = useState<Partial<Record<KnowledgeMode, EvidenceResult>>>({});
  const [loadingMode, setLoadingMode] = useState<KnowledgeMode | null>(null);
  const [error, setError] = useState("");

  const result = resultByMode[mode];
  const retrieve = async (next: KnowledgeMode) => {
    if (!user || resultByMode[next] || loadingMode) return;
    setLoadingMode(next);
    setError("");
    try {
      const { data, error: requestError } = await supabase.functions.invoke("omniqora-learning-evidence", {
        body: { tutorialId, checkIndex, mode: next },
      });
      if (requestError) throw requestError;
      const parsed = parseEvidenceResult(data as unknown);
      if (parsed.mode !== next) throw new Error("Mismatched retrieval mode");
      setResultByMode((current) => ({ ...current, [next]: parsed }));
    } catch {
      setError(t("qa.evidenceUnavailable"));
    } finally {
      setLoadingMode(null);
    }
  };

  const onToggle = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!opened) void retrieve(mode);
    setOpened((wasOpen) => !wasOpen);
  };

  return (
    <div className="rounded-xl border border-primary/15 bg-muted/20 p-3" data-testid="omniqora-evidence-panel">
      <Button type="button" variant="ghost" size="sm" onClick={onToggle}
        aria-expanded={opened} className="w-full justify-between gap-2 text-left">
        <span className="flex items-center gap-2">
          <SearchCheck className="h-4 w-4 text-primary" />
          {t(user ? "qa.exploreEvidence" : "qa.signInEvidence")}
        </span>
        {opened ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      {opened && user && (
        <div className="mt-3 space-y-4 border-t pt-3">
          <div className="flex flex-wrap gap-2">
            {modes.map((item) => (
              <Button key={item} type="button" size="sm" variant={item === mode ? "default" : "outline"}
                onClick={() => { setMode(item); void retrieve(item); }} disabled={Boolean(loadingMode)}
                aria-pressed={item === mode}>
                {t(`qa.evidenceModes.${item}`)}
              </Button>
            ))}
          </div>
          <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {t("qa.evidenceReviewNotice")}
          </p>
          {loadingMode === mode && (
            <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("qa.evidenceLoading")}
            </p>
          )}
          {error && !result && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {result && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {t("qa.evidenceMethod")}: {t(`qa.retrievalMethods.${result.method}`)}
              </p>
              {result.status === "insufficient_evidence" && (
                <p className="flex gap-2 text-sm text-muted-foreground">
                  <CircleHelp className="h-4 w-4 shrink-0" /> {t("qa.noGroundedEvidence")}
                </p>
              )}
              {result.status === "draft" && result.claims.map((claim, index) => (
                <div className="rounded-lg border border-amber-500/30 p-3 text-sm" key={index}>
                  <p className="mb-1 text-xs font-bold text-amber-700 dark:text-amber-300">{t("qa.aiDraft")}</p>
                  <p className="leading-6">{claim.text}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{claim.citations.map((ref) => "[" + ref + "]").join(" ")}</p>
                </div>
              ))}
              {result.graphPaths.length > 0 && (
                <section>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <GitBranch className="h-4 w-4" /> {t("qa.relatedConcepts")}
                  </h4>
                  <div className="space-y-2">
                    {result.graphPaths.slice(0, 4).flatMap((path, i) =>
                      path.edges.map((edge, j) => (
                        <div key={i + "-" + j} className="rounded-lg border bg-background p-3 text-xs">
                          <strong>{edge.source}</strong> → {edge.relation} → <strong>{edge.target}</strong> [{edge.citationId}]
                        </div>
                      )))}
                  </div>
                </section>
              )}
              {result.evidence.length > 0 && (
                <section>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <BookMarked className="h-4 w-4" /> {t("qa.sourceExcerpts")}
                  </h4>
                  <div className="space-y-2">
                    {result.evidence.map((item) => {
                      const path = safeLessonHref(item.lessonId);
                      return (
                        <div className="rounded-lg border bg-background p-3 text-xs" key={item.citationId}>
                          <p className="mb-1 font-semibold">[{item.citationId}] {item.title}</p>
                          <p className="whitespace-pre-wrap leading-5 text-muted-foreground">{item.excerpt}</p>
                          {path && (
                            <Link className="mt-2 inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
                              to={path}>
                              {t("qa.openCitedLesson")} <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
