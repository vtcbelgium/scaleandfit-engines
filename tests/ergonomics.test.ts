import { describe, expect, it } from "vitest";
import { computeDeskErgonomics, computeDisplayErgonomics } from "../src/sizer/ergonomics.js";

describe("Display & Standing Desk Ergonomics Engine", () => {
  it("computes accurate viewing distances, VESA pattern, and arm torque for TVs and monitors", () => {
    const monitor27 = computeDisplayErgonomics(27, 16, 9, "monitor");
    expect(monitor27.recommendedVesa).toBe("100x100");
    expect(monitor27.idealViewingDistanceCm).toBeCloseTo(monitor27.widthCm * 1.866, 0);
    expect(monitor27.minArmTorqueNm).toBeGreaterThan(5);

    const tv65 = computeDisplayErgonomics(65, 16, 9, "tv");
    expect(tv65.recommendedVesa).toBe("400x400");
    expect(tv65.cinemaViewingDistanceCm).toBeLessThan(tv65.idealViewingDistanceCm);
    expect(tv65.minViewingDistanceCm).toBeCloseTo(tv65.widthCm * 1.2, 0);

    const tv98 = computeDisplayErgonomics(98, 16, 9, "tv");
    expect(tv98.recommendedVesa).toBe("600x400");
  });

  it("computes seated and standing desk ergonomics within anthropometric bounds", () => {
    const erg = computeDeskErgonomics(175);
    expect(erg.seatedChairHeightCm).toBeGreaterThanOrEqual(42);
    expect(erg.seatedDeskHeightCm).toBeGreaterThanOrEqual(70);
    expect(erg.standingDeskHeightCm).toBeGreaterThan(erg.seatedDeskHeightCm);
    expect(erg.standingMonitorTopCm).toBeGreaterThan(erg.standingDeskHeightCm);
    expect(() => computeDeskErgonomics(90)).toThrow(RangeError);
  });
});
