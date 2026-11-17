import { expect, test } from "@playwright/test";

test("generates a ranked plan from MetroPT-3 data", async ({ page, request }) => {
  await request.delete("http://localhost:8000/data"); // no uploads: the MetroPT-3 fleet
  await page.goto("/");
  await expect(page.getByText("No synthetic data.")).toBeVisible();
  await page.getByRole("button", { name: "Generate plan" }).click();
  const rows = page.getByTestId("plan-row");
  await expect(rows).toHaveCount(25);
  await expect(rows.first()).toContainText("Revenue");
  await rows.first().getByRole("button").click();
  await expect(page.getByRole("heading", { name: "Reasons" })).toBeVisible();
});
