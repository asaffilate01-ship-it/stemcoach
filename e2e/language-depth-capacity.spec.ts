import { expect, test } from "@playwright/test";

async function dismissCookies(page: import("@playwright/test").Page) {
  const reject = page.getByRole("button", { name: /Reject All|Tout refuser|Alle ablehnen/i });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

test("legacy Italian and Spanish links do not reopen hidden study subjects", async ({ page }) => {
  for (const topic of ["italian-present-regular-verbs", "spanish-gustar-pronouns"]) {
    await page.goto("/qa-clinic?topic=" + topic);
    await dismissCookies(page);
    await expect(page.getByLabel("Filter topic")).toHaveValue("all");
    await expect(page.getByLabel("Filter subject")).toHaveValue("all");
  }
});

test("Arabic vocalised and unvocalised word forms are accepted in a short-answer check", async ({ page }) => {
  await page.goto("/qa-clinic?topic=arabic-numbers-one-to-ten");
  await dismissCookies(page);
  await expect(page.locator("article")).toHaveCount(10);
  const last = page.locator("article").last();
  await expect(last).toContainText("ثلاثة");
  await last.getByLabel("Write a short answer").fill("ثَلَاثَة");
  await last.getByRole("button", { name: "Check & explain" }).click();
  await expect(last.getByText("Correct — well done!")).toBeVisible();
});

test("Q&A homepage counts only visible subject resources", async ({ page }) => {
  await page.goto("/qa-clinic");
  await dismissCookies(page);
  await expect(page.getByText(/^\d+ lesson questions$/)).toBeVisible();
  await expect(page.getByText("14 subjects")).toBeVisible();
});
