import { afterEach,describe,expect,it } from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {VirtualLabWorkspace} from "@/components/learning/VirtualLabWorkspace";
afterEach(cleanup);

describe("applied laboratory interactions",()=>{
  it("explores outliers and resets the five observations",()=>{
    render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/Statistics and outliers/}));
    expect(screen.getByText("Mean").nextElementSibling?.textContent).toBe("12 ");
    fireEvent.change(screen.getByRole("slider",{name:"Fifth observation"}),{target:{value:"100"}});
    expect(screen.getByText("Mean").nextElementSibling?.textContent).toBe("28.8 ");
    expect(screen.getByText("Median").nextElementSibling?.textContent).toBe("12 ");
    fireEvent.click(screen.getByRole("button",{name:"Reset model"}));
    expect(screen.getByRole("slider",{name:"Fifth observation"})).toHaveValue("16");
  });
  it("changes classification decisions and shows undefined precision honestly",()=>{
    render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/AI classification thresholds/}));
    expect(within(screen.getByRole("table",{name:"Synthetic classification cases"})).getAllByRole("row")).toHaveLength(9);
    fireEvent.change(screen.getByRole("slider",{name:"Positive classification threshold"}),{target:{value:"100"}});
    expect(screen.getByText("Precision").nextElementSibling).toHaveTextContent("Undefined");
    expect(screen.getByText("Recall").nextElementSibling).toHaveTextContent("0 %");
  });
  it("shows unattainable break-even for zero contribution and resets",()=>{
    render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/Business break-even/}));
    expect(screen.getByText("Minimum units for nonnegative profit").nextElementSibling).toHaveTextContent("125 units");
    fireEvent.change(screen.getByRole("slider",{name:"Selling price per unit"}),{target:{value:"12"}});
    expect(screen.getByText("Not attainable")).toBeVisible();
    fireEvent.click(screen.getByRole("button",{name:"Reset model"}));
    expect(screen.getByText("Minimum units for nonnegative profit").nextElementSibling).toHaveTextContent("125 units");
  });
  it("retains the selected simulation and its state when switching to German",()=>{
    const {rerender}=render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/Statistics and outliers/}));
    fireEvent.change(screen.getByRole("slider",{name:"Fifth observation"}),{target:{value:"100"}});
    rerender(<VirtualLabWorkspace language="de"/>);
    expect(screen.getByRole("heading",{name:"Statistik und Ausreißer"})).toBeVisible();
    expect(screen.getByText("Arithmetisches Mittel").nextElementSibling).toHaveTextContent("28,8");
    expect(screen.getByRole("slider",{name:"Fünfter Messwert"})).toHaveValue("100");
  });
});