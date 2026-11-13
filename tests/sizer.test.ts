import { describe, expect, it } from "vitest";
import {
  AIRLINE_FLEET,
  DISPLAY_PRESETS,
  MATTRESS_PRESETS,
  compareDisplays,
  compareMattresses,
  computeDisplayDimensions,
  evaluateBagAgainstAirline,
  evaluateBagFleet,
} from "../src/sizer/index.js";

describe("Visual Sizer Geometry & Airline Fit Engine", () => {
  it("computes accurate 16:9 TV dimensions and +39.7% area delta for 65 vs 55 inch", () => {
    const d55 = computeDisplayDimensions({ label: '55" TV', diagonalIn: 55, aspectW: 16, aspectH: 9 });
    const d65 = computeDisplayDimensions({ label: '65" TV', diagonalIn: 65, aspectW: 16, aspectH: 9 });
    expect(d55.widthCm).toBeCloseTo(121.76, 1);
    expect(d55.heightCm).toBeCloseTo(68.49, 1);
    const cmp = compareDisplays(d55, d65);
    expect(cmp.areaDeltaPercent).toBeCloseTo(39.67, 1);
    expect(cmp.widthDiffCm).toBeGreaterThan(20);
  });

  it("compares mattresses accurately", () => {
    const queen = MATTRESS_PRESETS.find((m) => m.id.includes("us-queen"));
    const king = MATTRESS_PRESETS.find((m) => m.id.includes("us-king"));
    expect(queen).toBeDefined();
    expect(king).toBeDefined();
    const cmp = compareMattresses(queen!, king!);
    expect(cmp.widthDiffCm).toBeCloseTo(40.6, 1);
    expect(cmp.areaDeltaPercent).toBeGreaterThan(25);
  });

  it("loads 20+ displays and 30+ synthesized airlines cleanly", () => {
    expect(DISPLAY_PRESETS.length).toBeGreaterThanOrEqual(20);
    expect(AIRLINE_FLEET.length).toBeGreaterThanOrEqual(30);
    const smallPersonalBag: [number, number, number] = [38, 25, 18];
    const results = evaluateBagFleet(smallPersonalBag, 6, AIRLINE_FLEET);
    expect(results.every((r) => r.fitsCarryOn)).toBe(true);
    const oversized: [number, number, number] = [64, 46, 28];
    const ryanair = AIRLINE_FLEET.find((a) => a.iata === "FR")!;
    expect(evaluateBagAgainstAirline(oversized, 8, ryanair).verdict).toBe("TOO_LARGE");
  });
});
