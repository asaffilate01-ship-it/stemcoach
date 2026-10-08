import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const capacitor = readFileSync(resolve(process.cwd(), "capacitor.config.ts"), "utf8");
const install = readFileSync(resolve(process.cwd(), "src/pages/InstallApp.tsx"), "utf8");

describe("mobile shell release safety", () => {
  it("packages STEMCoach local assets instead of a remote preview origin", () => {
    expect(capacitor).toContain('webDir: "dist"');
    expect(capacitor).not.toContain("server:");
    expect(capacitor).not.toContain("cleartext:");
    expect(capacitor).not.toContain("lovableproject.com");
  });

  it("explains the limits of offline revision", () => {
    expect(install).toContain("grading and AI coaching require internet");
    expect(install).not.toContain("offline practice, and a native app experience");
  });
});
