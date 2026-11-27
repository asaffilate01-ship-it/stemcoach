import { expect, test } from "@playwright/test";

async function dismissCookies(page: import("@playwright/test").Page) {
  const reject = page.getByRole("button", { name: /Reject All|Tout refuser|Alle ablehnen/i });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

test("a newly authored lesson opens its six checked revision questions", async ({ page }) => {
  await page.goto("/tutorials?tutorial=arithmetic-sequences-nth-term");
  await dismissCookies(page);
  await expect(page.getByRole("heading", { name: "Guided STEM tutorials" })).toBeVisible();
  await page.getByRole("link", { name: "Practise this topic (6 questions)" }).click();
  await expect(page).toHaveURL(/\/qa-clinic\?subject=mathematics&topic=arithmetic-sequences-nth-term/);
  await expect(page.getByLabel("Filter topic")).toHaveValue("arithmetic-sequences-nth-term");
  await expect(page.locator("article")).toHaveCount(6);
  await expect(page.locator("article").first()).toContainText("What is the nth term of 3, 7, 11, 15");
});

test("a focused topic cannot invent missing questions even when 20 are requested", async ({ page }) => {
  await page.goto("/qa-clinic?topic=arithmetic-sequences-nth-term");
  await dismissCookies(page);
  await page.getByLabel("Revision sprint length").selectOption("20");
  await expect(page.getByText("6-question quick challenge")).toBeVisible();
  await expect(page.getByRole("button", { name: "5-minute challenge" })).toBeVisible();
  await page.getByRole("button", { name: "Adaptive review" }).click();
  await expect(page.getByText("Question 1 of 6")).toBeVisible();
  await expect(page.getByText("First-try score: 0 / 6")).toBeVisible();
  await expect(page.getByLabel("Revision sprint length")).toBeDisabled();
});

test("five-question timed sprints use the shorter time budget", async ({ page }) => {
  await page.goto("/qa-clinic?topic=arithmetic-sequences-nth-term");
  await dismissCookies(page);
  await page.getByLabel("Revision sprint length").selectOption("5");
  await expect(page.getByText("5-question quick challenge")).toBeVisible();
  await page.getByRole("button", { name: "3-minute challenge" }).click();
  await expect(page.getByText("Question 1 of 5")).toBeVisible();
  await expect(page.getByText("First-try score: 0 / 5")).toBeVisible();
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page.getByText("Question 2 of 5")).toBeVisible();
});

test("a full subject can run a genuine twenty-question ungraded sprint", async ({ page }) => {
  await page.goto("/qa-clinic?subject=physics");
  await dismissCookies(page);
  await page.getByLabel("Revision sprint length").selectOption("20");
  await expect(page.getByText("20-question quick challenge")).toBeVisible();
  await page.getByRole("button", { name: "Start challenge" }).click();
  await expect(page.getByText("Question 1 of 20")).toBeVisible();
  await expect(page.getByText("First-try score: 0 / 20")).toBeVisible();
  await expect(page.locator("article")).toHaveCount(1);
});

test("unanswered-only practice retries the exact original sprint, in order", async ({ page }) => {
  await page.goto("/qa-clinic?topic=arithmetic-sequences-nth-term");
  await dismissCookies(page);
  await page.getByLabel("Revision sprint length").selectOption("5");
  await page.getByRole("button", { name: "Start challenge", exact: true }).click();
  const questions: string[] = [];
  for (let i = 0; i < 5; i++) {
    await expect(page.getByRole("heading", { name: `Question ${i + 1} of 5`, exact: true })).toBeVisible();
    questions.push(await page.locator("article h3").innerText());
    await page.getByRole("button", { name: i === 4 ? "Finish challenge" : "Next question", exact: true }).click();
  }
  await expect(page.getByRole("button", { name: "Practise unanswered (5)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Retry mistakes/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Practise unanswered (5)", exact: true }).click();
  for (let i = 0; i < 5; i++) {
    await expect(page.getByRole("heading", { name: `Question ${i + 1} of 5`, exact: true })).toBeVisible();
    await expect(page.locator("article h3")).toHaveText(questions[i]);
    await page.getByRole("button", { name: i === 4 ? "Finish challenge" : "Next question", exact: true }).click();
  }
  await expect(page.getByRole("button", { name: "Practise unanswered (5)", exact: true })).toBeVisible();
});

test("mistake-only revision accepts an exact fraction on the next independent attempt", async ({ page }) => {
  const stem = "What is the sixth term of an arithmetic sequence starting at 5 with common difference 3?";
  await page.goto("/qa-clinic?topic=arithmetic-sequences-nth-term");
  await dismissCookies(page);
  await page.getByLabel("Question type").selectOption("numeric");
  await page.getByLabel("Search Q&A").fill(stem);
  await expect(page.locator("article")).toHaveCount(1);
  await page.getByRole("button", { name: "Start challenge", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Question 1 of 1", exact: true })).toBeVisible();
  const question = page.locator("article");
  const input = question.getByLabel("Enter a number or fraction (without units)");
  await expect(input).toHaveAttribute("inputmode", "text");
  await input.fill("19");
  await question.getByRole("button", { name: "Check & explain" }).click();
  await expect(question.getByText("Not quite. Compare your approach")).toBeVisible();
  await page.getByRole("button", { name: "Finish challenge", exact: true }).click();
  await expect(page.getByRole("button", { name: "Retry mistakes (1)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Practise unanswered/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Retry mistakes (1)", exact: true }).click();
  await expect(question.locator("h3")).toHaveText(stem);
  await input.fill("40/2");
  await question.getByRole("button", { name: "Check & explain" }).click();
  await expect(question.getByText("Correct — well done!")).toBeVisible();
  await expect(page.getByText("First-try score: 1 / 1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Finish challenge", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Retry mistakes/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Practise unanswered/ })).toHaveCount(0);
});

test("topic recommendations show first-attempt evidence and launch only eligible lesson questions", async ({ page }) => {
  const stem = "What is the sixth term of an arithmetic sequence starting at 5 with common difference 3?";
  await page.goto("/qa-clinic?topic=arithmetic-sequences-nth-term");
  await dismissCookies(page);
  await page.getByLabel("Question type").selectOption("numeric");
  await page.getByLabel("Search Q&A").fill(stem);
  const question = page.locator("article");
  await expect(question).toHaveCount(1);
  await question.getByLabel("Enter a number or fraction (without units)").fill("19");
  await question.getByRole("button", { name: "Check & explain" }).click();
  await expect(question.getByText("Not quite. Compare your approach")).toBeVisible();
  const recommendations = page.getByRole("region", { name: "Recommended topic revision" });
  await expect(recommendations).toBeVisible();
  await expect(recommendations.getByText("First-try mistakes", { exact: true })).toBeVisible();
  await recommendations.getByRole("button", { name: /Revise 1 questions from/ }).click();
  await expect(page.getByRole("heading", { name: "Question 1 of 1", exact: true })).toBeVisible();
  await expect(page.locator("article h3")).toHaveText(stem);
  await expect(recommendations).toHaveCount(0);
});
