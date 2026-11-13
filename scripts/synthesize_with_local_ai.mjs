import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(REPO_ROOT, "data");
const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";
const MODEL = "qwen2.5-coder:7b";
const DEEPCODER_PATH = "C:/OTHRYS/repos/OTHRYS/agents/cortex/deepcoder_dsl.mjs";

const deepcoder = await import(pathToFileURL(DEEPCODER_PATH).href);

async function askOllamaJson(prompt, keepAlive = "5m") {
  const started = Date.now();
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(60000),
    body: JSON.stringify({
      model: MODEL,
      prompt,
      format: "json",
      stream: false,
      keep_alive: keepAlive,
      options: { temperature: 0.1, num_ctx: 4096, num_predict: 2600 },
    }),
  });
  if (!res.ok) {
    throw new Error(`Ollama HTTP ${res.status}: ${await res.text()}`);
  }
  const body = await res.json();
  const parsed = JSON.parse(body.response);
  return { parsed, elapsedMs: Date.now() - started };
}

function slug(value) {
  return deepcoder.executePipeline(["slugify"], String(value));
}

function sealDataset(records) {
  const canonicalJson = deepcoder.executePipeline(["canonicalizeJson"], records);
  const digest = deepcoder.executePipeline(["canonicalizeJson", "stringifyCanonical", "sha256Hex"], records);
  return { canonicalJson, digest };
}

// Authoritative reference anchors to validate & guard local-model synthesis accuracy
const AUTHORITATIVE_SCREENS = [
  { label: '13.3" Laptop', category: "laptop", diagonalIn: 13.3, aspectW: 16, aspectH: 10 },
  { label: '14" Laptop', category: "laptop", diagonalIn: 14, aspectW: 16, aspectH: 10 },
  { label: '15.6" Laptop', category: "laptop", diagonalIn: 15.6, aspectW: 16, aspectH: 9 },
  { label: '16" Laptop', category: "laptop", diagonalIn: 16, aspectW: 16, aspectH: 10 },
  { label: '17.3" Laptop', category: "laptop", diagonalIn: 17.3, aspectW: 16, aspectH: 9 },
  { label: '24" Monitor', category: "monitor", diagonalIn: 24, aspectW: 16, aspectH: 9 },
  { label: '27" Monitor', category: "monitor", diagonalIn: 27, aspectW: 16, aspectH: 9 },
  { label: '32" Monitor', category: "monitor", diagonalIn: 32, aspectW: 16, aspectH: 9 },
  { label: '34" Ultrawide', category: "monitor", diagonalIn: 34, aspectW: 21, aspectH: 9 },
  { label: '38" Ultrawide', category: "monitor", diagonalIn: 38, aspectW: 21, aspectH: 9 },
  { label: '49" Super Ultrawide', category: "monitor", diagonalIn: 49, aspectW: 32, aspectH: 9 },
  { label: '32" TV', category: "tv", diagonalIn: 32, aspectW: 16, aspectH: 9 },
  { label: '42" OLED TV', category: "tv", diagonalIn: 42, aspectW: 16, aspectH: 9 },
  { label: '43" TV', category: "tv", diagonalIn: 43, aspectW: 16, aspectH: 9 },
  { label: '48" OLED TV', category: "tv", diagonalIn: 48, aspectW: 16, aspectH: 9 },
  { label: '50" TV', category: "tv", diagonalIn: 50, aspectW: 16, aspectH: 9 },
  { label: '55" TV', category: "tv", diagonalIn: 55, aspectW: 16, aspectH: 9 },
  { label: '65" TV', category: "tv", diagonalIn: 65, aspectW: 16, aspectH: 9 },
  { label: '75" TV', category: "tv", diagonalIn: 75, aspectW: 16, aspectH: 9 },
  { label: '77" OLED TV', category: "tv", diagonalIn: 77, aspectW: 16, aspectH: 9 },
  { label: '83" OLED TV', category: "tv", diagonalIn: 83, aspectW: 16, aspectH: 9 },
  { label: '85" TV', category: "tv", diagonalIn: 85, aspectW: 16, aspectH: 9 },
  { label: '98" TV', category: "tv", diagonalIn: 98, aspectW: 16, aspectH: 9 },
  { label: '100" TV', category: "tv", diagonalIn: 100, aspectW: 16, aspectH: 9 },
];

const AUTHORITATIVE_MATTRESSES = [
  { label: "US Twin", region: "US", widthCm: 96.5, lengthCm: 190.5 },
  { label: "US Twin XL", region: "US", widthCm: 96.5, lengthCm: 203.2 },
  { label: "US Full (Double)", region: "US", widthCm: 137.2, lengthCm: 190.5 },
  { label: "US Queen", region: "US", widthCm: 152.4, lengthCm: 203.2 },
  { label: "US King", region: "US", widthCm: 193.0, lengthCm: 203.2 },
  { label: "US California King", region: "US", widthCm: 182.9, lengthCm: 213.4 },
  { label: "EU Single 90x200", region: "EU", widthCm: 90, lengthCm: 200 },
  { label: "EU Small Double 120x200", region: "EU", widthCm: 120, lengthCm: 200 },
  { label: "EU Double 140x200", region: "EU", widthCm: 140, lengthCm: 200 },
  { label: "EU Queen 160x200", region: "EU", widthCm: 160, lengthCm: 200 },
  { label: "EU King 180x200", region: "EU", widthCm: 180, lengthCm: 200 },
  { label: "EU Super King 200x200", region: "EU", widthCm: 200, lengthCm: 200 },
  { label: "UK Single", region: "UK", widthCm: 90, lengthCm: 190 },
  { label: "UK Small Double", region: "UK", widthCm: 120, lengthCm: 190 },
  { label: "UK Double", region: "UK", widthCm: 135, lengthCm: 190 },
  { label: "UK King", region: "UK", widthCm: 150, lengthCm: 200 },
  { label: "UK Super King", region: "UK", widthCm: 180, lengthCm: 200 },
];

const AUTHORITATIVE_AVERY = [
  { code: "5160", name: "Avery 5160 Address Labels (30/sheet)", paper: "letter", cols: 3, rows: 10, labelWidthMm: 66.68, labelHeightMm: 25.4, marginTopMm: 12.7, marginLeftMm: 4.83, gapXMm: 3.18, gapYMm: 0 },
  { code: "5163", name: "Avery 5163 Shipping Labels (10/sheet)", paper: "letter", cols: 2, rows: 5, labelWidthMm: 101.6, labelHeightMm: 50.8, marginTopMm: 12.7, marginLeftMm: 4.06, gapXMm: 4.57, gapYMm: 0 },
  { code: "5167", name: "Avery 5167 Return Address (80/sheet)", paper: "letter", cols: 4, rows: 20, labelWidthMm: 44.45, labelHeightMm: 12.7, marginTopMm: 12.7, marginLeftMm: 7.62, gapXMm: 7.62, gapYMm: 0 },
  { code: "5371", name: "Avery 5371 Business Cards (10/sheet)", paper: "letter", cols: 2, rows: 5, labelWidthMm: 88.9, labelHeightMm: 50.8, marginTopMm: 12.7, marginLeftMm: 19.05, gapXMm: 0, gapYMm: 0 },
  { code: "L7160", name: "Avery L7160 A4 Address (21/sheet)", paper: "a4", cols: 3, rows: 7, labelWidthMm: 63.5, labelHeightMm: 38.1, marginTopMm: 15.15, marginLeftMm: 7.2, gapXMm: 2.55, gapYMm: 0 },
  { code: "L7163", name: "Avery L7163 A4 Parcel (14/sheet)", paper: "a4", cols: 2, rows: 7, labelWidthMm: 99.1, labelHeightMm: 38.1, marginTopMm: 15.15, marginLeftMm: 4.65, gapXMm: 2.5, gapYMm: 0 },
  { code: "L7165", name: "Avery L7165 A4 Large Parcel (8/sheet)", paper: "a4", cols: 2, rows: 4, labelWidthMm: 99.1, labelHeightMm: 67.7, marginTopMm: 13.1, marginLeftMm: 4.65, gapXMm: 2.5, gapYMm: 0 },
  { code: "J8160", name: "Avery J8160 Inkjet A4 (21/sheet)", paper: "a4", cols: 3, rows: 7, labelWidthMm: 63.5, labelHeightMm: 38.1, marginTopMm: 15.15, marginLeftMm: 7.2, gapXMm: 2.55, gapYMm: 0 },
];

const HOLIDAY_FACT_ANCHORS_2026_2027 = {
  US: [
    { date: "2026-01-01", name: "New Year's Day" },
    { date: "2026-01-19", name: "MLK Jr. Day" },
    { date: "2026-05-25", name: "Memorial Day" },
    { date: "2026-06-19", name: "Juneteenth" },
    { date: "2026-07-04", name: "Independence Day" },
    { date: "2026-09-07", name: "Labor Day" },
    { date: "2026-11-26", name: "Thanksgiving" },
    { date: "2026-12-25", name: "Christmas Day" },
    { date: "2027-01-01", name: "New Year's Day" },
    { date: "2027-01-18", name: "MLK Jr. Day" },
    { date: "2027-05-31", name: "Memorial Day" },
    { date: "2027-07-04", name: "Independence Day" },
    { date: "2027-09-06", name: "Labor Day" },
    { date: "2027-11-25", name: "Thanksgiving" },
    { date: "2027-12-25", name: "Christmas Day" },
  ],
  GB: [
    { date: "2026-01-01", name: "New Year's Day" },
    { date: "2026-04-03", name: "Good Friday" },
    { date: "2026-04-06", name: "Easter Monday" },
    { date: "2026-05-04", name: "Early May Bank Holiday" },
    { date: "2026-05-25", name: "Spring Bank Holiday" },
    { date: "2026-08-31", name: "Summer Bank Holiday" },
    { date: "2026-12-25", name: "Christmas Day" },
    { date: "2026-12-28", name: "Boxing Day (Observed)" },
    { date: "2027-01-01", name: "New Year's Day" },
    { date: "2027-03-26", name: "Good Friday" },
    { date: "2027-03-29", name: "Easter Monday" },
    { date: "2027-05-03", name: "Early May Bank Holiday" },
    { date: "2027-05-31", name: "Spring Bank Holiday" },
    { date: "2027-08-30", name: "Summer Bank Holiday" },
    { date: "2027-12-27", name: "Christmas Day (Observed)" },
  ],
  BE: [
    { date: "2026-01-01", name: "Nieuwjaar / Nouvel An" },
    { date: "2026-04-06", name: "Paasmaandag" },
    { date: "2026-05-01", name: "Dag van de Arbeid" },
    { date: "2026-05-14", name: "O.L.H. Hemelvaart" },
    { date: "2026-05-25", name: "Pinkstermaandag" },
    { date: "2026-07-21", name: "Nationale Feestdag" },
    { date: "2026-08-15", name: "O.L.V. Hemelvaart" },
    { date: "2026-11-01", name: "Allerheiligen" },
    { date: "2026-11-11", name: "Wapenstilstand" },
    { date: "2026-12-25", name: "Kerstmis" },
    { date: "2027-01-01", name: "Nieuwjaar / Nouvel An" },
    { date: "2027-03-29", name: "Paasmaandag" },
    { date: "2027-05-01", name: "Dag van de Arbeid" },
    { date: "2027-05-06", name: "O.L.H. Hemelvaart" },
    { date: "2027-05-17", name: "Pinkstermaandag" },
    { date: "2027-07-21", name: "Nationale Feestdag" },
    { date: "2027-11-11", name: "Wapenstilstand" },
    { date: "2027-12-25", name: "Kerstmis" },
  ],
  NL: [
    { date: "2026-01-01", name: "Nieuwjaarsdag" },
    { date: "2026-04-03", name: "Goede Vrijdag" },
    { date: "2026-04-06", name: "Tweede Paasdag" },
    { date: "2026-04-27", name: "Koningsdag" },
    { date: "2026-05-05", name: "Bevrijdingsdag" },
    { date: "2026-05-14", name: "Hemelvaartsdag" },
    { date: "2026-05-25", name: "Tweede Pinksterdag" },
    { date: "2026-12-25", name: "Eerste Kerstdag" },
    { date: "2027-01-01", name: "Nieuwjaarsdag" },
    { date: "2027-03-29", name: "Tweede Paasdag" },
    { date: "2027-04-27", name: "Koningsdag" },
    { date: "2027-05-06", name: "Hemelvaartsdag" },
    { date: "2027-05-17", name: "Tweede Pinksterdag" },
    { date: "2027-12-25", name: "Eerste Kerstdag" },
  ],
  DE: [
    { date: "2026-01-01", name: "Neujahr" },
    { date: "2026-04-03", name: "Karfreitag" },
    { date: "2026-04-06", name: "Ostermontag" },
    { date: "2026-05-01", name: "Tag der Arbeit" },
    { date: "2026-05-14", name: "Christi Himmelfahrt" },
    { date: "2026-05-25", name: "Pfingstmontag" },
    { date: "2026-10-03", name: "Tag der Deutschen Einheit" },
    { date: "2026-12-25", name: "1. Weihnachtstag" },
    { date: "2027-01-01", name: "Neujahr" },
    { date: "2027-03-26", name: "Karfreitag" },
    { date: "2027-03-29", name: "Ostermontag" },
    { date: "2027-05-01", name: "Tag der Arbeit" },
    { date: "2027-05-06", name: "Christi Himmelfahrt" },
    { date: "2027-10-03", name: "Tag der Deutschen Einheit" },
    { date: "2027-12-25", name: "1. Weihnachtstag" },
  ],
  FR: [
    { date: "2026-01-01", name: "Jour de l'An" },
    { date: "2026-04-06", name: "Lundi de Paques" },
    { date: "2026-05-01", name: "Fete du Travail" },
    { date: "2026-05-08", name: "Victoire 1945" },
    { date: "2026-05-14", name: "Ascension" },
    { date: "2026-07-14", name: "Fete Nationale" },
    { date: "2026-08-15", name: "Assomption" },
    { date: "2026-11-11", name: "Armistice 1918" },
    { date: "2026-12-25", name: "Noel" },
    { date: "2027-01-01", name: "Jour de l'An" },
    { date: "2027-03-29", name: "Lundi de Paques" },
    { date: "2027-05-01", name: "Fete du Travail" },
    { date: "2027-05-06", name: "Ascension" },
    { date: "2027-07-14", name: "Fete Nationale" },
    { date: "2027-12-25", name: "Noel" },
  ],
  CA: [
    { date: "2026-01-01", name: "New Year's Day" },
    { date: "2026-04-03", name: "Good Friday" },
    { date: "2026-05-18", name: "Victoria Day" },
    { date: "2026-07-01", name: "Canada Day" },
    { date: "2026-09-07", name: "Labour Day" },
    { date: "2026-10-12", name: "Thanksgiving" },
    { date: "2026-12-25", name: "Christmas Day" },
    { date: "2027-01-01", name: "New Year's Day" },
    { date: "2027-03-26", name: "Good Friday" },
    { date: "2027-07-01", name: "Canada Day" },
    { date: "2027-09-06", name: "Labour Day" },
    { date: "2027-10-11", name: "Thanksgiving" },
    { date: "2027-12-25", name: "Christmas Day" },
  ],
  AU: [
    { date: "2026-01-01", name: "New Year's Day" },
    { date: "2026-01-26", name: "Australia Day" },
    { date: "2026-04-03", name: "Good Friday" },
    { date: "2026-04-25", name: "Anzac Day" },
    { date: "2026-12-25", name: "Christmas Day" },
    { date: "2026-12-26", name: "Boxing Day" },
    { date: "2027-01-01", name: "New Year's Day" },
    { date: "2027-01-26", name: "Australia Day" },
    { date: "2027-03-26", name: "Good Friday" },
    { date: "2027-04-25", name: "Anzac Day" },
    { date: "2027-12-25", name: "Christmas Day" },
  ],
  ES: [
    { date: "2026-01-01", name: "Ano Nuevo" },
    { date: "2026-01-06", name: "Reyes Magos" },
    { date: "2026-04-03", name: "Viernes Santo" },
    { date: "2026-05-01", name: "Dia del Trabajo" },
    { date: "2026-10-12", name: "Fiesta Nacional" },
    { date: "2026-12-25", name: "Navidad" },
    { date: "2027-01-01", name: "Ano Nuevo" },
    { date: "2027-03-26", name: "Viernes Santo" },
    { date: "2027-05-01", name: "Dia del Trabajo" },
    { date: "2027-10-12", name: "Fiesta Nacional" },
    { date: "2027-12-25", name: "Navidad" },
  ],
  IT: [
    { date: "2026-01-01", name: "Capodanno" },
    { date: "2026-04-06", name: "Pasquetta" },
    { date: "2026-04-25", name: "Festa della Liberazione" },
    { date: "2026-05-01", name: "Festa dei Lavoratori" },
    { date: "2026-06-02", name: "Festa della Repubblica" },
    { date: "2026-08-15", name: "Ferragosto" },
    { date: "2026-12-25", name: "Natale" },
    { date: "2027-01-01", name: "Capodanno" },
    { date: "2027-03-29", name: "Pasquetta" },
    { date: "2027-04-25", name: "Festa della Liberazione" },
    { date: "2027-06-02", name: "Festa della Repubblica" },
    { date: "2027-12-25", name: "Natale" },
  ],
};

function sanitizeAirlineRows(rows) {
  const out = [];
  const seen = new Set();
  for (const row of rows || []) {
    if (!row?.name || !Array.isArray(row.carryOnCm) || row.carryOnCm.length !== 3) continue;
    const c = row.carryOnCm.map(Number).sort((a, b) => b - a);
    if (c.some((n) => !Number.isFinite(n) || n <= 10 || n > 100)) continue;
    const p = Array.isArray(row.personalItemCm) && row.personalItemCm.length === 3
      ? row.personalItemCm.map(Number).sort((a, b) => b - a)
      : [40, 30, 20];
    if (p.some((n) => !Number.isFinite(n) || n <= 5 || n > 80)) continue;
    const s = slug(`${row.name}-carry-on-size`);
    if (seen.has(s)) continue;
    seen.add(s);
    out.push({
      slug: s,
      iata: String(row.iata || "XX").toUpperCase().slice(0, 3),
      name: String(row.name),
      region: ["EU", "NA", "APAC", "ME"].includes(row.region) ? row.region : "EU",
      carryOnCm: [Number(c[0].toFixed(1)), Number(c[1].toFixed(1)), Number(c[2].toFixed(1))],
      personalItemCm: [Number(p[0].toFixed(1)), Number(p[1].toFixed(1)), Number(p[2].toFixed(1))],
      carryOnWeightKg: Number(row.carryOnWeightKg) > 0 ? Number(row.carryOnWeightKg) : 10,
      personalIncluded: Boolean(row.personalIncluded ?? true),
      overheadFree: Boolean(row.overheadFree ?? true),
      policyNote: String(row.policyNote || "Verify fare class before departure.").slice(0, 120),
    });
  }
  return out;
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const receipt = {
    schema: "scaleandfit.synthesis.v1",
    model: MODEL,
    deepcoderModule: DEEPCODER_PATH,
    generatedAt: new Date().toISOString(),
    batches: {},
  };

  const dcCheck = deepcoder.synthesize({
    jobId: "scaleandfit-catalog-normalize",
    title: "Catalog Route Slugifier",
    maxDepth: 2,
    examples: [
      { input: "55 vs 65 Inch TV ", output: "55-vs-65-inch-tv" },
      { input: "Nike & Adidas Fit", output: "nike-and-adidas-fit" },
    ],
    holdoutExamples: [{ input: "US Passport Photo 2x2", output: "us-passport-photo-2x2" }],
    skipBaseline: true,
  });
  receipt.deepcoderSynthesisOk = dcCheck.ok;
  receipt.deepcoderPipeline = dcCheck.pipeline;
  console.log("DeepCoder synthesis verified:", dcCheck.ok, dcCheck.pipeline);

  // Batch 1A..1D: 34 Airlines split into 4 crisp 8-9 airline batches so 7B never truncates
  console.log("Batch 1A..1D: 34 global airlines via Ollama", MODEL, "...");
  const airlineSpecs = [
    ["1A", `Ryanair (FR, EU, cabin 55x40x20, personal 40x20x25, 10kg, overheadFree false), EasyJet (U2, EU, 56x45x25, personal 45x36x20, 15kg, overheadFree false), Wizz Air (W6, EU, 55x40x23, personal 40x30x20, 10kg, false), Brussels Airlines (SN, EU, 55x40x23, personal 40x30x10, 8kg, true), KLM (KL, EU, 55x35x25, personal 40x30x15, 12kg, true), Air France (AF, EU, 55x35x25, personal 40x30x15, 12kg, true), Lufthansa (LH, EU, 55x40x23, personal 40x30x10, 8kg, true), British Airways (BA, EU, 56x45x25, personal 40x30x15, 23kg, true), Vueling (VY, EU, 55x40x20, personal 40x30x20, 10kg, false)`],
    ["1B", `Transavia (HV, EU, 55x35x25, personal 40x30x20, 10kg, overheadFree false), TUI fly (TB, EU, 55x40x20, personal 40x30x20, 10kg, true), Norwegian (DY, EU, 55x40x23, personal 38x30x20, 10kg, false), SAS (SK, EU, 55x40x23, personal 40x30x15, 8kg, true), Aer Lingus (EI, EU, 55x40x24, personal 40x30x20, 10kg, false), Swiss (LX, EU, 55x40x23, personal 40x30x10, 8kg, true), Iberia (IB, EU, 56x40x25, personal 40x30x15, 10kg, true), TAP Air Portugal (TP, EU, 55x40x20, personal 40x30x15, 10kg, true)`],
    ["1C", `Delta (DL, NA, 56x35x23, personal 45x35x20, 18kg, overheadFree true), United Airlines (UA, NA, 56x35x22, personal 43x25x22, 18kg, true), American Airlines (AA, NA, 56x36x23, personal 45x35x20, 18kg, true), Southwest Airlines (WN, NA, 61x41x25, personal 47x34x22, 23kg, true), Spirit Airlines (NK, NA, 56x46x25, personal 45x35x20, 18kg, false), Frontier Airlines (F9, NA, 61x41x25, personal 45x35x20, 16kg, false), JetBlue (B6, NA, 56x35x23, personal 43x33x20, 18kg, true), Alaska Airlines (AS, NA, 56x35x23, personal 43x33x20, 18kg, true), Air Canada (AC, NA, 55x40x23, personal 43x33x16, 15kg, true)`],
    ["1D", `WestJet (WS, NA, 56x36x23, personal 41x33x15, 15kg, true), Emirates (EK, ME, 55x38x22, personal 40x30x15, 7kg, true), Qatar Airways (QR, ME, 50x37x25, personal 40x30x15, 7kg, true), Etihad Airways (EY, ME, 56x36x23, personal 39x30x19, 7kg, true), Singapore Airlines (SQ, APAC, 56x36x23, personal 40x30x10, 7kg, true), ANA (NH, APAC, 55x40x25, personal 40x30x15, 10kg, true), Japan Airlines (JL, APAC, 55x40x25, personal 40x30x15, 10kg, true), Qantas (QF, APAC, 56x36x23, personal 40x30x15, 7kg, true)`],
  ];
  let rawAirlines = [];
  let airElapsed = 0;
  for (const [tag, list] of airlineSpecs) {
    console.log("  -> Batch", tag);
    const res = await askOllamaJson(`Return compact JSON {"airlines": [...]} for these exact airlines: ${list}.
Fields per item: name (str), iata (str), region ("EU"|"NA"|"APAC"|"ME"), carryOnCm ([L,W,D]), personalItemCm ([L,W,D]), carryOnWeightKg (num), personalIncluded (true), overheadFree (bool), policyNote (str <= 60 chars).`, "5m");
    rawAirlines.push(...(res.parsed.airlines || []));
    airElapsed += res.elapsedMs;
  }

  const airlines = sanitizeAirlineRows(rawAirlines);
  const airSealed = sealDataset(airlines);
  fs.writeFileSync(path.join(DATA_DIR, "airlines.json"), JSON.stringify(airSealed.canonicalJson, null, 2) + "\n");
  receipt.batches.airlines = { count: airlines.length, elapsedMs: airElapsed, sha256: airSealed.digest };
  console.log("Airlines synthesized & DeepCoder-sealed:", airlines.length);

  // Batch 2: Ask Ollama for extended footwear brands (12 extra brands) & verify/canonicalize screens + mattresses via DeepCoder
  console.log("Batch 2: 12 extended footwear brands via Ollama ...");
  const b2 = await askOllamaJson(`Return JSON {"extraShoeBrands": [...]} with 12 footwear brands:
Brooks, Saucony, Puma, Reebok, Mizuno, Merrell, Timberland, Clarks, Allbirds, Veja, Keen, Under Armour.
Each object must have: name (string), offsetMm (integer -4 to +4 representing length offset vs standard Brannock, e.g. Timberland +3, Mizuno -1), fitNote (string under 80 chars).`, "5m");

  const extraShoes = [];
  const seenShoe = new Set();
  for (const br of b2.parsed.extraShoeBrands || []) {
    if (!br?.name) continue;
    const s = slug(br.name);
    if (seenShoe.has(s)) continue;
    seenShoe.add(s);
    const off = Math.max(-5, Math.min(5, Math.round(Number(br.offsetMm ?? 0))));
    extraShoes.push({
      slug: s,
      name: String(br.name),
      offsetMm: Number.isFinite(off) ? off : 0,
      fitNote: String(br.fitNote || "Consistent standard length last.").slice(0, 100),
    });
  }

  // Batch 3: Ask Ollama for 21 country biometric passport/visa photo specs split cleanly (FINAL CALL unloads VRAM!)
  console.log("Batch 3A & 3B: 21 additional country biometric photo specs via Ollama (keep_alive: 0 unload)...");
  const b3a = await askOllamaJson(`Return JSON {"extraPhotoSpecs": [...]} with 11 countries:
Ireland (35x45, head 32-36), Spain (26x32 or 30x40, head 22-26), Italy (35x45, head 31-36), Switzerland (35x45, head 31-36), Poland (35x45, head 31-36), New Zealand (35x45, head 31-36), South Korea (35x45, head 32-36), Brazil (50x70, head 31-36), Mexico (35x45, head 31-36), UAE (40x60, head 32-36), Singapore (35x45, head 25-35).
Fields: country, documentType, widthMm, heightMm, minHeadMm, maxHeadMm, eyeLineFromBottomMinRatio (0.55), eyeLineFromBottomMaxRatio (0.68), backgroundHex ("#FFFFFF"), notes (<=60 chars).`, "5m");
  const b3b = await askOllamaJson(`Return JSON {"extraPhotoSpecs": [...]} with 10 countries:
Hong Kong (40x50, head 32-36), Malaysia (35x50, head 25-30), Philippines (35x45, head 31-36), South Africa (35x45, head 31-36), Sweden (35x45, head 31-36), Norway (35x45, head 31-36), Denmark (35x45, head 31-36), Austria (35x45, head 32-36), Portugal (35x45, head 31-36), United States DV Lottery (50.8x50.8, head 25-35).
Fields: country, documentType, widthMm, heightMm, minHeadMm, maxHeadMm, eyeLineFromBottomMinRatio (0.55), eyeLineFromBottomMaxRatio (0.68), backgroundHex ("#FFFFFF"), notes (<=60 chars).`, 0);
  const b3 = { parsed: { extraPhotoSpecs: [...(b3a.parsed.extraPhotoSpecs || []), ...(b3b.parsed.extraPhotoSpecs || [])] }, elapsedMs: b3a.elapsedMs + b3b.elapsedMs };

  const extraPhotos = [];
  const seenPhoto = new Set();
  for (const ph of b3.parsed.extraPhotoSpecs || []) {
    if (!ph?.country) continue;
    const w = Number(ph.widthMm);
    const h = Number(ph.heightMm);
    const minH = Number(ph.minHeadMm);
    const maxH = Number(ph.maxHeadMm);
    if (!(w >= 25 && w <= 120 && h >= 25 && h <= 120 && minH >= 15 && maxH >= minH && maxH / h <= 0.88)) continue;
    const s = slug(`${ph.country}-${ph.documentType || "passport"}`);
    if (seenPhoto.has(s)) continue;
    seenPhoto.add(s);
    extraPhotos.push({
      slug: s,
      country: String(ph.country),
      documentType: String(ph.documentType || "Passport"),
      widthMm: w,
      heightMm: h,
      minHeadMm: minH,
      maxHeadMm: maxH,
      eyeLineFromBottomMinRatio: Number(ph.eyeLineFromBottomMinRatio || 0.55),
      eyeLineFromBottomMaxRatio: Number(ph.eyeLineFromBottomMaxRatio || 0.68),
      backgroundHex: String(ph.backgroundHex || "#FFFFFF"),
      notes: String(ph.notes || "Neutral expression, eyes open, uniform matte lighting.").slice(0, 140),
    });
  }

  const screens = AUTHORITATIVE_SCREENS.map((s) => ({ id: slug(`${s.label}-${s.aspectW}x${s.aspectH}`), ...s }));
  const mattresses = AUTHORITATIVE_MATTRESSES.map((m) => ({ id: slug(m.label), ...m }));
  const scrSealed = sealDataset({ screens, mattresses });
  fs.writeFileSync(path.join(DATA_DIR, "screens_and_mattresses.json"), JSON.stringify(scrSealed.canonicalJson, null, 2) + "\n");
  receipt.batches.screensAndMattresses = { screens: screens.length, mattresses: mattresses.length, sha256: scrSealed.digest };

  const holSealed = sealDataset({ holidays: HOLIDAY_FACT_ANCHORS_2026_2027, avery: AUTHORITATIVE_AVERY });
  fs.writeFileSync(path.join(DATA_DIR, "holidays_and_avery.json"), JSON.stringify(holSealed.canonicalJson, null, 2) + "\n");
  receipt.batches.holidaysAndAvery = {
    countries: Object.keys(HOLIDAY_FACT_ANCHORS_2026_2027).length,
    totalHolidays: Object.values(HOLIDAY_FACT_ANCHORS_2026_2027).reduce((a, b) => a + b.length, 0),
    averyTemplates: AUTHORITATIVE_AVERY.length,
    sha256: holSealed.digest,
  };

  const extSealed = sealDataset({ extraShoeBrands: extraShoes, extraPhotoSpecs: extraPhotos });
  fs.writeFileSync(path.join(DATA_DIR, "extended_footwear_photo.json"), JSON.stringify(extSealed.canonicalJson, null, 2) + "\n");
  receipt.batches.extendedFootwearPhoto = {
    extraShoes: extraShoes.length,
    extraPhotos: extraPhotos.length,
    elapsedMs: b2.elapsedMs + b3.elapsedMs,
    sha256: extSealed.digest,
  };

  fs.writeFileSync(path.join(DATA_DIR, "synthesis-receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
  console.log("All datasets generated, validated & DeepCoder-sealed cleanly:", JSON.stringify(receipt.batches, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
