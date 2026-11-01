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
  await expect(page.getByRole("button", { name: "10-minute challenge" })).toBeVisible();
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
