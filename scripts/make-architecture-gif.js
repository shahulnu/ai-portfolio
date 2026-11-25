// Renders the platform architecture diagram as an animated GIF:
// marching dashes on every connector (in the direction of flow) plus a "packet"
// that walks one request through steps 1-9 with a caption per step.
// Usage: npm run gif   (or: node scripts/make-architecture-gif.js <output.gif> [framesDir])

const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");
const { GIFEncoder, quantize, applyPalette } = require("gifenc");

const OUT = process.argv[2];
const FRAMES_DIR = process.argv[3];
if (!OUT) throw new Error("usage: node make-gif.js <output.gif> [framesDir]");

const W = 1120, H = 742, OY = 62;
const C = {
  bg: "#f3f6f7", surface: "#ffffff", frameBg: "#f3f6f7", line: "#d3dcdf", fg: "#14242b", muted: "#56676e",
  accent: "#0e6b70", accentSoft: "#d6ecec", warm: "#a9521c", warmSoft: "#f6e3d6",
};
const FONT = "Segoe UI";
const MONO = "Consolas";

const STEPS = [
  "A request arrives from a portal, the reviewer workbench, a faxed PDF, or an X12 278 / FHIR PAS transaction.",
  "The API gateway authenticates the caller (SSO) and applies rate limits.",
  "Identifiers are redacted and documents screened for prompt injection before any model sees them.",
  "The workflow or LangGraph agent pulls policy, records and system data through read-only tools and MCP servers.",
  "The workflow calls Claude for reasoning over text, or classic ML for scoring.",
  "Model findings return as structured output with verbatim quotes or field readings.",
  "Code verifies every quote and field against the source and applies the routing rules.",
  "The case lands in the review queue; a person approves any write and every coverage decision.",
  "Every step is written to the audit log and traced for quality, latency and cost.",
];

// ---- Diagram geometry (same layout as src/components/ArchitectureDiagram.tsx) ----
const FRAMES = [
  [10, 45, 200, 320, "CHANNELS"], [240, 45, 200, 320, "EDGE"], [470, 45, 300, 320, "ORCHESTRATION"],
  [810, 45, 300, 320, "MODELS"], [470, 392, 640, 96, "KNOWLEDGE & TOOLS"], [10, 518, 1100, 92, "QUALITY & OPERATIONS"],
];
const BOXES = {
  inbound: [20, 62, 180, 46, ["Inbound transactions"], ["X12 278 · 837 · FHIR PAS"]],
  fax: [20, 116, 180, 46, ["Fax & PDF intake"], ["scanned prior auth requests"]],
  portals: [20, 170, 180, 46, ["Member & provider", "portals"], []],
  callctr: [20, 224, 180, 46, ["Call-center desktop"], []],
  reviewer: [20, 278, 180, 46, ["Reviewer workbench"], ["nurse / physician UI"]],
  gateway: [250, 70, 180, 60, ["API gateway"], ["SSO · rate limits"]],
  redact: [250, 165, 180, 50, ["Identifier redaction"], ["PHI removed pre-model"], true],
  inject: [250, 250, 180, 50, ["Prompt-injection", "screen"], []],
  workflows: [480, 62, 280, 140, ["Use-case workflows · LangGraph"], ["Prior authorization", "Denials & appeals", "Benefits Q&A (agent)", "Payment integrity", "HCC evidence", "Fax intake (agent + MCP)"], true],
  checks: [480, 220, 280, 46, ["Citation check + routing rules"], ["deterministic code"], true],
  human: [480, 296, 280, 46, ["Human review & approval"], ["a person approves every decision and write"], true],
  claude: [820, 70, 280, 70, ["Claude Opus 5.5"], ["Amazon Bedrock or Claude API", "structured output · prompt cache"]],
  ml: [820, 160, 280, 56, ["Classic ML · XGBoost"], ["FWA outliers · overturn scoring"]],
  policy: [482, 418, 116, 56, ["Policy library"], ["versioned"]],
  search: [606, 418, 116, 56, ["Hybrid search"], ["pgvector"]],
  fhir: [730, 418, 116, 56, ["FHIR server"], ["HAPI · Synthea"]],
  mcp: [854, 418, 116, 56, ["MCP servers"], ["eligibility · claims", "providers · cases"], true],
  calc: [978, 418, 120, 56, ["Calculators"], ["code maps"]],
  tests: [22, 540, 200, 56, ["Labeled test sets"], ["per application"]],
  evals: [240, 540, 200, 56, ["Evals in CI"], ["block on regression"], true],
  tracing: [458, 540, 200, 56, ["Tracing"], ["latency · cost per case"]],
  audit: [676, 540, 200, 56, ["Audit log"], ["inputs, outputs, decisions"]],
  risk: [894, 540, 204, 56, ["Model risk review"], ["drift · re-labeling"]],
};
// kind: req (request, accent), ret (result returning, warm), log (logging, muted). arrow: draw head.
const LINKS = [
  ["M200,85 H225", "req"], ["M200,139 H225", "req"], ["M200,193 H225", "req"], ["M200,247 H225", "req"], ["M200,301 H225", "req"],
  ["M225,301 V85", "req"], ["M225,100 H250", "req", true],
  ["M340,130 V165", "req", true],
  ["M430,190 H455 V135 H480", "req", true], ["M340,215 V250", "req"],
  ["M700,365 V405", "req"], ["M700,405 H540", "req"], ["M700,405 H1038", "req"],
  ...[540, 664, 788, 912, 1038].map((x) => [`M${x},405 V418`, "req", true]),
  ["M760,105 H820", "req", true], ["M760,188 H820", "req", true],
  ["M810,243 H760", "ret", true],
  ["M620,266 V296", "req", true],
  ["M480,319 H455 V355 H110 V324", "ret", true],
  ["M340,365 V518", "log", true],
];
const BADGES = [[225, 166], [340, 147], [455, 163], [700, 385], [790, 105], [786, 243], [640, 281], [290, 355], [340, 452]];
// Route the packet travels for each step, and the boxes lit while it does.
const ROUTES = [
  [[[110, 139], [200, 139], [225, 139], [225, 100], [250, 100]], ["inbound", "fax", "gateway"]],
  [[[340, 100], [340, 130], [340, 165]], ["gateway", "redact"]],
  [[[340, 190], [430, 190], [455, 190], [455, 135], [480, 135]], ["redact", "inject", "workflows"]],
  [[[700, 365], [700, 405], [912, 405], [912, 418]], ["workflows", "policy", "search", "fhir", "mcp", "calc"]],
  [[[700, 105], [760, 105], [820, 105]], ["workflows", "claude", "ml"]],
  [[[820, 243], [810, 243], [760, 243]], ["claude", "checks"]],
  [[[620, 243], [620, 266], [620, 296]], ["checks", "human"]],
  [[[480, 319], [455, 319], [455, 355], [110, 355], [110, 324]], ["human", "reviewer"]],
  [[[340, 365], [340, 518]], ["tracing", "audit", "evals"]],
];

const DASH = { req: [9, 5], ret: [8, 6], log: [2, 5] }; // every period divides 14
const STROKE = { req: C.accent, ret: C.warm, log: C.muted };

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function pointAt(pts, t) {
  const segs = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(L);
    total += L;
  }
  let d = t * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const f = segs[i] ? Math.min(1, d / segs[i]) : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
    }
    d -= segs[i];
  }
  return pts[pts.length - 1];
}

function box(id, lit) {
  const [x, y, w, h, lines, sub, key] = BOXES[id];
  const fill = key ? C.accentSoft : C.surface;
  const stroke = lit ? C.warm : key ? C.accent : C.line;
  const sw = lit ? 2.6 : 1.2;
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const total = lines.length * 17 + sub.length * 15;
  let ty = y + h / 2 - total / 2 + 13;
  for (const l of lines) {
    out += `<text x="${x + w / 2}" y="${ty}" text-anchor="middle" font-family="${FONT}" font-size="14" font-weight="600" fill="${C.fg}">${esc(l)}</text>`;
    ty += 17;
  }
  for (const s of sub) {
    out += `<text x="${x + w / 2}" y="${ty}" text-anchor="middle" font-family="${FONT}" font-size="12" fill="${C.muted}">${esc(s)}</text>`;
    ty += 15;
  }
  return out;
}

function frameSvg(step, t, shift) {
  const [route, lit] = ROUTES[step];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += `<defs>`;
  for (const k of Object.keys(STROKE)) {
    s += `<marker id="ah-${k}" viewBox="0 0 8 8" refX="8" refY="4" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${STROKE[k]}"/></marker>`;
  }
  s += `</defs><rect width="${W}" height="${H}" fill="${C.bg}"/>`;
  s += `<text x="20" y="34" font-family="${FONT}" font-size="21" font-weight="700" fill="${C.fg}">Healthcare Payer AI Platform</text>`;
  s += `<text x="318" y="34" font-family="${FONT}" font-size="15" fill="${C.muted}">one request, end to end</text>`;
  s += `<text x="${W - 20}" y="34" text-anchor="end" font-family="${FONT}" font-size="13" fill="${C.muted}">Shahul Ummarali</text>`;
  s += `<g transform="translate(0,${OY})">`;

  for (const [x, y, w, h, title] of FRAMES) {
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${C.frameBg}" stroke="${C.line}" stroke-dasharray="5 4"/>`;
    s += `<text x="${x + 2}" y="${y - 9}" font-family="${MONO}" font-size="11" font-weight="600" letter-spacing="1.1" fill="${C.muted}">${esc(title)}</text>`;
  }
  for (const id of Object.keys(BOXES)) s += box(id, lit.includes(id));

  // Marching dashes: a decreasing offset moves the dash pattern toward the path's end.
  for (const [d, kind, arrow] of LINKS) {
    const [a, b] = DASH[kind];
    s += `<path d="${d}" fill="none" stroke="${STROKE[kind]}" stroke-width="2" stroke-dasharray="${a} ${b}" stroke-dashoffset="${(-shift).toFixed(2)}"${arrow ? ` marker-end="url(#ah-${kind})"` : ""}/>`;
  }

  BADGES.forEach(([x, y], i) => {
    const on = i === step;
    // Opaque badges so the moving dashes never show through them.
    s += `<circle cx="${x}" cy="${y}" r="${on ? 13 : 10}" fill="${on ? C.warm : C.warmSoft}" stroke="${on ? C.surface : C.warm}" stroke-width="${on ? 2 : 1}"/>`;
    s += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-family="${MONO}" font-size="${on ? 13 : 11}" font-weight="700" fill="${on ? "#ffffff" : C.warm}">${i + 1}</text>`;
  });

  const [px, py] = pointAt(route, t);
  s += `<circle cx="${px}" cy="${py}" r="13" fill="${C.warm}" fill-opacity="0.22"/>`;
  s += `<circle cx="${px}" cy="${py}" r="6.5" fill="${C.warm}" stroke="#ffffff" stroke-width="2"/>`;
  s += `</g>`;

  // Caption for the active step
  const cy = OY + 620 + 34;
  s += `<rect x="10" y="${cy - 24}" width="${W - 20}" height="40" rx="8" fill="${C.surface}" stroke="${C.line}"/>`;
  s += `<circle cx="36" cy="${cy - 4}" r="12" fill="${C.warm}"/>`;
  s += `<text x="36" y="${cy + 1}" text-anchor="middle" font-family="${MONO}" font-size="13" font-weight="700" fill="#ffffff">${step + 1}</text>`;
  s += `<text x="58" y="${cy + 1}" font-family="${FONT}" font-size="15" fill="${C.fg}">${esc(STEPS[step])}</text>`;
  return s + `</svg>`;
}

// ---- Timeline ----
const PER_STEP = 14; // frames per step
const MOVE = 10; // frames spent moving; the rest holds at the destination
const DELAY = 75; // ms per frame
const TOTAL = PER_STEP * STEPS.length;
const SHIFT_TOTAL = 14 * 24; // multiple of every dash period, so the loop is seamless
const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

const rendered = [];
for (let f = 0; f < TOTAL; f++) {
  const step = Math.floor(f / PER_STEP);
  const i = f % PER_STEP;
  const t = ease(Math.min(1, i / (MOVE - 1)));
  const svg = frameSvg(step, t, (f * SHIFT_TOTAL) / TOTAL);
  const img = new Resvg(svg, { font: { loadSystemFonts: true, defaultFontFamily: FONT } }).render();
  if (FRAMES_DIR && (i === MOVE - 1)) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
    fs.writeFileSync(path.join(FRAMES_DIR, `step-${step + 1}.png`), img.asPng());
  }
  rendered.push(new Uint8Array(img.pixels));
}

// One shared palette (255 colors + 1 transparent slot) built from frames across the loop.
const sample = new Uint8Array(rendered[0].length * 3);
[0, Math.floor(TOTAL / 3), Math.floor((2 * TOTAL) / 3)].forEach((k, j) => sample.set(rendered[k], j * rendered[0].length));
const palette = quantize(sample, 255);
const TRANSPARENT = palette.length;
palette.push([0, 0, 0]);

const gif = GIFEncoder();
let prev = null;
for (let f = 0; f < TOTAL; f++) {
  const index = applyPalette(rendered[f], palette.slice(0, TRANSPARENT));
  const full = index.slice();
  if (prev) {
    // Unchanged pixels become transparent so each frame only stores what moved.
    for (let p = 0; p < index.length; p++) if (index[p] === prev[p]) index[p] = TRANSPARENT;
  }
  gif.writeFrame(index, W, H, {
    palette: f === 0 ? palette : undefined,
    delay: DELAY,
    transparent: f > 0,
    transparentIndex: TRANSPARENT,
    dispose: 1,
    repeat: 0,
  });
  prev = full;
}
gif.finish();
fs.writeFileSync(OUT, gif.bytes());
console.log(`${OUT}: ${TOTAL} frames, ${(TOTAL * DELAY / 1000).toFixed(1)} s loop, ${(fs.statSync(OUT).size / 1024 / 1024).toFixed(2)} MB`);
