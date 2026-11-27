import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RevisionOverview } from "@/components/dashboard/RevisionOverview";
import { qaEntries } from "@/data/qaClinic";
import { qaStorageKeys } from "@/lib/qaReviewFocus";
import { recordReviewAttempt, serialiseBookmarks, serialiseReviewHistory } from "@/lib/qaPractice";

vi.mock("react-i18next",()=>({useTranslation:()=>({t:(key:string)=>key})}));
const entry=qaEntries.find(q=>q.tutorialId==="arithmetic-sequences-nth-term")!;
const page=(accountId:string)=><MemoryRouter><RevisionOverview accountId={accountId}/></MemoryRouter>;
const region=()=>screen.getByRole("region",{name:"qa.reviewTitle"});
const link=(focus:string)=>within(region()).getByRole("link",{name:new RegExp("qa.reviewFilters."+focus+"$")});

describe("student dashboard revision overview",()=>{
  afterEach(()=>{cleanup();localStorage.clear();});
  it("shows the account's due and saved counts, refreshes on focus and resets on account switch",()=>{
    const a=qaStorageKeys("a"),b=qaStorageKeys("b");
    localStorage.setItem(a.history,serialiseReviewHistory(recordReviewAttempt({},entry.id,false,true,Date.now()-1000)));
    localStorage.setItem(a.bookmarks,serialiseBookmarks([entry.id]));
    const view=render(page("a"));
    expect(link("due")).toHaveTextContent("1qa.reviewFilters.due");
    expect(link("saved")).toHaveTextContent("1qa.reviewFilters.saved");
    expect(link("due")).toHaveAttribute("href","/qa-clinic?review=due");
    const topics=within(region()).getByRole("region",{name:"qa.topicRevision.title"});
    expect(within(topics).getByRole("link",{name:"qa.dashboardTopicReview.openLabel"})).toHaveAttribute("href","/qa-clinic?subject=mathematics&topic=arithmetic-sequences-nth-term&review=due");
    expect(within(topics).getByRole("heading",{name:entry.topic})).toBeVisible();
    expect(within(region()).getByRole("link",{name:"qa.explore"})).toHaveAttribute("href","/qa-clinic?review=due");
    localStorage.removeItem(a.history);
    fireEvent.focus(window);
    expect(link("due")).toHaveTextContent("0qa.reviewFilters.due");
    expect(within(region()).queryByRole("region",{name:"qa.topicRevision.title"})).not.toBeInTheDocument();
    view.rerender(page("b"));
    expect(link("saved")).toHaveTextContent("0qa.reviewFilters.saved");
    expect(link("due")).toHaveTextContent("0qa.reviewFilters.due");
    expect(localStorage.getItem(b.bookmarks)).toBeNull();
    expect(within(region()).queryByRole("region",{name:"qa.topicRevision.title"})).not.toBeInTheDocument();
    view.rerender(page("a"));
    expect(link("saved")).toHaveTextContent("1qa.reviewFilters.saved");
  });
});
