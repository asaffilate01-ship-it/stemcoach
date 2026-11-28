import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ExamReview } from "@/components/mock-exam/ExamReview";
import { requireConfirmedMockExamResult } from "@/lib/mockExamGrading";

vi.mock("react-i18next",()=>({useTranslation:()=>({t:(key:string)=>key})}));
const questions=[{id:"q1",question_text:"Synthetic examination question",options:["Alpha","Beta"],topic:"Example",subject:"mathematics",difficulty:1,points:1}];
const submitted=[{question_id:"q1",answer:"alpha"}];
const response={score:1,total:1,percent:100,certificate_issued:false,results:[{
  question_id:"q1",answer:"alpha",correct:true,correct_answer:"Alpha",explanation:"Confirmed explanation",worked_solution:null,
}]};

describe("confirmed examination review UI",()=>{
  afterEach(cleanup);
  it("renders a normalized correct answer and does not invent a certificate",()=>{
    const result=requireConfirmedMockExamResult(submitted,response);
    render(<MemoryRouter><ExamReview questions={questions} result={result} flagged={new Set()} selectedTemplate={null} onBrowse={()=>{}} /></MemoryRouter>);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.queryByText("mockExam.certificateProfile")).not.toBeInTheDocument();
    const toggle=screen.getByRole("button",{name:"mockExam.review"});
    expect(toggle).toHaveAttribute("aria-expanded","false");
    fireEvent.click(toggle);
    expect(screen.getByText("Confirmed explanation")).toBeInTheDocument();
    expect(screen.queryByText(/mockExam.yourAnswer/)).not.toBeInTheDocument();
    expect(screen.getByRole("button",{name:"mockExam.hideAnswers"})).toHaveAttribute("aria-expanded","true");
  });
  it("displays the certificate banner only when the server confirms issuance",()=>{
    const result=requireConfirmedMockExamResult(submitted,{...response,certificate_issued:true});
    render(<MemoryRouter><ExamReview questions={questions} result={result} flagged={new Set()} selectedTemplate={null} onBrowse={()=>{}} /></MemoryRouter>);
    expect(screen.getByText("mockExam.certificateProfile")).toBeInTheDocument();
  });
});
