import { describe, expect, it } from "vitest";
import {
  AIRLINE_FLEET,
  BIOMETRIC_PHOTO_SPECS,
  ENGINES_VERSION,
  SCALEANDFIT_SUITES,
  SHOE_BRANDS,
  computePrintSheetLayout,
  convertRingFromUsSize,
  getBiometricSpec,
} from "../src/index.js";

describe("scaleandfit-engines full 4-suite barrel exports", () => {
  it("exports version, 4 suite identifiers, and merged datasets", () => {
    expect(ENGINES_VERSION).toBe("1.0.0");
    expect(SCALEANDFIT_SUITES).toHaveLength(4);
    expect(AIRLINE_FLEET.length).toBeGreaterThanOrEqual(34);
    expect(SHOE_BRANDS).toHaveLength(24);
    expect(BIOMETRIC_PHOTO_SPECS).toHaveLength(36);
  });

  it("maps UK ring letters and photo slug aliases accurately", () => {
    expect(convertRingFromUsSize(6).uk).toBe("L");
    expect(convertRingFromUsSize(9).uk).toBe("R");
    expect(getBiometricSpec("us-passport-photo-2x2")?.slug).toBe("us-passport-2x2");
    expect(getBiometricSpec("schengen-visa-photo-35x45")?.slug).toBe("schengen-visa-35x45");

    const belgium = getBiometricSpec("belgium-passport-eid")!;
    const sheet = computePrintSheetLayout(belgium);
    expect(sheet.count).toBeGreaterThanOrEqual(6);
    for (const tile of sheet.placements) {
      expect(tile.xMm).toBeGreaterThanOrEqual(0);
      expect(tile.yMm).toBeGreaterThanOrEqual(0);
      expect(tile.xMm + tile.widthMm).toBeLessThanOrEqual(sheet.sheetWidthMm + 0.001);
      expect(tile.yMm + tile.heightMm).toBeLessThanOrEqual(sheet.sheetHeightMm + 0.001);
    }
  });
});
