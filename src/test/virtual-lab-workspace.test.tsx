import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { VirtualLabWorkspace } from "@/components/learning/VirtualLabWorkspace";
afterEach(cleanup);

describe("virtual lab learning workspace", () => {
  it("switches the circuit arrangement, updates results and resets", () => {
    render(<VirtualLabWorkspace />);
    expect(screen.getByRole("heading",{name:"Virtual laboratories"})).toBeVisible();
    expect(screen.getByText("Equivalent resistance").nextElementSibling?.textContent).toBe("90 Ω");
    fireEvent.click(screen.getByRole("button",{name:"Parallel"}));
    expect(screen.getByRole("button",{name:"Parallel"})).toHaveAttribute("aria-pressed","true");
    expect(screen.getByText("Equivalent resistance").nextElementSibling?.textContent).toBe("20 Ω");
    fireEvent.change(screen.getByRole("slider",{name:"Supply voltage"}),{target:{value:"6"}});
    expect(screen.getByText("Total current").nextElementSibling?.textContent).toBe("0.3 A");
    fireEvent.click(screen.getByRole("button",{name:"Reset model"}));
    expect(screen.getByText("Equivalent resistance").nextElementSibling?.textContent).toBe("90 Ω");
    expect(screen.getByRole("slider",{name:"Supply voltage"})).toHaveValue("12");
  });
  it("changes the motion model and updates the accessible graph", () => {
    render(<VirtualLabWorkspace />);
    fireEvent.click(screen.getByRole("button",{name:/Motion and acceleration/}));
    expect(screen.getByText("Displacement").nextElementSibling?.textContent).toBe("25 m");
    fireEvent.change(screen.getByRole("slider",{name:"Elapsed time"}),{target:{value:"10"}});
    expect(screen.getByText("Displacement").nextElementSibling?.textContent).toBe("100 m");
    expect(screen.getByRole("img",{name:/Velocity against time: 20 m\/s, 10 s/})).toBeVisible();
  });
  it("updates the dilution fraction, conserves the amount and states session-only storage", () => {
    render(<VirtualLabWorkspace />);
    fireEvent.click(screen.getByRole("button",{name:/Dilution model/}));
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow","20");
    fireEvent.change(screen.getByRole("slider",{name:"Final volume"}),{target:{value:"500"}});
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow","10");
    expect(screen.getByText("Final concentration").nextElementSibling?.textContent).toBe("0.1 mol/L");
    expect(screen.getByText("Amount of dissolved substance").nextElementSibling?.textContent).toBe("0.05 mol");
    expect(screen.getByText(/Values are not saved/)).toBeVisible();
  });
  it("renders the German interface and preserves the selected lab when language changes", () => {
    const {rerender}=render(<VirtualLabWorkspace />);
    fireEvent.click(screen.getByRole("button",{name:/Dilution model/}));
    rerender(<VirtualLabWorkspace language="de" />);
    expect(screen.getByRole("heading",{name:"Virtuelle Labore"})).toBeVisible();
    expect(screen.getByText("Endkonzentration").nextElementSibling?.textContent).toBe("0,2 mol/L");
  });
});
