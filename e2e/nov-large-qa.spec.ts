import { expect, test } from "@playwright/test";

async function dismissCookies(page: import("@playwright/test").Page) {
  const reject = page.getByRole("button", { name: /Reject All|Tout refuser|Alle ablehnen/i });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

test("new compound growth topic offers all ten original answers and a proportionate timed sprint", async ({ page }) => {
  await page.goto("/qa-clinic?topic=compound-growth-percentages");
  await dismissCookies(page);
  await expect(page.getByLabel("Filter topic")).toHaveValue("compound-growth-percentages");
  await expect(page.getByText("10 matching questions")).toBeVisible();
  await expect(page.locator("article")).toHaveCount(10);
  await expect(page.locator("article").first()).toContainText("multiplier for a 12% increase");
  await page.getByLabel("Revision sprint length").selectOption("20");
  await expect(page.getByText("10-question quick challenge")).toBeVisible();
  await page.getByRole("button", { name: "5-minute challenge" }).click();
  await expect(page.getByText("Question 1 of 10")).toBeVisible();
  await expect(page.locator("article")).toHaveCount(1);
});

test("local Q&A history shows honest first-try accuracy without storing answers", async ({ page }) => {
  await page.addInitScript(() => {
    const id = "compound-growth-percentages-0";
    localStorage.setItem("stemcoach:qa-review-v1:scope-v2:guest", JSON.stringify({
      version: 1,
      entries: { [id]: {
        attempts: 2, correctFirst: 1, incorrectFirst: 1,
        firstTryStreak: 1, lastAt: Date.now() - 60_000, dueAt: Date.now() - 60_000,
      } },
    }));
  });
  await page.goto("/qa-clinic?topic=compound-growth-percentages");
  await dismissCookies(page);
  await expect(page.getByText("First-attempt accuracy: 50% (1 of 2 attempts)")).toBeVisible();
});
