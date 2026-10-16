import { useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, GitBranch, LibraryBig } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { retrieveGroundedKnowledge } from "../../../supabase/functions/_shared/qaRetrieval.ts";

interface Props {
  subject: string;
  question: string;
  tutorialId: string;
}

export function KnowledgeConnections({ subject, question, tutorialId }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const grounding = useMemo(() =>
    retrieveGroundedKnowledge({ subject, query: question, focusId: tutorialId, limit: 3 }),
    [subject, question, tutorialId],
  );

  if (grounding.evidence.length === 0 && grounding.graph.length === 0) return null;

  return (
    <section aria-label={t("qa.knowledgeTitle")} className="mt-3 rounded-xl border border-primary/15 bg-primary/5 p-3">
      <Button type="button" variant="ghost" size="sm" className="w-full justify-between gap-2 text-xs font-semibold"
        aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span className="flex items-center gap-2"><GitBranch className="h-4 w-4 text-primary" />{t("qa.knowledgeTitle")}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      {open && (
        <div className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
            <strong>{t("qa.knowledgeSources")}</strong>
            <span className="text-muted-foreground">{t("qa.omniqoraEndorsement")}</span>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">{t("qa.draftSourceNotice")}</p>
          <div className="space-y-2">
            {grounding.evidence.map((source) => (
              <div key={source.id} className="rounded-lg border bg-background/80 p-3">
                <Link to={source.href} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                  <LibraryBig className="h-4 w-4" /> {source.title}
                </Link>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {source.content.slice(0, 240)}{source.content.length > 240 ? "…" : ""}
                </p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">[LESSON:{source.id}]</p>
              </div>
            ))}
          </div>

          {grounding.graph.length > 0 && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 text-xs font-semibold">
                <GitBranch className="h-4 w-4 text-primary" /> {t("qa.knowledgeRelated")}
              </h4>
              {grounding.graph.map((edge) => (
                <div key={edge.lessonId} className="rounded-lg border bg-background/80 p-3">
                  <Link to={edge.href} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    <BookOpen className="h-4 w-4" />{edge.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">{edge.reason}</p>
                  <span className="mt-1 inline-block text-[10px] text-muted-foreground">
                    {t(edge.distance === 1 ? "qa.knowledgeDirect" : "qa.knowledgeTwoHop")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
