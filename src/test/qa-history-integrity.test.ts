import { describe, expect, it } from "vitest";
import { buildReviewQueue, getQuestionHistory, getReviewSummary, parseReviewHistory, recordReviewAttempt, serialiseReviewHistory, type QuestionHistory, type ReviewHistory } from "@/lib/qaPractice";
import { getReviewFocusCounts } from "@/lib/qaReviewFocus";
import { buildQAWeeklyPlan } from "@/lib/qaWeeklyPlan";
import { buildTopicRevisionInsights } from "@/lib/qaTopicInsights";

const now = new Date(2026, 10, 27, 12).getTime();
const row = (correctFirst=1, incorrectFirst=0, lastAt=now): QuestionHistory => ({
  attempts: correctFirst + incorrectFirst, correctFirst, incorrectFirst,
  firstTryStreak: 0, lastAt, dueAt: lastAt,
});
const candidate = (id:string) => ({ id, subject:"mathematics", topic:"Example", format:"single", tutorialId:"example" });
const envelope = (entries:unknown) => JSON.stringify({version:1,entries});

describe("consistent device revision evidence", () => {
  it("rejects impossible counters, malformed dates and reserved IDs without inventing attempts", () => {
    const valid = row(2,1);
    const entries = Object.fromEntries([
      ["valid",valid], ["bad-total",{...valid,attempts:1}],
      ["negative",{...valid,incorrectFirst:-1}], ["streak",{...valid,firstTryStreak:3}],
      ["date",{...valid,dueAt:"0"}], ["null-date",{...valid,lastAt:null}],
      ["far-future",{...valid,dueAt:Number.MAX_SAFE_INTEGER}],
      ["fraction",{...valid,correctFirst:1.5}], ["__proto__",valid],
      ["constructor",valid], ["unknown",valid],
    ]);
    const ids = new Set(Object.keys(entries).filter(id => id !== "unknown"));
    expect(parseReviewHistory(envelope(entries), ids)).toEqual({valid});
    expect(getQuestionHistory(Object.create({valid}),"valid")).toBeUndefined();
    expect(recordReviewAttempt({}, "__proto__", true, true, now)).toEqual({});
  });

  it("retains exact counts for long histories and never rescales them into a fictional sample", () => {
    const original = { long: row(12000,8000) };
    const restored = parseReviewHistory(serialiseReviewHistory(original), new Set(["long"]));
    expect(restored).toEqual(original);
    const next = recordReviewAttempt(restored,"long",false,true,now+1);
    expect(next.long.attempts).toBe(20001);
    expect(next.long.correctFirst).toBe(12000);
    expect(next.long.incorrectFirst).toBe(8001);
    expect(original.long.attempts).toBe(20000);
  });

  it("keeps the most recently practised rows rather than the most recently inserted keys", () => {
    const entries:ReviewHistory = Object.fromEntries(Array.from({length:1501},(_,i)=>["q"+i,row(1,0,now+i)]));
    entries.q0 = row(1,0,now+5000);
    const parsed = parseReviewHistory(envelope(entries),new Set(Object.keys(entries)));
    expect(Object.keys(parsed)).toHaveLength(1500);
    expect(parsed.q0).toBeDefined();
    expect(parsed.q1).toBeUndefined();
    expect(parseReviewHistory(serialiseReviewHistory(entries),new Set(Object.keys(entries)))).toEqual(parsed);
    const added = recordReviewAttempt(parsed,"fresh",false,true,now+6000);
    expect(Object.keys(added)).toHaveLength(1500);
    expect(added.fresh).toBeDefined();
    expect(added.q0).toBeDefined();
    expect(added.q2).toBeUndefined();
  });

  it("keeps serialised storage readable at its own size limit", () => {
    const entries = Object.fromEntries(Array.from({length:1500},(_,i)=>["q"+i+"x".repeat(150),row(1,0,now+i)]));
    const encoded = serialiseReviewHistory(entries);
    expect(encoded.length).toBeLessThanOrEqual(250000);
    const parsed = parseReviewHistory(encoded,new Set(Object.keys(entries)));
    expect(Object.keys(parsed).length).toBeGreaterThan(0);
    expect(parsed["q1499"+"x".repeat(150)]).toBeDefined();
    expect(parsed["q0"+"x".repeat(150)]).toBeUndefined();
  });

  it("uses the same validated evidence across summary, dashboard focus, weekly plan and topic recommendations", () => {
    const entries = [candidate("good"),candidate("bad"),candidate("unseen"),candidate("good")];
    const history = {good:row(1,1),bad:{...row(1,0),correctFirst:100}};
    const summary = getReviewSummary(entries,history,now);
    expect(summary.practiced).toBe(1);
    expect(summary.firstTryAccuracy).toBe(50);
    expect(getReviewFocusCounts(entries,{history,saved:new Set(),now})).toEqual({all:3,due:1,missed:1,saved:0,new:2});
    const plan = buildQAWeeklyPlan(entries,history,now)[0];
    expect(plan.dueCount).toBe(1);
    expect(plan.newCount).toBe(2);
    expect(plan.questionIds[0]).toBe("good");
    expect(buildTopicRevisionInsights(entries,history,now)[0].reviewIds).toEqual(["good"]);
    expect(buildReviewQueue(entries,history,10,"adaptive",now,()=>NaN)).toHaveLength(3);
    expect(buildReviewQueue(entries,history,Infinity,"mixed",now)).toEqual([]);
  });
});
