import { expect, test } from "@playwright/test";

test("teacher invitation rejects malformed codes safely", async ({ page }) => {
  await page.goto("/teacher-invitation?token=not-valid");
  await expect(page.getByRole("heading", { name: "Teacher invitation" })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Invalid invitation link");
  await expect(page.getByRole("button", { name: "Accept teacher invitation" })).toHaveCount(0);
});

test("valid-format invitation asks for sign-in before redemption", async ({ page }) => {
  await page.goto("/teacher-invitation?token=" + "a".repeat(64));
  await expect(page.getByRole("button", { name: "Sign in to accept" })).toBeVisible();
  await page.getByRole("button", { name: "Sign in to accept" }).click();
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByText("Welcome back")).toBeVisible();
});
