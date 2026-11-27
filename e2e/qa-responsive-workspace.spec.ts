import { expect, test } from "@playwright/test";

for (const viewport of [{width:390,height:844},{width:768,height:1024},{width:1440,height:900}]) {
  test("Q&A navigation and keyboard focus work at "+viewport.width+"px", async ({page}) => {
    await page.setViewportSize(viewport);
    await page.goto("/qa-clinic?subject=mathematics&topic=arithmetic-sequences-nth-term");
    const reject=page.getByRole("button",{name:/Reject All|Tout refuser|Alle ablehnen/i});
    if(await reject.isVisible().catch(()=>false))await reject.click();
    const nav=page.getByRole("navigation",{name:"Q&A study areas"});
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link",{name:"Explore Q&A"})).toBeVisible();
    await nav.getByRole("link",{name:"Your revision progress"}).click();
    await expect(page).toHaveURL(/#qa-revision$/);
    await expect(page.getByLabel("Filter topic")).toHaveValue("arithmetic-sequences-nth-term");
    await page.getByLabel("Revision sprint length").selectOption("5");
    await page.getByRole("button",{name:"Start challenge",exact:true}).click();
    await expect(page.getByRole("heading",{name:"Question 1 of 5"})).toBeFocused();
    const progress=page.getByRole("progressbar",{name:"5-question quick challenge"});
    await expect(progress).toHaveAttribute("aria-valuenow","0");
    await page.getByRole("button",{name:"Next question"}).click();
    await expect(page.getByRole("heading",{name:"Question 2 of 5"})).toBeFocused();
    await expect(progress).toHaveAttribute("aria-valuenow","1");
    await page.getByRole("button",{name:"End this sprint"}).click();
    await expect(page.getByRole("heading",{name:"Explore Q&A",exact:true})).toBeFocused();
    await expect(progress).toHaveCount(0);
    await expect(page.locator("article")).toHaveCount(6);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBeTruthy();
  });
}
