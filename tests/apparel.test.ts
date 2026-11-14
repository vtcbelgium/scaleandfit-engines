import { describe, expect, it } from "vitest";
import {
  APPAREL_SIZE_MATRIX,
  convertDenimWaistInseam,
  matchApparelSizeByChestWaist,
} from "../src/apparel/index.js";

describe("International Apparel & Denim Sizing Matrix Engine", () => {
  it("matches men's and women's chest/waist measurements across US/EU/UK/JP", () => {
    expect(APPAREL_SIZE_MATRIX.length).toBe(12);

    const mensM = matchApparelSizeByChestWaist(100, 84, "mens");
    expect(mensM.alpha).toBe("M");
    expect(mensM.euNumeric).toBe(48);
    expect(mensM.usNumeric).toBe(38);

    const womensS = matchApparelSizeByChestWaist(86, 68, "womens");
    expect(womensS.alpha).toBe("S");
    expect(womensS.euNumeric).toBe(36);
    expect(womensS.ukNumeric).toBe(8);
  });

  it("converts W/L denim dimensions accurately", () => {
    const d = convertDenimWaistInseam(32, 32);
    expect(d.waistCm).toBeCloseTo(81.3, 1);
    expect(d.inseamCm).toBeCloseTo(81.3, 1);
    expect(d.euSize).toBe(48);
    expect(d.lengthClass).toBe("Regular");

    expect(convertDenimWaistInseam(30, 34).lengthClass).toBe("Long");
    expect(() => convertDenimWaistInseam(10, 32)).toThrow(RangeError);
  });
});
