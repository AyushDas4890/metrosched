// Renders docs/guide/guide.html to docs/MetroSched_Explained.pdf with the Playwright Chromium from frontend/.
// Run from the project root: node docs/guide/render.js
const path = require("path");
const { chromium } = require(path.join(__dirname, "../../frontend/node_modules/playwright"));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(require("url").pathToFileURL(path.join(__dirname, "guide.html")).href);
  await page.pdf({
    path: path.join(__dirname, "../MetroSched_Explained.pdf"),
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate:
      '<div style="font-size:8px;color:#4f626b;width:100%;padding:0 16mm;display:flex;justify-content:space-between">' +
      '<span>MetroSched, explained · real MetroPT-3 data</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
    margin: { top: "18mm", bottom: "20mm", left: "16mm", right: "16mm" },
  });
  await browser.close();
  console.log("wrote docs/MetroSched_Explained.pdf");
})();
