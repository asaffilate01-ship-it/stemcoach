import { describe, expect, it } from "vitest";
import { qaStorageKeys, qaReviewPath, parseReviewFocus } from "@/lib/qaReviewFocus";
import { QA_HISTORY_KEY, QA_BOOKMARKS_KEY, recordReviewAttempt, serialiseBookmarks, serialiseReviewHistory } from "@/lib/qaPractice";
import { readRevisionOverview } from "@/lib/revisionOverview";

const entries = ["a","b","c","d"].map(id=>({id,subject:"mathematics",topic:"Example",format:"single"}));
describe("dashboard revision bridge",()=>{
  it("links only validated categories without identifiers, answer text or arbitrary destinations",()=>{
    expect(qaReviewPath("due")).toBe("/qa-clinic?review=due");
    expect(qaReviewPath("all")).toBe("/qa-clinic");
    expect(parseReviewFocus("saved")).toBe("saved");
    for(const raw of [null,"__proto__","https://other.example","due&account=private","NEW",["due"]]){
      expect(parseReviewFocus(raw)).toBe("all");
    }
  });
  it("counts only known distinct questions from the current account and does not read legacy keys",()=>{
    const keys=qaStorageKeys("a");
    const storage=new Map<string,string>();
    let history=recordReviewAttempt({}, "a", false, true,1000);
    history=recordReviewAttempt(history,"b",true,true,1000);
    history=recordReviewAttempt(history,"outside",false,true,1000);
    storage.set(keys.history,serialiseReviewHistory(history));
    storage.set(keys.bookmarks,serialiseBookmarks(["a","c","outside"]));
    storage.set(QA_HISTORY_KEY,serialiseReviewHistory(history));
    storage.set(QA_BOOKMARKS_KEY,serialiseBookmarks(["d"]));
    const readKeys:string[]=[];
    const result=readRevisionOverview([...entries,entries[0]],"a",key=>{readKeys.push(key);return storage.get(key)??null;},2000);
    expect(result).toEqual({counts:{all:4,due:1,missed:1,saved:2,new:2},practiced:2});
    expect(readKeys).toEqual([keys.history,keys.bookmarks]);
    expect(readRevisionOverview(entries,"b",key=>storage.get(key)??null,2000)).toEqual({counts:{all:4,due:0,missed:0,saved:0,new:4},practiced:0});
  });
  it("does not report zero progress when browser storage cannot be read",()=>{
    expect(readRevisionOverview(entries,"a",()=>{throw new Error("blocked");},1000)).toBeNull();
  });
});
