import { describe, expect, it } from "vitest";
import { bindNewMockSubmission, requireCurrentMockKeys, type MockSession, type PublishedQuestion } from "../../docs/staging/mock-exam-session-contract";

const user="00000000-0000-4000-8000-000000000001";
const other="00000000-0000-4000-8000-000000000002";
const exam="00000000-0000-4000-8000-000000000003";
const first="00000000-0000-4000-8000-000000000004";
const second="00000000-0000-4000-8000-000000000005";
const session: MockSession={id:exam,userId:user,expiresAt:10000,subject:"mathematics",curriculum:"GCSE",questions:[{id:first,revision:2},{id:second,revision:1}]};
const body={exam_session_id:exam,submissions:[{question_id:second,answer:" "},{question_id:first,answer:"  40/2  "}]};
const row=(id:string,revision:number):PublishedQuestion=>({id,subject:session.subject,curriculum:session.curriculum,review_status:"published",review_revision:revision,question_type:"mcq",correct_answer:"20"});
describe("staged mock examination session contract",()=>{
  it("binds exactly the assigned set and returns deterministic server ordering",()=>{
    expect(bindNewMockSubmission(user,session,body,9999)).toEqual([{question_id:first,answer:"40/2"},{question_id:second,answer:null}]);
  });
  it("rejects other learners, expired sessions, and malformed or arbitrary submissions",()=>{
    expect(()=>bindNewMockSubmission(other,session,body,9999)).toThrow();
    expect(()=>bindNewMockSubmission(user,session,body,10000)).toThrow();
    expect(()=>bindNewMockSubmission(user,session,body,NaN)).toThrow();
    expect(()=>bindNewMockSubmission(user,session,{...body,user_id:user},9999)).toThrow();
    expect(()=>bindNewMockSubmission(user,session,{...body,exam_session_id:other},9999)).toThrow();
    expect(()=>bindNewMockSubmission(user,session,{...body,submissions:[body.submissions[0]]},9999)).toThrow();
    expect(()=>bindNewMockSubmission(user,session,{...body,submissions:[body.submissions[0],body.submissions[0]]},9999)).toThrow();
    expect(()=>bindNewMockSubmission(user,session,{...body,submissions:[{question_id:other,answer:"x"},body.submissions[1]]},9999)).toThrow();
    for(const answer of [123,undefined,"x".repeat(2001),"a\u0000b"]){
      expect(()=>bindNewMockSubmission(user,session,{...body,submissions:[{question_id:second,answer},body.submissions[1]]},9999)).toThrow();
    }
  });
  it("requires every assigned question to remain published, unchanged and gradeable",()=>{
    const a=row(first,2),b=row(second,1);
    expect(requireCurrentMockKeys(session,[b,a]).get(first)).toEqual(a);
    for(const invalid of [
      {...a,review_revision:3},{...a,review_status:"archived"},{...a,correct_answer:" "},
      {...a,question_type:"essay"},{...a,subject:"physics"},{...a,curriculum:"A Level"},
      {...a,id:other}
    ])expect(()=>requireCurrentMockKeys(session,[invalid,b])).toThrow();
    expect(()=>requireCurrentMockKeys(session,[a])).toThrow();
    expect(()=>requireCurrentMockKeys(session,[a,a])).toThrow();
    expect(()=>requireCurrentMockKeys({...session,questions:[session.questions[0],session.questions[0]]},[a,b])).toThrow();
  });
});
