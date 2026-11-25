import {afterEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {VirtualLabWorkspace} from "@/components/learning/VirtualLabWorkspace";
afterEach(cleanup);
describe("advanced finance lab interactions",()=>{
  it("shows journal and trial balance and keeps profit constant when collections change",()=>{
    render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/Double-entry bookkeeping/}));
    expect(within(screen.getByRole("table",{name:"Trial balance"})).getAllByRole("row")).toHaveLength(8);
    expect(screen.getByText("Profit or loss").nextElementSibling).toHaveTextContent("800 CU");
    fireEvent.change(screen.getByRole("slider",{name:"Credit sales collected"}),{target:{value:"100"}});
    expect(screen.getByText("Profit or loss").nextElementSibling).toHaveTextContent("800 CU");
    const table=screen.getByRole("table",{name:"Trial balance"});
    expect(within(table).getByRole("row",{name:/Receivables/})).toHaveTextContent("0.00");
    fireEvent.click(screen.getByRole("button",{name:"Reset model"}));
    expect(screen.getByRole("slider",{name:"Credit sales collected"})).toHaveValue("50");
  });
  it("identifies unit elasticity and identical-price undefined result",()=>{
    render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/Price elasticity of demand/}));
    expect(screen.getByRole("status")).toHaveTextContent("Inelastic demand");
    fireEvent.change(screen.getByRole("slider",{name:"Initial price"}),{target:{value:"60"}});
    expect(screen.getByRole("status")).toHaveTextContent("Unit elastic");
    fireEvent.change(screen.getByRole("slider",{name:"New price"}),{target:{value:"60"}});
    expect(screen.getByRole("status")).toHaveTextContent("Undefined: prices are identical");
  });
  it("retains the selected bookkeeping model and control state in German",()=>{
    const {rerender}=render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/Double-entry bookkeeping/}));
    fireEvent.change(screen.getByRole("slider",{name:"Credit sales collected"}),{target:{value:"75"}});
    rerender(<VirtualLabWorkspace language="de"/>);
    expect(screen.getByRole("heading",{name:"Doppelte Buchführung"})).toBeVisible();
    expect(screen.getByRole("slider",{name:"Bezahlter Anteil der Zielverkäufe"})).toHaveValue("75");
    expect(screen.getByRole("table",{name:"Summen- und Saldenliste"})).toBeVisible();
  });
});