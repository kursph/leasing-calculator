import {
  calculateGIK,
  calculateNominalRate,
  calculateFullAmortizationPayment,
  calculatePartialAmortizationPayment,
  validateTermMonths,
  validateAdvancePayment,
  validateOwnContribution,
  calculateContractStampDuty,
} from '../../src/engine/LeasingEngine';

describe('calculateGIK', () => {
  it('sums all components correctly', () => {
    const result = calculateGIK({
      netPurchasePrice: 28000,
      sideCostsActivatable: 500,
      nova: 1200,
      novaRefund: 200,
      nonActivatableCosts: 300,
    });
    expect(result).toBe(29800);
  });

  it('net NoVA = nova - novaRefund', () => {
    const result = calculateGIK({
      netPurchasePrice: 20000,
      sideCostsActivatable: 0,
      nova: 1000,
      novaRefund: 166.7,
    });
    expect(result).toBeCloseTo(20833.3, 1);
  });

  it('nonActivatableCosts defaults to 0', () => {
    const result = calculateGIK({
      netPurchasePrice: 10000,
      sideCostsActivatable: 0,
      nova: 0,
      novaRefund: 0,
    });
    expect(result).toBe(10000);
  });
});

describe('calculateNominalRate', () => {
  it('sums all rate components', () => {
    const rate = calculateNominalRate({
      euriborBase: 0.039,
      liquidityCost: 0.005,
      fundingCost: 0.003,
      capitalCost: 0.004,
      riskPremium: 0.003,
      processCost: 0.002,
      lenderMargin: 0.015,
    });
    expect(rate).toBeCloseTo(0.071, 3);
  });

  it('lenderMargin isolated contributes correctly', () => {
    const withMargin = calculateNominalRate({
      euriborBase: 0.03,
      liquidityCost: 0,
      fundingCost: 0,
      capitalCost: 0,
      riskPremium: 0,
      processCost: 0,
      lenderMargin: 0.02,
    });
    expect(withMargin).toBeCloseTo(0.05, 4);
  });
});

describe('calculateFullAmortizationPayment', () => {
  it('returns positive monthly payment', () => {
    const payment = calculateFullAmortizationPayment(25000, 48, 0.071);
    expect(payment).toBeGreaterThan(0);
  });

  it('longer term = lower payment (all else equal)', () => {
    const short = calculateFullAmortizationPayment(25000, 36, 0.071);
    const long = calculateFullAmortizationPayment(25000, 60, 0.071);
    expect(short).toBeGreaterThan(long);
  });

  it('rounds to 2 decimal places', () => {
    const payment = calculateFullAmortizationPayment(25000, 48, 0.071);
    expect(payment).toBe(parseFloat(payment.toFixed(2)));
  });
});

describe('calculatePartialAmortizationPayment', () => {
  it('residual reduces monthly payment vs full amortization', () => {
    const full = calculateFullAmortizationPayment(25000, 48, 0.071);
    const partial = calculatePartialAmortizationPayment(25000, 5000, 48, 0.071);
    expect(partial).toBeLessThan(full);
  });

  it('residual=0 equals full amortization payment', () => {
    const full = calculateFullAmortizationPayment(25000, 48, 0.071);
    const partial = calculatePartialAmortizationPayment(25000, 0, 48, 0.071);
    expect(partial).toBeCloseTo(full, 1);
  });
});

describe('validateTermMonths', () => {
  it('accepts valid term within range', () => {
    expect(validateTermMonths(48, 96)).toBeNull();
  });

  it('rejects term exceeding 90% of useful life', () => {
    expect(validateTermMonths(90, 96)).not.toBeNull(); // 90 > 86.4
  });

  it('rejects term below 40% of useful life (Vollamortisation)', () => {
    expect(validateTermMonths(30, 96)).not.toBeNull(); // 30 < 38.4
  });

  it('accepts exactly at max boundary', () => {
    expect(validateTermMonths(86, 96)).toBeNull(); // floor(96*0.9)=86
  });
});

describe('validateAdvancePayment', () => {
  it('rejects advance exceeding 30% of net price', () => {
    expect(validateAdvancePayment(9001, 30000)).not.toBeNull();
  });

  it('accepts advance at 30% of net price', () => {
    expect(validateAdvancePayment(9000, 30000)).toBeNull();
  });
});

describe('validateOwnContribution', () => {
  it('rejects combined contribution above 50%', () => {
    expect(validateOwnContribution(8000, 5000, 2001, 30000)).not.toBeNull();
  });

  it('accepts combined contribution at 50%', () => {
    expect(validateOwnContribution(8000, 5000, 2000, 30000)).toBeNull();
  });
});

describe('calculateContractStampDuty', () => {
  it('fixed term: 1% of total payments', () => {
    const duty = calculateContractStampDuty(24000, true);
    expect(duty).toBe(240);
  });

  it('open term: 1% × 36 × monthly rate', () => {
    const duty = calculateContractStampDuty(0, false, 500);
    expect(duty).toBe(180);
  });
});
