import { useState } from "react";
import { Calculator } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateStudyExpression } from "@/lib/numericalPractice";

export function StudyCalculator() {
  const { t } = useTranslation();
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calculateStudyExpression> | null>(null);

  return (
    <details className="min-w-0 rounded-2xl border bg-card p-3 shadow-sm sm:p-4">
      <summary className="cursor-pointer rounded-lg py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="inline-flex items-center gap-2"><Calculator className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{t("coach.calculator.title")}</span>
      </summary>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("coach.calculator.description")}</p>
      <form className="mt-3 space-y-2" onSubmit={event => { event.preventDefault(); setResult(calculateStudyExpression(expression)); }}>
        <label htmlFor="study-calculation" className="block text-sm font-medium">{t("coach.calculator.expression")}</label>
        <Input id="study-calculation" dir="ltr" autoComplete="off" maxLength={120}
          value={expression} placeholder="(3 + 5) / 4"
          onChange={event => { setExpression(event.target.value); setResult(null); }} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="min-h-11 flex-1 rounded-xl" disabled={!expression.trim()}>{t("coach.calculator.calculate")}</Button>
          <Button type="button" variant="outline" className="min-h-11 rounded-xl" onClick={() => { setExpression(""); setResult(null); }} disabled={!expression && !result}>{t("common.clear")}</Button>
        </div>
      </form>
      {result && <div role="status" className="mt-3 min-w-0 rounded-xl border bg-muted/20 p-3">
        {result.ok ? <><p className="text-xs font-medium text-muted-foreground">{t("coach.calculator.exact")}</p><p dir="ltr" className="mt-1 break-all text-lg font-semibold tabular-nums">{result.exact}</p></>
          : <p className="text-sm text-muted-foreground">{t(`coach.calculator.errors.${result.reason}`)}</p>}
      </div>}
      <p className="mt-3 text-xs text-muted-foreground">{t("coach.calculator.notice")}</p>
    </details>
  );
}
