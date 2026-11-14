import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const airlines = JSON.parse(fs.readFileSync(path.join(ROOT, "data/airlines.json"), "utf8"));
const scrMat = JSON.parse(fs.readFileSync(path.join(ROOT, "data/screens_and_mattresses.json"), "utf8"));
const holAvery = JSON.parse(fs.readFileSync(path.join(ROOT, "data/holidays_and_avery.json"), "utf8"));
const extended = JSON.parse(fs.readFileSync(path.join(ROOT, "data/extended_footwear_photo.json"), "utf8"));

const sizerTs = `// Auto-generated from DeepCoder-sealed synthesis (data/airlines.json & data/screens_and_mattresses.json)
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
  IE: "Ireland",
  CH: "Switzerland",
  AT: "Austria",
  PT: "Portugal",
  PL: "Poland",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  JP: "Japan",
  MX: "Mexico",
};

const paperTs = `// Auto-generated from DeepCoder-sealed synthesis (data/holidays_and_avery.json)
import type { HolidayEntry } from "./calendars.js";
import type { AveryTemplateSpec } from "./avery.js";

export const HOLIDAY_COUNTRIES: Record<string, string> = ${JSON.stringify(countryNames, null, 2)};

export const PUBLIC_HOLIDAYS_2026_2027: Record<string, HolidayEntry[]> = ${JSON.stringify(holAvery.holidays, null, 2)};

export const AVERY_TEMPLATES: AveryTemplateSpec[] = ${JSON.stringify(holAvery.avery, null, 2)};
`;
fs.writeFileSync(path.join(ROOT, "src/paper/datasets.ts"), paperTs, "utf8");

const CORE_SHOE_BRANDS = [
  { slug: "nike", name: "Nike", offsetMm: 0, fitNote: "True to Brannock standard length; medium D width" },
  { slug: "adidas", name: "Adidas", offsetMm: 2, fitNote: "Runs slightly long; half UK step tighter than US" },
  { slug: "new-balance", name: "New Balance", offsetMm: 0, fitNote: "Consistent anatomical last with wide width options" },
  { slug: "hoka", name: "Hoka", offsetMm: -2, fitNote: "Snug midfoot rocker geometry; round up 0.5 size if between sizes" },
  { slug: "asics", name: "ASICS", offsetMm: -1, fitNote: "Slightly tapered toe box compared to New Balance" },
  { slug: "birkenstock", name: "Birkenstock", offsetMm: 4, fitNote: "Generous contoured cork footbed; size down for narrow fit" },
  { slug: "converse", name: "Converse", offsetMm: 5, fitNote: "Runs 0.5 size large; most buyers size down half a US size" },
  { slug: "vans", name: "Vans", offsetMm: 1, fitNote: "Classic vulcanized canvas fit; true to length" },
  { slug: "salomon", name: "Salomon", offsetMm: -2, fitNote: "Precision athletic trail wrap; snug heel lock" },
  { slug: "on-running", name: "On Running", offsetMm: -1, fitNote: "Swiss CloudTec last runs slightly compact" },
  { slug: "dr-martens", name: "Dr. Martens", offsetMm: 3, fitNote: "Structured leather boot last with generous toe room" },
  { slug: "crocs", name: "Crocs", offsetMm: 4, fitNote: "Relaxed roomy resin fit; whole sizes only" },
];

const seenShoe = new Set(CORE_SHOE_BRANDS.map((b) => b.slug));
const mergedBrands = [
  ...CORE_SHOE_BRANDS,
  ...(extended.extraShoeBrands || []).filter((b) => !seenShoe.has(b.slug)),
];

const shoesTs = `// src/footwear/shoes.ts (SHOE_BRANDS synchronized from DeepCoder-sealed data/extended_footwear_photo.json)
export type GenderFit = "mens" | "womens" | "unisex";

export interface ShoeBrandProfile {
  slug: string;
  name: string;
  offsetMm: number;
  fitNote: string;
}

export interface ConvertedShoeSize {
  brand: string;
  mondopointMm: number;
  us: number;
  uk: number;
  eu: number;
  fitNote: string;
}

export const SHOE_BRANDS: ShoeBrandProfile[] = ${JSON.stringify(mergedBrands, null, 2)};

export function roundHalf(val: number): number {
  return Math.round(val * 2) / 2;
}

export function usToMondopointMm(usSize: number, gender: GenderFit, brandOffsetMm = 0): number {
  if (gender === "mens" || gender === "unisex") {
    return Math.round((usSize + 18) * 10 + brandOffsetMm);
  } else if (gender === "womens") {
    return Math.round((usSize - 1.5 + 18) * 10 + brandOffsetMm);
  }
  throw new Error("Invalid gender fit");
}

export function mondopointToUs(mondopointMm: number, gender: GenderFit, brandOffsetMm = 0): number {
  if (gender === "mens" || gender === "unisex") {
    return roundHalf((mondopointMm - brandOffsetMm) / 10 - 18);
  } else if (gender === "womens") {
    return roundHalf((mondopointMm - brandOffsetMm) / 10 - 18 + 1.5);
  }
  throw new Error("Invalid gender fit");
}

export function mondopointToEu(mondopointMm: number): number {
  return Math.round(((mondopointMm + 15) / (20 / 3)) * 2) / 2;
}

export function mondopointToUk(mondopointMm: number, gender: GenderFit): number {
  return roundHalf(mondopointToUs(mondopointMm, gender, 0) - (gender === "womens" ? 2 : 1));
}

export function convertShoeBetweenBrands(fromBrandSlug: string, targetBrandSlug: string, usSize: number, gender: GenderFit): ConvertedShoeSize {
  const source = SHOE_BRANDS.find((brand) => brand.slug === fromBrandSlug);
  const target = SHOE_BRANDS.find((brand) => brand.slug === targetBrandSlug);
  if (!source || !target) {
    throw new Error("Unknown brand slug");
  }
  const mondopointMm = usToMondopointMm(usSize, gender, source.offsetMm);
  const us = mondopointToUs(mondopointMm, gender, target.offsetMm);
  const uk = mondopointToUk(mondopointMm, gender);
  const eu = mondopointToEu(mondopointMm);
  return {
    brand: target.name,
    mondopointMm,
    us,
    uk,
    eu,
    fitNote: target.fitNote,
  };
}
`;
fs.writeFileSync(path.join(ROOT, "src/footwear/shoes.ts"), shoesTs, "utf8");

const CORE_PHOTO_SPECS = [
  { slug: "us-passport-2x2", country: "United States", documentType: "Passport", widthMm: 50.8, heightMm: 50.8, minHeadMm: 25, maxHeadMm: 35, eyeLineFromBottomMinRatio: 0.56, eyeLineFromBottomMaxRatio: 0.69, backgroundHex: "#FFFFFF", notes: "2x2 inch square on uniform white #FFFFFF background." },
  { slug: "us-visa-ds160", country: "United States", documentType: "DS-160 Visa", widthMm: 50.8, heightMm: 50.8, minHeadMm: 25, maxHeadMm: 35, eyeLineFromBottomMinRatio: 0.56, eyeLineFromBottomMaxRatio: 0.69, backgroundHex: "#FFFFFF", maxFileSizeKb: 240, notes: "600x600 px digital upload under 240 KB on plain white background." },
  { slug: "schengen-visa-35x45", country: "Schengen Area", documentType: "Visa", widthMm: 35, heightMm: 45, minHeadMm: 32, maxHeadMm: 36, eyeLineFromBottomMinRatio: 0.55, eyeLineFromBottomMaxRatio: 0.68, backgroundHex: "#F4F4F4", notes: "Standard 35x45 mm EU Schengen biometric framing with neutral expression." },
  { slug: "belgium-passport-eid", country: "Belgium", documentType: "Passport & eID", widthMm: 35, heightMm: 45, minHeadMm: 31, maxHeadMm: 36, eyeLineFromBottomMinRatio: 0.55, eyeLineFromBottomMaxRatio: 0.68, backgroundHex: "#FFFFFF", notes: "Belgian biometric passport & eID standard on plain uniform white background." },
  { slug: "netherlands-pasfoto", country: "Netherlands", documentType: "Pasfoto Passport/ID", widthMm: 35, heightMm: 45, minHeadMm: 26, maxHeadMm: 30, eyeLineFromBottomMinRatio: 0.54, eyeLineFromBottomMaxRatio: 0.67, backgroundHex: "#F2F2F2", notes: "Strict Dutch Pasfoto ear-to-ear centered pose with neutral expression." },
  { slug: "germany-biometric-passport", country: "Germany", documentType: "Reisepass", widthMm: 35, heightMm: 45, minHeadMm: 32, maxHeadMm: 36, eyeLineFromBottomMinRatio: 0.56, eyeLineFromBottomMaxRatio: 0.68, backgroundHex: "#F2F2F2", notes: "German Schablone biometric mask proportions." },
  { slug: "france-passport-cni", country: "France", documentType: "Passeport & CNI", widthMm: 35, heightMm: 45, minHeadMm: 32, maxHeadMm: 36, eyeLineFromBottomMinRatio: 0.55, eyeLineFromBottomMaxRatio: 0.68, backgroundHex: "#E8EEF5", notes: "Light uniform off-white or pale grey-blue background, neutral mouth." },
  { slug: "uk-passport-35x45", country: "United Kingdom", documentType: "Passport", widthMm: 35, heightMm: 45, minHeadMm: 29, maxHeadMm: 34, eyeLineFromBottomMinRatio: 0.55, eyeLineFromBottomMaxRatio: 0.68, backgroundHex: "#ECECEC", notes: "Plain light grey or cream background with zero shadows." },
  { slug: "canada-passport-50x70", country: "Canada", documentType: "Passport", widthMm: 50, heightMm: 70, minHeadMm: 31, maxHeadMm: 36, eyeLineFromBottomMinRatio: 0.52, eyeLineFromBottomMaxRatio: 0.64, backgroundHex: "#FFFFFF", notes: "50x70 mm tall Canadian standard frame with visible shoulders." },
  { slug: "australia-passport-35x45", country: "Australia", documentType: "Passport", widthMm: 35, heightMm: 45, minHeadMm: 32, maxHeadMm: 36, eyeLineFromBottomMinRatio: 0.55, eyeLineFromBottomMaxRatio: 0.68, backgroundHex: "#FFFFFF", notes: "Plain white/light grey background showing full chin to crown." },
  { slug: "india-passport-2x2", country: "India", documentType: "Passport", widthMm: 50.8, heightMm: 50.8, minHeadMm: 25, maxHeadMm: 35, eyeLineFromBottomMinRatio: 0.55, eyeLineFromBottomMaxRatio: 0.68, backgroundHex: "#FFFFFF", notes: "2x2 inch (51x51 mm) square plain white backdrop." },
  { slug: "china-visa-33x48", country: "China", documentType: "Visa", widthMm: 33, heightMm: 48, minHeadMm: 28, maxHeadMm: 33, eyeLineFromBottomMinRatio: 0.55, eyeLineFromBottomMaxRatio: 0.68, backgroundHex: "#FFFFFF", notes: "Strict 33x48 mm narrow frame with exposed ears on white backdrop." },
  { slug: "japan-passport-35x45", country: "Japan", documentType: "Passport", widthMm: 35, heightMm: 45, minHeadMm: 32, maxHeadMm: 36, eyeLineFromBottomMinRatio: 0.55, eyeLineFromBottomMaxRatio: 0.68, backgroundHex: "#FFFFFF", notes: "35x45 mm borderless plain white/off-white background." },
  { slug: "turkey-biometric-50x60", country: "Turkey", documentType: "Biometric Passport", widthMm: 50, heightMm: 60, minHeadMm: 32, maxHeadMm: 36, eyeLineFromBottomMinRatio: 0.53, eyeLineFromBottomMaxRatio: 0.66, backgroundHex: "#FFFFFF", notes: "50x60 mm Turkish ICAO standard on pure white background." },
  { slug: "linkedin-headshot-square", country: "Global", documentType: "CV Headshot", widthMm: 100, heightMm: 100, minHeadMm: 48, maxHeadMm: 72, eyeLineFromBottomMinRatio: 0.52, eyeLineFromBottomMaxRatio: 0.66, backgroundHex: "#F8FAFC", notes: "High-resolution 300-DPI square studio headshot crop." },
];

const seenPhoto = new Set(CORE_PHOTO_SPECS.map((p) => p.slug));
const mergedPhotos = [
  ...CORE_PHOTO_SPECS,
  ...(extended.extraPhotoSpecs || []).filter((p) => !seenPhoto.has(p.slug)),
];

const specsTs = `// src/photo/specs.ts (BIOMETRIC_PHOTO_SPECS synchronized from DeepCoder-sealed data/extended_footwear_photo.json)
export interface BiometricPhotoSpec {
  slug: string;
  country: string;
  documentType: string;
  widthMm: number;
  heightMm: number;
  minHeadMm: number;
  maxHeadMm: number;
  eyeLineFromBottomMinRatio: number;
  eyeLineFromBottomMaxRatio: number;
  backgroundHex: string;
  maxFileSizeKb?: number;
  notes: string;
}

const SLUG_ALIASES: Record<string, string> = {
  "us-passport-photo-2x2": "us-passport-2x2",
  "schengen-visa-photo-35x45": "schengen-visa-35x45",
};

export const BIOMETRIC_PHOTO_SPECS: BiometricPhotoSpec[] = ${JSON.stringify(mergedPhotos, null, 2)};

export function getBiometricSpec(slug: string): BiometricPhotoSpec | undefined {
  const canonical = SLUG_ALIASES[slug] || slug;
  return BIOMETRIC_PHOTO_SPECS.find((spec) => spec.slug === canonical);
}
`;
fs.writeFileSync(path.join(ROOT, "src/photo/specs.ts"), specsTs, "utf8");

console.log("Generated sizer/datasets.ts, paper/datasets.ts, footwear/shoes.ts, and photo/specs.ts cleanly.");
