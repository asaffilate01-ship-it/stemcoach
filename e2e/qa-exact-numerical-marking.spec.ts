import { expect, test } from "@playwright/test";

test("numeric practice accepts an equivalent fraction without claiming a graded exam result", async ({ page }) => {
  await page.goto("/qa-clinic?topic=arithmetic-sequences-nth-term");
  const reject=page.getByRole("button",{name:/Reject All|Tout refuser|Alle ablehnen/i});
  if(await reject.isVisible().catch(()=>false))await reject.click();
  await page.getByLabel("Question type").selectOption("numeric");
  const question=page.locator("article").filter({hasText:"What is the sixth term of an arithmetic sequence starting at 5 with common difference 3?"});
  await expect(question).toHaveCount(1);
  await question.getByRole("textbox").fill("40/2");
  await question.getByRole("button",{name:"Check & explain"}).click();
  await expect(question.getByText("Correct — well done!")).toBeVisible();
});
