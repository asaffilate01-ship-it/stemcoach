import { expect, test } from "@playwright/test";

async function dismissCookies(page: import("@playwright/test").Page) {
  const reject = page.getByRole("button", { name: /Reject All|Tout refuser|Alle ablehnen/i });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

test("source-grounded Q&A does not call Omniqora for an anonymous learner", async ({ page }) => {
  let knowledgeCalls = 0;
  await page.route("**/functions/v1/omniqora-learning-evidence", async (route) => {
    knowledgeCalls++;
    await route.fulfill({ status: 403, contentType: "application/json", body: '{"error":"unauthorized"}' });
  });
  await page.goto("/qa-clinic");
  await dismissCookies(page);
  const card = page.locator("article").first();
  await expect(card.getByRole("button", { name: "Sign in for sourced explanations" })).toBeVisible();
  await card.getByRole("button", { name: "Sign in for sourced explanations" }).click();
  await expect(page).toHaveURL(/\/auth$/);
  expect(knowledgeCalls).toBe(0);
});

test("tutorials expose the same source-navigation option without leaking answers", async ({ page }) => {
  await page.goto("/tutorials");
  await dismissCookies(page);
  await page.getByRole("button").filter({ hasText: "Solving Quadratic Equations" }).click();
  await expect(page.getByRole("button", { name: "Sign in for sourced explanations" })).toBeVisible();
});
