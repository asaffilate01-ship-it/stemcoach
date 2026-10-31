import { expect, test } from "@playwright/test";

async function dismissCookies(page: import("@playwright/test").Page) {
  const reject = page.getByRole("button", { name: /Reject All|Tout refuser|Alle ablehnen/i });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

test("Q&A library reports an authored question without putting answers in the URL", async ({ page }) => {
  await page.goto("/qa-clinic");
  await dismissCookies(page);
  const firstCard = page.locator("article").first();
  const report = firstCard.getByRole("link", { name: "Report question issue" });
  await expect(report).toHaveAttribute("href", /\/support\?report=content&question=[a-z0-9-]+&tutorial=[a-z0-9-]+/);
  await report.click();
  await expect(page).toHaveURL(/\/support\?report=content/);
  await expect(page.getByText("Report a learning content issue")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Subject" })).toHaveValue(/^Content accuracy: /);
  await expect(page.getByRole("textbox", { name: "Message" })).toBeEmpty();
});

test("a lesson checkpoint links to the same content feedback route", async ({ page }) => {
  await page.goto("/tutorials?tutorial=quadratic-equations");
  await dismissCookies(page);
  const link = page.getByRole("link", { name: "Report a question issue" }).first();
  await expect(link).toHaveAttribute("href", /question=quadratic-equations%3A0/);
  await link.click();
  await expect(page.getByText("Report a learning content issue")).toBeVisible();
});
