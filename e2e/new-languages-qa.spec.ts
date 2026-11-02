import { expect, test } from "@playwright/test";

async function dismissCookies(page: import("@playwright/test").Page) {
  const reject = page.getByRole("button", { name: /Reject All|Tout refuser|Alle ablehnen/i });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

test("Italian, Spanish and Arabic topics each offer ten authored practice checks", async ({ page }) => {
  for (const [id, subject] of [
    ["italian-essere-avere-present", "italian"],
    ["spanish-ser-estar", "spanish"],
    ["arabic-greetings-pronouns", "arabic"],
  ] as const) {
    await page.goto("/qa-clinic?topic=" + id);
    await dismissCookies(page);
    await expect(page.getByLabel("Filter topic")).toHaveValue(id);
    await expect(page.getByLabel("Filter subject")).toHaveValue(subject);
    await expect(page.getByText("10 matching questions")).toBeVisible();
    await expect(page.locator("article")).toHaveCount(10);
  }
});

test("Arabic question and answer text retains automatic text direction", async ({ page }) => {
  await page.goto("/qa-clinic?topic=arabic-greetings-pronouns");
  await dismissCookies(page);
  const first = page.locator("article").first();
  await expect(first.locator("h3[dir=auto]")).toContainText("مَرْحَبًا");
  await expect(first.locator("button span[dir=auto]").first()).toBeVisible();
});

test("Three new language names appear in the subject filter", async ({ page }) => {
  await page.goto("/qa-clinic");
  await dismissCookies(page);
  for (const name of ["Italian", "Spanish", "Arabic (Modern Standard)"]) {
    await expect(page.getByLabel("Filter subject").locator("option", { hasText: name })).toHaveCount(1);
  }
});
