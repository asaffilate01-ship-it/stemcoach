import {afterEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {VirtualLabWorkspace} from "@/components/learning/VirtualLabWorkspace";
afterEach(cleanup);

describe("finance lab workspace",()=>{
  it("shows a three-month schedule and demonstrates credit sales",()=>{
    render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/Cash flow and accrual profit/}));
    const profit=screen.getByText("Three-month accrual profit").nextElementSibling;
    expect(profit).toHaveTextContent("1,200 CU");
    expect(within(screen.getByRole("region",{name:"Three-month schedule"})).getAllByRole("heading",{name:/^Month /})).toHaveLength(3);
    fireEvent.change(screen.getByRole("slider",{name:"Sales collected immediately"}),{target:{value:"0"}});
    expect(profit).toHaveTextContent("1,200 CU");
    expect(screen.getByText("Closing receivables").nextElementSibling).toHaveTextContent("2,000 CU");
    expect(screen.getByText("Maximum month-end cash shortfall").nextElementSibling).toHaveTextContent("1,000 CU");
    fireEvent.click(screen.getByRole("button",{name:"Reset model"}));
    expect(screen.getByRole("slider",{name:"Sales collected immediately"})).toHaveValue("50");
  });
  it("updates the supply-demand graph and shortage at the chosen price",()=>{
    render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/Market supply and demand/}));
    expect(screen.getByText("Equilibrium price").nextElementSibling).toHaveTextContent("30 CU");
    expect(screen.getByRole("img",{name:/Supply and demand graph: Equilibrium price 30/})).toBeVisible();
    fireEvent.change(screen.getByRole("slider",{name:"Chosen market price"}),{target:{value:"20"}});
    expect(screen.getByText("Shortage").nextElementSibling).toHaveTextContent("40 units");
    fireEvent.change(screen.getByRole("slider",{name:"Chosen market price"}),{target:{value:"40"}});
    expect(screen.getByText("Surplus").nextElementSibling).toHaveTextContent("40 units");
  });
  it("preserves the chosen model and settings across interface locales",()=>{
    const {rerender}=render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/Market supply and demand/}));
    fireEvent.change(screen.getByRole("slider",{name:"Chosen market price"}),{target:{value:"20"}});
    rerender(<VirtualLabWorkspace language="de"/>);
    expect(screen.getByRole("heading",{name:"Angebot und Nachfrage"})).toBeVisible();
    expect(screen.getByRole("slider",{name:"Gewählter Marktpreis"})).toHaveValue("20");
    expect(screen.getByText("Nachfrageüberschuss").nextElementSibling).toHaveTextContent("40 Einheiten");
  });
});
