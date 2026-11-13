import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const airlines = JSON.parse(fs.readFileSync(path.join(ROOT, "data/airlines.json"), "utf8"));
const scrMat = JSON.parse(fs.readFileSync(path.join(ROOT, "data/screens_and_mattresses.json"), "utf8"));
const holAvery = JSON.parse(fs.readFileSync(path.join(ROOT, "data/holidays_and_avery.json"), "utf8"));

const sizerTs = `// Auto-generated from DeepCoder-sealed Ollama synthesis (data/airlines.json & data/screens_and_mattresses.json)
import type { AirlineBaggageSpec } from "./airlines.js";
import type { DisplayInput, MattressSpec } from "./geometry.js";

export const DISPLAY_PRESETS: Array<DisplayInput & { id: string }> = ${JSON.stringify(scrMat.screens, null, 2)};

export const MATTRESS_PRESETS: MattressSpec[] = ${JSON.stringify(scrMat.mattresses, null, 2)};

export const AIRLINE_FLEET: AirlineBaggageSpec[] = ${JSON.stringify(airlines, null, 2)};
`;

fs.writeFileSync(path.join(ROOT, "src/sizer/datasets.ts"), sizerTs, "utf8");

const countryNames = {
  US: "United States",
  GB: "United Kingdom",
  BE: "Belgium",
  NL: "Netherlands",
  DE: "Germany",
  FR: "France",
  CA: "Canada",
  AU: "Australia",
  ES: "Spain",
  IT: "Italy",
};

const paperTs = `// Auto-generated from DeepCoder-sealed synthesis (data/holidays_and_avery.json)
import type { HolidayEntry } from "./calendars.js";
import type { AveryTemplateSpec } from "./avery.js";

export const HOLIDAY_COUNTRIES: Record<string, string> = ${JSON.stringify(countryNames, null, 2)};

export const PUBLIC_HOLIDAYS_2026_2027: Record<string, HolidayEntry[]> = ${JSON.stringify(holAvery.holidays, null, 2)};

export const AVERY_TEMPLATES: AveryTemplateSpec[] = ${JSON.stringify(holAvery.avery, null, 2)};
`;

fs.writeFileSync(path.join(ROOT, "src/paper/datasets.ts"), paperTs, "utf8");
console.log("Generated src/sizer/datasets.ts and src/paper/datasets.ts cleanly.");
