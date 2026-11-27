import { describe, expect, it } from "vitest";
import { summariseSprint, sprintAcceptsAttempt } from "@/lib/qaSprintResults";

describe("targeted formative sprint recovery", () => {
  it("separates missed and unattempted questions and retries only those questions in order", () => {
    const ids = ["q1", "q2", "q3", "q4", "q2"];
    const result = summariseSprint(ids, {q1:true,q2:false,q4:true,other:false});
    expect(result).toEqual({total:4,attempted:3,correct:2,missed:1,unattempted:1,retryIds:["q2","q3"]});
    expect(ids).toEqual(["q1","q2","q3","q4","q2"]);
  });
  it("handles complete mastery, no attempts, and empty input", () => {
    expect(summariseSprint(["a","b"],{a:true,b:true}).retryIds).toEqual([]);
    expect(summariseSprint(["a","b"],{})).toMatchObject({attempted:0,unattempted:2,retryIds:["a","b"]});
    expect(summariseSprint([],{})).toEqual({total:0,attempted:0,correct:0,missed:0,unattempted:0,retryIds:[]});
  });
  it("does not count inherited properties as attempts", () => {
    const record = Object.create({q1:true});
    expect(summariseSprint(["q1"],record).unattempted).toBe(1);
  });
  it("accepts only the current question and rejects a timed attempt at or after expiry", () => {
    const values = {id:"q1",activeId:"q1",deadline:1000,now:999};
    expect(sprintAcceptsAttempt(values)).toBe(true);
    expect(sprintAcceptsAttempt({...values,now:1000})).toBe(false);
    expect(sprintAcceptsAttempt({...values,now:1001})).toBe(false);
    expect(sprintAcceptsAttempt({...values,id:"q2"})).toBe(false);
    expect(sprintAcceptsAttempt({...values,activeId:undefined})).toBe(false);
    expect(sprintAcceptsAttempt({...values,deadline:null,now:1001})).toBe(true);
    expect(sprintAcceptsAttempt({...values,now:NaN})).toBe(false);
  });
});
