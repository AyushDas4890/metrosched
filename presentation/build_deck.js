// Builds presentation/MetroSched.pptx (18 slides).
// Run from the project root with pptxgenjs on NODE_PATH:  node presentation/build_deck.js
// Optional: set PPTX_SKILL_DIR to the pptx skill folder to write the brand colours into the deck theme.
const path = require("path");
const pptxgen = require("pptxgenjs");

const INK = "0E1A21", CARD = "13232D", PAPER = "F3F6F7", WHITE = "FFFFFF", MUTED = "4F626B", RULE = "D3DDE1";
const REV = "2A9FC6", STB = "BC8422", IBL = "DA5670", PLATE = "E6EDF0", LIGHT_MUTED = "93A6AF";

const THEME = {
  name: "MetroSched Night Desk",
  headFontFace: "Arial",
  bodyFontFace: "Calibri",
  colors: {
    dk1: INK, lt1: WHITE, dk2: CARD, lt2: PAPER,
    accent1: REV, accent2: STB, accent3: IBL, accent4: MUTED, accent5: LIGHT_MUTED, accent6: RULE,
    hlink: REV, folHlink: MUTED,
  },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "MetroSched";
pres.subject = "Explainable nightly train induction planning (CSE 471, SIH25081)";

pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: PAPER },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.9, fontFace: "Arial", fontSize: 26, bold: true, color: INK, margin: 0, valign: "middle", align: "left" }, text: "" } },
    { text: { text: "MetroSched  ·  CSE 471  ·  planning data synthetic, compressor data real (MetroPT-3)", options: { x: 0.6, y: 7.02, w: 9, h: 0.3, fontSize: 10, color: MUTED, margin: 0 } } },
  ],
  slideNumber: { x: 12.3, y: 7.02, w: 0.5, h: 0.3, fontSize: 10, color: MUTED },
});
pres.defineSlideMaster({ title: "DARK", background: { color: INK } });

const text = (s, t, o) => s.addText(t, { isTextBox: true, fontFace: "Calibri", fontSize: 16, color: INK, valign: "top", margin: 0, ...o });
const bullets = (items, o = {}) => items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1, ...o } }));
const card = (s, x, y, w, h, fill = WHITE) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: RULE, width: 1 }, rectRadius: 0.08 });
const plate = (s, id, x, y, fill = PLATE, ink = INK) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 1.05, h: 0.4, fill: { color: fill }, rectRadius: 0.05 });
  s.addText(id, { isTextBox: true, x, y, w: 1.05, h: 0.4, align: "center", valign: "middle", fontFace: "Arial", bold: true, fontSize: 13, color: ink, margin: 0 });
};
const tag = (s, label, color, x, y, w = 1.6) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.38, fill: { color }, rectRadius: 0.06 });
  s.addText(label, { isTextBox: true, x, y, w, h: 0.38, align: "center", valign: "middle", fontFace: "Arial", bold: true, fontSize: 13, color: WHITE, margin: 0 });
};
const table = (s, rows, o) => {
  const head = { bold: true, color: WHITE, fill: { color: INK } };
  s.addTable(rows.map((r, i) => r.map((c) => (i === 0 ? { text: c, options: head } : c))), {
    fontFace: "Calibri", fontSize: 14, color: INK, border: { type: "solid", color: RULE, pt: 1 }, fill: { color: WHITE }, valign: "middle", ...o,
  });
};
const content = (title, section) => {
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: section });
  s.addText(title, { placeholder: "title" });
  return s;
};

// ---------------- 1. Title ----------------
pres.addSection({ title: "Introduction" });
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "Introduction" });
  [["TS-07", REV], ["TS-12", REV], ["TS-04", STB], ["TS-21", IBL]].forEach(([id, c], i) => plate(s, id, 0.8 + i * 1.2, 1.15, c, WHITE));
  text(s, "MetroSched", { x: 0.8, y: 2.0, w: 11.5, h: 1.3, fontFace: "Arial", fontSize: 66, bold: true, color: WHITE });
  text(s, "Every train, a reason.", { x: 0.8, y: 3.35, w: 11, h: 0.7, fontSize: 28, italic: true, color: REV });
  text(s, "Explainable nightly train induction planning for Kochi Metro (Smart India Hackathon SIH25081)", { x: 0.8, y: 4.15, w: 11.5, h: 0.6, fontSize: 20, color: PLATE });
  text(s, "CSE 471 class project  ·  Planning data is synthetic; compressor sensor data is real (MetroPT-3, CC BY 4.0)", { x: 0.8, y: 6.4, w: 12, h: 0.4, fontSize: 13, color: LIGHT_MUTED });
  s.addNotes("MetroSched turns the 21:00 to 23:00 manual induction decision into an optimised, explained plan. Planning data is synthetic; the compressor sensor data is real.");
}

// ---------------- 2. Problem ----------------
{
  const s = content("Every night, about 25 trainsets need one of three assignments", "Introduction");
  [["REVENUE", "Runs passenger service tomorrow", REV], ["STANDBY", "Fit, held in reserve", STB], ["IBL", "Inspection Bay Line: maintenance", IBL]].forEach(([h, d, c], i) => {
    const x = 0.6 + i * 2.75;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.55, w: 2.55, h: 1.55, fill: { color: c }, rectRadius: 0.08 });
    text(s, h, { x: x + 0.2, y: 1.72, w: 2.2, h: 0.5, fontFace: "Arial", bold: true, fontSize: 22, color: WHITE });
    text(s, d, { x: x + 0.2, y: 2.3, w: 2.2, h: 0.7, fontSize: 15, color: WHITE });
  });
  text(s, "Today this is decided between 21:00 and 23:00 from spreadsheets, WhatsApp messages and Maximo exports: slow, error-prone and not auditable.", { x: 0.6, y: 3.5, w: 7.9, h: 1.2, fontSize: 18 });
  card(s, 8.9, 1.55, 3.8, 5.0);
  text(s, "Six interacting inputs", { x: 9.15, y: 1.75, w: 3.4, h: 0.5, fontFace: "Arial", bold: true, fontSize: 18 });
  text(s, bullets(["Fitness certificates (hard)", "Maximo job cards (hard)", "Cleaning slots (hard capacity)", "Branding exposure (soft)", "Mileage balancing (soft)", "Stabling geometry (soft)"]), { x: 9.15, y: 2.4, w: 3.4, h: 3.9, fontSize: 16, paraSpaceAfter: 8 });
  s.addNotes("Three hard rules can never be broken; three soft goals are traded off against each other.");
}

// ---------------- 3. What it is / who uses it ----------------
{
  const s = content("MetroSched recommends, explains and lets a person decide", "Introduction");
  table(s, [
    ["User", "What they get"],
    ["Depot supervisor (main user)", "Tonight's plan in under a second, with reasons and the power to override"],
    ["Maintenance engineer", "Which trains are blocked, and which compressors look likely to fail"],
    ["Branding team", "Whether wrapped trains are earning their contracted hours"],
    ["Operations manager / auditor", "Every plan and every override, with reasons"],
  ], { x: 0.6, y: 1.5, w: 7.6, colW: [2.9, 4.7], rowH: 0.62 });
  card(s, 8.6, 1.5, 4.1, 4.9);
  text(s, "What it is not", { x: 8.85, y: 1.7, w: 3.6, h: 0.5, fontFace: "Arial", bold: true, fontSize: 18 });
  text(s, bullets(["Not connected to real KMRL systems", "Not deployed: runs locally, no login", "Not a replacement for the supervisor", "Not a timetable or crew roster"]), { x: 8.85, y: 2.35, w: 3.6, h: 3.8, fontSize: 16, paraSpaceAfter: 10 });
}

// ---------------- 3b. A night with MetroSched ----------------
{
  const s = content("A night with MetroSched: how the features are used", "Introduction");
  const steps = [
    ["Afternoon", "Load data", "Certificates, Maximo job cards, branding (CSV/JSON ingest)"],
    ["21:00", "Generate plan", "Ranked list with reasons and alerts in under a second"],
    ["21:15", "Check fleet health", "Expiring certificates, compressor risk, open job cards"],
    ["22:30", "What-if", "A late fault comes in: simulate, see exactly what changes"],
    ["23:00", "Override and lock", "Supervisor overrules with a reason; it is logged"],
  ];
  steps.forEach(([time, h, d], i) => {
    const x = 0.6 + i * 2.48;
    s.addShape(pres.shapes.OVAL, { x: x + 0.95, y: 1.7, w: 0.42, h: 0.42, fill: { color: i === 4 ? STB : REV } });
    if (i < steps.length - 1) s.addShape(pres.shapes.LINE, { x: x + 1.42, y: 1.91, w: 2.0, h: 0, line: { color: RULE, width: 2 } });
    card(s, x, 2.45, 2.3, 2.9);
    text(s, time, { x: x + 0.2, y: 2.6, w: 1.9, h: 0.4, fontSize: 14, color: MUTED });
    text(s, h, { x: x + 0.2, y: 3.0, w: 1.9, h: 0.5, fontFace: "Arial", bold: true, fontSize: 17 });
    text(s, d, { x: x + 0.2, y: 3.85, w: 1.9, h: 1.4, fontSize: 14, color: MUTED });
  });
  text(s, "Next day: managers review plan history and the override log. The timeline is illustrative, not a measured KMRL workflow.", { x: 0.6, y: 5.75, w: 12.1, h: 0.6, fontSize: 14, color: MUTED });
}

// ---------------- 4. Architecture ----------------
pres.addSection({ title: "How it works" });
{
  const s = content("Architecture: data in, a ranked and explained plan out", "How it works");
  const box = (t, sub, x, y, w = 2.15, fill = WHITE, ink = INK) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 1.25, fill: { color: fill }, line: { color: RULE, width: 1 }, rectRadius: 0.08 });
    text(s, t, { x: x + 0.1, y: y + 0.22, w: w - 0.2, h: 0.45, align: "center", fontFace: "Arial", bold: true, fontSize: 15, color: ink });
    text(s, sub, { x: x + 0.1, y: y + 0.7, w: w - 0.2, h: 0.45, align: "center", fontSize: 13, color: ink === INK ? MUTED : LIGHT_MUTED });
  };
  box("Data", "seeded generator + CSV/JSON ingest", 0.6, 1.8);
  box("MetroPT-3", "real compressor sensors", 0.6, 3.6, 2.15, "FBF4E6");
  box("FastAPI + SQLite", "routes, storage", 3.35, 2.7);
  box("CP-SAT optimizer", "hard rules + weighted goals", 6.1, 1.8);
  box("Risk model", "scikit-learn random forest", 6.1, 3.6);
  box("Explanations", "rule-based reasons, alerts", 8.85, 2.7);
  box("Next.js dashboard", "6 pages + 3D story", 8.85, 4.7, 2.15, INK, WHITE);
  const arrow = (x, y, w, h, rot = 0) => s.addShape(pres.shapes.RIGHT_ARROW, { x, y, w, h, rotate: rot, fill: { color: REV } });
  arrow(2.8, 2.55, 0.5, 0.35); arrow(2.8, 3.95, 0.5, 0.35, -30);
  arrow(5.55, 2.55, 0.5, 0.35, -25); arrow(5.55, 3.65, 0.5, 0.35, 25);
  arrow(8.3, 2.55, 0.5, 0.35, 25); arrow(8.3, 3.7, 0.5, 0.35, -25);
  arrow(9.68, 4.15, 0.5, 0.35, 90);
  text(s, "Supervisor overrides are logged and, after 20, re-weight the soft goals (logistic regression).", { x: 0.6, y: 5.6, w: 9.6, h: 0.6, fontSize: 15, color: MUTED });
}

// ---------------- 5. Data ----------------
{
  const s = content("Two kinds of data: synthetic planning data, real sensor data", "How it works");
  card(s, 0.6, 1.5, 5.9, 5.0);
  text(s, "Synthetic (seed 471)", { x: 0.85, y: 1.7, w: 5.4, h: 0.5, fontFace: "Arial", bold: true, fontSize: 20 });
  text(s, bullets(["25 trainsets, 3 cars each, at Muttom depot", "75 fitness certificates, 41 Maximo-style job cards", "8 branding contracts, mileage 180k–260k km", "27 stabling bays on 3 lines + 6 IBL bays", "Same seed, same data; every assumption in ASSUMPTIONS.md"]), { x: 0.85, y: 2.35, w: 5.4, h: 4.0, fontSize: 16, paraSpaceAfter: 8 });
  card(s, 6.8, 1.5, 5.9, 5.0, "FBF4E6");
  text(s, "Real: MetroPT-3", { x: 7.05, y: 1.7, w: 5.4, h: 0.5, fontFace: "Arial", bold: true, fontSize: 20 });
  text(s, bullets(["Air compressor (APU) of one Metro do Porto train", "Feb–Aug 2020, 1,516,948 sensor rows, 15 signals", "4 company-reported air-leak failures", "UCI ML Repository, DOI 10.24432/C5VW3R, CC BY 4.0", "Each trainset gets a seeded 12-hour slice (an assumption)"]), { x: 7.05, y: 2.35, w: 5.4, h: 4.0, fontSize: 16, paraSpaceAfter: 8 });
}

// ---------------- 6. Hard vs soft ----------------
{
  const s = content("Hard rules are never broken; soft goals are traded off", "How it works");
  [[0.6, "Hard constraints", IBL, ["All 3 certificates valid on service date", "No open critical job card", "Exactly 18 trains in revenue", "At least 2 on standby", "Cleaning-due revenue trains ≤ 6 slots", "IBL trains ≤ 6 bays"]],
   [6.9, "Soft objective (weight)", REV, ["Branding shortfall (10)", "Mileage above fleet mean (2)", "Shunting moves (5)", "Standby buffer (3)", "Preventive maintenance (4)", "Compressor fault risk (500)"]]].forEach(([x, h, c, items]) => {
    card(s, x, 1.5, 5.8, 5.0);
    s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: 1.78, w: 0.36, h: 0.36, fill: { color: c } });
    text(s, h, { x: x + 0.85, y: 1.72, w: 4.7, h: 0.5, fontFace: "Arial", bold: true, fontSize: 20 });
    text(s, bullets(items), { x: x + 0.35, y: 2.45, w: 5.2, h: 3.9, fontSize: 17, paraSpaceAfter: 9 });
  });
}

// ---------------- 7. Optimizer ----------------
{
  const s = content("CP-SAT plans the whole fleet in hundredths of a second", "How it works");
  [["0.02 s", "25-train seeded plan"], ["0.04 s", "40 trains, 2 depots (limit 10 s)"], ["0", "hard-rule violations"]].forEach(([n, l], i) => {
    const x = 0.6 + i * 4.15;
    card(s, x, 1.5, 3.9, 2.1);
    text(s, n, { x: x + 0.3, y: 1.65, w: 3.4, h: 1.1, fontFace: "Arial", bold: true, fontSize: 52, color: REV });
    text(s, l, { x: x + 0.3, y: 2.85, w: 3.4, h: 0.6, fontSize: 16, color: MUTED });
  });
  text(s, bullets([
    "Variables: one yes/no per train per assignment, plus one per blocked exit on a stabling line.",
    "If no plan fits every hard rule, it returns the smallest relaxation (e.g. \"Relax required revenue by 2\") instead of a broken plan.",
    "One solver thread: tied plans resolve the same way each run, so tests and documented results are repeatable.",
    "An independent checker re-verifies every hard rule in the tests.",
  ]), { x: 0.6, y: 4.0, w: 12.1, h: 2.8, fontSize: 17, paraSpaceAfter: 8 });
}

// ---------------- 8. Explanations ----------------
{
  const s = content("Every assignment carries reasons built from the rules", "How it works");
  [["TS-22", REV, "Revenue", ["Branding: Kerala Tourism 20 h short — revenue recovers exposure", "Mileage 33,830 km below fleet mean", "Bay D1-L2-P2 has a clear exit path"]],
   ["TS-21", IBL, "IBL", ["Sent to IBL: high compressor (APU) fault risk", "Risk 94% from real MetroPT-3 slice 29–30 May 2020, which contains a reported air leak"]],
   ["TS-15", IBL, "IBL", ["Not fit for service", "Open critical job card WO100026: bogie bearing temperature alarm (hard rule)"]]].forEach(([id, c, a, rs], i) => {
    const y = 1.45 + i * 1.62;
    card(s, 0.6, y, 12.1, 1.45);
    plate(s, id, 0.85, y + 0.25, INK, WHITE);
    tag(s, a, c, 0.85, y + 0.8, 1.05);
    text(s, bullets(rs), { x: 2.25, y: y + 0.2, w: 10.2, h: 1.2, fontSize: 16, paraSpaceAfter: 4 });
  });
  text(s, "No language model: the same input always gives the same words, so every decision can be audited.", { x: 0.6, y: 6.4, w: 12, h: 0.4, fontSize: 14, color: MUTED });
}

// ---------------- 8b. Override learning ----------------
{
  const s = content("Overrides: the supervisor has the last word, and the system learns", "How it works");
  card(s, 0.6, 1.5, 5.9, 5.0);
  text(s, "Overriding a train", { x: 0.85, y: 1.7, w: 5.4, h: 0.5, fontFace: "Arial", bold: true, fontSize: 19 });
  text(s, bullets([
    "Open the train on Tonight's plan, pick a new assignment, give a reason",
    "Stored with time, reason and the train's features; shown on the Override log",
    "An unfit train cannot be moved out of IBL: the API refuses",
    "Limitation: the plan is not re-solved around an override",
  ]), { x: 0.85, y: 2.35, w: 5.4, h: 4.0, fontSize: 16, paraSpaceAfter: 9 });
  card(s, 6.8, 1.5, 5.9, 5.0);
  text(s, "Learning from overrides", { x: 7.05, y: 1.7, w: 5.4, h: 0.5, fontFace: "Arial", bold: true, fontSize: 19 });
  text(s, bullets([
    "Label: did the supervisor move the train into revenue (1) or out (0)?",
    "Features: branding need, low mileage, exit bay, few open jobs",
    "Logistic regression; weight = default × exp(coefficient), clamped 0.25×–4×",
    "Fewer than 20 overrides, or all in one direction: default weights",
  ]), { x: 7.05, y: 2.35, w: 5.4, h: 4.0, fontSize: 16, paraSpaceAfter: 9 });
}

// ---------------- 9. MetroPT-3 model ----------------
pres.addSection({ title: "Real data" });
{
  const s = content("Real data: compressor fault-risk model trained on MetroPT-3", "Real data");
  text(s, bullets([
    "1.5 M sensor rows → 8,627 thirty-minute windows (mean, spread, signal duty) → 167 labelled as failure",
    "Random forest; every window scored by a model trained on the other months only (leave-one-month-out)",
    "Each trainset's risk = peak score in its slice of 24 logged half-hours (≈12 h); ≥ 50% raises an alert",
  ]), { x: 0.6, y: 1.45, w: 12.1, h: 1.6, fontSize: 16, paraSpaceAfter: 6 });
  s.addChart(pres.charts.BAR, [{ name: "Peak risk", labels: ["18 Apr", "29–30 May", "5–7 Jun", "15 Jul"], values: [48, 93, 51, 4] }], {
    x: 0.6, y: 3.15, w: 6.2, h: 3.65, barDir: "col", chartColors: [REV], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0\"%\"",
    dataLabelFontFace: "+mn-lt", dataLabelFontSize: 13, dataLabelColor: INK, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
    catAxisLabelColor: INK, valAxisLabelColor: MUTED, valAxisMaxVal: 100, valAxisMinVal: 0, valGridLine: { color: RULE, size: 1 }, catGridLine: { style: "none" },
    showLegend: false, showTitle: true, title: "Peak out-of-fold risk during each reported air leak", titleFontFace: "+mn-lt", titleFontSize: 13, titleColor: INK,
  });
  table(s, [
    ["Out-of-fold metric", "Value"],
    ["ROC AUC", "0.975"],
    ["Reported failures caught at 50%", "2 of 4"],
    ["False alarms: windows / 12-h slices", "1.5% / 3.9%"],
    ["Average precision", "0.286"],
  ], { x: 7.2, y: 3.25, w: 5.5, colW: [3.7, 1.8], rowH: 0.55 });
  text(s, "Honest result: excellent ranking, but 15 Jul is missed and some normal slices score high.", { x: 7.2, y: 6.15, w: 5.5, h: 0.6, fontSize: 14, color: MUTED });
}

// ---------------- 10. Risk in the plan ----------------
{
  const s = content("Compressor risk shapes tonight's plan as a soft goal", "Real data");
  table(s, [
    ["Train", "Real slice (2020)", "Risk", "Reported leak in slice?", "Plan"],
    ["TS-21", "29 May 20:30 – 30 May 08:00", "94%", "Yes", "IBL, with alert"],
    ["TS-09", "13 May 23:00 – 14 May 13:30", "86%", "No (false alarm)", "Revenue, with alert"],
    ["TS-22", "5 Jun 07:00 – 18:30", "23%", "Yes (leak starts 10:00)", "Revenue"],
    ["TS-03", "15 Jul 12:00 – 23:30", "4%", "Yes (missed)", "Revenue"],
  ], { x: 0.6, y: 1.5, w: 12.1, colW: [1.2, 3.6, 1.1, 3.2, 3.0], rowH: 0.6 });
  text(s, bullets([
    "Objective term: 500 × risk for a train in revenue. Whether a train leaves depends on its replacement cost (TS-23 test: out at 95% risk).",
    "TS-09 stays in service: its branding debt and low mileage outweigh the penalty, and the alert tells the supervisor to inspect it.",
    "Hard rules are unchanged: risk alone never forces a train out, because the model is not ground truth.",
  ]), { x: 0.6, y: 4.85, w: 12.1, h: 2.0, fontSize: 16, paraSpaceAfter: 6 });
}

// ---------------- 11. What-if ----------------
pres.addSection({ title: "The product" });
{
  const s = content("What-if simulation shows exactly which trains change", "The product");
  table(s, [
    ["Scenario", "Result on the seeded plan"],
    ["TS-07 Rolling-Stock certificate expires", "TS-07 Revenue → IBL; TS-04 Standby → Revenue; TS-21 IBL → Standby"],
    ["Critical fault reported on TS-22", "TS-22 Revenue → IBL; TS-04 Standby → Revenue; TS-21 IBL → Standby"],
    ["Only 16 revenue trains needed", "TS-09 (86% risk) and TS-20 Revenue → Standby; TS-04 Standby → IBL"],
    ["One cleaning crew absent", "No valid plan: \"Relax required revenue by 2\""],
  ], { x: 0.6, y: 1.5, w: 12.1, colW: [4.3, 7.8], rowH: 0.78 });
  text(s, "Why TS-21 moves to standby: fit trains drop to 20, and 18 revenue + 2 standby need all of them. Every diff is asserted by a test.", { x: 0.6, y: 5.6, w: 12, h: 0.5, fontSize: 15, color: MUTED });
}

// ---------------- 12. Dashboard ----------------
{
  const s = content("A night-shift dashboard: six pages and a 3D explainer", "The product");
  [["Tonight's plan", "Ranked list first; reasons on click; inline override"], ["Fleet health", "Certificate expiry, compressor risk, open job cards"], ["Mileage & branding", "Distance from fleet mean; advertiser shortfall"],
   ["Depot bay map", "Stabling lines, IBL bays, shunting moves"], ["What-if simulator", "Scenario in, assignment diff out"], ["Override log", "Every override and the current weights"]].forEach(([h, d], i) => {
    const x = 0.6 + (i % 3) * 4.15, y = 1.5 + Math.floor(i / 3) * 2.15;
    card(s, x, y, 3.9, 1.95);
    text(s, h, { x: x + 0.3, y: y + 0.25, w: 3.3, h: 0.5, fontFace: "Arial", bold: true, fontSize: 19 });
    text(s, d, { x: x + 0.3, y: y + 0.85, w: 3.3, h: 0.9, fontSize: 15, color: MUTED });
  });
  text(s, "Next.js, Tailwind, shadcn/ui, Recharts, Motion springs, React Bits; /story uses GSAP ScrollTrigger and CSS 3D. Colour-blind-safe colours; nothing shown by colour alone; reduced-motion respected.", { x: 0.6, y: 5.95, w: 12.1, h: 0.8, fontSize: 14, color: MUTED });
}

// ---------------- 13. Results / tests ----------------
pres.addSection({ title: "Results" });
{
  const s = content("Results: 18 revenue, 2 standby, 5 IBL; all tests passing", "Results");
  s.addChart(pres.charts.BAR, [{ name: "Trains", labels: ["Revenue", "Standby", "IBL"], values: [18, 2, 5] }], {
    x: 0.6, y: 1.5, w: 6.4, h: 5.1, barDir: "col", chartColors: [REV, STB, IBL], showValue: true, dataLabelPosition: "outEnd",
    dataLabelFontFace: "+mn-lt", dataLabelFontSize: 14, dataLabelColor: INK, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
    catAxisLabelColor: INK, valAxisLabelColor: MUTED, valGridLine: { color: RULE, size: 1 }, catGridLine: { style: "none" }, showLegend: false,
    showTitle: true, title: "Trains per assignment (seed 471)", titleFontFace: "+mn-lt", titleFontSize: 13, titleColor: INK,
  });
  table(s, [
    ["Suite", "Result", "Covers"],
    ["pytest", "28 / 28", "Rules, optimizer, what-if, learning, MetroPT-3 data and model, API, 40-train speed"],
    ["Vitest", "6 / 6", "Formatting helpers, components"],
    ["Playwright", "1 / 1", "Generates a plan in the browser"],
  ], { x: 7.4, y: 1.5, w: 5.3, colW: [1.25, 1.05, 3.0], rowH: 0.75, fontSize: 13 });
  text(s, "Full suite passed 28/28 in 3 of 3 runs after making the solver deterministic.", { x: 7.4, y: 5.0, w: 5.3, h: 0.8, fontSize: 14, color: MUTED });
}

// ---------------- 13b. How to run it ----------------
{
  const s = content("Run it in three commands (Windows PowerShell)", "Results");
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.5, w: 7.0, h: 2.1, fill: { color: INK }, rectRadius: 0.08 });
  text(s, "git clone <repo-url> metrosched\ncd metrosched\n.\\run.ps1", { x: 0.95, y: 1.75, w: 6.4, h: 1.7, fontFace: "Courier New", fontSize: 20, color: PLATE });
  text(s, bullets([
    "Creates .venv, installs Python and npm packages, seeds the data",
    "API on localhost:8000 (docs at /docs), dashboard on localhost:3000",
    ".\\run.ps1 test runs pytest, Vitest and Playwright",
    "MetroPT-3 windows are committed; the 208 MB raw download is only needed to rebuild them",
  ]), { x: 0.6, y: 3.95, w: 7.0, h: 2.6, fontSize: 16, paraSpaceAfter: 8 });
  card(s, 8.0, 1.5, 4.7, 5.0);
  text(s, "Stack", { x: 8.25, y: 1.7, w: 4.2, h: 0.5, fontFace: "Arial", bold: true, fontSize: 19 });
  text(s, bullets([
    "Python 3.14, FastAPI, Pydantic v2",
    "SQLite via SQLAlchemy",
    "Google OR-Tools CP-SAT",
    "scikit-learn, pandas",
    "Next.js 15, TypeScript, Tailwind",
    "shadcn/ui, Recharts, Motion, GSAP",
    "pytest, Vitest, Playwright",
  ]), { x: 8.25, y: 2.35, w: 4.2, h: 4.0, fontSize: 16, paraSpaceAfter: 6 });
}

// ---------------- 14. Limitations ----------------
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "Results" });
  text(s, "Limitations and next steps", { x: 0.8, y: 0.6, w: 11.5, h: 0.9, fontFace: "Arial", bold: true, fontSize: 34, color: WHITE });
  text(s, bullets([
    "Compressor data comes from one Porto train mapped onto synthetic Kochi trainsets; the model misses 2 of 4 failures at 50%",
    "Overrides are logged but the plan is not re-solved around them",
    "Capacities are fleet-wide, not per depot; the dashboard shows one depot",
    "Shunting is a blocking-pair model, not a full move sequence",
    "Next: re-solve after overrides, per-depot capacities, richer sensor features, real KMRL data connectors",
  ]), { x: 0.8, y: 1.8, w: 11.6, h: 4.6, fontSize: 20, color: WHITE, paraSpaceAfter: 12 });
}

// ---------------- 15. References ----------------
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "Results" });
  text(s, "Data and references", { x: 0.8, y: 0.6, w: 11.5, h: 0.9, fontFace: "Arial", bold: true, fontSize: 34, color: WHITE });
  text(s, bullets([
    "MetroPT-3 Dataset, UCI Machine Learning Repository, DOI 10.24432/C5VW3R, licensed CC BY 4.0",
    "Davari, N. et al. (2021). Predictive maintenance based on anomaly detection using deep learning for air production unit in the railway industry. IEEE DSAA.",
    "Veloso, B. et al. (2022). The MetroPT dataset for predictive maintenance. Scientific Data 9, 764.",
    "Smart India Hackathon problem SIH25081 (Kochi Metro Rail Limited): train induction planning and scheduling",
    "Google OR-Tools CP-SAT, scikit-learn, FastAPI, Next.js",
  ]), { x: 0.8, y: 1.8, w: 11.6, h: 4.2, fontSize: 17, color: PLATE, paraSpaceAfter: 12 });
  text(s, "Full guide: docs/MetroSched_Explained.pdf", { x: 0.8, y: 6.4, w: 11, h: 0.4, fontSize: 14, color: LIGHT_MUTED });
}

(async () => {
  const out = path.join(__dirname, "MetroSched.pptx");
  await pres.writeFile({ fileName: out });
  if (process.env.PPTX_SKILL_DIR) {
    const { applyTheme } = require(path.join(process.env.PPTX_SKILL_DIR, "scripts", "apply_theme.js"));
    await applyTheme(out, THEME);
  }
  console.log("wrote", out);
})();
