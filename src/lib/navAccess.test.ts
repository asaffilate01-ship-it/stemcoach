import { describe, expect, it } from "vitest";
import { canShowNavItem } from "./navAccess";

describe("role-aware navigation", () => {
  const anonymous = { signedIn: false, rolesLoading: false, roles: [] };
  it("keeps public pages available before login", () => {
    expect(canShowNavItem({}, anonymous)).toBe(true);
  });
  it("does not expose role links to visitors", () => {
    expect(canShowNavItem({ roles: ["teacher"] }, anonymous)).toBe(false);
  });
  it("waits for role loading to finish before showing protected destinations", () => {
    expect(canShowNavItem({ roles: ["admin"] }, { signedIn: true, rolesLoading: true, roles: ["admin"] })).toBe(false);
  });
  it("permits only matching member roles", () => {
    const user = { signedIn: true, rolesLoading: false, roles: ["reviewer"] };
    expect(canShowNavItem({ roles: ["admin", "reviewer"] }, user)).toBe(true);
    expect(canShowNavItem({ roles: ["teacher"] }, user)).toBe(false);
  });
});
