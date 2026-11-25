type ReadState={isError:boolean;isFetching:boolean;isPending:boolean};
export function teacherReportStatus(reads:readonly ReadState[]):"error"|"loading"|"ready"{
  if(reads.some(r=>r.isFetching||r.isPending&&!r.isError))return "loading";
  return reads.some(r=>r.isError)?"error":"ready";
}
/** Only valid, completed scored attempts contribute to the returned mean.
 * Counts describe returned rows, not full enrolment or readiness. */
export function assignmentReport(rows:readonly {completed_at:string|null;score:number;total:number}[]){
  const completed=rows.filter(row=>Boolean(row.completed_at));
  const valid=completed.filter(row=>Number.isSafeInteger(row.total)&&row.total>0&&Number.isSafeInteger(row.score)&&row.score>=0&&row.score<=row.total);
  return {completed:completed.length,returned:rows.length,scored:valid.length,invalid:completed.length-valid.length,average:valid.length?Math.round(valid.reduce((sum,row)=>sum+100*row.score/row.total,0)/valid.length):null};
}
