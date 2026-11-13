// tests/footwear.test.ts
import { describe, it, expect } from 'vitest';
import { usToMondopointMm, convertShoeBetweenBrands } from '../src/footwear/shoes.js';
import { pixelsPerMmFromCardWidth, convertRingFromUsSize } from '../src/footwear/rings.js';

describe('Shoe Size Conversion', () => {
  it('converts shoe size between brands correctly', () => {
    const result = convertShoeBetweenBrands("nike", "converse", 10, "mens");
    expect(result.us).toBeLessThanOrEqual(10);
    expect(result.eu).toBeGreaterThanOrEqual(40);
    expect(result.uk).toBeGreaterThanOrEqual(5) && expect(result.uk).toBeLessThan(15);
  });
});

describe('Ring Size Conversion', () => {
  it('converts ring size from US size correctly', () => {
    const result = convertRingFromUsSize(9);
    expect(result.diameterMm).toBeCloseTo(18.95, 2);
    expect(result.circumferenceMm).toBeCloseTo(59.5, 1);
    expect(result.eu).toBe(60);
    expect(result.uk).not.toBe("");
  });
});
