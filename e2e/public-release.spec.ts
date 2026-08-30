import { expect, test } from "@playwright/test";

async function dismissCookies(page: import("@playwright/test").Page) {
  const reject = page.getByRole("button", { name: /Reject All|Tout refuser|Alle ablehnen/i });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

test("public landing renders without a loading dead-end", async ({ page }) => {
  await page.goto("/");
  await dismissCookies(page);
  await expect(page.getByRole("heading", { name: /Master your exams/i })).toBeVisible();
  await expect(page.getByText("Loading…")).toHaveCount(0);
});

test("pricing presents the server-backed 5,000 and 1,000 credit packs", async ({ page }) => {
  await page.goto("/pricing");
  await dismissCookies(page);
  await expect(page.getByText("5,000 questions", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("1,000 extra questions", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/10,000 questions|2,000 extra questions/)).toHaveCount(0);
});

test("tutorial catalogue covers all fourteen subjects", async ({ page }) => {
  await page.goto("/tutorials");
  await dismissCookies(page);
  await expect(page.getByText(/0 of \d+ tutorials mastered/i)).toBeVisible();
  await expect(page.getByText("Solving Quadratic Equations")).toBeVisible();
  await expect(page.locator("select option")).toHaveCount(15);
  await page.locator("select").selectOption("german");
  await expect(page.getByText("Nominative and Accusative Cases")).toBeVisible();
});

test("exam library uses original blueprints and opens exact exam setup", async ({ page }) => {
  await page.goto("/past-papers");
  await dismissCookies(page);
  await expect(page.getByRole("heading", { name: /Exam practice library/i })).toBeVisible();
  await page.getByRole("button", { name: /Open exam setup/i }).first().click();
  await expect(page).toHaveURL(/\/mock-exam\?template=/);
  await expect(page.getByText(/Conditions|Exam conditions/i).first()).toBeVisible();
});

test("classroom hub is account protected and no longer advertises an unfinished feature", async ({ page }) => {
  await page.goto("/live-classroom");
  await dismissCookies(page);
  await expect(page.getByRole("heading", { name: /Sign in to open your classroom hub/i })).toBeVisible();
  await expect(page.getByText(/Coming Soon/i)).toHaveCount(0);
});

test("mastery remains account-protected", async ({ page }) => {
  await page.goto("/mastery");
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
});
