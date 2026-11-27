import { expect, test } from "@playwright/test";

test("a focused sprint retries the original unanswered questions without leaving the selected topic", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/qa-clinic?topic=arithmetic-sequences-nth-term");
  const reject=page.getByRole("button",{name:/Reject All|Tout refuser|Alle ablehnen/i});
  if(await reject.isVisible().catch(()=>false))await reject.click();
  await page.getByLabel("Revision sprint length").selectOption("5");
  await page.getByRole("button",{name:"Start challenge",exact:true}).click();
  await expect(page.getByLabel("Filter topic")).toBeDisabled();
  await expect(page.getByRole("button",{name:"Start challenge",exact:true})).toBeDisabled();
  const questions:string[]=[];
  for(let i=0;i<5;i++){
    const card=page.locator("article").first();
    await expect(card).toBeVisible();
    questions.push((await card.locator("h3").first().textContent())!);
    await page.getByRole("button",{name:i===4?"Finish challenge":"Next question",exact:true}).click();
  }
  await expect(page.getByText("No first attempt",{exact:true})).toBeVisible();
  await expect(page.getByText("0 correct first try · 0 answered · 5 shown")).toBeVisible();
  await page.getByRole("button",{name:"Retry 5 missed or unattempted"}).click();
  for(let i=0;i<5;i++){
    await expect(page.locator("article h3").first()).toHaveText(questions[i]);
    if(i<4)await page.getByRole("button",{name:"Next question",exact:true}).click();
  }
  await page.getByRole("button",{name:"End this sprint"}).click();
  await expect(page.getByLabel("Filter topic")).toBeEnabled();
  await expect(page.getByLabel("Filter topic")).toHaveValue("arithmetic-sequences-nth-term");
  await expect(page.locator("article")).toHaveCount(6);
});
