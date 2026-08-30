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

test("tutorial catalogue exposes all twenty guided tutorials", async ({ page }) => {
  await page.goto("/tutorials");
  await dismissCookies(page);
  await expect(page.getByText(/0 of 20 tutorials mastered/i)).toBeVisible();
  await expect(page.getByText("Solving Quadratic Equations")).toBeVisible();
  await expect(page.getByText("Network Threats and Defences")).toBeVisible();
});

test("mastery remains account-protected", async ({ page }) => {
  await page.goto("/mastery");
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
});
