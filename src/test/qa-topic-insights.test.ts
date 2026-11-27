import { describe, expect, it } from "vitest";
import { buildTopicRevisionInsights } from "@/lib/qaTopicInsights";
import type { QuestionHistory } from "@/lib/qaPractice";

const row = (correctFirst:number, incorrectFirst:number, dueAt:number): QuestionHistory => ({
  attempts: correctFirst + incorrectFirst, correctFirst, incorrectFirst, firstTryStreak: 0, lastAt: 100, dueAt,
});
const candidate = (id:string, tutorialId="lesson-a", subject="mathematics") => ({
  id, tutorialId, subject, topic:"Shared title", format:"single",
});

describe("evidence-led exact-topic revision", () => {
  it("counts distinct questions and first attempts, prioritising due mistakes within the exact lesson", () => {
    const a = candidate("a"), b = candidate("b"), c = candidate("c");
    const result = buildTopicRevisionInsights([a,b,c,a,candidate("new")], {
      a:row(2,1,90), b:row(1,3,200), c:row(2,0,300), unrelated:row(0,4,50),
    }, 100);
    expect(result).toEqual([{
      tutorialId:"lesson-a",subject:"mathematics",topic:"Shared title",
      practicedQuestions:3,firstAttempts:9,firstCorrect:5,firstMistakes:4,dueQuestions:1,
      reviewIds:["a","b"],
    }]);
  });
  it("does not mix lesson IDs or subjects even when their names match", () => {
    const result = buildTopicRevisionInsights([
      candidate("a"),candidate("b","lesson-b"),candidate("c","lesson-c","physics"),
    ], {a:row(0,1,50),b:row(0,2,50),c:row(0,3,50)},100);
    expect(result.map(item=>[item.tutorialId,item.reviewIds])).toEqual([
      ["lesson-c",["c"]],["lesson-b",["b"]],["lesson-a",["a"]],
    ]);
    expect(buildTopicRevisionInsights([candidate("b","lesson-b")],{a:row(0,1,50),b:row(0,2,50)},100)[0].reviewIds).toEqual(["b"]);
  });
  it("ignores impossible counters, inherited history, unseen questions and invalid timestamps", () => {
    const history = Object.assign(Object.create({a:row(0,1,50)}), {
      b:{...row(2,1,50),attempts:1},c:row(0,0,50),d:row(1,0,200),e:row(0,1,NaN),
      f:row(0,1,80),
    });
    const items = ["a","b","c","d","e","f"].map(id=>candidate(id));
    expect(buildTopicRevisionInsights(items,history,100)[0].reviewIds).toEqual(["f"]);
    expect(buildTopicRevisionInsights(items,history,NaN)).toEqual([]);
    expect(buildTopicRevisionInsights(items,history,100,0)).toEqual([]);
  });
  it("caps recommendations and produces deterministic due-first ordering", () => {
    const items = Array.from({length:12},(_,i)=>candidate("q"+i,"lesson-"+i));
    const history = Object.fromEntries(items.map(item=>[item.id,row(0,1,50)]));
    expect(buildTopicRevisionInsights(items,history,100)).toHaveLength(3);
    expect(buildTopicRevisionInsights(items,history,100,100)).toHaveLength(10);
    expect(buildTopicRevisionInsights([...items].reverse(),history,100)).toEqual(buildTopicRevisionInsights(items,history,100));
  });
});
