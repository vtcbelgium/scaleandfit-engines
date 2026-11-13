// tests/photo.test.ts
import { describe, expect, it } from "vitest";
import { mmToPixelsAtDpi, computeHeadCropGuide, computePrintSheetLayout } from '../src/photo/layout.js';
import { getBiometricSpec } from '../src/photo/specs.js';

describe('Photo Layout', () => {
  it('mmToPixelsAtDpi', () => {
    expect(mmToPixelsAtDpi(50.8, 300)).toBe(600);
  });

  it('computeHeadCropGuide', () => {
    const spec = getBiometricSpec('us-passport-2x2');
    if (!spec) throw new Error('US Passport spec not found');
    const guide = computeHeadCropGuide(spec);
    expect(guide.idealHeadRatio).toBeCloseTo(0.5906, 1);
    expect(guide.eyeLineYRatioFromTop).toBeCloseTo(0.425, 1);
  });

  it('computePrintSheetLayout', () => {
    const spec = getBiometricSpec('us-passport-2x2');
    if (!spec) throw new Error('US Passport spec not found');
    const layout = computePrintSheetLayout(spec);
    expect(layout.count).toBeGreaterThanOrEqual(2);
  });

  it('computePrintSheetLayout for schengen-visa-35x45', () => {
    const spec = getBiometricSpec('schengen-visa-35x45');
    if (!spec) throw new Error('Schengen Visa spec not found');
    const layout = computePrintSheetLayout(spec);
    expect(layout.count).toBeGreaterThanOrEqual(6);
  });
});
