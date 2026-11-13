import { describe, expect, it } from "vitest";
import { ENGINES_VERSION, SCALEANDFIT_SUITES } from "../src/index.js";

describe("scaleandfit-engines scaffold", () => {
  it("exports version and all 4 suite identifiers", () => {
    expect(ENGINES_VERSION).toBe("1.0.0");
    expect(SCALEANDFIT_SUITES).toHaveLength(4);
  });
});
