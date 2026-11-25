import {afterEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {VirtualLabWorkspace} from "@/components/learning/VirtualLabWorkspace";
afterEach(cleanup);
describe("science and literature workspace",()=>{
  it("updates buoyancy and resets the model",()=>{
    render(<VirtualLabWorkspace selectedLab="buoyancy"/>);
    expect(screen.getByRole("status")).toHaveTextContent("Floats at equilibrium");
    fireEvent.change(screen.getByRole("slider",{name:"Object mass"}),{target:{value:"1000"}});
    expect(screen.getByRole("status")).toHaveTextContent("Neutral buoyancy");
    fireEvent.change(screen.getByRole("slider",{name:"Object mass"}),{target:{value:"1500"}});
    expect(screen.getByRole("status")).toHaveTextContent("Sinks");
    fireEvent.click(screen.getByRole("button",{name:"Reset model"}));
    expect(screen.getByRole("slider",{name:"Object mass"})).toHaveValue("600");
  });
  it("recomputes thermal energy for each material",()=>{
    render(<VirtualLabWorkspace selectedLab="thermalEnergy"/>);
    expect(screen.getByText("Energy transferred").nextElementSibling).toHaveTextContent("41.8 kJ");
    fireEvent.change(screen.getByRole("combobox",{name:"Material"}),{target:{value:"iron"}});
    expect(screen.getByText("Energy transferred").nextElementSibling).toHaveTextContent("4.5 kJ");
  });
  it("reveals text-grounded commentary and resets it on passage change",()=>{
    render(<VirtualLabWorkspace selectedLab="closeReading"/>);
    fireEvent.click(screen.getByRole("button",{name:/held its breath/}));
    expect(screen.getByRole("heading",{name:"Personification"})).toBeVisible();
    fireEvent.change(screen.getByRole("combobox",{name:"Choose passage"}),{target:{value:"1"}});
    expect(screen.queryByRole("heading",{name:"Personification"})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button",{name:/like a tin drum/}));
    expect(screen.getByRole("heading",{name:"Simile"})).toBeVisible();
  });
  it("keeps English passages labelled and translates commentary when locale changes",()=>{
    const {rerender}=render(<VirtualLabWorkspace selectedLab="closeReading"/>);
    fireEvent.click(screen.getByRole("button",{name:/held its breath/}));
    rerender(<VirtualLabWorkspace selectedLab="closeReading" language="de"/>);
    expect(screen.getByRole("heading",{name:"Personifikation"})).toBeVisible();
    expect(screen.getByText(/Die Texte sind auf Englisch/)).toBeVisible();
    expect(screen.getByText(/The harbour held its breath/)).toHaveAttribute("lang","en");
    const group=screen.getByRole("group",{name:"Labor finden"});
    expect(within(group).getAllByRole("button")).toHaveLength(22);
  });
});