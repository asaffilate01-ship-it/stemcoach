import {describe,it,expect} from "vitest";
import {teacherReportStatus,assignmentReport} from "@/lib/teacherReporting";
const ready={isError:false,isFetching:false,isPending:false};
describe("teacher reporting boundaries",()=>{
 it("distinguishes failed and pending reports from confirmed empty data",()=>{
  expect(teacherReportStatus([ready])).toBe("ready");
  expect(teacherReportStatus([ready,{...ready,isError:true}])).toBe("error");
  expect(teacherReportStatus([ready,{...ready,isFetching:true}])).toBe("loading");
  expect(teacherReportStatus([ready,{...ready,isPending:true}])).toBe("loading");
 });
 it("calculates a mean only from valid completed scores and keeps genuine zero distinct",()=>{
  expect(assignmentReport([]).average).toBeNull();
  expect(assignmentReport([{completed_at:null,score:0,total:10}]).average).toBeNull();
  expect(assignmentReport([{completed_at:"date",score:0,total:10}]).average).toBe(0);
  expect(assignmentReport([{completed_at:"date",score:5,total:10},{completed_at:"date",score:3,total:4},{completed_at:"date",score:8,total:2},{completed_at:null,score:0,total:5}])).toEqual({completed:3,returned:4,scored:2,invalid:1,average:63});
 });
});
