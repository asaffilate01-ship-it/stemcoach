import { describe, expect, it } from "vitest";
import { newLanguageExpansion, NEW_LANGUAGE_SUBJECTS } from "@/data/tutorialExpansionNewLanguages";
import { tutorials } from "@/data/tutorials";
import { qaEntries } from "@/data/qaClinic";
import { subjects } from "@/data/questions";
import { TUTORIAL_CONTEXTS } from "../../supabase/functions/_shared/tutorialCatalog";
import { emptyResponse, getQuestionFormat, inspectQuestion, isCorrectResponse } from "@/lib/qaEngine";
import { studySpeechLanguage } from "@/lib/subjectLanguage";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("new language formative foundation", () => {
  it("adds nine lessons with ninety valid checks across exactly three new subjects", () => {
    expect(NEW_LANGUAGE_SUBJECTS).toEqual(["italian","spanish","arabic"]);
    expect(newLanguageExpansion).toHaveLength(9);
    for (const subject of NEW_LANGUAGE_SUBJECTS)
      expect(newLanguageExpansion.filter((lesson) => lesson.subject === subject)).toHaveLength(3);
    expect(newLanguageExpansion.reduce((n, t) => n + 1 + (t.practice?.length || 0), 0)).toBe(90);
    expect(subjects).toHaveLength(17);
    expect(tutorials).toHaveLength(212);
    expect(qaEntries).toHaveLength(1262);
    expect(new Set(tutorials.map((t)=>t.id)).size).toBe(212);
    expect(new Set(qaEntries.map((q)=>q.id)).size).toBe(1262);
    expect(new Set(tutorials.map((t)=>t.subject))).toEqual(new Set(subjects.map((s)=>s.id)));
  });
  it("checks all 90 authored answer keys and rejects a different option or free text", () => {
    const seen = new Set<string>();
    let total = 0;
    for (const t of newLanguageExpansion) {
      expect(t.lesson).toHaveLength(3);
      expect(t.objectives).toHaveLength(3);
      expect(t.workedExample.length).toBeGreaterThan(65);
      expect(t.examTip?.length).toBeGreaterThan(25);
      expect(t.commonMistake?.length).toBeGreaterThan(30);
      const checks = [t.checkpoint,...(t.practice || [])];
      expect(checks).toHaveLength(10);
      for (const q of checks) {
        expect(inspectQuestion(q), `${t.id}: ${q.question}`).toEqual([]);
        expect(q.explanation.length).toBeGreaterThan(22);
        expect(q.hint?.length).toBeGreaterThan(20);
        const correct = emptyResponse(q), wrong = emptyResponse(q);
        const format = getQuestionFormat(q);
        if (format === "short-text") {
          correct.freeText = q.answer;
          wrong.freeText = "___wrong___";
        } else if (format === "single" || format === "true-false") {
          correct.choice = q.answer;
          wrong.choice = q.options.find((o) => o !== q.answer) || "";
        } else throw new Error("Unsupported language-check format: "+format);
        expect(isCorrectResponse(q, correct)).toBe(true);
        expect(isCorrectResponse(q, wrong)).toBe(false);
        const fingerprint = t.subject + ":" + q.question.normalize("NFKC").toLowerCase();
        expect(seen.has(fingerprint), fingerprint).toBe(false);
        seen.add(fingerprint);
        total++;
      }
    }
    expect(total).toBe(90);
  });
  it("maintains exact source allowlist parity and language-specific narration", () => {
    expect(TUTORIAL_CONTEXTS.map(({id,subject,title})=>({id,subject,title})))
      .toEqual(tutorials.map(({id,subject,title})=>({id,subject,title})));
    expect(studySpeechLanguage("italian")).toBe("it-IT");
    expect(studySpeechLanguage("spanish")).toBe("es-ES");
    expect(studySpeechLanguage("arabic")).toBe("ar-SA");
    expect(studySpeechLanguage("mathematics")).toBe("en-GB");
  });
  it("supports direction-appropriate Arabic content without enabling unfinished UI locales", () => {
    const qa = readFileSync(resolve(process.cwd(),"src/pages/QAClinic.tsx"),"utf8");
    const tutorial = readFileSync(resolve(process.cwd(),"src/pages/Tutorials.tsx"),"utf8");
    const question = readFileSync(resolve(process.cwd(),"src/components/qa/QuestionInteraction.tsx"),"utf8");
    const languages = readFileSync(resolve(process.cwd(),"src/i18n/language.ts"),"utf8");
    expect(qa).toContain('dir="auto"');
    expect(tutorial).toContain('dir="auto"');
    expect(question).toContain('speechLanguage');
    expect(question).toContain('utterance.lang = speechLanguage');
    expect(languages).toContain('"en", "fr", "de"');
  });
});
