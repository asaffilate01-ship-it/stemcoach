import {afterEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {VirtualLabWorkspace} from "@/components/learning/VirtualLabWorkspace";
afterEach(cleanup);
describe("humanities laboratory interactions",()=>{
  it("updates map distance and area when the denominator doubles",()=>{
    render(<VirtualLabWorkspace selectedLab="mapScale"/>);
    expect(screen.getByText("Ground distance").nextElementSibling).toHaveTextContent("1 km");
    expect(screen.getByText("Ground area").nextElementSibling).toHaveTextContent("1 km²");
    fireEvent.change(screen.getByRole("combobox",{name:"Map scale"}),{target:{value:"50000"}});
    expect(screen.getByText("Ground distance").nextElementSibling).toHaveTextContent("2 km");
    expect(screen.getByText("Ground area").nextElementSibling).toHaveTextContent("4 km²");
    fireEvent.click(screen.getByRole("button",{name:"Reset model"}));
    expect(screen.getByRole("combobox",{name:"Map scale"})).toHaveValue("25000");
  });
  it("recalculates net migration and population change",()=>{
    render(<VirtualLabWorkspace selectedLab="population"/>);
    expect(screen.getByText("Net migration").nextElementSibling).toHaveTextContent("500 people");
    fireEvent.change(screen.getByRole("slider",{name:"Departures"}),{target:{value:"1000"}});
    expect(screen.getByText("Net migration").nextElementSibling).toHaveTextContent("-200 people");
    expect(screen.getByText("Total change").nextElementSibling).toHaveTextContent("0 people");
  });
  it("shows the pooled reversal, then removes it after balancing groups",()=>{
    render(<VirtualLabWorkspace selectedLab="confounding"/>);
    expect(screen.getByRole("status")).toHaveTextContent(/Reversal: B has a higher success rate/);
    expect(screen.getByText("Pooled B minus A").nextElementSibling).toHaveTextContent("-26 pp");
    fireEvent.change(screen.getByRole("slider",{name:"Higher-familiarity cases in B"}),{target:{value:"80"}});
    expect(screen.getByRole("status")).toHaveTextContent("No pooled reversal");
    expect(screen.getByText("Pooled B minus A").nextElementSibling).toHaveTextContent("10 pp");
  });
  it("finds the humanities labs in the humanities group and preserves a German locale switch",()=>{
    const {rerender}=render(<VirtualLabWorkspace/>);
    fireEvent.change(screen.getByRole("combobox",{name:"Subject group"}),{target:{value:"humanities"}});
    expect(within(screen.getByRole("group",{name:"Find a laboratory"})).getAllByRole("button")).toHaveLength(4);
    fireEvent.click(screen.getByRole("button",{name:/Population change/}));
    fireEvent.change(screen.getByRole("slider",{name:"Departures"}),{target:{value:"1000"}});
    rerender(<VirtualLabWorkspace language="de"/>);
    expect(screen.getByRole("heading",{name:"Bevölkerungsentwicklung"})).toBeVisible();
    expect(screen.getByRole("slider",{name:"Fortzüge"})).toHaveValue("1000");
    expect(screen.getByRole("combobox",{name:"Fachgruppe"})).toHaveValue("humanities");
  });
});