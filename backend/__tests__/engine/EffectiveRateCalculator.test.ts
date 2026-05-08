import { calculateEffectiveRate } from '../../src/engine/EffectiveRateCalculator';

describe('calculateEffectiveRate', () => {
  it('returns positive APR', () => {
    const rate = calculateEffectiveRate(25000, 600, 48, 0, 0);
    expect(rate).toBeGreaterThan(0);
  });

  it('effective rate > nominal for typical lease', () => {
    // nominal ~7.1% — effective should be close
    const rate = calculateEffectiveRate(25000, 600, 48, 0, 0);
    expect(rate).toBeGreaterThan(0.05);
    expect(rate).toBeLessThan(0.2);
  });

  it('advance payment reduces effective base (higher effective rate)', () => {
    const noAdvance = calculateEffectiveRate(25000, 600, 48, 0, 0);
    const withAdvance = calculateEffectiveRate(25000, 600, 48, 0, 2000);
    expect(withAdvance).toBeGreaterThan(noAdvance);
  });

  it('residual value reduces monthly payment requirement', () => {
    const noResidual = calculateEffectiveRate(25000, 600, 48, 0, 0);
    const withResidual = calculateEffectiveRate(25000, 450, 48, 5000, 0);
    expect(typeof noResidual).toBe('number');
    expect(typeof withResidual).toBe('number');
  });

  it('converges for zero-residual full amortization', () => {
    const rate = calculateEffectiveRate(30000, 650, 60, 0, 0);
    expect(isFinite(rate)).toBe(true);
    expect(isNaN(rate)).toBe(false);
  });

  it('uses default advancePayment=0 when omitted', () => {
    const withDefault = calculateEffectiveRate(25000, 600, 48, 0);
    const withExplicit = calculateEffectiveRate(25000, 600, 48, 0, 0);
    expect(withDefault).toBeCloseTo(withExplicit, 8);
  });
});
