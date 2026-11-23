// Captures dashboard screenshots for the guide. Needs backend (8000) and frontend (3000) running.
// Run from the project root: node docs/guide/shots.js
const path = require("path");
const fs = require("fs");
const { chromium } = require(path.join(__dirname, "../../frontend/node_modules/playwright"));

const OUT = path.join(__dirname, "shots");
const BASE = "http://localhost:3000";

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1360, height: 860 }, deviceScaleFactor: 1.5 });
  const shot = (name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });

  await page.goto(BASE + "/");
  await page.getByRole("button", { name: "Generate plan" }).click();
  await page.getByTestId("plan-row").first().waitFor();
  await page.waitForTimeout(1500);
  await shot("plan");
  await page.getByRole("button", { name: "TS-21" }).first().click();
  await page.waitForTimeout(1200);
  await page.locator("#row-TS-21").screenshot({ path: path.join(OUT, "plan-detail.png") });

  for (const [route, name] of [["/fleet", "fleet"], ["/usage", "usage"], ["/depot", "depot"], ["/overrides", "overrides"]]) {
    await page.goto(BASE + route);
    await page.waitForTimeout(1800);
    await shot(name);
  }

  await page.goto(BASE + "/simulate");
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Show the effect" }).click();
  await page.waitForTimeout(1500);
  await shot("simulate");

  await page.goto(BASE + "/knowledge");
  await page.getByRole("button", { name: "pressure below 7 bar" }).click();
  await page.waitForTimeout(1800);
  await shot("knowledge");

  await browser.close();
  console.log("shots written to docs/guide/shots");
})();
