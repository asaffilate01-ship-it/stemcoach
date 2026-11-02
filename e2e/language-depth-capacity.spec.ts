import { expect, test } from "@playwright/test";

async function dismissCookies(page: import("@playwright/test").Page) {
  const reject = page.getByRole("button", { name: /Reject All|Tout refuser|Alle ablehnen/i });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

test("new Italian and Spanish language-depth checks are launchable", async ({ page }) => {
  for (const [topic, subject] of [
    ["italian-present-regular-verbs", "italian"],
    ["spanish-gustar-pronouns", "spanish"],
  ] as const) {
    await page.goto("/qa-clinic?topic=" + topic);
    await dismissCookies(page);
    await expect(page.getByLabel("Filter topic")).toHaveValue(topic);
    await expect(page.getByLabel("Filter subject")).toHaveValue(subject);
    await expect(page.getByText("10 matching questions")).toBeVisible();
    await expect(page.locator("article")).toHaveCount(10);
    await page.getByLabel("Revision sprint length").selectOption("20");
    await expect(page.getByText("10-question quick challenge")).toBeVisible();
    await expect(page.getByRole("button", { name: "5-minute challenge" })).toBeVisible();
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

test("Q&A homepage truthfully displays the new 814-question draft catalogue", async ({ page }) => {
  await page.goto("/qa-clinic");
  await dismissCookies(page);
  await expect(page.getByText("814 lesson questions")).toBeVisible();
  await expect(page.getByText("17 subjects")).toBeVisible();
});
