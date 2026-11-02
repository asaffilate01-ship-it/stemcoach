import { expect, test } from "@playwright/test";

async function dismissCookies(page: import("@playwright/test").Page) {
  const reject = page.getByRole("button", { name: /Reject All|Tout refuser|Alle ablehnen/i });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

test("public study hub offers 18 accessible practical guides with real source links", async ({ page }) => {
  await page.goto("/study-skills");
  await dismissCookies(page);
  await expect(page.getByRole("heading", { name: "Study & exam skills" })).toBeVisible();
  await expect(page.locator("article")).toHaveCount(18);
  await page.getByRole("button", { name: "I keep forgetting" }).click();
  await expect(page.locator("article")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "Test yourself from memory" })).toBeVisible();
  await page.getByRole("button", { name: "All techniques" }).click();
  await page.getByRole("searchbox", { name: "Search study techniques" }).fill("sleep");
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.locator("article")).toContainText(["Protect rest and sleep"]);
  await expect(page.locator("article").getByRole("link", { name: /Read the underlying guidance/ })).toHaveAttribute("href", /^https:\/\//);
});

test("checklist ticks and a working focus timer are local optional controls", async ({ page }) => {
  await page.goto("/study-skills");
  await dismissCookies(page);
  await expect(page.getByRole("timer", { name: "Focus timer" })).toHaveText("20:00");
  await page.getByRole("button", { name: "10 minutes" }).click();
  await expect(page.getByRole("timer", { name: "Focus timer" })).toHaveText("10:00");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByRole("timer", { name: "Focus timer" })).toHaveText("10:00");
  await page.getByLabel("Choose a specific topic and realistic time block").check();
  await expect(page.getByText("1 of 4 considered")).toBeVisible();
  await page.getByRole("button", { name: "Night before an exam" }).click();
  await expect(page.getByText("0 of 4 considered")).toBeVisible();
  await page.reload();
  await dismissCookies(page);
  await expect(page.getByText("0 of 4 considered")).toBeVisible();
});

test("German and French study guides are translated rather than empty English placeholders", async ({ page }) => {
  await page.goto("/study-skills");
  await dismissCookies(page);
  await page.evaluate(() => localStorage.setItem("i18nextLng", "de"));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Lern- und Prüfungstechniken" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mit einem kleinen Schritt beginnen" })).toBeVisible();
  await page.evaluate(() => localStorage.setItem("i18nextLng", "fr"));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Méthodes d'étude et d'examen" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Commencer par une petite tâche" })).toBeVisible();
});
