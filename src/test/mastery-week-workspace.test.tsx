import {afterEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {MasteryWeekPlan} from "@/components/learning/MasteryWeekPlan";
import type {MasteryRow} from "@/lib/masteryRevision";
afterEach(cleanup);
const now=new Date(2026,10,25,12);
const row=(topic:string,day:number):MasteryRow=>({curriculum:"uk-gcse",subject:"physics",topic,mastery_score:50,confidence_score:40,attempts:5,correct_attempts:3,correct_streak:1,last_practised_at:null,next_review_at:new Date(2026,10,day,9).toISOString(),mastery_level:"developing"});
describe("weekly revision plan interaction",()=>{
  it("adjusts workload, switches days, and links to exact topics",()=>{
    const rows=[row("Energy",25),row("Waves",25),row("Fields",26)];
    render(<MemoryRouter><MasteryWeekPlan rows={rows} curriculum="uk-gcse" now={now} language="en"/></MemoryRouter>);
    expect(screen.getByRole("heading",{name:"Your seven-day revision plan"})).toBeVisible();
    expect(screen.getAllByRole("link",{name:"Practise topic"})).toHaveLength(2);
    fireEvent.change(screen.getByRole("combobox",{name:"Maximum topics per day"}),{target:{value:"1"}});
    expect(screen.getAllByRole("link",{name:"Practise topic"})).toHaveLength(1);
    const days=within(screen.getByRole("group",{name:"Select a revision day"})).getAllByRole("button");
    expect(days).toHaveLength(7);
    fireEvent.click(days[1]);
    expect(days[1]).toHaveAttribute("aria-pressed","true");
    const path=screen.getByRole("link",{name:"Practise topic"}).getAttribute("href");
    expect(path).toContain("curriculum=uk-gcse");
    expect(path).toContain("topic=Waves");
    expect(screen.getByText(/does not change your saved review dates/)).toBeVisible();
  });
  it("shows overflow and genuinely empty days in German",()=>{
    const rows=Array.from({length:5},(_,i)=>row("Thema "+i,31));
    render(<MemoryRouter><MasteryWeekPlan rows={rows} curriculum="uk-gcse" now={now} language="de"/></MemoryRouter>);
    expect(screen.getByText("Für diesen Tag sind keine Themen eingeplant.")).toBeVisible();
    expect(screen.getByText("Binnen sieben Tagen fällig, nicht eingeplant").nextElementSibling).toHaveTextContent("3");
    fireEvent.change(screen.getByRole("combobox",{name:"Maximale Themen pro Tag"}),{target:{value:"4"}});
    expect(screen.getByText("Binnen sieben Tagen fällig, nicht eingeplant").nextElementSibling).toHaveTextContent("1");
  });
});