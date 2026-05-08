import Decimal from 'decimal.js';
import { ScheduleRow } from '../types';

// VÖL Brochure p. 58-61 — advance payments (vorschüssig)
// Interest: dekursiv (end of period), 30/360 commercial convention
export function generateSchedule(
  gik: number,
  payment: number,
  termMonths: number,
  annualRate: number,
  residualValue: number
): ScheduleRow[] {
  const monthlyRate = new Decimal(annualRate).div(12);
  let capital = new Decimal(gik);
  const rows: ScheduleRow[] = [];

  for (let i = 1; i <= termMonths; i++) {
    // Advance: capital reduces by (payment - interest on post-payment capital)
    // capital_after = capital - payment + interest_on_capital_after
    // capital_after × (1 + monthlyRate) - capital_after = payment - something...
    // Simplified: interest is on capital AFTER deducting payment principal
    const interest = capital.minus(payment).mul(monthlyRate);
    const principal = new Decimal(payment).minus(interest);
    const capitalAfterPayment = capital.minus(principal);

    rows.push({
      period: i,
      payment: new Decimal(payment).toDecimalPlaces(2).toNumber(),
      interest: interest.toDecimalPlaces(2).toNumber(),
      principal: principal.toDecimalPlaces(2).toNumber(),
      capitalAfterPayment: capitalAfterPayment.toDecimalPlaces(2).toNumber(),
      capitalAtPeriodEnd: capitalAfterPayment.toDecimalPlaces(2).toNumber(),
    });

    capital = capitalAfterPayment;
  }

  return rows;
}
