import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {VirtualLabWorkspace} from "@/components/learning/VirtualLabWorkspace";

afterEach(cleanup);
describe("responsive laboratory catalogue",()=>{
  it("filters by subject, retains the active experiment, and restores all models",()=>{
    render(<VirtualLabWorkspace/>);
    const catalogue=screen.getByRole("group",{name:"Find a laboratory"});
    expect(within(catalogue).getAllByRole("button")).toHaveLength(19);
    fireEvent.change(screen.getByRole("combobox",{name:"Subject group"}),{target:{value:"business"}});
    expect(within(catalogue).getAllByRole("button")).toHaveLength(5);
    expect(screen.getByText(/selected laboratory is outside your current filters/i)).toBeVisible();
    expect(screen.getByRole("heading",{name:"Electric circuits"})).toBeVisible();
    fireEvent.click(within(catalogue).getByRole("button",{name:/Cash flow and accrual profit/}));
    expect(screen.getByRole("heading",{name:"Cash flow and accrual profit"})).toBeVisible();
    fireEvent.change(screen.getByRole("slider",{name:"Sales collected immediately"}),{target:{value:"0"}});
    fireEvent.change(screen.getByRole("searchbox",{name:"Search laboratories"}),{target:{value:"no such topic"}});
    expect(screen.getByText(/No matching laboratories/)).toBeVisible();
    expect(screen.getByRole("slider",{name:"Sales collected immediately"})).toHaveValue("0");
    fireEvent.click(screen.getByRole("button",{name:"Clear filters"}));
    expect(within(catalogue).getAllByRole("button")).toHaveLength(19);
    expect(screen.getByRole("slider",{name:"Sales collected immediately"})).toHaveValue("0");
  });
  it("requests a validated deep-link selection and responds to external navigation",()=>{
    const onSelectLab=vi.fn();
    const {rerender}=render(<VirtualLabWorkspace selectedLab="subnet" onSelectLab={onSelectLab}/>);
    expect(screen.getByRole("heading",{name:"IPv4 subnet capacity"})).toBeVisible();
    fireEvent.click(screen.getByRole("button",{name:/Market supply and demand/}));
    expect(onSelectLab).toHaveBeenCalledWith("marketEquilibrium");
    rerender(<VirtualLabWorkspace selectedLab="marketEquilibrium" onSelectLab={onSelectLab}/>);
    expect(screen.getByRole("heading",{name:"Market supply and demand"})).toBeVisible();
    rerender(<VirtualLabWorkspace selectedLab="subnet" onSelectLab={onSelectLab}/>);
    expect(screen.getByRole("heading",{name:"IPv4 subnet capacity"})).toBeVisible();
  });
  it("moves keyboard focus to the experiment without changing its parameters",()=>{
    render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:"Go to selected experiment"}));
    expect(document.activeElement?.getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Electric circuits");
  });
  it("retains filters and experiment selection when switching interface locale",()=>{
    const {rerender}=render(<VirtualLabWorkspace/>);
    fireEvent.change(screen.getByRole("combobox",{name:"Subject group"}),{target:{value:"science"}});
    fireEvent.change(screen.getByRole("searchbox",{name:"Search laboratories"}),{target:{value:"dilution"}});
    fireEvent.click(screen.getByRole("button",{name:/Dilution/}));
    rerender(<VirtualLabWorkspace language="de"/>);
    expect(screen.getByRole("combobox",{name:"Fachgruppe"})).toHaveValue("science");
    expect(screen.getByRole("searchbox",{name:"Labore suchen"})).toHaveValue("dilution");
    expect(within(screen.getByRole("group",{name:"Labor finden"})).getAllByRole("button")).toHaveLength(1);
  });
});
