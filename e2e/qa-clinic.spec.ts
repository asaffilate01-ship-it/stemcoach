import { expect, test } from "@playwright/test";

test("Q&A clinic exposes explanations only after learner requests them", async ({ page }) => {
  await page.goto("/qa-clinic");
  await expect(page.getByRole("heading", { name: "Q&A Clinic" })).toBeVisible();
  const first = page.locator("article").first();
  await expect(first.getByText("Why this works")).toHaveCount(0);
  await first.getByRole("button", { name: "Check & explain" }).click();
  await expect(first.getByText("Why this works")).toBeVisible();
  await expect(first.getByText("Worked example")).toBeVisible();
  await first.getByRole("button", { name: "Hide answer" }).click();
  await expect(first.getByText("Why this works")).toHaveCount(0);
});

test("Q&A can be filtered by subject and queried on mobile", async ({ page }) => {
  await page.goto("/qa-clinic");
  await page.getByLabel("Filter subject").selectOption("physics");
  await expect(page.locator("article").first()).toBeVisible();
  await page.getByLabel("Search Q&A").fill("nothing-will-match-this");
  await expect(page.getByText("No matching questions")).toBeVisible();
});

test("free-form Q&A offers a subject-aware route to STEMCoach", async ({ page }) => {
  await page.goto("/qa-clinic");
  await page.getByLabel("Question subject").selectOption("biology");
  await page.getByLabel("Your question").fill("Why do cells need mitochondria?");
  await page.getByRole("button", { name: "Ask STEMCoach" }).click();
  await expect(page).toHaveURL(/\/ai-tutor\?subject=biology/);
});
