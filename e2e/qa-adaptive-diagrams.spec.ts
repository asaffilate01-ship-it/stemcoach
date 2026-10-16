import { expect, test } from "@playwright/test";

async function dismissCookies(page: import("@playwright/test").Page) {
  const reject = page.getByRole("button", { name: /Reject All|Tout refuser|Alle ablehnen/i });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

test("diagram labelling works with keyboard-accessible dropdowns", async ({ page }) => {
  await page.goto("/qa-clinic?subject=mathematics");
  await dismissCookies(page);
  await page.getByLabel("Question type").selectOption("diagram-label");
  const question = page.locator("article").first();
  await expect(question.getByRole("img", { name: /Label the three sides/ })).toBeVisible();
  await question.getByLabel("Point A").selectOption("Opposite");
  await question.getByLabel("Point B").selectOption("Adjacent");
  await question.getByLabel("Point C").selectOption("Hypotenuse");
  await question.getByRole("button", { name: "Check & explain" }).click();
  await expect(question.getByText("Correct — well done!")).toBeVisible();
});

test("fill-in-the-blanks requires all answers and explains mistakes", async ({ page }) => {
  await page.goto("/qa-clinic?subject=chemistry");
  await dismissCookies(page);
  await page.getByLabel("Question type").selectOption("fill-blanks");
  const question = page.locator("article").first();
  await question.getByPlaceholder("Type the missing word").nth(0).fill("negative");
  await question.getByPlaceholder("Type the missing word").nth(1).fill("positive");
  await question.getByRole("button", { name: "Check & explain" }).click();
  await expect(question.getByText("Correct — well done!")).toBeVisible();
});

test("adaptive review prioritises missed topics and persists local progress across reload", async ({ page }) => {
  await page.goto("/qa-clinic?subject=mathematics");
  await dismissCookies(page);
  const first = page.locator("article").first();
  await first.locator('button[aria-pressed]').nth(1).click();
  await first.getByRole("button", { name: "Check & explain" }).click();
  await expect(page.getByText(/1 of \d+ questions practised/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/1 of \d+ questions practised/)).toBeVisible();
  await page.getByRole("button", { name: "Adaptive review" }).click();
  await expect(page.getByText("Question 1 of 10")).toBeVisible();
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page.getByText("Question 2 of 10")).toBeVisible();
});

test("timed mode displays a countdown and still allows skipping without awarding points", async ({ page }) => {
  await page.goto("/qa-clinic");
  await dismissCookies(page);
  await page.getByRole("button", { name: "5-minute challenge" }).click();
  await expect(page.getByText(/Time left: 0[45]:\d{2}/)).toBeVisible();
  await expect(page.getByText("First-try score: 0 / 10")).toBeVisible();
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page.getByText("Question 2 of 10")).toBeVisible();
});
