import { expect, test } from "@playwright/test";

test("landing has semantic practice and pricing links without a fabricated pass rate", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Master your exams/i })).toBeVisible();

  const practice = page.getByRole("link", { name: /Start Practising/i });
  const pricing = page.getByRole("link", { name: /View Plans/i });
  await expect(practice).toHaveAttribute("href", "/subjects");
  await expect(pricing).toHaveAttribute("href", "/pricing");
  await expect(page.locator("main").getByText("Pass Rate", { exact: true })).toHaveCount(0);
  await expect(page.locator("main").getByText("Reviewed Questions", { exact: true })).toHaveCount(0);
});

test("landing keeps primary navigation available for reduced-motion learners", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Master your exams/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Start Practising/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /View Plans/i })).toBeVisible();
});
