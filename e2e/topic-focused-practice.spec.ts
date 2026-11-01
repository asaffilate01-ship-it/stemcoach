import { test, expect } from "@playwright/test";

async function dismissCookies(page: import("@playwright/test").Page) {
  const reject = page.getByRole("button", { name: /Reject All|Tout refuser|Alle ablehnen/i });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

test("a new STEM lesson opens an eight-question focused practice set", async ({ page }) => {
  await page.goto("/tutorials?tutorial=statistics-mean-median-spread");
  await dismissCookies(page);
  await expect(page.getByRole("heading", { name: "Guided STEM tutorials" })).toBeVisible();
  await page.getByRole("link", { name: /Practise this topic \(8 questions\)/i }).click();

  await expect(page).toHaveURL(/\/qa-clinic\?subject=mathematics&topic=statistics-mean-median-spread/);
  await expect(page.getByLabel("Filter subject")).toHaveValue("mathematics");
  await expect(page.getByLabel("Filter topic")).toHaveValue("statistics-mean-median-spread");
  await expect(page.locator("article")).toHaveCount(8);
  await expect(page.locator("article").first()).toContainText("What is the mean of 2, 4, 6 and 8?");
  await expect(page.getByRole("link", { name: "Report question issue" })).toHaveCount(8);

  await page.getByLabel("Filter topic").selectOption("all");
  await expect(page).not.toHaveURL(/topic=/);
  await expect(page.getByLabel("Filter subject")).toHaveValue("mathematics");
  await expect(page.locator("article")).toHaveCount(16);

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByLabel("Filter subject")).toHaveValue("all");
  await expect(page.getByLabel("Filter topic")).toHaveValue("all");
});

test("shareable topic deep links select the correct subject, ignoring untrusted topic IDs", async ({ page }) => {
  await page.goto("/qa-clinic?subject=physics&topic=german-perfekt-auxiliaries");
  await dismissCookies(page);
  await expect(page.getByLabel("Filter subject")).toHaveValue("german");
  await expect(page.getByLabel("Filter topic")).toHaveValue("german-perfekt-auxiliaries");
  await expect(page.locator("article")).toHaveCount(8);

  await page.goto("/qa-clinic?topic=%3Cscript%3E");
  await expect(page.getByLabel("Filter topic")).toHaveValue("all");
  await expect(page.getByLabel("Filter subject")).toHaveValue("all");
  await expect(page.locator("article").first()).toBeVisible();
});

test("new topic filters also apply to adaptive study challenges", async ({ page }) => {
  await page.goto("/qa-clinic?topic=sql-queries-and-keys");
  await dismissCookies(page);
  await expect(page.locator("article")).toHaveCount(8);
  await page.getByRole("button", { name: "Adaptive review" }).click();
  await expect(page.getByText("Question 1 of 8")).toBeVisible();
  await expect(page.getByText("First-try score: 0 / 8")).toBeVisible();
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page.getByText("Question 2 of 8")).toBeVisible();
});
