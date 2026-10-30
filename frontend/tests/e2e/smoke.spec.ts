import { expect, test } from "@playwright/test";

test("generates a ranked plan from seeded data", async ({ page, request }) => {
  await request.post("http://localhost:8000/data/seed");
  await page.goto("/");
  await expect(page.getByText("All train data shown here is synthetic")).toBeVisible();
  await page.getByRole("button", { name: "Generate plan" }).click();
  const rows = page.getByTestId("plan-row");
  await expect(rows).toHaveCount(25);
  await expect(rows.first()).toContainText("Revenue");
  await rows.first().getByRole("button").click();
  await expect(page.getByRole("heading", { name: "Reasons" })).toBeVisible();
});
