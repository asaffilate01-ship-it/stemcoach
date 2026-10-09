import { useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Lightbulb, RotateCcw, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TutorialCheckpoint } from "@/data/tutorials";
import { displayAnswer, emptyResponse, getQuestionFormat, hasResponse, isCorrectResponse } from "@/lib/qaEngine";

interface Props {
  question: TutorialCheckpoint;
  questionId: string;
  workedExample?: string;
  examTip?: string;
  commonMistake?: string;
  onAttempt?: (correct: boolean, firstAttempt: boolean) => void;
}

export function QuestionInteraction({ question, questionId, workedExample, examTip, commonMistake, onAttempt }: Props) {
  const { t } = useTranslation();
  const format = getQuestionFormat(question);
  const [response, setResponse] = useState(() => emptyResponse(question));
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [feedback, setFeedback] = useState<boolean | null>(null);

  const pickChoice = (option: string) => {
    if (revealed) return;
    setResponse((previous) => ({ ...previous, choice: option }));
  };

  const toggleMulti = (option: string) => {
    if (revealed) return;
    setResponse((previous) => ({
      ...previous,
      choices: previous.choices.includes(option)
        ? previous.choices.filter((value) => value !== option)
        : [...previous.choices, option],
    }));
  };

  const moveOrder = (index: number, direction: number) => {
    if (revealed || index + direction < 0 || index + direction >= response.order.length) return;
    setResponse((previous) => {
      const order = [...previous.order];
      [order[index], order[index + direction]] = [order[index + direction], order[index]];
      return { ...previous, order };
    });
  };

  const reveal = () => {
    if (revealed) {
      setRevealed(false);
      return;
    }
    if (hasResponse(question, response)) {
      const correct = isCorrectResponse(question, response);
      setFeedback(correct);
      onAttempt?.(correct, attemptCount === 0);
      setAttemptCount((count) => count + 1);
    } else {
      // Revealing without a response is unscored and doesn't count as correct.
      setFeedback(null);
    }
    setRevealed(true);
  };

  const retry = () => {
    setResponse(emptyResponse(question));
    setFeedback(null);
    setRevealed(false);
  };

  return (
    <div className="space-y-3">
      <span className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary">
        {t(`qa.formats.${format}`)}
      </span>
      {(format === "single" || format === "true-false" || format === "multiple") && (
        <div className="grid gap-2" role="group" aria-label={t("qa.answerOptions")}>
          {question.options.map((option, index) => {
            const chosen = format === "multiple" ? response.choices.includes(option) : response.choice === option;
            return (
              <button type="button" key={option} aria-pressed={chosen} disabled={revealed}
                onClick={() => format === "multiple" ? toggleMulti(option) : pickChoice(option)}
                className={chosen
                  ? "w-full rounded-xl border border-primary bg-primary/10 px-3 py-2.5 text-left text-sm"
                  : "w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/40 focus-visible:outline-primary"}>
                <span className="mr-2 text-xs font-bold text-muted-foreground">{format === "multiple" ? "☐" : String.fromCharCode(65 + index) + "."}</span>
                {option}
              </button>
            );
          })}
        </div>
      )}
      {(format === "numeric" || format === "short-text") && (
        <div>
          <label className="mb-1 block text-xs font-semibold" htmlFor={questionId + "-response"}>
            {t(format === "numeric" ? "qa.answerNumber" : "qa.answerWritten")}
          </label>
          <Input id={questionId + "-response"} type="text" inputMode={format === "numeric" ? "decimal" : "text"}
            autoComplete="off" maxLength={120} disabled={revealed}
            placeholder={t(format === "numeric" ? "qa.numberPlaceholder" : "qa.writtenPlaceholder")}
            value={response.freeText} onChange={(event) => setResponse((prev) => ({ ...prev, freeText: event.target.value }))} />
        </div>
      )}
      {format === "ordering" && (
        <ol className="space-y-2" aria-label={t("qa.orderInstructions")}>
          {response.order.map((option, index) => (
            <li className="flex items-center gap-2 rounded-xl border bg-muted/20 p-2" key={option}>
              <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground">{index + 1}</span>
              <span className="min-w-0 flex-1 text-sm">{option}</span>
              <Button type="button" variant="outline" size="icon" aria-label={t("qa.moveUp", { item: option })}
                disabled={revealed || index === 0} onClick={() => moveOrder(index, -1)}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" aria-label={t("qa.moveDown", { item: option })}
                disabled={revealed || index === response.order.length - 1} onClick={() => moveOrder(index, 1)}>
                <ArrowDown className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ol>
      )}
      {format === "matching" && (
        <div className="space-y-2">
          {(question.pairs || []).map((pair, index) => (
            <div key={pair.left} className="grid items-center gap-2 rounded-xl border p-3 sm:grid-cols-2">
              <label className="text-sm font-medium" htmlFor={questionId + "-match-" + index}>{pair.left}</label>
              <select id={questionId + "-match-" + index} value={response.matches[pair.left] || ""} disabled={revealed}
                onChange={(event) => setResponse((prev) => ({ ...prev, matches: { ...prev.matches, [pair.left]: event.target.value } }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="">{t("qa.chooseMatch")}</option>
                {question.options.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
      {question.hint && !revealed && (
        <div>
          <Button type="button" size="sm" variant="ghost" className="gap-1.5 text-xs" aria-expanded={showHint}
            onClick={() => setShowHint((previous) => !previous)}>
            <Lightbulb className="h-4 w-4" /> {showHint ? t("qa.hideHint") : t("qa.showHint")}
          </Button>
          {showHint && <p className="mt-1 rounded-lg bg-amber-500/10 p-3 text-xs leading-5">{question.hint}</p>}
        </div>
      )}
      {revealed && (
        <div className="space-y-3 rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm" role="status">
          {feedback !== null && <p className={feedback
            ? "flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300"
            : "font-semibold text-amber-700 dark:text-amber-300"}>
            {feedback && <CheckCircle2 className="h-4 w-4" />}
            {t(feedback ? "qa.correct" : "qa.incorrect")}
          </p>}
          <p><strong>{t("qa.correctAnswer")}:</strong> {displayAnswer(question)}</p>
          <div><h4 className="mb-1 font-semibold">{t("qa.why")}</h4><p className="whitespace-pre-wrap">{question.explanation}</p></div>
          {workedExample && <div><h4 className="mb-1 font-semibold">{t("qa.workedExample")}</h4><p className="whitespace-pre-wrap">{workedExample}</p></div>}
          {commonMistake && <p><strong>{t("qa.commonMistake")}:</strong> {commonMistake}</p>}
          {examTip && <p><strong>{t("qa.examTip")}:</strong> {examTip}</p>}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant={revealed ? "secondary" : "outline"} className="gap-1.5 rounded-xl"
          aria-expanded={revealed} onClick={reveal}>
          <Eye className="h-4 w-4" /> {revealed ? t("qa.hideAnswer") : t("qa.checkAndExplain")}
        </Button>
        {revealed && feedback === false && (
          <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={retry}>
            <RotateCcw className="h-4 w-4" /> {t("qa.tryAgain")}
          </Button>
        )}
      </div>
    </div>
  );
}
