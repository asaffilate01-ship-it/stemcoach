import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("Q&A assessment controls have no serious automated accessibility violations", async ({ page }) => {
  await page.goto("/qa-clinic");
  await expect(page.locator("main")).toBeVisible();
  const results = await new AxeBuilder({ page }).include("main").analyze();
  expect(results.violations.filter(item => ["critical","serious"].includes(item.impact || ""))).toEqual([]);
});
