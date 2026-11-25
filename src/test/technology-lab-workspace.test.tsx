import {afterEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {VirtualLabWorkspace} from "@/components/learning/VirtualLabWorkspace";
afterEach(cleanup);

describe("technology lab workspace interactions",()=>{
  it("shows subnet capacity and shortfall as prefix changes",()=>{
    render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/IPv4 subnet capacity/}));
    expect(screen.getByText("Usable host addresses").nextElementSibling).toHaveTextContent("62");
    fireEvent.change(screen.getByRole("slider",{name:"Prefix length"}),{target:{value:"27"}});
    expect(screen.getByText("Host shortfall").nextElementSibling).toHaveTextContent("20");
    expect(screen.getByRole("status")).toHaveTextContent("The subnet is too small.");
    fireEvent.click(screen.getByRole("button",{name:"Reset model"}));
    expect(screen.getByRole("slider",{name:"Prefix length"})).toHaveValue("26");
  });
  it("clamps failed instances as provisioned capacity shrinks",()=>{
    render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/Cloud capacity and resilience/}));
    fireEvent.change(screen.getByRole("slider",{name:"Failed instances"}),{target:{value:"4"}});
    expect(screen.getByText(/Undefined \(zero available capacity\)/)).toBeVisible();
    fireEvent.change(screen.getByRole("slider",{name:"Provisioned instances"}),{target:{value:"2"}});
    expect(screen.getByRole("slider",{name:"Failed instances"})).toHaveValue("2");
    expect(screen.getByText("Unserved requests").nextElementSibling).toHaveTextContent("250 req/s");
  });
  it("demonstrates scope and additional authentication without granting publication",()=>{
    render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/Defensive access control/}));
    expect(screen.getByRole("status")).toHaveTextContent("Allowed by this example policy");
    fireEvent.change(screen.getByRole("combobox",{name:"Role"}),{target:{value:"reviewer"}});
    fireEvent.change(screen.getByRole("combobox",{name:"Requested action"}),{target:{value:"submitReview"}});
    expect(screen.getByRole("status")).toHaveTextContent("additional authentication required");
    fireEvent.click(screen.getByRole("checkbox",{name:"Additional authentication verified"}));
    expect(screen.getByRole("status")).toHaveTextContent("Allowed by this example policy");
    fireEvent.click(screen.getByRole("checkbox",{name:"Resource belongs to authorised scope"}));
    expect(screen.getByRole("status")).toHaveTextContent("outside authorised scope");
    fireEvent.click(screen.getByRole("checkbox",{name:"Resource belongs to authorised scope"}));
    fireEvent.change(screen.getByRole("combobox",{name:"Requested action"}),{target:{value:"publishQuestion"}});
    expect(screen.getByRole("status")).toHaveTextContent("role lacks permission");
  });
  it("preserves controls and selected model across locale changes",()=>{
    const {rerender}=render(<VirtualLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/IPv4 subnet capacity/}));
    fireEvent.change(screen.getByRole("slider",{name:"Prefix length"}),{target:{value:"27"}});
    rerender(<VirtualLabWorkspace language="de"/>);
    expect(screen.getByRole("heading",{name:"IPv4-Subnetzkapazität"})).toBeVisible();
    expect(screen.getByRole("slider",{name:"Präfixlänge"})).toHaveValue("27");
    expect(screen.getByRole("status")).toHaveTextContent("Das Subnetz ist zu klein.");
  });
});
