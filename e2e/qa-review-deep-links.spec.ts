import { expect, test } from "@playwright/test";
import { qaStorageKeys } from "../src/lib/qaReviewFocus";

test("revision deep links preserve topic scope and selected focus on reload", async ({ page }) => {
  await page.addInitScript((historyKey) => {
    const id = "arithmetic-sequences-nth-term-0";
    localStorage.setItem(historyKey, JSON.stringify({version:1,entries:{[id]:{
      attempts:1,correctFirst:0,incorrectFirst:1,firstTryStreak:0,lastAt:Date.now()-60000,dueAt:Date.now()-60000,
    }}}));
  },qaStorageKeys(null).history);
  await page.goto("/qa-clinic?topic=arithmetic-sequences-nth-term&review=due");
  const reject=page.getByRole("button",{name:/Reject All|Tout refuser|Alle ablehnen/i});
  if(await reject.isVisible().catch(()=>false))await reject.click();
  await expect(page.getByLabel("Review focus")).toHaveValue("due");
  await expect(page.getByLabel("Filter topic")).toHaveValue("arithmetic-sequences-nth-term");
  await expect(page.locator("article")).toHaveCount(1);
  await page.getByLabel("Review focus").selectOption("new");
  await expect(page).toHaveURL(/review=new/);
  await expect(page.locator("article")).toHaveCount(5);
  await page.reload();
  await expect(page.getByLabel("Review focus")).toHaveValue("new");
  await expect(page.locator("article")).toHaveCount(5);
  await page.getByRole("button",{name:"Clear filters",exact:true}).click();
  await expect(page.getByLabel("Review focus")).toHaveValue("all");
  await expect(page).not.toHaveURL(/review=/);
  await page.goto("/qa-clinic?topic=arithmetic-sequences-nth-term&review=unknown");
  await expect(page.getByLabel("Review focus")).toHaveValue("all");
  await expect(page.locator("article")).toHaveCount(6);
});
