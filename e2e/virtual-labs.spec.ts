import { test, expect } from "@playwright/test";

test("virtual laboratory route requires an account", async ({page}) => {
  await page.goto("/virtual-labs");
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByRole("heading",{name:"Virtual laboratories"})).toHaveCount(0);
});
