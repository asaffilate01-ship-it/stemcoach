import { expect, test } from "@playwright/test";
async function dismissCookies(page: import("@playwright/test").Page) {
  const reject = page.getByRole("button", { name: /Reject All|Tout refuser|Alle ablehnen/i });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

test("expanded authored bank is displayed in the Q&A Clinic", async ({ page }) => {
  await page.goto("/qa-clinic?subject=mathematics");
  await dismissCookies(page);
  const bankSize = page.getByText(/^\d+ lesson questions$/);
  await expect(bankSize).toBeVisible();
  expect(Number((await bankSize.textContent())?.match(/^\d+/)?.[0])).toBeGreaterThanOrEqual(331);
  await page.getByLabel("Search Q&A").fill("Functions, Domain and Range");
  await expect(page.getByText("Functions, Domain and Range").first()).toBeVisible();
});

test("save a question, reload, filter saved and remove it", async ({ page }) => {
  await page.goto("/qa-clinic");
  await dismissCookies(page);
  await page.locator("article").first().getByRole("button", { name: "Save question" }).click();
  await page.getByLabel("Review focus").selectOption("saved");
  await expect(page.locator("article")).toHaveCount(1);
  await page.reload();
  await page.getByLabel("Review focus").selectOption("saved");
  await expect(page.locator("article")).toHaveCount(1);
  await page.locator("article").first().getByRole("button", { name: "Remove saved question" }).click();
  await expect(page.getByText("No matching questions")).toBeVisible();
});

test("opening an untouched ordering solution cannot count as an attempt", async ({ page }) => {
  await page.goto("/qa-clinic");
  await dismissCookies(page);
  await page.getByLabel("Question type").selectOption("ordering");
  const question = page.locator("article").first();
  await question.getByRole("button", { name: "Check & explain" }).click();
  await expect(question.getByText("Why this works")).toBeVisible();
  await expect(question.getByText("Correct — well done!")).toHaveCount(0);
  await expect(page.getByText(/0 of \d+ questions practised/)).toBeVisible();
});

test("previously missed and due filters surface local learning errors", async ({ page }) => {
  await page.goto("/qa-clinic?subject=mathematics");
  await dismissCookies(page);
  const first = page.locator("article").first();
  await first.locator('div[role="group"] button[aria-pressed]').nth(1).click();
  await first.getByRole("button", { name: "Check & explain" }).click();
  await page.getByLabel("Review focus").selectOption("missed");
  await expect(page.locator("article")).toHaveCount(1);
  await page.getByLabel("Review focus").selectOption("due");
  await expect(page.locator("article")).toHaveCount(1);
});
