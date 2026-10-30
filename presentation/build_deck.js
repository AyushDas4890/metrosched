// Builds presentation/MetroSched.pptx. Run: NODE_PATH=<dir with pptxgenjs> node presentation/build_deck.js
const path = require("path");
const pptxgen = require("pptxgenjs");

const INK = "13262F", BG = "F3F6F7", REV = "0F7FA8", STB = "B7790A", IBL = "C4314B", MUTED = "4F626B", WHITE = "FFFFFF";
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.theme = { headFontFace: "Arial", bodyFontFace: "Calibri" };
pres.title = "MetroSched";

pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: BG },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.4, w: 12.1, h: 0.9, fontFace: "Arial", fontSize: 32, bold: true, color: INK, margin: 0 }, text: "" } },
    { text: { text: "MetroSched · CSE 471 · synthetic data", options: { x: 0.6, y: 7.0, w: 6, h: 0.3, fontSize: 10, color: MUTED, margin: 0 } } },
  ],
  slideNumber: { x: 12.3, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: MUTED },
});
pres.defineSlideMaster({ title: "DARK", background: { color: INK } });

const text = (s, t, o) => s.addText(t, { isTextBox: true, fontFace: "Calibri", fontSize: 16, color: INK, valign: "top", ...o });
const plate = (s, id, x, y, color = INK) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 1.1, h: 0.42, fill: { color }, rectRadius: 0.05 });
  s.addText(id, { isTextBox: true, x, y, w: 1.1, h: 0.42, align: "center", valign: "middle", fontFace: "Arial", bold: true, fontSize: 14, color: WHITE, margin: 0 });
};
const card = (s, x, y, w, h) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: WHITE }, line: { color: "D3DDE1", width: 1 }, rectRadius: 0.08 });

// 1. Title
{
  const s = pres.addSlide({ masterName: "DARK" });
  ["TS-07", "TS-12", "TS-22", "TS-04"].forEach((id, i) => plate(s, id, 0.8 + i * 1.25, 1.2, [REV, REV, STB, IBL][i]));
  text(s, "MetroSched", { x: 0.8, y: 2.2, w: 11, h: 1.2, fontFace: "Arial", fontSize: 60, bold: true, color: WHITE });
  text(s, "Explainable nightly train induction planning for Kochi Metro (SIH25081)", { x: 0.8, y: 3.5, w: 11, h: 0.8, fontSize: 24, color: "C9D6DC" });
  text(s, "CSE 471 class project · All per-train data is synthetic", { x: 0.8, y: 6.3, w: 11, h: 0.5, fontSize: 14, color: "9FB2BA" });
  s.addNotes("MetroSched turns the 21:00–23:00 manual induction decision into an optimized, explainable ranked list.");
}

// 2. Problem
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("Every night, ~25 trainsets need one of three assignments", { placeholder: "title" });
  [["Revenue", "Runs passenger service next morning", REV], ["Standby", "Fit, held in reserve", STB], ["IBL", "Inspection Bay Line / maintenance", IBL]].forEach(([h, d, c], i) => {
    const x = 0.6 + i * 2.6;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.6, w: 2.4, h: 1.5, fill: { color: c }, rectRadius: 0.08 });
    text(s, h, { x: x + 0.2, y: 1.75, w: 2.0, h: 0.5, fontFace: "Arial", bold: true, fontSize: 22, color: WHITE });
    text(s, d, { x: x + 0.2, y: 2.3, w: 2.0, h: 0.7, fontSize: 14, color: WHITE });
  });
  text(s, "Today: spreadsheets, WhatsApp updates and Maximo exports. Slow, error-prone, not auditable.", { x: 0.6, y: 3.5, w: 7.4, h: 1.0, fontSize: 18 });
  card(s, 8.6, 1.6, 4.1, 5.0);
  text(s, "Six interacting inputs", { x: 8.85, y: 1.8, w: 3.6, h: 0.5, fontFace: "Arial", bold: true, fontSize: 18 });
  text(s, [
    "Fitness certificates (hard)", "Maximo job cards (hard)", "Cleaning slots (hard capacity)",
    "Branding exposure (soft)", "Mileage balancing (soft)", "Stabling geometry (soft)",
  ].map((t, i, a) => ({ text: t, options: { bullet: true, breakLine: i < a.length - 1 } })), { x: 8.85, y: 2.4, w: 3.7, h: 3.8, fontSize: 16, paraSpaceAfter: 8 });
}

// 3. Architecture
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("Architecture: data in, ranked and explained plan out", { placeholder: "title" });
  const boxes = [
    ["Seeded generator / CSV & JSON ingest", 0.6], ["FastAPI + SQLite", 3.2], ["CP-SAT optimizer", 5.8], ["Rule-based explanations", 8.4], ["Next.js dashboard", 11.0],
  ];
  boxes.forEach(([t, x], i) => {
    card(s, x, 2.4, 2.1, 1.5);
    text(s, t, { x: x + 0.1, y: 2.5, w: 1.9, h: 1.3, align: "center", valign: "middle", fontFace: "Arial", bold: true, fontSize: 15 });
    if (i < boxes.length - 1) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 2.15, y: 2.95, w: 0.4, h: 0.4, fill: { color: REV } });
  });
  card(s, 5.8, 4.6, 2.1, 1.3);
  text(s, "Override learner (scikit-learn)", { x: 5.9, y: 4.7, w: 1.9, h: 1.1, align: "center", valign: "middle", fontFace: "Arial", bold: true, fontSize: 14 });
  s.addShape(pres.shapes.UP_ARROW, { x: 6.65, y: 4.0, w: 0.4, h: 0.55, fill: { color: STB } });
  text(s, "Supervisor overrides are logged with the train's features. After 20 overrides they re-weight the soft objective.", { x: 8.3, y: 4.7, w: 4.4, h: 1.2, fontSize: 15, color: MUTED });
}

// 4. Hard vs soft
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("Hard rules are never broken; soft goals are traded off", { placeholder: "title" });
  [[0.6, "Hard constraints", IBL, ["All 3 certificates valid on service date", "No open critical job card", "Exactly the required revenue count", "Standby ≥ minimum", "Cleaning-due revenue trains ≤ slots", "IBL ≤ bay capacity"]],
   [6.9, "Soft objective (weighted)", REV, ["Branding shortfall if wrapped train is not in revenue", "Mileage above fleet mean in revenue", "Shunting moves to clear the exit", "Standby buffer bonus", "Preventive maintenance for open non-critical jobs"]]]
    .forEach(([x, h, c, items]) => {
      card(s, x, 1.6, 5.8, 4.9);
      s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: 1.85, w: 0.4, h: 0.4, fill: { color: c } });
      text(s, h, { x: x + 0.85, y: 1.8, w: 4.7, h: 0.5, fontFace: "Arial", bold: true, fontSize: 20 });
      text(s, items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })), { x: x + 0.3, y: 2.5, w: 5.2, h: 3.8, fontSize: 16, paraSpaceAfter: 8 });
    });
}

// 5. Model & performance
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("Google OR-Tools CP-SAT solves the 40-train case in 0.03 s", { placeholder: "title" });
  [["0.03 s", "40 trains, 2 depots (limit: 10 s)"], ["0", "hard-rule violations in seeded plan"], ["25/25", "trains with visible reasons"]].forEach(([n, l], i) => {
    const x = 0.6 + i * 4.15;
    card(s, x, 1.7, 3.9, 2.2);
    text(s, n, { x: x + 0.3, y: 1.85, w: 3.4, h: 1.1, fontFace: "Arial", bold: true, fontSize: 54, color: REV });
    text(s, l, { x: x + 0.3, y: 3.0, w: 3.4, h: 0.8, fontSize: 16, color: MUTED });
  });
  text(s, [
    { text: "Variables: x[train, assignment] ∈ {0,1}, plus one move flag per blocking pair on a stabling line.", options: { bullet: true, breakLine: true } },
    { text: "If no plan satisfies every hard rule, the model is re-solved with slack on capacity rules. The smallest relaxation is reported instead of a plan.", options: { bullet: true, breakLine: true } },
    { text: "An independent checker re-verifies every hard rule in the tests.", options: { bullet: true } },
  ], { x: 0.6, y: 4.3, w: 12.1, h: 2.3, fontSize: 17, paraSpaceAfter: 8 });
}

// 6. Explainability
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("Every assignment carries reasons derived from the rules", { placeholder: "title" });
  [["TS-22", REV, "Revenue", ["Fit for service and selected for revenue", "Earliest certificate expiry: Rolling-Stock on 2026-11-30", "Open non-critical job cards: WO100036 (high), WO100037 (low)"]],
   ["TS-20", STB, "Standby", ["Held as standby: revenue requirement met by higher-ranked trains", "Mileage 238,939 km is 19,562 km above fleet mean"]],
   ["TS-15", IBL, "IBL", ["Not fit for service; must go to Inspection Bay Line", "Open critical job card WO100026: bogie bearing temperature alarm (hard rule)"]]]
    .forEach(([id, c, a, rs], i) => {
      const y = 1.6 + i * 1.7;
      card(s, 0.6, y, 12.1, 1.5);
      plate(s, id, 0.85, y + 0.2);
      text(s, a, { x: 0.85, y: y + 0.75, w: 1.1, h: 0.4, align: "center", bold: true, fontSize: 14, color: c, margin: 0 });
      text(s, rs.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < rs.length - 1 } })), { x: 2.2, y: y + 0.15, w: 10.3, h: 1.25, fontSize: 15 });
    });
}

// 7. Dashboard
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("Six dashboard pages for the supervisor's night shift", { placeholder: "title" });
  [["Tonight's plan", "Ranked list first, reasons on expand, inline override"], ["Fleet health", "Certificate expiry chart, open Maximo job cards"], ["Mileage & branding", "Deviation from fleet mean, exposure shortfall"],
   ["Depot bay map", "Stabling lines, IBL occupancy, shunting moves"], ["What-if simulator", "Scenario in, assignment diff out"], ["Override log", "Logged overrides and current learned weights"]]
    .forEach(([h, d], i) => {
      const x = 0.6 + (i % 3) * 4.15, y = 1.6 + Math.floor(i / 3) * 2.55;
      card(s, x, y, 3.9, 2.3);
      text(s, h, { x: x + 0.3, y: y + 0.25, w: 3.3, h: 0.5, fontFace: "Arial", bold: true, fontSize: 20 });
      text(s, d, { x: x + 0.3, y: y + 0.85, w: 3.3, h: 1.2, fontSize: 16, color: MUTED });
    });
}

// 8. What-if
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("What-if simulation shows exactly which trains change", { placeholder: "title" });
  const hdr = { bold: true, color: WHITE, fill: { color: INK } };
  s.addTable([
    [{ text: "Scenario", options: hdr }, { text: "Result (seed 471)", options: hdr }],
    ["TS-07 Rolling-Stock certificate expires", "TS-07 Revenue → IBL; TS-04 IBL → Revenue"],
    ["Critical fault reported on TS-22", "TS-22 Revenue → IBL; TS-04 IBL → Revenue"],
    ["Only 16 revenue trains needed", "TS-02, TS-13, TS-17 Revenue → Standby; TS-04 IBL → Revenue; TS-16 Standby → IBL"],
    ["One cleaning crew absent", "No valid plan: relaxation report says relax cleaning slots by 2"],
  ], { x: 0.6, y: 1.6, w: 12.1, colW: [4.4, 7.7], fontFace: "Calibri", fontSize: 16, color: INK, border: { type: "solid", color: "D3DDE1", pt: 1 }, fill: { color: WHITE }, rowH: 0.75, valign: "middle" });
}

// 9. Results chart
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("Seeded plan: 18 revenue, 2 standby, 5 IBL", { placeholder: "title" });
  s.addChart(pres.charts.BAR, [{ name: "Trains", labels: ["Revenue", "Standby", "IBL"], values: [18, 2, 5] }], {
    x: 0.6, y: 1.6, w: 6.6, h: 5.0, barDir: "col", chartColors: [REV, STB, IBL], showValue: true, dataLabelPosition: "outEnd",
    dataLabelFontFace: "Calibri", dataLabelFontSize: 14, dataLabelColor: INK, catAxisLabelFontFace: "Calibri", valAxisLabelFontFace: "Calibri",
    catAxisLabelColor: INK, valAxisLabelColor: MUTED, valGridLine: { color: "E3E9EC", size: 1 }, catGridLine: { style: "none" }, showLegend: false,
    showTitle: true, title: "Trains per assignment", titleFontFace: "Calibri", titleFontSize: 14, titleColor: INK,
  });
  card(s, 7.6, 1.6, 5.1, 5.0);
  text(s, "Tests", { x: 7.9, y: 1.8, w: 4.5, h: 0.5, fontFace: "Arial", bold: true, fontSize: 20 });
  text(s, [
    { text: "pytest: 22 passed", options: { bullet: true, breakLine: true } },
    { text: "Vitest: 6 passed", options: { bullet: true, breakLine: true } },
    { text: "Playwright smoke test: plan generated in the browser", options: { bullet: true, breakLine: true } },
    { text: "40 trains / 2 depots under 10 s", options: { bullet: true } },
  ], { x: 7.9, y: 2.4, w: 4.6, h: 3.8, fontSize: 17, paraSpaceAfter: 10 });
}

// 10. Limitations
{
  const s = pres.addSlide({ masterName: "DARK" });
  text(s, "Limitations and next steps", { x: 0.8, y: 0.6, w: 11.5, h: 1.0, fontFace: "Arial", bold: true, fontSize: 36, color: WHITE });
  text(s, [
    "Capacities are fleet-wide, not per depot; the dashboard shows one depot",
    "Shunting is a blocking-pair model, not a full move sequence",
    "Learner re-weights soft goals; withdrawal-risk prediction is future work",
    "Validate assumptions against real KMRL data before any operational use",
  ].map((t, i, a) => ({ text: t, options: { bullet: true, breakLine: i < a.length - 1 } })), { x: 0.8, y: 1.9, w: 11.5, h: 4.0, fontSize: 22, color: WHITE, paraSpaceAfter: 14 });
  text(s, "All per-train data is synthetic; see docs/ASSUMPTIONS.md", { x: 0.8, y: 6.4, w: 11, h: 0.5, fontSize: 14, color: "9FB2BA" });
}

pres.writeFile({ fileName: path.join(__dirname, "MetroSched.pptx") }).then((f) => console.log("wrote", f));
