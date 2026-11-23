// Builds presentation/MetroSched_Motion.pptx: 11 slides in the website's black / white / olive theme,
// with Morph transitions (a moving olive accent bar) and staggered fade-up entrances.
// Run from the project root with pptxgenjs + jszip on NODE_PATH:  node presentation/build_motion_deck.js
const path = require("path");
const pptxgen = require("pptxgenjs");
const JSZip = require("jszip");

const BG = "0B0B0B", CARD = "161616", LINE = "2C2C2C", WHITE = "F2F2F0", MUTED = "A3A3A3";
const OLIVE = "9AAB4A", DEEP = "6B7A2E", REV = "2A9FC6", STB = "BC8422", IBL = "DA5670";
const OUT = path.join(__dirname, "MetroSched_Motion.pptx");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
pres.title = "MetroSched explained";
pres.theme = { headFontFace: "Arial", bodyFontFace: "Calibri" };

let n = 0;
const nm = () => `a${++n}`; // animated element names
const T = (s, t, o) => s.addText(t, { objectName: nm(), isTextBox: true, fontFace: "Calibri", fontSize: 18, color: WHITE, valign: "top", margin: 0, ...o });
const H = (s, t, kicker) => {
  s.addText(kicker.toUpperCase(), { objectName: "!!kicker", x: 0.7, y: 0.45, w: 8, h: 0.3, fontFace: "Arial", fontSize: 12, bold: true, color: OLIVE, charSpacing: 2, margin: 0 });
  s.addText(t, { objectName: "!!title", x: 0.7, y: 0.8, w: 11.5, h: 0.9, fontFace: "Arial", fontSize: 32, bold: true, color: WHITE, margin: 0, valign: "top" });
};
const box = (s, x, y, w, h, fill = CARD, o = {}) =>
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { objectName: nm(), x, y, w, h, fill: { color: fill }, line: { color: LINE, width: 1 }, rectRadius: 0.12, ...o });
// Morph actor: the olive accent bar moves between slides.
const actors = (s, sun, bar) => {
  s.addShape(pres.shapes.RECTANGLE, { objectName: "!!bar", ...bar, fill: { color: OLIVE }, line: { type: "none" } });
};
const slide = () => { const s = pres.addSlide(); s.background = { color: BG }; return s; };
const card = (s, x, y, w, h, head, body, accent = OLIVE) => {
  box(s, x, y, w, h);
  s.addShape(pres.shapes.RECTANGLE, { objectName: nm(), x: x + 0.25, y: y + 0.3, w: 0.08, h: 0.45, fill: { color: accent }, line: { type: "none" } });
  T(s, head, { x: x + 0.5, y: y + 0.25, w: w - 0.75, h: 0.55, fontFace: "Arial", bold: true, fontSize: 18 });
  T(s, body, { x: x + 0.5, y: y + 0.85, w: w - 0.75, h: h - 1.0, fontSize: 15, color: MUTED });
};

// 1. Title
{
  const s = slide();
  actors(s, { x: 8.2, y: 2.2, w: 7, h: 7 }, { x: 0.7, y: 3.55, w: 1.6, h: 0.08 });
  s.addText("MetroSched", { objectName: "!!title", x: 0.7, y: 1.8, w: 9, h: 1.4, fontFace: "Arial", fontSize: 66, bold: true, color: WHITE, margin: 0 });
  T(s, "Which train runs tomorrow? A planner that decides every night, and says why.", { x: 0.7, y: 3.85, w: 7.4, h: 1.0, fontSize: 22 });
  T(s, "CSE 471 · SIH25081 (Kochi Metro) · built on real MetroPT-3 train data", { x: 0.7, y: 6.6, w: 9, h: 0.4, fontSize: 13, color: MUTED });
}

// 2. Problem
{
  const s = slide();
  actors(s, { x: 10.6, y: -1.6, w: 4, h: 4 }, { x: 0.7, y: 1.75, w: 1.2, h: 0.06 });
  H(s, "Every night: 25 trains, 3 places to put them", "The problem");
  const tracks = [["In service", "Carries passengers tomorrow", REV, "18"], ["Standby", "Ready to step in if a train fails", STB, "≥ 2"], ["Maintenance (IBL)", "Stays back for checks or repair", IBL, "≤ 6"]];
  tracks.forEach(([h, d, c, k], i) => {
    const x = 0.7 + i * 4.05;
    box(s, x, 2.3, 3.75, 2.6);
    T(s, k, { x: x + 0.35, y: 2.5, w: 3, h: 0.9, fontFace: "Arial", fontSize: 44, bold: true, color: c });
    T(s, h, { x: x + 0.35, y: 3.45, w: 3.2, h: 0.5, fontFace: "Arial", fontSize: 20, bold: true });
    T(s, d, { x: x + 0.35, y: 3.95, w: 3.2, h: 0.8, fontSize: 15, color: MUTED });
  });
  T(s, "Today staff decide this by hand from many sheets. One wrong call means a breakdown on the line or a crowded platform. MetroSched does it in under a second and explains every choice.", { x: 0.7, y: 5.3, w: 11.8, h: 1.2, fontSize: 18 });
}

// 3. Real data
{
  const s = slide();
  actors(s, { x: -2.2, y: 4.2, w: 5, h: 5 }, { x: 0.7, y: 1.75, w: 2.2, h: 0.06 });
  H(s, "Only real data: the MetroPT-3 train compressor readings", "The data");
  card(s, 0.7, 2.3, 5.8, 3.9, "What it is", "Sensor readings from the air compressor of a real Metro do Porto train (2020): pressures, oil temperature, motor current and on/off signals, with the dates of real failures.");
  card(s, 6.8, 2.3, 5.8, 3.9, "How we use it", "Each of our 25 trains is matched to a 12-hour slice of those readings. From it we measure: how hard the compressor works, minutes of low air pressure, and the chance of a fault. Nothing is made up; missing inputs are shown as 'not loaded'.");
}

// 4. How it works
{
  const s = slide();
  actors(s, { x: 10.8, y: 4.6, w: 4, h: 4 }, { x: 0.7, y: 1.75, w: 3.0, h: 0.06 });
  H(s, "How it works, in four steps", "The big picture");
  const steps = [["1  Read", "Load tonight's facts for every train"], ["2  Predict", "A trained model gives each train its chance of a compressor fault"], ["3  Decide", "The OR-Tools solver places all 25 trains at once, following the rules"], ["4  Explain", "Each train gets a rank, a score and plain-language reasons"]];
  steps.forEach(([h, d], i) => {
    const x = 0.7 + i * 3.05;
    box(s, x, 2.4, 2.8, 3.2);
    T(s, h, { x: x + 0.3, y: 2.65, w: 2.3, h: 0.6, fontFace: "Arial", fontSize: 22, bold: true, color: OLIVE });
    T(s, d, { x: x + 0.3, y: 3.35, w: 2.3, h: 2.1, fontSize: 16 });
    if (i < 3) s.addShape(pres.shapes.CHEVRON, { objectName: nm(), x: x + 2.85, y: 3.85, w: 0.18, h: 0.32, fill: { color: OLIVE }, line: { type: "none" } });
  });
  T(s, "The supervisor always has the last word: they can move any train, and the plan re-balances around their choice.", { x: 0.7, y: 6.0, w: 11.8, h: 0.8, fontSize: 17, color: MUTED });
}

// 5. OR-Tools: switches
{
  const s = slide();
  actors(s, { x: -2.4, y: 4.6, w: 5, h: 5 }, { x: 0.7, y: 1.75, w: 3.6, h: 0.06 });
  H(s, "OR-Tools CP-SAT: the plan as 75 on/off switches", "The solver");
  T(s, [
    { text: "Think of a light switch for every train and every place.", options: { breakLine: true } },
    { text: "25 trains × 3 places = 75 switches.", options: { breakLine: true, bold: true, color: OLIVE } },
    { text: " ", options: { breakLine: true } },
    { text: "Each train must have exactly one switch on. The solver from Google's OR-Tools tries the combinations cleverly, throws away any that break a rule, and keeps the one with the lowest total cost.", options: {} },
  ], { x: 0.7, y: 2.3, w: 6.2, h: 4, fontSize: 18 });
  // switch grid
  const rows = [["TS-08", 0], ["TS-16", 0], ["TS-22", 1], ["TS-03", 2], ["TS-21", 2]];
  ["In service", "Standby", "IBL"].forEach((h, j) => T(s, h, { x: 8.75 + j * 1.25, y: 2.25, w: 1.2, h: 0.35, fontSize: 13, color: MUTED, align: "center" }));
  rows.forEach(([t, on], i) => {
    const y = 2.75 + i * 0.72;
    T(s, t, { x: 7.5, y: y + 0.08, w: 1.1, h: 0.4, fontFace: "Consolas", fontSize: 16 });
    [REV, STB, IBL].forEach((c, j) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      objectName: nm(), x: 8.95 + j * 1.25, y, w: 0.85, h: 0.5, rectRadius: 0.25,
      fill: { color: j === on ? c : CARD }, line: { color: j === on ? c : LINE, width: 1 },
    }));
  });
  T(s, "…20 more rows", { x: 7.5, y: 6.4, w: 4, h: 0.4, fontSize: 13, color: MUTED });
}

// 6. Rules vs goals
{
  const s = slide();
  actors(s, { x: -1.8, y: -1.8, w: 4, h: 4 }, { x: 0.7, y: 1.75, w: 4.2, h: 0.06 });
  H(s, "Rules must hold; goals are traded off", "The solver");
  card(s, 0.7, 2.3, 5.8, 4.2, "Hard rules (never broken)", "• Every train gets exactly one place\n• Exactly 18 in service\n• At least 2 on standby\n• At most 6 in maintenance\n• An unfit train never runs\n• A supervisor's change is kept", IBL);
  card(s, 6.8, 2.3, 5.8, 4.2, "Soft goals (cost points)", "• High fault risk in service → cost\n• Minutes of low air pressure → cost\n• Compressor worked harder than average → cost\n• Branding, mileage, shunting when that data is loaded\n\nThe solver picks the plan with the lowest total cost.", OLIVE);
}

// 7. Ranking formula
{
  const s = slide();
  actors(s, { x: 10.2, y: 4.0, w: 4.5, h: 4.5 }, { x: 0.7, y: 1.75, w: 5.0, h: 0.06 });
  H(s, "How ranking is done: place first, then score", "Ranking");
  const steps = [["1", "The solver picks each train's place"], ["2", "Every train gets a fit score (same formula for all)"], ["3", "Sort: In service → Standby → IBL, then score high → low"]];
  steps.forEach(([k, d], i) => {
    const y = 2.35 + i * 0.95;
    box(s, 0.7, y, 5.6, 0.78);
    T(s, k, { x: 0.95, y: y + 0.13, w: 0.5, h: 0.5, fontFace: "Arial", fontSize: 24, bold: true, color: OLIVE });
    T(s, d, { x: 1.5, y: y + 0.2, w: 4.7, h: 0.5, fontSize: 16 });
  });
  box(s, 6.7, 2.35, 5.9, 3.65, "1B1F12", { line: { color: DEEP, width: 1 } });
  T(s, "Fit score", { x: 7.0, y: 2.55, w: 5, h: 0.45, fontFace: "Arial", bold: true, fontSize: 18, color: OLIVE });
  T(s, [
    { text: "start at 50", options: { breakLine: true } },
    { text: "− 50 × fault chance", options: { breakLine: true } },
    { text: "− 0.5 × low-pressure minutes (max 60)", options: { breakLine: true } },
    { text: "− 20 × (work done − fleet average)", options: { breakLine: true } },
    { text: "− 100 if the train is unfit", options: {} },
  ], { x: 7.0, y: 3.1, w: 5.5, h: 2.6, fontFace: "Consolas", fontSize: 16, paraSpaceAfter: 6 });
  T(s, "Higher score = healthier train. The score only orders the list; the solver decides the place.", { x: 0.7, y: 6.3, w: 11.8, h: 0.6, fontSize: 16, color: MUTED });
}

// 8. Ranking example
{
  const s = slide();
  actors(s, { x: 11.2, y: 5.6, w: 3.5, h: 3.5 }, { x: 0.7, y: 1.75, w: 5.8, h: 0.06 });
  H(s, "Ranking with real numbers", "Ranking");
  const hdr = (t) => ({ text: t, options: { bold: true, color: OLIVE, fill: { color: CARD } } });
  const rows = [
    ["1", "TS-08", "In service", "0%", "0 min", "5%", "53.5"],
    ["18", "TS-16", "In service", "34%", "0 min", "15%", "34.5"],
    ["19", "TS-22", "Standby", "23%", "0 min", "79%", "27.3"],
    ["22", "TS-03", "IBL", "4%", "89 min", "57%", "11.0"],
    ["25", "TS-21", "IBL", "94%", "0 min", "61%", "−4.3"],
  ];
  s.addTable([["Rank", "Train", "Place", "Fault chance", "Low air", "Work done", "Score"].map(hdr), ...rows.map((r) => r.map((c) => ({ text: c })))], {
    objectName: nm(), x: 0.7, y: 2.3, w: 11.9, colW: [1.0, 1.3, 2.0, 2.0, 1.7, 1.8, 2.1], rowH: 0.52,
    fontFace: "Calibri", fontSize: 16, color: WHITE, fill: { color: BG }, border: { type: "solid", color: LINE, pt: 1 },
  });
  T(s, "TS-21:  50 − 47 (94% fault chance) − 7.6 (works much harder than average) = −4.3  → last.", { x: 0.7, y: 5.6, w: 11.8, h: 0.5, fontFace: "Consolas", fontSize: 15 });
  T(s, "TS-22 (27.3) sits below TS-16 (34.5) because it is on standby: place comes first, score second.", { x: 0.7, y: 6.2, w: 11.8, h: 0.5, fontSize: 16, color: MUTED });
}

// 9. Supervisor change
{
  const s = slide();
  actors(s, { x: -2.0, y: 3.8, w: 5, h: 5 }, { x: 0.7, y: 1.75, w: 6.6, h: 0.06 });
  H(s, "A supervisor changes a train: the plan re-balances", "Human in charge");
  const flow = [["TS-12", "In service → Maintenance", "Supervisor: \"brake check\"", IBL], ["Solver", "runs again with TS-12 locked", "all other rules still hold", OLIVE], ["TS-22", "Standby → In service", "18 still in service", REV]];
  flow.forEach(([h, a, b, c], i) => {
    const x = 0.7 + i * 4.05;
    box(s, x, 2.4, 3.75, 2.6);
    T(s, h, { x: x + 0.35, y: 2.6, w: 3, h: 0.7, fontFace: "Consolas", fontSize: 30, bold: true, color: c });
    T(s, a, { x: x + 0.35, y: 3.4, w: 3.1, h: 0.5, fontSize: 18, bold: true });
    T(s, b, { x: x + 0.35, y: 3.95, w: 3.1, h: 0.8, fontSize: 15, color: MUTED });
  });
  T(s, "Every change is saved with its reason. After 20 changes, a small learning model (logistic regression) adjusts how much each goal matters, so the planner learns the supervisors' habits.", { x: 0.7, y: 5.4, w: 11.8, h: 1.2, fontSize: 17 });
}

// 10. Agent memory (new)
{
  const s = slide();
  actors(s, { x: 11.4, y: -1.4, w: 3.2, h: 3.2 }, { x: 0.7, y: 1.75, w: 7.4, h: 0.06 });
  H(s, "How the agent remembers the past", "Agent memory");
  // Step 1-4 pipeline
  const steps = [
    ["1  Save", "Every plan and every supervisor change is stored in the database"],
    ["2  Look back", "For each train: its place in the last 5 plans + its change log"],
    ["3  Spot patterns", "Moved since last plan? Same place again? Many maintenance visits?"],
    ["4  Tell", "Short notes under the train, and a 'History' tag"],
  ];
  steps.forEach(([h, d], i) => {
    const x = 0.7 + i * 3.05;
    box(s, x, 2.1, 2.8, 1.75);
    T(s, h, { x: x + 0.25, y: 2.25, w: 2.4, h: 0.45, fontFace: "Arial", fontSize: 18, bold: true, color: OLIVE });
    T(s, d, { x: x + 0.25, y: 2.75, w: 2.4, h: 1.0, fontSize: 13, color: MUTED });
    if (i < 3) s.addShape(pres.shapes.CHEVRON, { objectName: nm(), x: x + 2.85, y: 2.85, w: 0.18, h: 0.32, fill: { color: OLIVE }, line: { type: "none" } });
  });
  // Timeline: one train's past plans read by the agent
  T(s, "Example: what it reads for one train (illustration)", { x: 0.7, y: 4.15, w: 8, h: 0.35, fontSize: 13, color: MUTED });
  const past = [["Plan 1", "In service", REV], ["Plan 2", "In service", REV], ["Plan 3", "Maintenance", IBL], ["Plan 4", "Maintenance", IBL], ["Tonight", "Maintenance", IBL]];
  past.forEach(([p, a, c], i) => {
    const x = 0.7 + i * 1.62;
    T(s, p, { x, y: 4.55, w: 1.5, h: 0.3, fontSize: 12, color: MUTED, align: "center" });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { objectName: nm(), x: x + 0.05, y: 4.9, w: 1.4, h: 0.55, rectRadius: 0.27, fill: { color: c, transparency: i === 4 ? 0 : 35 }, line: { color: i === 4 ? WHITE : c, width: i === 4 ? 1.5 : 1 } });
    T(s, a, { x: x + 0.05, y: 5.03, w: 1.4, h: 0.3, fontSize: 12, bold: true, align: "center", color: BG });
  });
  box(s, 0.7, 5.75, 8.0, 0.75, CARD);
  T(s, [{ text: "Change log  ", options: { bold: true, color: OLIVE } }, { text: "Plan 3 · supervisor moved it to Maintenance · \"brake check\"" }], { x: 0.95, y: 5.95, w: 7.6, h: 0.4, fontSize: 14 });
  // Resulting notes
  s.addShape(pres.shapes.CHEVRON, { objectName: nm(), x: 8.95, y: 5.35, w: 0.25, h: 0.45, fill: { color: OLIVE }, line: { type: "none" } });
  box(s, 9.4, 4.4, 3.2, 2.2, "1B1F12", { line: { color: DEEP, width: 1 } });
  T(s, "Notes it writes", { x: 9.6, y: 4.5, w: 2.9, h: 0.35, fontFace: "Arial", fontSize: 14, bold: true, color: OLIVE });
  T(s, "• Same place (Maintenance) in each of the last 2 plans\n• Sent to maintenance in 2 of the last 4 plans: may need a deeper check\n• Supervisors changed it 1 time; last: \"brake check\"", { x: 9.6, y: 4.85, w: 2.9, h: 1.7, fontSize: 11 });
  T(s, "It only reads what was really saved: nothing is guessed.", { x: 0.7, y: 6.7, w: 11.8, h: 0.4, fontSize: 14, color: MUTED });
}

// 11. Fault notes + guardrails
{
  const s = slide();
  actors(s, { x: -1.6, y: -1.6, w: 4, h: 4 }, { x: 0.7, y: 1.75, w: 8.4, h: 0.06 });
  H(s, "Ask about faults: answers only from real notes", "Agent safety");
  const steps = [["Check the question", "Tricks or 'make up a record' are refused"], ["Find notes", "Top 4 matching passages from 10 real notes"], ["Write the answer", "Claude answers in 2–4 sentences, citing a note"], ["Check the answer", "No citation → answer hidden, notes shown"]];
  steps.forEach(([h, d], i) => {
    const x = 0.7 + i * 3.05;
    box(s, x, 2.35, 2.8, 2.5);
    T(s, String(i + 1), { x: x + 0.3, y: 2.5, w: 1, h: 0.6, fontFace: "Arial", fontSize: 28, bold: true, color: OLIVE });
    T(s, h, { x: x + 0.3, y: 3.15, w: 2.3, h: 0.5, fontFace: "Arial", fontSize: 17, bold: true });
    T(s, d, { x: x + 0.3, y: 3.65, w: 2.3, h: 1.1, fontSize: 14, color: MUTED });
  });
  T(s, "Tested on 13 labelled questions: the safety checks were right every time (1.0) and the right note was always in the top 4 (1.0). Every question is logged.", { x: 0.7, y: 5.25, w: 11.8, h: 1.0, fontSize: 17 });
}

// ---------- motion: Morph transitions + staggered fade-up entrances ----------
const MORPH = '<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"><mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" Requires="p159"><p:transition spd="slow" xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" p14:dur="1200"><p159:morph option="byObject"/></p:transition></mc:Choice><mc:Fallback><p:transition spd="slow"><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>';

function timing(ids) {
  let id = 3;
  const effects = ids.map((sp, i) => {
    const a = ++id, b = ++id, c = ++id, d = ++id, e = ++id;
    return `<p:par><p:cTn id="${a}" fill="hold"><p:stCondLst><p:cond delay="${Math.min(i * 120, 2400)}"/></p:stCondLst><p:childTnLst>`
      + `<p:par><p:cTn id="${b}" presetID="10" presetClass="entr" presetSubtype="0" fill="hold" nodeType="withEffect"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>`
      + `<p:set><p:cBhvr><p:cTn id="${c}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="${sp}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>`
      + `<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="${d}" dur="600"/><p:tgtEl><p:spTgt spid="${sp}"/></p:tgtEl></p:cBhvr></p:animEffect>`
      + `<p:anim calcmode="lin" valueType="num"><p:cBhvr additive="base"><p:cTn id="${e}" dur="600" fill="hold"/><p:tgtEl><p:spTgt spid="${sp}"/></p:tgtEl><p:attrNameLst><p:attrName>ppt_y</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val><p:strVal val="#ppt_y+0.04"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="#ppt_y"/></p:val></p:tav></p:tavLst></p:anim>`
      + `</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>`;
  }).join("");
  return `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>`
    + `<p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>${effects}</p:childTnLst></p:cTn></p:par>`
    + `</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>`;
}

(async () => {
  const buf = await pres.write({ outputType: "nodebuffer" });
  const zip = await JSZip.loadAsync(buf);
  const slides = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f));
  for (const f of slides) {
    let xml = await zip.file(f).async("string");
    const ids = [...xml.matchAll(/<p:cNvPr id="(\d+)" name="a\d+"/g)].map((m) => m[1]);
    const add = MORPH + (ids.length ? timing(ids) : "");
    xml = xml.replace("</p:clrMapOvr>", "</p:clrMapOvr>" + add);
    zip.file(f, xml);
  }
  if (slides.length !== 11) throw new Error(`expected 11 slides, got ${slides.length}`);
  await require("fs").promises.writeFile(OUT, await zip.generateAsync({ type: "nodebuffer" }));
  console.log(`wrote ${OUT} (${slides.length} slides)`);
})();
