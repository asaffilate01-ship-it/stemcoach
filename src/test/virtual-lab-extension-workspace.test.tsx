import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { VirtualLabWorkspace } from "@/components/learning/VirtualLabWorkspace";
afterEach(cleanup);

describe("extended virtual lab controls",()=>{
  it("changes a quadratic graph from two roots to one root to none",()=>{
    render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/Quadratic graph explorer/}));
    expect(screen.getByRole("img",{name:/Quadratic graph: Vertex/})).toBeVisible();
    expect(screen.getByText("Real roots").nextElementSibling?.textContent).toBe("-1; 3");
    fireEvent.change(screen.getByRole("slider",{name:/Vertex y-coordinate/}),{target:{value:"0"}});
    expect(screen.getByText("Real roots").nextElementSibling?.textContent).toBe("1");
    fireEvent.change(screen.getByRole("slider",{name:/Vertex y-coordinate/}),{target:{value:"2"}});
    expect(screen.getByText("No real roots")).toBeVisible();
    fireEvent.click(screen.getByRole("button",{name:"Reset model"}));
    expect(screen.getByText("Real roots").nextElementSibling?.textContent).toBe("-1; 3");
  });
  it("updates the accessible Punnett square and phenotype proportions",()=>{
    render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/Mendelian inheritance/}));
    expect(within(screen.getByRole("table",{name:"Punnett square"})).getAllByRole("cell")).toHaveLength(4);
    expect(screen.getByText("Recessive phenotype").nextElementSibling?.textContent).toBe("25 %");
    fireEvent.change(screen.getByRole("combobox",{name:"Parent 2 genotype"}),{target:{value:"aa"}});
    expect(screen.getByText("Recessive phenotype").nextElementSibling?.textContent).toBe("50 %");
    fireEvent.click(screen.getByRole("button",{name:"Reset model"}));
    expect(screen.getByRole("combobox",{name:"Parent 2 genotype"})).toHaveValue("Aa");
  });
  it("steps through binary search and resets the trace for a new target",()=>{
    render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/Binary search visualiser/}));
    expect(screen.getByRole("button",{name:"Previous step"})).toBeDisabled();
    const next=screen.getByRole("button",{name:"Next step"});
    for(let i=0;i<4&&!next.hasAttribute("disabled");i++)fireEvent.click(next);
    expect(screen.getByRole("status")).toHaveTextContent("Found at zero-based index 5");
    expect(next).toBeDisabled();
    fireEvent.change(screen.getByRole("slider",{name:"Target value"}),{target:{value:"0"}});
    expect(screen.getByRole("status")).toHaveTextContent("Step 1");
    for(let i=0;i<4&&!next.hasAttribute("disabled");i++)fireEvent.click(next);
    expect(screen.getByRole("status")).toHaveTextContent("Target absent from this array");
  });
  it("maintains selected lab and state when switching to German",()=>{
    const {rerender}=render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/Mendelian inheritance/}));
    fireEvent.change(screen.getByRole("combobox",{name:"Parent 2 genotype"}),{target:{value:"aa"}});
    rerender(<VirtualLabWorkspace language="de"/>);
    expect(screen.getByRole("heading",{name:"Virtuelle Labore"})).toBeVisible();
    expect(screen.getByRole("combobox",{name:"Genotyp Elternteil 2"})).toHaveValue("aa");
    expect(screen.getByRole("table",{name:"Kreuzungsschema"})).toBeVisible();
  });
});
