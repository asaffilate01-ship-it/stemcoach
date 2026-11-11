import { test, expect } from "@playwright/test";

test("mobile More menu exposes useful resources without requiring an account", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile navigation only");
  await page.goto("/subjects");
  await page.getByRole("button", { name: "More" }).click();
  const clinic = page.getByRole("menuitem", { name: /Q&A Clinic/i });
  await expect(clinic).toBeVisible();
  await clinic.click();
  await expect(page).toHaveURL(/\/qa-clinic$/);
});
