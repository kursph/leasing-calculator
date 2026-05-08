import { generateSchedule } from '../../src/engine/AmortizationSchedule';

describe('generateSchedule', () => {
  const gik = 25000;
  const annualRate = 0.071;
  const term = 12;
  const residual = 0;

  it('generates correct number of rows', () => {
    const schedule = generateSchedule(gik, 2500, term, annualRate, residual);
    expect(schedule).toHaveLength(term);
  });

  it('periods are sequential from 1', () => {
    const schedule = generateSchedule(gik, 2500, term, annualRate, residual);
    schedule.forEach((row, i) => expect(row.period).toBe(i + 1));
  });

  it('all monetary values are numbers', () => {
    const schedule = generateSchedule(gik, 2500, term, annualRate, residual);
    for (const row of schedule) {
      expect(typeof row.payment).toBe('number');
      expect(typeof row.interest).toBe('number');
      expect(typeof row.principal).toBe('number');
      expect(typeof row.capitalAfterPayment).toBe('number');
      expect(typeof row.capitalAtPeriodEnd).toBe('number');
    }
  });

  it('payment = interest + principal (within rounding)', () => {
    const schedule = generateSchedule(gik, 2500, term, annualRate, residual);
    for (const row of schedule) {
      expect(row.interest + row.principal).toBeCloseTo(row.payment, 1);
    }
  });

  it('capital decreases over time for full amortization', () => {
    const schedule = generateSchedule(gik, 2500, term, annualRate, residual);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].capitalAtPeriodEnd).toBeLessThan(schedule[i - 1].capitalAtPeriodEnd);
    }
  });
});
