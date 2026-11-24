import { test, expect } from "@playwright/test";

for (const width of [360, 768, 1440]) {
  test("launch markets and language tracks fit at " + width + "px", async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/subjects");
    const reject = page.getByRole("button", { name: /Reject All/i });
    if (await reject.isVisible().catch(() => false)) await reject.click();
    const markets = page.locator('[aria-label="Launch markets"]');
    await expect(markets.getByRole("button")).toHaveCount(3);
    for (const country of ["United Kingdom", "Germany", "Pakistan"]) await expect(markets.getByRole("button", { name: new RegExp(country) })).toBeVisible();
    await markets.getByRole("button", { name: /Pakistan/ }).click();
    await expect(markets.getByRole("button", { name: /Pakistan/ })).toHaveAttribute("aria-pressed", "true");
    const languages = page.locator("#study-languages");
    for (const lang of ["English", "German", "Arabic", "Urdu", "Welsh"]) await expect(languages.getByText(lang, { exact: true }).first()).toBeVisible();
    await expect(languages.getByText("Content in preparation")).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    if (width < 1024) await expect(page.getByRole("button", { name: /Filters/i }).first()).toBeVisible();
  });
}
