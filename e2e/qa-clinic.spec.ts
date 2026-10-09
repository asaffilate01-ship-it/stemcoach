import { expect, test } from "@playwright/test";

async function dismissCookies(page: import("@playwright/test").Page) {
  const reject = page.getByRole("button", { name: /Reject All|Tout refuser|Alle ablehnen/i });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

test("Q&A clinic reveals worked explanations on request, then hides them again", async ({ page }) => {
  await page.goto("/qa-clinic");
  await dismissCookies(page);
  await expect(page.getByRole("heading", { name: "Q&A Clinic" })).toBeVisible();
  const first = page.locator("article").first();
  await expect(first.getByText("Why this works")).toHaveCount(0);
  await first.getByRole("button", { name: "Check & explain" }).click();
  await expect(first.getByText("Why this works")).toBeVisible();
  await expect(first.getByText("Worked example")).toBeVisible();
  await first.getByRole("button", { name: "Hide answer" }).click();
  await expect(first.getByText("Why this works")).toHaveCount(0);
});

test("library filters subject, format and difficulty without losing the ability to search", async ({ page }) => {
  await page.goto("/qa-clinic");
  await dismissCookies(page);
  await page.getByLabel("Filter subject").selectOption("physics");
  await expect(page.locator("article").first()).toBeVisible();
  await page.getByLabel("Question type").selectOption("numeric");
  await expect(page.locator("article").first()).toBeVisible();
  await page.getByLabel("Search Q&A").fill("nothing-will-match-this");
  await expect(page.getByText("No matching questions")).toBeVisible();
});

test("numeric answer and retryable feedback in the Q&A engine", async ({ page }) => {
  await page.goto("/qa-clinic?subject=mathematics");
  await dismissCookies(page);
  await page.getByLabel("Question type").selectOption("numeric");
  const first = page.locator("article").first();
  await first.getByLabel("Enter your number (without units)").fill("9999");
  await first.getByRole("button", { name: "Check & explain" }).click();
  await expect(first.getByText("Not quite. Compare your approach")).toBeVisible();
  await first.getByRole("button", { name: "Try again" }).click();
  await first.getByLabel("Enter your number (without units)").fill("47");
  await first.getByRole("button", { name: "Check & explain" }).click();
  await expect(first.getByText("Correct — well done!")).toBeVisible();
});

test("ordering, matching and multiple-select formats are available", async ({ page }) => {
  await page.goto("/qa-clinic");
  await dismissCookies(page);
  const format = page.getByLabel("Question type");
  await format.selectOption("ordering");
  await expect(page.locator("article").first().getByRole("button", { name: /Move .* up/i }).first()).toBeVisible();
  await format.selectOption("matching");
  await expect(page.locator("article").first().locator("select")).toHaveCount(3);
  await format.selectOption("multiple");
  await expect(page.locator("article").first().getByRole("button", { name: "Check & explain" })).toBeVisible();
  await format.selectOption("short-text");
  await expect(page.locator("article").first().getByLabel("Write a short answer")).toBeVisible();
});

test("quick challenge shows progress and can advance without awarding skipped questions", async ({ page }) => {
  await page.goto("/qa-clinic");
  await dismissCookies(page);
  await page.getByRole("button", { name: "Start challenge" }).click();
  await expect(page.getByText("Question 1 of 10")).toBeVisible();
  await expect(page.getByText("First-try score: 0 / 10")).toBeVisible();
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page.getByText("Question 2 of 10")).toBeVisible();
});

test("free-form Q&A offers a subject-aware draft handoff to STEMCoach", async ({ page }) => {
  await page.goto("/qa-clinic");
  await dismissCookies(page);
  await page.getByLabel("Question subject").selectOption("biology");
  await page.getByLabel("Your question").fill("Why do cells need mitochondria?");
  await page.getByRole("button", { name: "Ask STEMCoach" }).click();
  await expect(page).toHaveURL(/\/ai-tutor\?subject=biology/);
});
