import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { qaEntries } from "@/data/qaClinic";
import { tutorials } from "@/data/tutorials";
import {
  DRAFT_VARIANT_CAPACITY, DRAFT_VARIANT_SKILLS, VARIANTS_PER_SKILL, previewDraftVariants,
} from "@/lib/draftVariantBank";

const LESSON_GOAL = 500;
const QUESTION_GOAL = 1_000_000;
const PAGE_SIZE = 5;

/**
 * Admin-only companion to the existing authenticated generation/review flow.
 * This is a local, deterministic preview; it never writes to a question table.
 */
export function DraftVariantPreview() {
  const [start, setStart] = useState(0);
  const items = useMemo(() => previewDraftVariants(start, PAGE_SIZE), [start]);
  const skillIndex = Math.floor(start / VARIANTS_PER_SKILL);

  const goTo = (requested: number) => {
    if (!Number.isSafeInteger(requested) || requested < 0) return;
    setStart(Math.min(requested, DRAFT_VARIANT_CAPACITY - 1));
  };

  return (
    <section aria-labelledby="draft-generator-heading" className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
      <div className="mb-5">
        <p className="stem-label">Academic content scale programme</p>
        <h2 id="draft-generator-heading" className="mt-1 text-xl font-bold">1M questions · 500 lessons</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Authoring targets are distinct from generator capacity and from independently reviewed, published questions.
          These variants are temporary teaching drafts; nothing is automatically uploaded or certified.
        </p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">Guided teaching lessons</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{tutorials.length.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/ {LESSON_GOAL}</span></p>
          <p className="mt-1 text-xs text-muted-foreground">{Math.max(0, LESSON_GOAL - tutorials.length)} additional substantive lessons needed</p>
        </div>
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">Authored lesson self-checks</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{qaEntries.length.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted-foreground">Formative practice only; not verified exam-bank inventory</p>
        </div>
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">Potential parameterised drafts</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{DRAFT_VARIANT_CAPACITY.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted-foreground">16 skill templates × 65,536 unique combinations; target {QUESTION_GOAL.toLocaleString()} distinct approved questions</p>
        </div>
      </div>

      <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-foreground">
        <strong>Quality gate:</strong> generated variants are not published exam questions. Require specification mapping,
        duplicate and answer checks, independent academic review, safeguarding and approval through the existing editorial workflow.
      </p>

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
        <div>
          <Label htmlFor="draft-skill-select">Preview a question skill</Label>
          <select
            id="draft-skill-select"
            value={skillIndex}
            onChange={(event) => goTo(Number(event.target.value) * VARIANTS_PER_SKILL)}
            className="mt-1 flex min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {DRAFT_VARIANT_SKILLS.map((name, i) => <option key={name} value={i}>{name.replace(/-/g, " ")}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="draft-start-index">First draft index</Label>
          <Input
            id="draft-start-index"
            type="number"
            min={0}
            max={DRAFT_VARIANT_CAPACITY - 1}
            step={1}
            value={start}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isSafeInteger(value) && value >= 0 && value < DRAFT_VARIANT_CAPACITY) goTo(value);
            }}
            className="mt-1 min-h-11"
          />
        </div>
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span aria-live="polite">Showing {items.length} of {DRAFT_VARIANT_CAPACITY.toLocaleString()} available draft variations</span>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" disabled={start === 0} onClick={() => goTo(Math.max(0, start - PAGE_SIZE))}>
            Previous
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={start + PAGE_SIZE >= DRAFT_VARIANT_CAPACITY} onClick={() => goTo(start + PAGE_SIZE)}>
            Next
          </Button>
        </div>
      </div>
      <ol className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-border/70 p-4">
            <div className="mb-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-md bg-muted px-2 py-1 capitalize">{item.subject.replace(/-/g, " ")}</span>
              <span className="rounded-md bg-muted px-2 py-1">{item.skill.replace(/-/g, " ")}</span>
              <span className="rounded-md border px-2 py-1">Draft · not reviewed</span>
            </div>
            <p className="break-words text-sm font-semibold">{item.question}</p>
            <details className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <summary className="cursor-pointer font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Reveal answer and working</summary>
              <div className="mt-2 space-y-1">
                <p className="font-semibold">Answer: {item.answer}</p>
                <p className="text-muted-foreground">{item.workedSolution}</p>
              </div>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
