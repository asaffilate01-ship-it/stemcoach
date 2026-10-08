import { expect, test } from "@playwright/test";

test("institution reporting requires an authenticated account", async ({ page }) => {
  await page.goto("/institution");
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("teacher class linking requires an authenticated teacher", async ({ page }) => {
  await page.goto("/teacher");
  await expect(page).toHaveURL(/\/auth$/);
});
