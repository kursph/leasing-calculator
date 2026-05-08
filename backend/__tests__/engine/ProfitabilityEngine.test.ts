import { calculateProfitability } from '../../src/engine/ProfitabilityEngine';
import { generateSchedule } from '../../src/engine/AmortizationSchedule';

const makeContract = (overrides = {}) => {
  const gik = 25000;
  const monthlyPayment = 550;
  const termMonths = 48;
  const annualRate = 0.071;
  const schedule = generateSchedule(gik, monthlyPayment, termMonths, annualRate, 0);

  return {
    gik,
    monthlyPayment,
    termMonths,
    nominalRate: 0.071,
    euriborRate: 0.039,
    lenderMargin: 0.015,
    residualValue: 0,
    schedule,
    operatingCostConfig: 500,
    ...overrides,
  };
};

describe('calculateProfitability', () => {
  it('returns all required fields', () => {
    const result = calculateProfitability(makeContract());
    expect(result).toHaveProperty('totalPayments');
    expect(result).toHaveProperty('totalInterestIncome');
    expect(result).toHaveProperty('refinancingCost');
    expect(result).toHaveProperty('operatingCost');
    expect(result).toHaveProperty('contractFeeIncome');
    expect(result).toHaveProperty('residualValueIncome');
    expect(result).toHaveProperty('netMargin');
    expect(result).toHaveProperty('marginPct');
    expect(result).toHaveProperty('spread');
    expect(result).toHaveProperty('isProfit');
  });

  it('totalPayments = monthlyPayment × termMonths', () => {
    const contract = makeContract();
    const result = calculateProfitability(contract);
    expect(result.totalPayments).toBeCloseTo(contract.monthlyPayment * contract.termMonths, 1);
  });

  it('spread = nominalRate - euriborRate', () => {
    const contract = makeContract();
    const result = calculateProfitability(contract);
    expect(result.spread).toBeCloseTo(0.071 - 0.039, 4);
  });

  it('contractFeeIncome = 1% of totalPayments', () => {
    const result = calculateProfitability(makeContract());
    expect(result.contractFeeIncome).toBeCloseTo(result.totalPayments * 0.01, 1);
  });

  it('isProfit=true when profitable contract', () => {
    const result = calculateProfitability(makeContract());
    expect(result.isProfit).toBe(result.netMargin > 0);
  });

  it('marginPct = netMargin / gik * 100', () => {
    const contract = makeContract();
    const result = calculateProfitability(contract);
    expect(result.marginPct).toBeCloseTo((result.netMargin / contract.gik) * 100, 2);
  });

  it('higher lenderMargin = higher spread', () => {
    const low = calculateProfitability(makeContract({ lenderMargin: 0.01, nominalRate: 0.061 }));
    const high = calculateProfitability(makeContract({ lenderMargin: 0.03, nominalRate: 0.081 }));
    expect(high.spread).toBeGreaterThan(low.spread);
  });
});
