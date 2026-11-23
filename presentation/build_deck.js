// Builds presentation/MetroSched.pptx (exactly 12 slides).
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
    { text: { text: "MetroSched  ·  CSE 471  ·  no synthetic data: real MetroPT-3 compressor data", options: { x: 0.6, y: 7.02, w: 9, h: 0.3, fontSize: 10, color: MUTED, margin: 0 } } },
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
const chartText = { dataLabelFontFace: "+mn-lt", catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", titleFontFace: "+mn-lt",
  dataLabelColor: INK, catAxisLabelColor: INK, valAxisLabelColor: MUTED, titleColor: INK, titleFontSize: 13 };

// ================= 1. Title =================
pres.addSection({ title: "Introduction" });
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "Introduction" });
  [["TS-08", REV], ["TS-11", REV], ["TS-22", STB], ["TS-21", IBL]].forEach(([id, c], i) => plate(s, id, 0.8 + i * 1.2, 1.15, c, WHITE));
  text(s, "MetroSched", { x: 0.8, y: 2.0, w: 11.5, h: 1.3, fontFace: "Arial", fontSize: 66, bold: true, color: WHITE });
  text(s, "Every train, a reason.", { x: 0.8, y: 3.35, w: 11, h: 0.7, fontSize: 28, italic: true, color: REV });
  text(s, "Explainable nightly train induction planning for Kochi Metro (Smart India Hackathon SIH25081)", { x: 0.8, y: 4.15, w: 11.5, h: 0.6, fontSize: 20, color: PLATE });
  text(s, "CSE 471 class project  ·  No synthetic data: real MetroPT-3 compressor sensor data (CC BY 4.0)", { x: 0.8, y: 6.4, w: 12, h: 0.4, fontSize: 13, color: LIGHT_MUTED });
  s.addNotes("MetroSched turns the 21:00 to 23:00 manual induction decision into an optimised, explained plan. No synthetic data: trains are scored on real MetroPT-3 compressor readings, and inputs with no real source are shown as not loaded.");
}

// ================= 2. Problem =================
{
  const s = content("Every night, about 25 trainsets need one of three assignments", "Introduction");
  [["REVENUE", "Runs passenger service tomorrow", REV], ["STANDBY", "Fit, held in reserve", STB], ["IBL", "Inspection Bay Line: maintenance", IBL]].forEach(([h, d, c], i) => {
    const x = 0.6 + i * 2.75;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.55, w: 2.55, h: 1.55, fill: { color: c }, rectRadius: 0.08 });
    text(s, h, { x: x + 0.2, y: 1.72, w: 2.2, h: 0.5, fontFace: "Arial", bold: true, fontSize: 22, color: WHITE });
    text(s, d, { x: x + 0.2, y: 2.3, w: 2.2, h: 0.7, fontSize: 15, color: WHITE });
  });
  text(s, "Today this is decided between 21:00 and 23:00 from spreadsheets, WhatsApp messages and Maximo exports: slow, error-prone and not auditable.", { x: 0.6, y: 3.5, w: 7.9, h: 1.2, fontSize: 18 });
  text(s, "MetroSched recommends, explains and lets the supervisor decide. It is not connected to real KMRL systems, not deployed, and not a timetable or crew roster.", { x: 0.6, y: 4.9, w: 7.9, h: 1.2, fontSize: 16, color: MUTED });
  card(s, 8.9, 1.55, 3.8, 5.0);
  text(s, "Six interacting inputs", { x: 9.15, y: 1.75, w: 3.4, h: 0.5, fontFace: "Arial", bold: true, fontSize: 18 });
  text(s, bullets(["Fitness certificates (hard)", "Maximo job cards (hard)", "Cleaning slots (hard capacity)", "Branding exposure (soft)", "Mileage balancing (soft)", "Stabling geometry (soft)"]), { x: 9.15, y: 2.4, w: 3.4, h: 3.9, fontSize: 16, paraSpaceAfter: 8 });
  s.addNotes("Three hard rules can never be broken; three soft goals are traded off. None of these six has public KMRL data, so MetroSched reports them as not loaded until real files are uploaded. Users: depot supervisor (main), maintenance engineer, branding team, operations manager. A typical night: load data in the afternoon, generate at 21:00, check fleet health, run a what-if when a late fault arrives, override with a reason, lock the plan by 23:00.");
}

// ================= 3. Architecture =================
pres.addSection({ title: "How it works" });
{
  const s = content("Architecture: data in, a ranked and explained plan out", "How it works");
  const box = (t, sub, x, y, w = 2.15, fill = WHITE, ink = INK) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 1.25, fill: { color: fill }, line: { color: RULE, width: 1 }, rectRadius: 0.08 });
    text(s, t, { x: x + 0.1, y: y + 0.22, w: w - 0.2, h: 0.45, align: "center", fontFace: "Arial", bold: true, fontSize: 15, color: ink });
    text(s, sub, { x: x + 0.1, y: y + 0.7, w: w - 0.2, h: 0.45, align: "center", fontSize: 13, color: ink === INK ? MUTED : LIGHT_MUTED });
  };
  box("Uploads", "real CSV/JSON (optional)", 0.6, 1.8);
  box("MetroPT-3", "real compressor sensors", 0.6, 3.6, 2.15, "FBF4E6");
  box("FastAPI + SQLite", "routes, storage", 3.35, 2.7);
  box("CP-SAT optimizer", "hard rules + weighted goals", 6.1, 1.8);
  box("Risk model", "scikit-learn random forest", 6.1, 3.6);
  box("Explanations", "rule-based reasons, alerts", 8.85, 2.7);
  box("Fault notes", "TF-IDF + cited LLM answer", 6.1, 5.4);
  box("Next.js dashboard", "7 pages + 3D story", 8.85, 4.7, 2.15, INK, WHITE);
  const arrow = (x, y, w, h, rot = 0) => s.addShape(pres.shapes.RIGHT_ARROW, { x, y, w, h, rotate: rot, fill: { color: REV } });
  arrow(2.8, 2.55, 0.5, 0.35); arrow(2.8, 3.95, 0.5, 0.35, -30);
  arrow(5.55, 2.55, 0.5, 0.35, -25); arrow(5.55, 3.65, 0.5, 0.35, 25);
  arrow(8.3, 2.55, 0.5, 0.35, 25); arrow(8.3, 3.7, 0.5, 0.35, -25);
  arrow(9.68, 4.15, 0.5, 0.35, 90); arrow(8.3, 5.6, 0.5, 0.35, -20);
  text(s, "Overrides are logged and, after 20, re-weight the soft goals (logistic regression).", { x: 0.6, y: 5.45, w: 5.2, h: 0.9, fontSize: 15, color: MUTED });
}

// ================= 4. Data =================
{
  const s = content("No synthetic data: real sensors, missing inputs reported", "How it works");
  card(s, 0.6, 1.5, 5.9, 5.0, "FBF4E6");
  text(s, "Real: MetroPT-3 + public facts", { x: 0.85, y: 1.7, w: 5.4, h: 0.5, fontFace: "Arial", bold: true, fontSize: 20 });
  text(s, bullets(["Air compressor (APU) of one Metro do Porto train", "Feb–Aug 2020, 1,516,948 sensor rows, 15 signals", "4 company-reported air-leak failures", "UCI, DOI 10.24432/C5VW3R, CC BY 4.0", "25 trainsets at Muttom (public KMRL facts)", "Each trainset gets a 12-h slice: risk, duty, minutes below 7 bar"]), { x: 0.85, y: 2.35, w: 5.4, h: 4.0, fontSize: 16, paraSpaceAfter: 8 });
  card(s, 6.8, 1.5, 5.9, 5.0);
  text(s, "Not loaded (no public source)", { x: 7.05, y: 1.7, w: 5.4, h: 0.5, fontFace: "Arial", bold: true, fontSize: 20 });
  text(s, bullets(["Certificates, Maximo job cards, cleaning: hard rules listed as not checked", "Branding, mileage, bay positions: soft goals not used", "No train is called \"fit\" without certificate and job-card data", "Upload real files to switch them on (POST /data/ingest)", "Slice mapping and capacities are labelled assumptions"]), { x: 7.05, y: 2.35, w: 5.4, h: 4.0, fontSize: 16, paraSpaceAfter: 8 });
  s.addNotes("GET /data/status shows what is loaded. With MetroPT-3 only: 3 rules not checked, 3 goals not used. Tests that need certificates and job cards use an invented fixture that lives in the tests folder only.");
}

// ================= 5. Rules + optimizer =================
{
  const s = content("CP-SAT: hard rules never broken, soft goals traded off", "How it works");
  [[0.6, "Hard constraints", IBL, ["Exactly 18 trains in revenue", "At least 2 on standby", "IBL trains ≤ 6 bays", "Certificates valid (if loaded)", "No critical job card (if loaded)", "Cleaning slots (if loaded)"]],
   [4.75, "Soft objective (weight)", REV, ["Compressor fault risk (500)", "Minutes below 7 bar (5)", "Duty above fleet mean (2)", "Standby buffer (3)", "IBL for real alarms (4)", "Branding, mileage, shunting if loaded"]]].forEach(([x, h, c, items]) => {
    card(s, x, 1.5, 3.95, 5.0);
    s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: 1.75, w: 0.32, h: 0.32, fill: { color: c } });
    text(s, h, { x: x + 0.7, y: 1.68, w: 3.1, h: 0.5, fontFace: "Arial", bold: true, fontSize: 18 });
    text(s, bullets(items), { x: x + 0.3, y: 2.35, w: 3.5, h: 4.0, fontSize: 16, paraSpaceAfter: 8 });
  });
  [["0.005 s", "25-train MetroPT-3 plan"], ["0.04 s", "40 trains, 2 depots (limit 10 s)"], ["3", "rules flagged not checked"]].forEach(([n, l], i) => {
    const y = 1.5 + i * 1.7;
    card(s, 8.9, y, 3.8, 1.5);
    text(s, n, { x: 9.15, y: y + 0.12, w: 3.3, h: 0.8, fontFace: "Arial", bold: true, fontSize: 36, color: REV });
    text(s, l, { x: 9.15, y: y + 0.95, w: 3.3, h: 0.45, fontSize: 14, color: MUTED });
  });
  s.addNotes("Variables: one yes/no per train per assignment plus one per blocked exit. If no plan fits, the solver returns the smallest relaxation, e.g. 'Relax required revenue by 2'. One solver thread so tied plans resolve the same way each run. An independent checker re-verifies every hard rule in the tests.");
}

// ================= 6. Explanations + overrides =================
{
  const s = content("Every assignment explained; the supervisor has the last word", "How it works");
  [["TS-08", REV, "Revenue", ["Fitness not verified (no certificate or job-card data)", "Fault risk 0%; compressor loaded 5% vs fleet mean 23%"]],
   ["TS-21", IBL, "IBL", ["Sent to IBL: high compressor (APU) fault risk", "94% from real MetroPT-3 slice 29–30 May 2020 (reported air leak)"]],
   ["TS-03", IBL, "IBL", ["Sent to IBL: air pressure fell below 7 bar", "89 min below 7 bar; real 15 July leak the risk model missed (4%)"]]].forEach(([id, c, a, rs], i) => {
    const y = 1.45 + i * 1.32;
    card(s, 0.6, y, 7.6, 1.18);
    plate(s, id, 0.8, y + 0.15, INK, WHITE);
    tag(s, a, c, 0.8, y + 0.65, 1.05);
    text(s, bullets(rs), { x: 2.1, y: y + 0.17, w: 5.95, h: 0.95, fontSize: 14, paraSpaceAfter: 3 });
  });
  text(s, "Rule-based, no language model: the same input always gives the same words.", { x: 0.6, y: 5.5, w: 7.6, h: 0.6, fontSize: 14, color: MUTED });
  card(s, 8.6, 1.45, 4.1, 5.05);
  text(s, "Overrides and learning", { x: 8.85, y: 1.65, w: 3.6, h: 0.5, fontFace: "Arial", bold: true, fontSize: 18 });
  text(s, bullets([
    "Pick a new assignment and give a reason; it is logged",
    "A train with a known blocking fault cannot leave IBL",
    "After 20 overrides a logistic regression re-weights the soft goals",
    "Limitation: the plan is not re-solved around an override",
  ]), { x: 8.85, y: 2.3, w: 3.65, h: 4.0, fontSize: 15, paraSpaceAfter: 8 });
}

// ================= 7. MetroPT-3 risk =================
pres.addSection({ title: "Real data and retrieval" });
{
  const s = content("Real data: compressor fault risk from MetroPT-3", "Real data and retrieval");
  s.addChart(pres.charts.BAR, [{ name: "Peak risk", labels: ["18 Apr", "29–30 May", "5–7 Jun", "15 Jul"], values: [48, 93, 51, 4] }], {
    x: 0.6, y: 1.45, w: 5.6, h: 3.4, barDir: "col", chartColors: [REV], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0\"%\"", dataLabelFontSize: 12,
    valAxisMaxVal: 100, valAxisMinVal: 0, valGridLine: { color: RULE, size: 1 }, catGridLine: { style: "none" }, showLegend: false,
    showTitle: true, title: "Peak out-of-fold risk during each reported air leak", ...chartText,
  });
  table(s, [["Metric (out-of-fold)", "Value"], ["ROC AUC", "0.975"], ["Failures caught at 50%", "2 of 4"], ["False alarms: windows / 12-h slices", "1.5% / 3.9%"]],
    { x: 0.6, y: 5.0, w: 5.6, colW: [3.9, 1.7], rowH: 0.42, fontSize: 13 });
  table(s, [
    ["Train", "Risk", "Reported leak?", "Plan"],
    ["TS-21", "94%", "Yes", "IBL, alert"],
    ["TS-09", "86%", "No (false alarm)", "IBL, alerts"],
    ["TS-22", "23%", "Yes (starts 10:00)", "Standby"],
    ["TS-03", "4%", "Yes (missed)", "IBL: 89 min < 7 bar"],
  ], { x: 6.6, y: 1.45, w: 6.1, colW: [1.05, 0.9, 2.25, 1.9], rowH: 0.48, fontSize: 13 });
  text(s, bullets([
    "1.5 M rows → 8,627 half-hour windows; random forest scored leave-one-month-out",
    "Penalty 500 × risk in revenue; a soft goal, not a hard rule",
    "The LPS low-pressure signal caught the TS-03 leak that the model missed",
  ]), { x: 6.6, y: 4.2, w: 6.1, h: 2.4, fontSize: 14, paraSpaceAfter: 6 });
}

// ================= 8. Knowledge base =================
{
  const s = content("Fault notes: grounded answers with guardrails and evaluation", "Real data and retrieval");
  const steps = [
    ["1  Input guardrail", "Refuse injection, requests to invent records, empty or over-long questions; never sent to the model"],
    ["2  Retrieve", "TF-IDF (words + word pairs) over 10 real MetroPT-3 passages; cosine top 4, score ≥ 0.05"],
    ["3  Generate", "Claude writes 2–4 plain sentences from those passages only, with API citations"],
    ["4  Output guardrail", "No citation → answer withheld; refusal, error or no key → show quotes"],
    ["5  Audit", "Every question, status and cited passage logged"],
  ];
  steps.forEach(([h, d], i) => {
    const y = 1.45 + i * 1.0;
    card(s, 0.6, y, 6.6, 0.88);
    text(s, h, { x: 0.8, y: y + 0.1, w: 6.2, h: 0.35, fontFace: "Arial", bold: true, fontSize: 15 });
    text(s, d, { x: 0.8, y: y + 0.45, w: 6.2, h: 0.4, fontSize: 12, color: MUTED });
  });
  table(s, [
    ["Evaluation (13 labelled cases)", "Result"],
    ["Guardrail accuracy", "1.0"],
    ["Retrieval hit@4", "1.0"],
    ["Cited-answer rate (with API key)", "--llm run"],
    ["Citation precision (with API key)", "--llm run"],
  ], { x: 7.5, y: 1.45, w: 5.2, colW: [3.6, 1.6], rowH: 0.5, fontSize: 13 });
  text(s, "Syllabus: Unit IV retrieval pipelines for grounded reasoning; Unit VI guardrails, prompt filtering, evaluation metrics.", { x: 7.5, y: 4.6, w: 5.2, h: 1.2, fontSize: 13, color: MUTED });
  s.addNotes("Code: backend/rag/answer.py, GET /kb/answer, backend/rag/evaluate.py, tests/test_answer.py (5 tests with a fake client). Without ANTHROPIC_API_KEY the page shows quotes only and says why. Model claude-opus-5-5, effort low, server-side fallback on refusal.");
}

// ================= 9. What-if =================
pres.addSection({ title: "The product" });
{
  const s = content("What-if simulation shows exactly which trains change", "The product");
  table(s, [
    ["Scenario", "Result on the MetroPT-3 fleet (baseline 18 / 3 / 4)"],
    ["TS-07 certificate expires (hypothetical)", "TS-07 Revenue → IBL; TS-22 Standby → Revenue"],
    ["Critical fault reported on TS-12", "TS-12 Revenue → IBL; TS-22 Standby → Revenue"],
    ["Only 16 revenue trains needed", "TS-14 Revenue → IBL (16.9 min below 7 bar); TS-16 Revenue → Standby"],
    ["Cleaning crews absent", "Refused: no cleaning data loaded"],
  ], { x: 0.6, y: 1.5, w: 12.1, colW: [4.3, 7.8], rowH: 0.78 });
  text(s, "No certificate data is loaded, so the certificate scenario adds a hypothetical expired one. Every diff is asserted by a test.", { x: 0.6, y: 5.6, w: 12, h: 0.6, fontSize: 15, color: MUTED });
}

// ================= 10. Dashboard + results =================
{
  const s = content("Seven pages in plain words; 3D depot view; all tests passing", "The product");
  [["Tonight's plan", "3D depot tracks, reasons, change form"], ["Train health", "Fault chance per train"], ["Compressor use", "Work done, minutes below 7 bar"],
   ["Depot", "Maintenance line and why"], ["What if…", "Test a change first"], ["Change log", "Who changed what; learned priorities"], ["Fault notes", "Cited answers from real notes"]].forEach(([h, d], i) => {
    const x = 0.6 + (i % 2) * 3.1, y = 1.45 + Math.floor(i / 2) * 1.3;
    card(s, x, y, 2.95, 1.15);
    text(s, h, { x: x + 0.2, y: y + 0.12, w: 2.6, h: 0.4, fontFace: "Arial", bold: true, fontSize: 15 });
    text(s, d, { x: x + 0.2, y: y + 0.55, w: 2.6, h: 0.55, fontSize: 12, color: MUTED });
  });
  text(s, "Labels: In service, Standby, Maintenance (IBL). Plus /story, a 3D walkthrough.", { x: 3.7, y: 5.5, w: 2.95, h: 0.9, fontSize: 13, color: MUTED });
  s.addChart(pres.charts.BAR, [{ name: "Trains", labels: ["In service", "Standby", "Maintenance"], values: [18, 3, 4] }], {
    x: 7.0, y: 1.4, w: 5.7, h: 2.85, barDir: "col", chartColors: [REV, STB, IBL], showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 12,
    valGridLine: { color: RULE, size: 1 }, catGridLine: { style: "none" }, showLegend: false, showTitle: true, title: "Trains per assignment (MetroPT-3 fleet)", ...chartText,
  });
  table(s, [["Suite", "Result"], ["pytest (backend)", "44 / 44"], ["Vitest (frontend)", "6 / 6"], ["Playwright (browser)", "1 / 1"]],
    { x: 7.0, y: 4.45, w: 5.7, colW: [3.8, 1.9], rowH: 0.42, fontSize: 13 });
  s.addNotes("Run: git clone, cd, .\\run.ps1 (creates .venv, installs packages; no seeding; API on :8000, dashboard on :3000). Stack: Python, FastAPI, SQLite, OR-Tools CP-SAT, scikit-learn, Next.js 15, Tailwind, shadcn/ui, Recharts, Motion, GSAP. Colour-blind-safe colours; reduced motion respected.");
}

// ================= 11. Limitations =================
pres.addSection({ title: "Wrap-up" });
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "Wrap-up" });
  text(s, "Limitations and next steps", { x: 0.8, y: 0.6, w: 11.5, h: 0.9, fontFace: "Arial", bold: true, fontSize: 34, color: WHITE });
  text(s, bullets([
    "MetroPT-3 is one Porto train mapped onto 25 Kochi trainsets; the model misses 2 of 4 failures at 50%",
    "Without real uploads, certificates, critical job cards and cleaning are not checked",
    "Retrieval is keyword-based over 10 real passages; written answers need an API key",
    "Overrides are logged but the plan is not re-solved around them",
        "Next: re-solve after overrides, a ReAct agent over the planner's tools, embeddings for a larger corpus, per-depot capacities, real KMRL certificate, Maximo and depot data",
  ]), { x: 0.8, y: 1.8, w: 11.6, h: 4.8, fontSize: 19, color: WHITE, paraSpaceAfter: 12 });
}

// ================= 12. References =================
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "Wrap-up" });
  text(s, "Data and references", { x: 0.8, y: 0.6, w: 11.5, h: 0.9, fontFace: "Arial", bold: true, fontSize: 34, color: WHITE });
  text(s, bullets([
    "MetroPT-3 Dataset, UCI Machine Learning Repository, DOI 10.24432/C5VW3R, licensed CC BY 4.0",
    "Davari, N. et al. (2021). Predictive maintenance based on anomaly detection using deep learning for air production unit in the railway industry. IEEE DSAA.",
    "Veloso, B. et al. (2022). The MetroPT dataset for predictive maintenance. Scientific Data 9, 764.",
    "Smart India Hackathon problem SIH25081 (Kochi Metro Rail Limited): train induction planning and scheduling",
    "Google OR-Tools CP-SAT, scikit-learn, FastAPI, Next.js",
  ]), { x: 0.8, y: 1.8, w: 11.6, h: 4.2, fontSize: 17, color: PLATE, paraSpaceAfter: 12 });
  text(s, "Full guide: docs/MetroSched_Explained.pdf  ·  Run it: git clone, cd metrosched, .\\run.ps1", { x: 0.8, y: 6.4, w: 11.5, h: 0.4, fontSize: 14, color: LIGHT_MUTED });
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
