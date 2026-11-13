// src/footwear/rings.ts
export const CREDIT_CARD_WIDTH_MM = 85.6 as const;

export interface RingConversion {
  diameterMm: number;
  circumferenceMm: number;
  us: number;
  uk: string;
  eu: number;
  jp: number;
}

export function pixelsPerMmFromCardWidth(cardWidthPx: number): number {
  if (cardWidthPx <= 0) {
    throw new Error("Card width must be greater than 0");
  }
  return cardWidthPx / CREDIT_CARD_WIDTH_MM;
}

export function convertRingFromDiameterMm(diameterMm: number): RingConversion {
  if (diameterMm < 10 || diameterMm > 30) {
    throw new Error("Diameter must be between 10 and 30 mm");
  }
  const circumferenceMm = Number((Math.PI * diameterMm).toFixed(2));
  const us = Math.round(((diameterMm - 11.63) / 0.8128) * 2) / 2;
  const eu = Math.round(Math.PI * diameterMm);
  const jp = Math.max(1, Math.round((diameterMm - 12.67) / 0.333 + 1));
  const uk = ["S", "M", "L", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"][Math.floor(us) - 6] || "";
  return { diameterMm, circumferenceMm, us, uk, eu, jp };
}

export function convertRingFromUsSize(usSize: number): RingConversion {
  const diameterMm = 11.63 + usSize * 0.8128;
  return convertRingFromDiameterMm(diameterMm);
}
