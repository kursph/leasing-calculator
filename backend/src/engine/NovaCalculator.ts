import Decimal from 'decimal.js';
import { NoVAResult } from '../types';

// Source: NoVAG §6 + VÖL Brochure p. 24-25
// PKW/Kombi only; electric vehicles = 0 from 2016
export function calculateNoVA(
  co2Grams: number,
  netPurchasePrice: number,
  year: number
): NoVAResult {
  if (year >= 2016 && co2Grams === 0) {
    return { taxRate: 0, novaAmount: 0, leasingRefund: 0 };
  }

  const deduction = year >= 2016 ? 300 : year === 2015 ? 400 : 450;

  const netPrice = new Decimal(netPurchasePrice);
  const deductionPct = new Decimal(deduction).div(netPrice).mul(100);
  const rawRate = new Decimal(co2Grams).minus(90).div(5).minus(deductionPct);

  const taxRate = Decimal.max(0, rawRate)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toNumber();

  const novaAmount = netPrice.mul(taxRate).div(100).toDecimalPlaces(2).toNumber();

  // 16.67% = 20/100 × 100/120 — leasing company reclaims this
  const leasingRefund = new Decimal(novaAmount).mul('0.1667').toDecimalPlaces(2).toNumber();

  // CO₂ surcharge: +20 EUR per g/km above 250 g/km
  const co2Surcharge = co2Grams > 250
    ? new Decimal(co2Grams - 250).mul(20).toNumber()
    : 0;

  return {
    taxRate,
    novaAmount: new Decimal(novaAmount).plus(co2Surcharge).toDecimalPlaces(2).toNumber(),
    leasingRefund,
  };
}
