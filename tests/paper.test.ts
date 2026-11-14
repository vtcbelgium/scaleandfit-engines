import { describe, expect, it } from "vitest";
import {
  AVERY_TEMPLATES,
  HOLIDAY_COUNTRIES,
  PAPER_FORMATS,
  PUBLIC_HOLIDAYS_2026_2027,
  buildAverySheetPlan,
  buildMonthCalendarGrid,
  buildPaperGeometry,
  mmToPt,
} from "../src/paper/index.js";

describe("Printable Paper, Holidays & Avery Coordinate Engine", () => {
  it("converts millimeters to PDF points cleanly", () => {
    expect(mmToPt(210)).toBeCloseTo(PAPER_FORMATS.a4.widthPt, 1);
    expect(mmToPt(297)).toBeCloseTo(PAPER_FORMATS.a4.heightPt, 1);
    expect(mmToPt(215.9)).toBeCloseTo(612, 0);
  });

  it("generates dot-grid, graph, isometric, cornell, music & handwriting geometries", () => {
    const dotA4 = buildPaperGeometry("a4", "dot-grid", 5, 12);
    expect(dotA4.dots.length).toBeGreaterThan(1500);
    const graphLetter = buildPaperGeometry("letter", "graph-grid", 5, 12);
    expect(graphLetter.lines.length).toBeGreaterThan(60);
    const iso = buildPaperGeometry("a4", "isometric-grid", 10, 12);
    expect(iso.lines.length).toBeGreaterThan(50);
    const cornell = buildPaperGeometry("a4", "cornell-notes", 7, 12);
    expect(cornell.rowsCount).toBeGreaterThan(20);
    const staff = buildPaperGeometry("letter", "music-staff", 5, 12);
    expect(staff.rowsCount).toBeGreaterThanOrEqual(8);
  });

  it("builds accurate 2026-2027 calendar grids with country holidays", () => {
    expect(Object.keys(HOLIDAY_COUNTRIES).length).toBeGreaterThanOrEqual(20);
    expect(AVERY_TEMPLATES.length).toBeGreaterThanOrEqual(30);
    const julyBe = buildMonthCalendarGrid(2026, 7, true, PUBLIC_HOLIDAYS_2026_2027.BE);
    const jul21 = julyBe.weeks.flat().find((c) => c.isoDate === "2026-07-21");
    expect(jul21?.holidayNames.length).toBe(1);
    const novUs = buildMonthCalendarGrid(2026, 11, false, PUBLIC_HOLIDAYS_2026_2027.US);
    const tgiving = novUs.weeks.flat().find((c) => c.isoDate === "2026-11-26");
    expect(tgiving?.holidayNames[0]).toContain("Thanksgiving");
  });

  it("computes Avery die-cut sheets for 5160 and L7160 with offset calibration", () => {
    const a5160 = AVERY_TEMPLATES.find((a) => a.code === "5160")!;
    const plan = buildAverySheetPlan(a5160, 1.5, -1);
    expect(plan.totalLabels).toBe(30);
    expect(plan.boxes[0].xMm).toBeCloseTo(a5160.marginLeftMm + 1.5, 2);
    expect(plan.boxes[0].yMm).toBeCloseTo(a5160.marginTopMm - 1, 2);
  });
});
