import { test, expect } from "@playwright/test";

test("Q&A self-check can reveal public RAG lesson sources with GraphRAG links", async ({ page }) => {
  await page.goto("/qa-clinic");
  const first = page.locator("article").first();
  const open = first.getByRole("button", { name: "Explore learning connections" });
  await expect(open).toBeVisible();
  await open.click();
  await expect(first.getByText("Lesson-backed explanations")).toBeVisible();
  await expect(first.getByText(/not an independently exam-board-verified source/)).toBeVisible();
  await expect(first.getByText(/\[LESSON:quadratic-equations\]/)).toBeVisible();
  await expect(first.getByText("Connected concepts")).toBeVisible();
  const related = first.getByRole("link", { name: /Simultaneous Equations by Elimination/ });
  await expect(related).toBeVisible();
  await related.click();
  await expect(page).toHaveURL(/\/tutorials\?tutorial=simultaneous-equations/);
});

test("the tutorial view includes a source panel without sending personal data to AI", async ({ page }) => {
  await page.goto("/tutorials?tutorial=quadratic-equations");
  await expect(page.getByRole("button", { name: "Explore learning connections" })).toBeVisible();
  await page.getByRole("button", { name: "Explore learning connections" }).click();
  await expect(page.getByText("Intelligence by Omniqora")).toBeVisible();
  await expect(page.getByText(/\[LESSON:quadratic-equations\]/)).toBeVisible();
});
