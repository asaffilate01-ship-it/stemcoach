import { expect, test } from "@playwright/test";

test("institution registration stays available to prospective colleges", async ({ page }) => {
  await page.goto("/register-institution");
  await expect(page.getByRole("heading", { name: "Register Your Institution" })).toBeVisible();
  await expect(page.getByPlaceholder("e.g. Westminster Academy")).toBeVisible();
  await expect(page.getByRole("button", { name: /Register Institution/i })).toBeVisible();
});

test("student invitation URL prefills the institution identifier", async ({ page }) => {
  await page.goto("/join-institution?code=example-college");
  await expect(page.getByRole("heading", { name: "Join an Institution" })).toBeVisible();
  await expect(page.getByPlaceholder("e.g. westminster-academy")).toHaveValue("example-college");
});
