import { expect, test } from "@playwright/test";

async function dismissCookies(page: import("@playwright/test").Page) {
  const reject = page.getByRole("button", { name: /Reject All|Tout refuser|Alle ablehnen/i });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

test("seven-day formative Q&A plan launches a real five-question set", async ({ page }) => {
  await page.goto("/qa-clinic?topic=arithmetic-sequences-nth-term");
  await dismissCookies(page);
  await expect(page.getByRole("heading", { name: "Your 7-day revision plan" })).toBeVisible();
  await expect(page.getByText("5 new · 0 due", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Practise day 1" }).click();
  await expect(page.getByText("Question 1 of 5")).toBeVisible();
  await expect(page.locator("article")).toHaveCount(1);
});

test("practice history prioritises due questions without exposing typed answers", async ({ page }) => {
  await page.addInitScript(() => {
    const id = "arithmetic-sequences-nth-term-0";
    localStorage.setItem("stemcoach:qa-review-v1", JSON.stringify({
      version: 1,
      entries: { [id]: {
        attempts: 1, correctFirst: 0, incorrectFirst: 1, firstTryStreak: 0,
        lastAt: Date.now() - 60_000, dueAt: Date.now() - 60_000,
      } },
    }));
  });
  await page.goto("/qa-clinic?topic=arithmetic-sequences-nth-term");
  await dismissCookies(page);
  await expect(page.getByText("4 new · 1 due", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Practise day 1" }).click();
  await expect(page.locator("article").first()).toContainText("What is the nth term of 3, 7, 11, 15");
});
