import {test,expect} from "@playwright/test";
test("language laboratory route requires sign-in",async({page})=>{
  await page.goto("/language-labs");
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByRole("heading",{name:"Language laboratory"})).toHaveCount(0);
});
