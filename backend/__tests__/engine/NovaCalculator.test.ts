import { calculateNoVA } from '../../src/engine/NovaCalculator';

describe('calculateNoVA', () => {
  it('electric vehicle from 2016 = 0', () => {
    const result = calculateNoVA(0, 40000, 2024);
    expect(result.taxRate).toBe(0);
    expect(result.novaAmount).toBe(0);
    expect(result.leasingRefund).toBe(0);
  });

  it('deduction is 300 for year >= 2016', () => {
    // taxRate = max(0, (co2 - 90) / 5 - deduction/price * 100)
    // (120-90)/5 = 6; 300/28000*100 = 1.071; rate = 6 - 1.071 = 4.929
    const result = calculateNoVA(120, 28000, 2024);
    expect(result.taxRate).toBeCloseTo(4.93, 1);
  });

  it('deduction is 400 for year 2015', () => {
    const result2015 = calculateNoVA(120, 28000, 2015);
    const result2016 = calculateNoVA(120, 28000, 2016);
    expect(result2015.taxRate).toBeLessThan(result2016.taxRate);
  });

  it('deduction is 450 for year < 2015', () => {
    const result = calculateNoVA(120, 28000, 2014);
    expect(result.taxRate).toBeLessThan(calculateNoVA(120, 28000, 2015).taxRate);
  });

  it('leasingRefund = 16.67% of novaAmount', () => {
    const result = calculateNoVA(130, 30000, 2024);
    expect(result.leasingRefund).toBeCloseTo(result.novaAmount * 0.1667, 1);
  });

  it('taxRate floored at 0 for low-emission vehicles', () => {
    const result = calculateNoVA(50, 50000, 2024);
    expect(result.taxRate).toBe(0);
    expect(result.novaAmount).toBe(0);
  });

  it('CO2 surcharge applied above 250 g/km', () => {
    const base = calculateNoVA(250, 30000, 2024);
    const high = calculateNoVA(260, 30000, 2024);
    expect(high.novaAmount).toBeGreaterThan(base.novaAmount + 199);
  });

  it('novaAmount computed as netPrice * taxRate / 100', () => {
    const result = calculateNoVA(120, 28000, 2024);
    const expected = 28000 * (result.taxRate / 100);
    expect(result.novaAmount).toBeCloseTo(expected, 0);
  });
});
