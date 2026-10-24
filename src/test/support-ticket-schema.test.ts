import { describe, expect, it } from "vitest";
import { zodResolver } from "@hookform/resolvers/zod";
import { supportTicketSchema } from "@/lib/supportTicketSchema";
const resolve = zodResolver(supportTicketSchema(key => `translated:${key}`));
const options = {fields: {}, shouldUseNativeValidation: false};
describe("Support form resolver compatibility", () => {
  it("returns translated field errors without throwing for invalid input", async () => {
    const result = await resolve({name:"",email:"wrong",category:"",subject:"",message:""}, undefined, options);
    expect(Object.keys(result.errors).sort()).toEqual(["category","email","message","name","subject"]);
    expect(result.errors.email?.message).toBe("translated:support.validation.email");
    expect(result.values).toEqual({});
  });
  it("preserves valid ticket fields", async () => {
    const ticket = {name:"Test learner",email:"test@example.com",category:"general",subject:"Help with a class",message:"Please help me access my scheduled class."};
    const result = await resolve(ticket, undefined, options);
    expect(result.errors).toEqual({}); expect(result.values).toEqual(ticket);
  });
});
