import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const DEEPCODER_PATH = "C:/OTHRYS/repos/OTHRYS/agents/cortex/deepcoder_dsl.mjs";
const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";
const MODEL = "qwen2.5-coder:7b";

const deepcoder = await import(pathToFileURL(DEEPCODER_PATH).href);
const BANNED_RE = /zero[\s-]*ads|ad[\s-]*free|\bno[\s-]*ads\b|without\s+annoying\s+ads|googlesyndication|googletagmanager|8\s*(?:to|-|\u2013|tot|bis|à|a)\s*88|all\s+ages|kids\s+to\s+seniors/i;

function cleanNote(text, fallback) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (!s || BANNED_RE.test(s)) return fallback;
  return s.slice(0, 120);
}

function slug(value) {
  return deepcoder.executePipeline(["slugify"], String(value));
}

function sealDataset(records) {
  return {
    canonicalJson: deepcoder.executePipeline(["canonicalizeJson"], records),
    digest: deepcoder.executePipeline(["canonicalizeJson", "stringifyCanonical", "sha256Hex"], records),
  };
}

async function askOllamaNoteEnrichment(kind, items) {
  const started = Date.now();
  try {
    const prompt = `Return strictly JSON mapping each slug in ${JSON.stringify(items.map((x) => x.slug || x.name))} to a concise, factual 6-12 word technical summary note for ${kind}. No promotional language, no mentions of advertising or age groups.`;
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: MODEL,
        prompt,
        format: "json",
        stream: false,
        keep_alive: "2m",
        options: { temperature: 0.1, num_ctx: 2048, num_predict: 900 },
      }),
    });
    if (!res.ok) return { notes: {}, elapsedMs: Date.now() - started, fallback: true };
    const body = await res.json();
    const parsed = JSON.parse(body.response || "{}");
    return { notes: parsed && typeof parsed === "object" ? parsed : {}, elapsedMs: Date.now() - started, fallback: false };
  } catch {
    return { notes: {}, elapsedMs: Date.now() - started, fallback: true };
  }
}

async function unloadOllama() {
  try {
    await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({ model: MODEL, prompt: "", keep_alive: 0 }),
    });
  } catch {
    // Ollama may already be stopped
  }
}

// -----------------------------------------------------------------------------
// 1. Expand Airlines (34 -> 75 total)
// -----------------------------------------------------------------------------
const EXTRA_AIRLINES = [
  { name: "Eurowings", iata: "EW", region: "EU", carryOnCm: [55, 40, 23], personalItemCm: [40, 30, 25], carryOnWeightKg: 8, personalIncluded: true, overheadFree: false, policyNote: "Basic fare includes small under-seat bag only" },
  { name: "Condor", iata: "DE", region: "EU", carryOnCm: [55, 40, 20], personalItemCm: [40, 30, 10], carryOnWeightKg: 8, personalIncluded: true, overheadFree: false, policyNote: "Economy Light limits carry-on to personal under-seat item" },
  { name: "Jet2", iata: "LS", region: "EU", carryOnCm: [56, 45, 25], personalItemCm: [40, 30, 15], carryOnWeightKg: 10, personalIncluded: true, overheadFree: true, policyNote: "10 kg overhead cabin bag plus under-seat item included" },
  { name: "LOT Polish Airlines", iata: "LO", region: "EU", carryOnCm: [55, 40, 23], personalItemCm: [40, 35, 12], carryOnWeightKg: 8, personalIncluded: true, overheadFree: true, policyNote: "Standard 8 kg overhead cabin bag included" },
  { name: "Finnair", iata: "AY", region: "EU", carryOnCm: [55, 40, 23], personalItemCm: [40, 30, 15], carryOnWeightKg: 8, personalIncluded: true, overheadFree: false, policyNote: "Superlight ticket includes small under-seat bag only" },
  { name: "Austrian Airlines", iata: "OS", region: "EU", carryOnCm: [55, 40, 23], personalItemCm: [40, 30, 10], carryOnWeightKg: 8, personalIncluded: true, overheadFree: true, policyNote: "Lufthansa Group 8 kg overhead cabin limit" },
  { name: "ITA Airways", iata: "AZ", region: "EU", carryOnCm: [55, 35, 25], personalItemCm: [45, 36, 20], carryOnWeightKg: 8, personalIncluded: true, overheadFree: true, policyNote: "8 kg narrow 35 cm depth cabin trolley plus accessory" },
  { name: "Aegean Airlines", iata: "A3", region: "EU", carryOnCm: [56, 45, 25], personalItemCm: [40, 30, 15], carryOnWeightKg: 8, personalIncluded: true, overheadFree: true, policyNote: "Light fare includes either 8 kg overhead or personal item" },
  { name: "Volotea", iata: "V7", region: "EU", carryOnCm: [55, 40, 20], personalItemCm: [40, 30, 20], carryOnWeightKg: 10, personalIncluded: true, overheadFree: false, policyNote: "Under-seat bag free; Priority adds 10 kg cabin roller" },
  { name: "Air Europa", iata: "UX", region: "EU", carryOnCm: [55, 35, 25], personalItemCm: [40, 30, 15], carryOnWeightKg: 10, personalIncluded: true, overheadFree: true, policyNote: "10 kg 55x35x25 cm overhead bag included on Economy" },
  { name: "airBaltic", iata: "BT", region: "EU", carryOnCm: [55, 40, 23], personalItemCm: [30, 40, 10], carryOnWeightKg: 8, personalIncluded: true, overheadFree: true, policyNote: "8 kg combined cabin weight across trolley and personal bag" },
  { name: "Iberia Express", iata: "I2", region: "EU", carryOnCm: [56, 40, 25], personalItemCm: [40, 30, 15], carryOnWeightKg: 10, personalIncluded: true, overheadFree: true, policyNote: "Standard 56x40x25 cm overhead cabin allowance" },
  { name: "Pegasus Airlines", iata: "PC", region: "EU", carryOnCm: [55, 40, 20], personalItemCm: [40, 30, 15], carryOnWeightKg: 8, personalIncluded: true, overheadFree: false, policyNote: "Basic international fares allow 40x30x15 cm 3 kg under-seat only" },
  { name: "Turkish Airlines", iata: "TK", region: "EU", carryOnCm: [55, 40, 23], personalItemCm: [40, 30, 15], carryOnWeightKg: 8, personalIncluded: true, overheadFree: true, policyNote: "8 kg 55x40x23 cm cabin bag plus personal item" },
  { name: "Icelandair", iata: "FI", region: "EU", carryOnCm: [55, 40, 20], personalItemCm: [40, 30, 15], carryOnWeightKg: 10, personalIncluded: true, overheadFree: true, policyNote: "10 kg cabin bag; Economy Light limits dimensions strictly" },
  { name: "PLAY Airlines", iata: "OG", region: "EU", carryOnCm: [56, 45, 25], personalItemCm: [42, 32, 25], carryOnWeightKg: 10, personalIncluded: true, overheadFree: false, policyNote: "Basic fare covers 42x32x25 cm personal item only" },
  { name: "Virgin Atlantic", iata: "VS", region: "EU", carryOnCm: [56, 36, 23], personalItemCm: [40, 30, 15], carryOnWeightKg: 10, personalIncluded: true, overheadFree: true, policyNote: "10 kg cabin trolley plus small personal item included" },
  { name: "Croatia Airlines", iata: "OU", region: "EU", carryOnCm: [55, 40, 20], personalItemCm: [40, 30, 10], carryOnWeightKg: 8, personalIncluded: true, overheadFree: true, policyNote: "8 kg 115 cm linear cabin allowance on Airbus & Dash 8" },
  { name: "Luxair", iata: "LG", region: "EU", carryOnCm: [55, 40, 23], personalItemCm: [40, 30, 10], carryOnWeightKg: 8, personalIncluded: true, overheadFree: true, policyNote: "8 kg overhead bag plus small handbag included" },
  { name: "SUNEXPRESS", iata: "XQ", region: "EU", carryOnCm: [55, 40, 23], personalItemCm: [40, 30, 20], carryOnWeightKg: 8, personalIncluded: true, overheadFree: false, policyNote: "SunLight allows 4 kg personal under-seat item only" },
  { name: "Loganair", iata: "LM", region: "EU", carryOnCm: [40, 35, 18], personalItemCm: [35, 25, 15], carryOnWeightKg: 6, personalIncluded: true, overheadFree: true, policyNote: "Compact regional turboprop bins cap length at 40 cm" },
  { name: "Czech Airlines", iata: "OK", region: "EU", carryOnCm: [55, 45, 25], personalItemCm: [40, 30, 15], carryOnWeightKg: 8, personalIncluded: true, overheadFree: false, policyNote: "Lite fare requires paid upgrade for overhead cabin case" },
  { name: "Porter Airlines", iata: "PD", region: "NA", carryOnCm: [55, 40, 23], personalItemCm: [43, 33, 16], carryOnWeightKg: 9, personalIncluded: true, overheadFree: false, policyNote: "Basic fare allows personal item only; Standard adds overhead" },
  { name: "Flair Airlines", iata: "F8", region: "NA", carryOnCm: [55, 40, 23], personalItemCm: [43, 33, 15], carryOnWeightKg: 10, personalIncluded: true, overheadFree: false, policyNote: "Personal item free; overhead carry-on requires fee" },
  { name: "Breeze Airways", iata: "MX", region: "NA", carryOnCm: [56, 36, 23], personalItemCm: [43, 33, 20], carryOnWeightKg: 12, personalIncluded: true, overheadFree: false, policyNote: "No Flex fare includes under-seat item only" },
  { name: "Allegiant Air", iata: "G4", region: "NA", carryOnCm: [56, 36, 25], personalItemCm: [45, 36, 20], carryOnWeightKg: 11, personalIncluded: true, overheadFree: false, policyNote: "One personal item included; overhead rollaboard paid" },
  { name: "Hawaiian Airlines", iata: "HA", region: "NA", carryOnCm: [56, 36, 23], personalItemCm: [45, 35, 20], carryOnWeightKg: 11, personalIncluded: true, overheadFree: true, policyNote: "22x14x9 in overhead bag up to 11.5 kg included" },
  { name: "Aeromexico", iata: "AM", region: "NA", carryOnCm: [55, 40, 25], personalItemCm: [40, 30, 15], carryOnWeightKg: 10, personalIncluded: true, overheadFree: true, policyNote: "10 kg combined cabin allowance on Basic AM+ routes" },
  { name: "Copa Airlines", iata: "CM", region: "NA", carryOnCm: [56, 36, 26], personalItemCm: [43, 25, 22], carryOnWeightKg: 10, personalIncluded: true, overheadFree: true, policyNote: "10 kg carry-on included across Americas network" },
  { name: "Sun Country Airlines", iata: "SY", region: "NA", carryOnCm: [61, 41, 28], personalItemCm: [43, 33, 23], carryOnWeightKg: 16, personalIncluded: true, overheadFree: false, policyNote: "Personal item free; paid overhead bag up to 35 lb" },
  { name: "Scoot", iata: "TR", region: "APAC", carryOnCm: [54, 38, 23], personalItemCm: [40, 30, 10], carryOnWeightKg: 10, personalIncluded: true, overheadFree: true, policyNote: "10 kg combined cabin weight (two pieces total)" },
  { name: "AirAsia", iata: "AK", region: "APAC", carryOnCm: [56, 36, 23], personalItemCm: [40, 30, 10], carryOnWeightKg: 7, personalIncluded: true, overheadFree: true, policyNote: "Strict 7 kg combined cabin plus small bag limit" },
  { name: "Cathay Pacific", iata: "CX", region: "APAC", carryOnCm: [56, 36, 23], personalItemCm: [40, 30, 15], carryOnWeightKg: 7, personalIncluded: true, overheadFree: true, policyNote: "7 kg Economy cabin bag plus personal small item" },
  { name: "EVA Air", iata: "BR", region: "APAC", carryOnCm: [56, 36, 23], personalItemCm: [40, 30, 10], carryOnWeightKg: 7, personalIncluded: true, overheadFree: true, policyNote: "7 kg cabin bag limit with strict 115 cm linear cap" },
  { name: "Korean Air", iata: "KE", region: "APAC", carryOnCm: [55, 40, 20], personalItemCm: [40, 30, 15], carryOnWeightKg: 10, personalIncluded: true, overheadFree: true, policyNote: "10 kg cabin bag plus personal item allowed in Economy" },
  { name: "VietJet Air", iata: "VJ", region: "APAC", carryOnCm: [56, 36, 23], personalItemCm: [40, 30, 10], carryOnWeightKg: 7, personalIncluded: true, overheadFree: true, policyNote: "7 kg combined carry-on and small handbag allowance" },
  { name: "IndiGo", iata: "6E", region: "APAC", carryOnCm: [55, 35, 25], personalItemCm: [40, 30, 15], carryOnWeightKg: 7, personalIncluded: true, overheadFree: true, policyNote: "7 kg overhead plus 3 kg personal laptop/handbag" },
  { name: "Air New Zealand", iata: "NZ", region: "APAC", carryOnCm: [55, 35, 25], personalItemCm: [40, 30, 15], carryOnWeightKg: 7, personalIncluded: true, overheadFree: true, policyNote: "118 cm total linear length, 7 kg Economy limit" },
  { name: "Jetstar", iata: "JQ", region: "APAC", carryOnCm: [56, 36, 23], personalItemCm: [40, 30, 15], carryOnWeightKg: 7, personalIncluded: true, overheadFree: true, policyNote: "Strict gate scale check at 7 kg combined across two bags" },
  { name: "Saudia", iata: "SV", region: "ME", carryOnCm: [56, 45, 25], personalItemCm: [40, 30, 15], carryOnWeightKg: 7, personalIncluded: true, overheadFree: true, policyNote: "7 kg Guest Class cabin bag plus personal item" },
  { name: "Oman Air", iata: "WY", region: "ME", carryOnCm: [55, 38, 25], personalItemCm: [40, 30, 15], carryOnWeightKg: 7, personalIncluded: true, overheadFree: true, policyNote: "7 kg single Economy cabin allowance (115 cm linear)" },
];

// -----------------------------------------------------------------------------
// 2. Expand Screens (24 -> 32) & Mattresses (17 -> 21)
// -----------------------------------------------------------------------------
const EXTRA_SCREENS = [
  { id: "21-5-monitor-16x9", label: '21.5" Monitor', category: "monitor", diagonalIn: 21.5, aspectW: 16, aspectH: 9 },
  { id: "28-4k-monitor-16x9", label: '28" 4K Monitor', category: "monitor", diagonalIn: 28, aspectW: 16, aspectH: 9 },
  { id: "32-oled-monitor-16x9", label: '32" OLED Monitor', category: "monitor", diagonalIn: 32, aspectW: 16, aspectH: 9 },
  { id: "40-ultrawide-21x9", label: '40" Ultrawide', category: "monitor", diagonalIn: 40, aspectW: 21, aspectH: 9 },
  { id: "45-ultrawide-oled-21x9", label: '45" OLED Ultrawide', category: "monitor", diagonalIn: 45, aspectW: 21, aspectH: 9 },
  { id: "40-tv-16x9", label: '40" TV', category: "tv", diagonalIn: 40, aspectW: 16, aspectH: 9 },
  { id: "58-tv-16x9", label: '58" TV', category: "tv", diagonalIn: 58, aspectW: 16, aspectH: 9 },
  { id: "70-tv-16x9", label: '70" TV', category: "tv", diagonalIn: 70, aspectW: 16, aspectH: 9 },
];

const EXTRA_MATTRESSES = [
  { id: "eu-narrow-80x200", label: "EU Narrow Single 80x200", region: "EU", widthCm: 80, lengthCm: 200 },
  { id: "eu-french-double-140x190", label: "EU French Double 140x190", region: "EU", widthCm: 140, lengthCm: 190 },
  { id: "us-rv-short-queen", label: "US RV Short Queen", region: "US", widthCm: 152.4, lengthCm: 190.5 },
  { id: "uk-emperor-200x200", label: "UK Emperor 200x200", region: "UK", widthCm: 200, lengthCm: 200 },
];

// -----------------------------------------------------------------------------
// 3. Expand Avery/Herma Labels (8 -> 30) & Holiday Countries (10 -> 20)
// -----------------------------------------------------------------------------
const EXTRA_AVERY = [
  { code: "5161", name: "Avery 5161 Address Labels (20/sheet)", paper: "letter", cols: 2, rows: 10, labelWidthMm: 101.6, labelHeightMm: 25.4, marginTopMm: 12.7, marginLeftMm: 4.06, gapXMm: 4.57, gapYMm: 0 },
  { code: "5162", name: "Avery 5162 Address Labels (14/sheet)", paper: "letter", cols: 2, rows: 7, labelWidthMm: 101.6, labelHeightMm: 33.87, marginTopMm: 21.17, marginLeftMm: 4.06, gapXMm: 4.57, gapYMm: 0 },
  { code: "5164", name: "Avery 5164 Shipping Labels (6/sheet)", paper: "letter", cols: 2, rows: 3, labelWidthMm: 101.6, labelHeightMm: 84.67, marginTopMm: 12.7, marginLeftMm: 4.06, gapXMm: 4.57, gapYMm: 0 },
  { code: "5195", name: "Avery 5195 Return Labels (60/sheet)", paper: "letter", cols: 4, rows: 15, labelWidthMm: 44.45, labelHeightMm: 16.93, marginTopMm: 12.7, marginLeftMm: 7.62, gapXMm: 7.62, gapYMm: 0 },
  { code: "5260", name: "Avery 5260 Laser Address (30/sheet)", paper: "letter", cols: 3, rows: 10, labelWidthMm: 66.68, labelHeightMm: 25.4, marginTopMm: 12.7, marginLeftMm: 4.83, gapXMm: 3.18, gapYMm: 0 },
  { code: "5263", name: "Avery 5263 Inkjet Shipping (10/sheet)", paper: "letter", cols: 2, rows: 5, labelWidthMm: 101.6, labelHeightMm: 50.8, marginTopMm: 12.7, marginLeftMm: 4.06, gapXMm: 4.57, gapYMm: 0 },
  { code: "5388", name: "Avery 5388 Index Cards 3x5 (3/sheet)", paper: "letter", cols: 1, rows: 3, labelWidthMm: 127.0, labelHeightMm: 76.2, marginTopMm: 25.4, marginLeftMm: 44.45, gapXMm: 0, gapYMm: 0 },
  { code: "8160", name: "Avery 8160 Inkjet Address (30/sheet)", paper: "letter", cols: 3, rows: 10, labelWidthMm: 66.68, labelHeightMm: 25.4, marginTopMm: 12.7, marginLeftMm: 4.83, gapXMm: 3.18, gapYMm: 0 },
  { code: "8163", name: "Avery 8163 Inkjet Shipping (10/sheet)", paper: "letter", cols: 2, rows: 5, labelWidthMm: 101.6, labelHeightMm: 50.8, marginTopMm: 12.7, marginLeftMm: 4.06, gapXMm: 4.57, gapYMm: 0 },
  { code: "8167", name: "Avery 8167 Inkjet Return (80/sheet)", paper: "letter", cols: 4, rows: 20, labelWidthMm: 44.45, labelHeightMm: 12.7, marginTopMm: 12.7, marginLeftMm: 7.62, gapXMm: 7.62, gapYMm: 0 },
  { code: "8371", name: "Avery 8371 Business Cards (10/sheet)", paper: "letter", cols: 2, rows: 5, labelWidthMm: 88.9, labelHeightMm: 50.8, marginTopMm: 12.7, marginLeftMm: 19.05, gapXMm: 0, gapYMm: 0 },
  { code: "L7159", name: "Avery L7159 A4 Mini Address (24/sheet)", paper: "a4", cols: 3, rows: 8, labelWidthMm: 63.5, labelHeightMm: 33.9, marginTopMm: 13.0, marginLeftMm: 7.2, gapXMm: 2.55, gapYMm: 0 },
  { code: "L7161", name: "Avery L7161 A4 Address (18/sheet)", paper: "a4", cols: 3, rows: 6, labelWidthMm: 63.5, labelHeightMm: 46.6, marginTopMm: 8.7, marginLeftMm: 7.2, gapXMm: 2.55, gapYMm: 0 },
  { code: "L7162", name: "Avery L7162 A4 Parcel (16/sheet)", paper: "a4", cols: 2, rows: 8, labelWidthMm: 99.1, labelHeightMm: 34.0, marginTopMm: 12.5, marginLeftMm: 4.65, gapXMm: 2.5, gapYMm: 0 },
  { code: "L7166", name: "Avery L7166 A4 Large Parcel (6/sheet)", paper: "a4", cols: 2, rows: 3, labelWidthMm: 99.1, labelHeightMm: 93.1, marginTopMm: 8.85, marginLeftMm: 4.65, gapXMm: 2.5, gapYMm: 0 },
  { code: "L7168", name: "Avery L7168 A4 Half-Sheet (2/sheet)", paper: "a4", cols: 1, rows: 2, labelWidthMm: 199.6, labelHeightMm: 143.5, marginTopMm: 5.0, marginLeftMm: 5.2, gapXMm: 0, gapYMm: 0 },
  { code: "L7173", name: "Avery L7173 A4 Wide Parcel (10/sheet)", paper: "a4", cols: 2, rows: 5, labelWidthMm: 99.1, labelHeightMm: 57.0, marginTopMm: 6.0, marginLeftMm: 4.65, gapXMm: 2.5, gapYMm: 0 },
  { code: "J8159", name: "Avery J8159 A4 Inkjet (24/sheet)", paper: "a4", cols: 3, rows: 8, labelWidthMm: 63.5, labelHeightMm: 33.9, marginTopMm: 13.0, marginLeftMm: 7.2, gapXMm: 2.55, gapYMm: 0 },
  { code: "J8163", name: "Avery J8163 A4 Inkjet Parcel (14/sheet)", paper: "a4", cols: 2, rows: 7, labelWidthMm: 99.1, labelHeightMm: 38.1, marginTopMm: 15.15, marginLeftMm: 4.65, gapXMm: 2.5, gapYMm: 0 },
  { code: "J8165", name: "Avery J8165 A4 Large Inkjet (8/sheet)", paper: "a4", cols: 2, rows: 4, labelWidthMm: 99.1, labelHeightMm: 67.7, marginTopMm: 13.1, marginLeftMm: 4.65, gapXMm: 2.5, gapYMm: 0 },
  { code: "HERMA-4270", name: "Herma 4270 A4 Multi-Purpose (24/sheet)", paper: "a4", cols: 3, rows: 8, labelWidthMm: 70.0, labelHeightMm: 37.0, marginTopMm: 0.5, marginLeftMm: 0.0, gapXMm: 0, gapYMm: 0 },
  { code: "HERMA-4360", name: "Herma 4360 A4 Shipping (16/sheet)", paper: "a4", cols: 2, rows: 8, labelWidthMm: 105.0, labelHeightMm: 37.0, marginTopMm: 0.5, marginLeftMm: 0.0, gapXMm: 0, gapYMm: 0 },
];

const EXTRA_HOLIDAYS = {
  IE: [
    { date: "2026-01-01", name: "New Year's Day" },
    { date: "2026-02-02", name: "St Brigid's Day" },
    { date: "2026-03-17", name: "St Patrick's Day" },
    { date: "2026-04-06", name: "Easter Monday" },
    { date: "2026-05-04", name: "May Bank Holiday" },
    { date: "2026-06-01", name: "June Bank Holiday" },
    { date: "2026-08-03", name: "August Bank Holiday" },
    { date: "2026-10-26", name: "October Bank Holiday" },
    { date: "2026-12-25", name: "Christmas Day" },
    { date: "2026-12-26", name: "St Stephen's Day" },
    { date: "2027-01-01", name: "New Year's Day" },
    { date: "2027-02-01", name: "St Brigid's Day" },
    { date: "2027-03-17", name: "St Patrick's Day" },
    { date: "2027-03-29", name: "Easter Monday" },
    { date: "2027-05-03", name: "May Bank Holiday" },
    { date: "2027-06-07", name: "June Bank Holiday" },
    { date: "2027-08-02", name: "August Bank Holiday" },
    { date: "2027-10-25", name: "October Bank Holiday" },
    { date: "2027-12-25", name: "Christmas Day" },
    { date: "2027-12-26", name: "St Stephen's Day" },
  ],
  CH: [
    { date: "2026-01-01", name: "Neujahr / Nouvel An" },
    { date: "2026-04-03", name: "Karfreitag / Vendredi saint" },
    { date: "2026-04-06", name: "Ostermontag / Lundi de Pâques" },
    { date: "2026-05-14", name: "Auffahrt / Ascension" },
    { date: "2026-05-25", name: "Pfingstmontag / Lundi de Pentecôte" },
    { date: "2026-08-01", name: "Bundesfeiertag / Fête nationale" },
    { date: "2026-12-25", name: "Weihnachten / Noël" },
    { date: "2027-01-01", name: "Neujahr / Nouvel An" },
    { date: "2027-03-26", name: "Karfreitag / Vendredi saint" },
    { date: "2027-03-29", name: "Ostermontag / Lundi de Pâques" },
    { date: "2027-05-06", name: "Auffahrt / Ascension" },
    { date: "2027-05-17", name: "Pfingstmontag / Lundi de Pentecôte" },
    { date: "2027-08-01", name: "Bundesfeiertag / Fête nationale" },
    { date: "2027-12-25", name: "Weihnachten / Noël" },
  ],
  AT: [
    { date: "2026-01-01", name: "Neujahr" },
    { date: "2026-01-06", name: "Heilige Drei Könige" },
    { date: "2026-04-06", name: "Ostermontag" },
    { date: "2026-05-01", name: "Staatsfeiertag" },
    { date: "2026-05-14", name: "Christi Himmelfahrt" },
    { date: "2026-05-25", name: "Pfingstmontag" },
    { date: "2026-06-04", name: "Fronleichnam" },
    { date: "2026-08-15", name: "Mariä Himmelfahrt" },
    { date: "2026-10-26", name: "Nationalfeiertag" },
    { date: "2026-11-01", name: "Allerheiligen" },
    { date: "2026-12-08", name: "Mariä Empfängnis" },
    { date: "2026-12-25", name: "Christtag" },
    { date: "2026-12-26", name: "Stefanitag" },
    { date: "2027-01-01", name: "Neujahr" },
    { date: "2027-01-06", name: "Heilige Drei Könige" },
    { date: "2027-03-29", name: "Ostermontag" },
    { date: "2027-05-01", name: "Staatsfeiertag" },
    { date: "2027-05-06", name: "Christi Himmelfahrt" },
    { date: "2027-05-17", name: "Pfingstmontag" },
    { date: "2027-05-27", name: "Fronleichnam" },
    { date: "2027-08-15", name: "Mariä Himmelfahrt" },
    { date: "2027-10-26", name: "Nationalfeiertag" },
    { date: "2027-12-25", name: "Christtag" },
    { date: "2027-12-26", name: "Stefanitag" },
  ],
  PT: [
    { date: "2026-01-01", name: "Ano Novo" },
    { date: "2026-04-03", name: "Sexta-feira Santa" },
    { date: "2026-04-25", name: "Dia da Liberdade" },
    { date: "2026-05-01", name: "Dia do Trabalhador" },
    { date: "2026-06-10", name: "Dia de Portugal" },
    { date: "2026-08-15", name: "Assunção de Nossa Senhora" },
    { date: "2026-10-05", name: "Implantação da República" },
    { date: "2026-12-01", name: "Restauração da Independência" },
    { date: "2026-12-25", name: "Natal" },
    { date: "2027-01-01", name: "Ano Novo" },
    { date: "2027-03-26", name: "Sexta-feira Santa" },
    { date: "2027-04-25", name: "Dia da Liberdade" },
    { date: "2027-05-01", name: "Dia do Trabalhador" },
    { date: "2027-06-10", name: "Dia de Portugal" },
    { date: "2027-08-15", name: "Assunção de Nossa Senhora" },
    { date: "2027-10-05", name: "Implantação da República" },
    { date: "2027-12-01", name: "Restauração da Independência" },
    { date: "2027-12-25", name: "Natal" },
  ],
  PL: [
    { date: "2026-01-01", name: "Nowy Rok" },
    { date: "2026-01-06", name: "Trzech Króli" },
    { date: "2026-04-05", name: "Wielkanoc" },
    { date: "2026-04-06", name: "Poniedziałek Wielkanocny" },
    { date: "2026-05-01", name: "Święto Pracy" },
    { date: "2026-05-03", name: "Święto Konstytucji 3 Maja" },
    { date: "2026-06-04", name: "Boże Ciało" },
    { date: "2026-08-15", name: "Wniebowzięcie NMP" },
    { date: "2026-11-01", name: "Wszystkich Świętych" },
    { date: "2026-11-11", name: "Święto Niepodległości" },
    { date: "2026-12-25", name: "Boże Narodzenie" },
    { date: "2026-12-26", name: "Drugi dzień Świąt" },
    { date: "2027-01-01", name: "Nowy Rok" },
    { date: "2027-01-06", name: "Trzech Króli" },
    { date: "2027-03-29", name: "Poniedziałek Wielkanocny" },
    { date: "2027-05-01", name: "Święto Pracy" },
    { date: "2027-05-03", name: "Święto Konstytucji 3 Maja" },
    { date: "2027-05-27", name: "Boże Ciało" },
    { date: "2027-08-15", name: "Wniebowzięcie NMP" },
    { date: "2027-11-11", name: "Święto Niepodległości" },
    { date: "2027-12-25", name: "Boże Narodzenie" },
    { date: "2027-12-26", name: "Drugi dzień Świąt" },
  ],
  SE: [
    { date: "2026-01-01", name: "Nyårsdagen" },
    { date: "2026-01-06", name: "Trettondedag jul" },
    { date: "2026-04-03", name: "Långfredagen" },
    { date: "2026-04-06", name: "Annandag påsk" },
    { date: "2026-05-01", name: "Första maj" },
    { date: "2026-05-14", name: "Kristi himmelsfärdsdag" },
    { date: "2026-06-06", name: "Sveriges nationaldag" },
    { date: "2026-06-20", name: "Midsommardagen" },
    { date: "2026-12-25", name: "Juldagen" },
    { date: "2026-12-26", name: "Annandag jul" },
    { date: "2027-01-01", name: "Nyårsdagen" },
    { date: "2027-01-06", name: "Trettondedag jul" },
    { date: "2027-03-26", name: "Långfredagen" },
    { date: "2027-03-29", name: "Annandag påsk" },
    { date: "2027-05-01", name: "Första maj" },
    { date: "2027-05-06", name: "Kristi himmelsfärdsdag" },
    { date: "2027-06-06", name: "Sveriges nationaldag" },
    { date: "2027-06-26", name: "Midsommardagen" },
    { date: "2027-12-25", name: "Juldagen" },
    { date: "2027-12-26", name: "Annandag jul" },
  ],
  NO: [
    { date: "2026-01-01", name: "Første nyttårsdag" },
    { date: "2026-04-03", name: "Langfredag" },
    { date: "2026-04-06", name: "Andre påskedag" },
    { date: "2026-05-01", name: "Arbeidernes dag" },
    { date: "2026-05-14", name: "Kristi himmelfartsdag" },
    { date: "2026-05-17", name: "Grunnlovsdagen" },
    { date: "2026-05-25", name: "Andre pinsedag" },
    { date: "2026-12-25", name: "Første juledag" },
    { date: "2026-12-26", name: "Andre juledag" },
    { date: "2027-01-01", name: "Første nyttårsdag" },
    { date: "2027-03-26", name: "Langfredag" },
    { date: "2027-03-29", name: "Andre påskedag" },
    { date: "2027-05-01", name: "Arbeidernes dag" },
    { date: "2027-05-06", name: "Kristi himmelfartsdag" },
    { date: "2027-05-17", name: "Grunnlovsdagen" },
    { date: "2027-05-17", name: "Andre pinsedag" },
    { date: "2027-12-25", name: "Første juledag" },
    { date: "2027-12-26", name: "Andre juledag" },
  ],
  DK: [
    { date: "2026-01-01", name: "Nytårsdag" },
    { date: "2026-04-02", name: "Skærtorsdag" },
    { date: "2026-04-03", name: "Langfredag" },
    { date: "2026-04-06", name: "Anden påskedag" },
    { date: "2026-05-14", name: "Kristi himmelfartsdag" },
    { date: "2026-05-25", name: "Anden pinsedag" },
    { date: "2026-12-25", name: "Juledag" },
    { date: "2026-12-26", name: "Anden juledag" },
    { date: "2027-01-01", name: "Nytårsdag" },
    { date: "2027-03-25", name: "Skærtorsdag" },
    { date: "2027-03-26", name: "Langfredag" },
    { date: "2027-03-29", name: "Anden påskedag" },
    { date: "2027-05-06", name: "Kristi himmelfartsdag" },
    { date: "2027-05-17", name: "Anden pinsedag" },
    { date: "2027-12-25", name: "Juledag" },
    { date: "2027-12-26", name: "Anden juledag" },
  ],
  JP: [
    { date: "2026-01-01", name: "New Year's Day (Ganjitsu)" },
    { date: "2026-01-12", name: "Coming of Age Day" },
    { date: "2026-02-11", name: "National Foundation Day" },
    { date: "2026-02-23", name: "Emperor's Birthday" },
    { date: "2026-04-29", name: "Showa Day" },
    { date: "2026-05-03", name: "Constitution Memorial Day" },
    { date: "2026-05-05", name: "Children's Day" },
    { date: "2026-08-11", name: "Mountain Day" },
    { date: "2026-11-03", name: "Culture Day" },
    { date: "2026-11-23", name: "Labor Thanksgiving Day" },
    { date: "2027-01-01", name: "New Year's Day (Ganjitsu)" },
    { date: "2027-01-11", name: "Coming of Age Day" },
    { date: "2027-02-11", name: "National Foundation Day" },
    { date: "2027-02-23", name: "Emperor's Birthday" },
    { date: "2027-04-29", name: "Showa Day" },
    { date: "2027-05-03", name: "Constitution Memorial Day" },
    { date: "2027-05-05", name: "Children's Day" },
    { date: "2027-08-11", name: "Mountain Day" },
    { date: "2027-11-03", name: "Culture Day" },
    { date: "2027-11-23", name: "Labor Thanksgiving Day" },
  ],
  MX: [
    { date: "2026-01-01", name: "Año Nuevo" },
    { date: "2026-02-02", name: "Día de la Constitución" },
    { date: "2026-03-16", name: "Natalicio de Benito Juárez" },
    { date: "2026-05-01", name: "Día del Trabajo" },
    { date: "2026-09-16", name: "Día de la Independencia" },
    { date: "2026-11-16", name: "Día de la Revolución" },
    { date: "2026-12-25", name: "Navidad" },
    { date: "2027-01-01", name: "Año Nuevo" },
    { date: "2027-02-01", name: "Día de la Constitución" },
    { date: "2027-03-15", name: "Natalicio de Benito Juárez" },
    { date: "2027-05-01", name: "Día del Trabajo" },
    { date: "2027-09-16", name: "Día de la Independencia" },
    { date: "2027-11-15", name: "Día de la Revolución" },
    { date: "2027-12-25", name: "Navidad" },
  ],
};

// -----------------------------------------------------------------------------
// 4. Expand Shoe Brands (24 -> 45 total: 12 core + 33 extraShoeBrands)
// -----------------------------------------------------------------------------
const NEW_SHOE_BRANDS = [
  { slug: "onitsuka-tiger", name: "Onitsuka Tiger", offsetMm: -2, fitNote: "Heritage low-profile Japanese trainer; slightly snug length" },
  { slug: "altra", name: "Altra", offsetMm: 1, fitNote: "FootShape wide anatomical toe box with true length" },
  { slug: "topo-athletic", name: "Topo Athletic", offsetMm: 1, fitNote: "Roomy forefoot with locked midfoot heel pocket" },
  { slug: "la-sportiva", name: "La Sportiva", offsetMm: -3, fitNote: "Technical Italian mountain last runs half-size compact" },
  { slug: "scarpa", name: "Scarpa", offsetMm: -2, fitNote: "Precision European approach fit; slightly firm toe rand" },
  { slug: "lowa", name: "Lowa", offsetMm: 0, fitNote: "Standard German trekking last built for hiking socks" },
  { slug: "meindl", name: "Meindl", offsetMm: 1, fitNote: "Generous Alpine Comfort Fit forefoot width" },
  { slug: "ecco", name: "ECCO", offsetMm: 2, fitNote: "Danish comfort anatomical last with extra forefoot volume" },
  { slug: "geox", name: "Geox", offsetMm: 1, fitNote: "Italian European last slightly generous in casual styles" },
  { slug: "camper", name: "Camper", offsetMm: 1, fitNote: "Minimalist EU sizing; round toe box accommodates medium width" },
  { slug: "red-wing", name: "Red Wing", offsetMm: 5, fitNote: "Heritage work boots typically sized half to one US size down" },
  { slug: "blundstone", name: "Blundstone", offsetMm: 2, fitNote: "Australian Chelsea boot AU sizing; half sizes add width only" },
  { slug: "ugg", name: "UGG", offsetMm: 3, fitNote: "Shearling fleece compresses over wear; snug initial fit advised" },
  { slug: "fila", name: "FILA", offsetMm: 0, fitNote: "Standard international court trainer sizing" },
  { slug: "diadora", name: "Diadora", offsetMm: 1, fitNote: "Classic Italian court and heritage running last" },
  { slug: "skechers", name: "Skechers", offsetMm: 2, fitNote: "Relaxed Fit casual last gives comfortable forefoot depth" },
  { slug: "cole-haan", name: "Cole Haan", offsetMm: 2, fitNote: "Hybrid dress-sneaker last often runs half size generous" },
  { slug: "solomon-s-lab", name: "Hummel", offsetMm: 0, fitNote: "Classic European handball & retro sneaker proportions" },
  { slug: "keds", name: "Keds", offsetMm: -1, fitNote: "Slim tapered canvas sneaker; consider up 0.5 for wide feet" },
  { slug: "seavees", name: "Karhu", offsetMm: -2, fitNote: "Finnish heritage running shoes run slightly short; size up 0.5" },
  { slug: "teva", name: "Teva", offsetMm: 1, fitNote: "Whole-size adjustable strapping sandals; true standard length" },
];
// Fix slug cleanliness on 2 labels above cleanly
NEW_SHOE_BRANDS[17].slug = "hummel";
NEW_SHOE_BRANDS[19].slug = "karhu";

// -----------------------------------------------------------------------------
// 5. Expand Biometric Photo Specs (36 -> 90 total: 15 core + 75 extraPhotoSpecs)
// -----------------------------------------------------------------------------
const NEW_PHOTO_SPECS = [
  ["belgium-driving-license", "Belgium", "Driving License", 35, 45, 31, 36, "#FFFFFF"],
  ["netherlands-driving-license", "Netherlands", "Rijbewijs / ID Card", 35, 45, 26, 30, "#F2F2F2"],
  ["germany-personalausweis", "Germany", "Personalausweis", 35, 45, 32, 36, "#F2F2F2"],
  ["france-ants-epermis", "France", "ePhoto ANTS / Permis", 35, 45, 32, 36, "#E8EEF5"],
  ["uk-driving-license", "United Kingdom", "DVLA Driving License", 35, 45, 29, 34, "#ECECEC"],
  ["uk-digital-passport-code", "United Kingdom", "HMPO Digital Upload", 50.8, 63.5, 34, 45, "#ECECEC"],
  ["us-green-card-uscis", "United States", "USCIS Green Card / I-485", 50.8, 50.8, 25, 35, "#FFFFFF"],
  ["us-global-entry-photo", "United States", "Global Entry / TSA", 50.8, 50.8, 25, 35, "#FFFFFF"],
  ["canada-visa-pr-35x45", "Canada", "Temporary Resident Visa", 35, 45, 31, 36, "#FFFFFF"],
  ["canada-citizenship-50x70", "Canada", "Citizenship Application", 50, 70, 31, 36, "#FFFFFF"],
  ["spain-dni-photo", "Spain", "DNI Electrónico", 26, 32, 22, 26, "#FFFFFF"],
  ["italy-carta-identita", "Italy", "Carta d'Identità CIE", 35, 45, 31, 36, "#FFFFFF"],
  ["portugal-cartao-cidadao", "Portugal", "Cartão de Cidadão", 35, 45, 31, 36, "#FFFFFF"],
  ["greece-passport-40x60", "Greece", "Biometric Passport", 40, 60, 32, 36, "#FFFFFF"],
  ["finland-passport-36x47", "Finland", "Passport & Police ID", 36, 47, 32, 36, "#F4F4F4"],
  ["czechia-passport-35x45", "Czechia", "Passport & Občanský Průkaz", 35, 45, 31, 36, "#FFFFFF"],
  ["hungary-passport-35x45", "Hungary", "Biometric Passport", 35, 45, 31, 36, "#FFFFFF"],
  ["romania-passport-35x45", "Romania", "Passport & Visa", 35, 45, 32, 36, "#FFFFFF"],
  ["bulgaria-passport-35x45", "Bulgaria", "Biometric Passport", 35, 45, 31, 36, "#FFFFFF"],
  ["croatia-passport-35x45", "Croatia", "Putovnica & Osobna", 35, 45, 31, 36, "#FFFFFF"],
  ["luxembourg-passport-35x45", "Luxembourg", "Passport & eID", 35, 45, 31, 36, "#FFFFFF"],
  ["iceland-passport-35x45", "Iceland", "Passport Photo", 35, 45, 31, 36, "#FFFFFF"],
  ["russia-passport-35x45", "Russia", "International Passport", 35, 45, 32, 36, "#FFFFFF"],
  ["ukraine-passport-35x45", "Ukraine", "Biometric Passport", 35, 45, 31, 36, "#FFFFFF"],
  ["serbia-passport-50x50", "Serbia", "Biometric Passport", 50, 50, 28, 35, "#FFFFFF"],
  ["morocco-passport-35x45", "Morocco", "CIN & Passport", 35, 45, 31, 36, "#ECECEC"],
  ["tunisia-passport-35x45", "Tunisia", "Passport Photo", 35, 45, 31, 36, "#FFFFFF"],
  ["egypt-passport-40x60", "Egypt", "Passport & Visa", 40, 60, 32, 36, "#FFFFFF"],
  ["nigeria-passport-35x45", "Nigeria", "e-Passport Photo", 35, 45, 29, 35, "#FFFFFF"],
  ["kenya-evisa-51x51", "Kenya", "eTA / Passport", 50.8, 50.8, 25, 35, "#FFFFFF"],
  ["saudi-arabia-visa-51x51", "Saudi Arabia", "eVisa & Iqama", 50.8, 50.8, 25, 35, "#FFFFFF"],
  ["qatar-passport-38x48", "Qatar", "Visa & ID Card", 38, 48, 30, 35, "#FFFFFF"],
  ["israel-passport-35x45", "Israel", "Biometric Passport", 35, 45, 31, 36, "#FFFFFF"],
  ["india-oci-visa-51x51", "India", "e-Visa & OCI Upload", 50.8, 50.8, 25, 35, "#FFFFFF"],
  ["india-pancard-25x35", "India", "PAN Card Official Form", 25, 35, 20, 25, "#FFFFFF"],
  ["pakistan-nadra-35x45", "Pakistan", "NADRA NICOP & Passport", 35, 45, 31, 36, "#FFFFFF"],
  ["bangladesh-passport-45x55", "Bangladesh", "e-Passport Photo", 45, 55, 32, 36, "#FFFFFF"],
  ["vietnam-visa-40x60", "Vietnam", "e-Visa & Passport", 40, 60, 32, 36, "#FFFFFF"],
  ["thailand-visa-35x45", "Thailand", "Visa & Passport", 35, 45, 31, 36, "#FFFFFF"],
  ["indonesia-passport-35x45", "Indonesia", "Visa & Paspor", 35, 45, 30, 35, "#FFFFFF"],
  ["taiwan-passport-35x45", "Taiwan", "Passport & eID", 35, 45, 32, 36, "#FFFFFF"],
  ["japan-mynumber-35x45", "Japan", "MyNumber & Residence Card", 35, 45, 32, 36, "#FFFFFF"],
  ["japan-visa-45x45", "Japan", "Entry Visa Application", 45, 45, 31, 35, "#FFFFFF"],
  ["china-passport-33x48", "China", "Chinese Biometric Passport", 33, 48, 28, 33, "#FFFFFF"],
  ["korea-visa-35x45", "South Korea", "K-ETA & Visa Photo", 35, 45, 32, 36, "#FFFFFF"],
  ["argentina-passport-40x40", "Argentina", "Pasaporte & DNI", 40, 40, 28, 32, "#FFFFFF"],
  ["colombia-visa-30x40", "Colombia", "Visa Digital 3x4 cm", 30, 40, 25, 30, "#FFFFFF"],
  ["chile-passport-45x45", "Chile", "Pasaporte & Cédula", 45, 45, 30, 35, "#FFFFFF"],
  ["peru-passport-35x45", "Peru", "Pasaporte Biométrico", 35, 45, 31, 36, "#FFFFFF"],
  ["schengen-blue-card-35x45", "European Union", "EU Blue Card Residence", 35, 45, 32, 36, "#FFFFFF"],
  ["international-driving-permit-35x45", "Global", "IDP International Driving Permit", 35, 45, 31, 36, "#FFFFFF"],
  ["isic-student-card-28x35", "Global", "ISIC Student ID Card", 28, 35, 22, 26, "#FFFFFF"],
  ["baby-infant-passport-35x45", "European Union", "Infant & Newborn Passport", 35, 45, 29, 36, "#FFFFFF"],
  ["gun-hunting-permit-35x45", "Belgium & France", "Sporting Permit ID 35x45", 35, 45, 31, 36, "#FFFFFF"],
];

async function main() {
  const airlinesPath = path.join(DATA_DIR, "airlines.json");
  const scrMatPath = path.join(DATA_DIR, "screens_and_mattresses.json");
  const holAveryPath = path.join(DATA_DIR, "holidays_and_avery.json");
  const extPath = path.join(DATA_DIR, "extended_footwear_photo.json");

  const airlines = JSON.parse(fs.readFileSync(airlinesPath, "utf8"));
  const scrMat = JSON.parse(fs.readFileSync(scrMatPath, "utf8"));
  const holAvery = JSON.parse(fs.readFileSync(holAveryPath, "utf8"));
  const ext = JSON.parse(fs.readFileSync(extPath, "utf8"));

  // Optional fast Ollama verification note enrichment on subset of airlines
  const ollamaBatch = await askOllamaNoteEnrichment(
    "airline cabin baggage policies",
    EXTRA_AIRLINES.slice(0, 8).map((a) => ({ slug: slug(`${a.name} carry-on size`), name: a.name }))
  );

  // Merge airlines cleanly without touching existing 34
  const seenAir = new Set(airlines.map((a) => a.slug));
  for (const extra of EXTRA_AIRLINES) {
    const s = slug(`${extra.name} carry-on size`);
    if (seenAir.has(s)) continue;
    seenAir.add(s);
    const enriched = ollamaBatch.notes[s];
    airlines.push({
      carryOnCm: extra.carryOnCm,
      carryOnWeightKg: extra.carryOnWeightKg,
      iata: extra.iata,
      name: extra.name,
      overheadFree: extra.overheadFree,
      personalIncluded: extra.personalIncluded,
      personalItemCm: extra.personalItemCm,
      policyNote: cleanNote(enriched, extra.policyNote),
      region: extra.region,
      slug: s,
    });
  }

  // Merge screens & mattresses cleanly
  const seenScreens = new Set(scrMat.screens.map((s) => s.id));
  for (const s of EXTRA_SCREENS) {
    if (!seenScreens.has(s.id)) {
      seenScreens.add(s.id);
      scrMat.screens.push(s);
    }
  }
  const seenMattresses = new Set(scrMat.mattresses.map((m) => m.id));
  for (const m of EXTRA_MATTRESSES) {
    if (!seenMattresses.has(m.id)) {
      seenMattresses.add(m.id);
      scrMat.mattresses.push(m);
    }
  }

  // Merge Avery/Herma labels & Holiday countries
  const seenAvery = new Set(holAvery.avery.map((a) => a.code));
  for (const av of EXTRA_AVERY) {
    if (!seenAvery.has(av.code)) {
      seenAvery.add(av.code);
      holAvery.avery.push(av);
    }
  }
  for (const [cc, rows] of Object.entries(EXTRA_HOLIDAYS)) {
    if (!holAvery.holidays[cc]) {
      holAvery.holidays[cc] = rows;
    }
  }

  // Merge extended footwear brands & biometric photo specs
  const seenShoes = new Set(ext.extraShoeBrands.map((b) => b.slug));
  for (const b of NEW_SHOE_BRANDS) {
    if (!seenShoes.has(b.slug)) {
      seenShoes.add(b.slug);
      ext.extraShoeBrands.push(b);
    }
  }
  const seenPhotos = new Set(ext.extraPhotoSpecs.map((p) => p.slug));
  for (const row of NEW_PHOTO_SPECS) {
    const [pSlug, country, documentType, widthMm, heightMm, minHeadMm, maxHeadMm, backgroundHex] = row;
    if (seenPhotos.has(pSlug)) continue;
    seenPhotos.add(pSlug);
    ext.extraPhotoSpecs.push({
      backgroundHex,
      country,
      documentType,
      eyeLineFromBottomMaxRatio: 0.68,
      eyeLineFromBottomMinRatio: 0.55,
      heightMm,
      maxHeadMm,
      minHeadMm,
      notes: `${widthMm}×${heightMm} mm official ${country} ${documentType} framing.`,
      slug: pSlug,
      widthMm,
    });
  }

  const airSealed = sealDataset(airlines);
  const scrMatSealed = sealDataset(scrMat);
  const holAverySealed = sealDataset(holAvery);
  const extSealed = sealDataset(ext);

  fs.writeFileSync(airlinesPath, JSON.stringify(airSealed.canonicalJson, null, 2), "utf8");
  fs.writeFileSync(scrMatPath, JSON.stringify(scrMatSealed.canonicalJson, null, 2), "utf8");
  fs.writeFileSync(holAveryPath, JSON.stringify(holAverySealed.canonicalJson, null, 2), "utf8");
  fs.writeFileSync(extPath, JSON.stringify(extSealed.canonicalJson, null, 2), "utf8");

  const receipt = {
    schema: "scaleandfit.synthesis.v2",
    model: MODEL,
    deepcoderModule: DEEPCODER_PATH,
    generatedAt: new Date().toISOString(),
    batches: {
      airlines: {
        count: airlines.length,
        elapsedMs: ollamaBatch.elapsedMs,
        ollamaFallback: ollamaBatch.fallback,
        sha256: airSealed.digest,
      },
      screensAndMattresses: {
        screens: scrMat.screens.length,
        mattresses: scrMat.mattresses.length,
        sha256: scrMatSealed.digest,
      },
      holidaysAndAvery: {
        countries: Object.keys(holAvery.holidays).length,
        totalHolidays: Object.values(holAvery.holidays).reduce((acc, arr) => acc + arr.length, 0),
        averyTemplates: holAvery.avery.length,
        sha256: holAverySealed.digest,
      },
      extendedFootwearPhoto: {
        extraShoes: ext.extraShoeBrands.length,
        extraPhotos: ext.extraPhotoSpecs.length,
        sha256: extSealed.digest,
      },
    },
    deepcoderSynthesisOk: true,
    deepcoderPipeline: ["slugify", "canonicalizeJson", "sha256Hex"],
  };
  fs.writeFileSync(path.join(DATA_DIR, "synthesis-receipt.json"), JSON.stringify(receipt, null, 2), "utf8");

  await unloadOllama();
  console.log(
    `[expand-wave1] Sealed airlines=${airlines.length}, screens=${scrMat.screens.length}, mattresses=${scrMat.mattresses.length}, avery=${holAvery.avery.length}, holidays=${Object.keys(holAvery.holidays).length}, extraShoes=${ext.extraShoeBrands.length}, extraPhotos=${ext.extraPhotoSpecs.length}`
  );
}

await main();
