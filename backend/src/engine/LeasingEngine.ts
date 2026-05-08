import Decimal from 'decimal.js';
import { GIKInput, RateComponents } from '../types';

// VÖL Brochure p. 58-61 — interest: 30/360 commercial calendar
// Payments: advance (vorschüssig) — due at start of period

export function calculateGIK(input: GIKInput): number {
  return new Decimal(input.netPurchasePrice)
    .plus(input.sideCostsActivatable)
    .plus(new Decimal(input.nova).minus(input.novaRefund))
    .plus(input.nonActivatableCosts ?? 0)
    .toDecimalPlaces(2)
    .toNumber();
}

export function calculateNominalRate(components: RateComponents): number {
  return new Decimal(components.euriborBase)
    .plus(components.liquidityCost)
    .plus(components.fundingCost)
    .plus(components.capitalCost)
    .plus(components.riskPremium)
    .plus(components.processCost)
    .plus(components.lenderMargin)
    .toDecimalPlaces(6)
    .toNumber();
}

// Full amortisation (Vollamortisation) — residual = 0
// Advance (vorschüssig): Rv = Rn / r
export function calculateFullAmortizationPayment(
  gik: number,
  termMonths: number,
  annualRate: number
): number {
  const r = new Decimal(1).plus(new Decimal(annualRate).div(12));
  const rn = r.pow(termMonths);
  const rMinus1 = r.minus(1);

  // Arrears: Rn = GIK × rⁿ(r-1) / (rⁿ-1)
  const Rn = new Decimal(gik).mul(rn.mul(rMinus1)).div(rn.minus(1));
  // Advance: Rv = Rn / r
  const Rv = Rn.div(r);

  return Rv.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

// Partial amortisation (Teilamortisation) — residual > 0
export function calculatePartialAmortizationPayment(
  gik: number,
  residualValue: number,
  termMonths: number,
  annualRate: number
): number {
  const r = new Decimal(1).plus(new Decimal(annualRate).div(12));
  const rn = r.pow(termMonths);
  const rMinus1 = r.minus(1);

  const gikD = new Decimal(gik);
  const rvD = new Decimal(residualValue);

  // Arrears: Rn = (GIK - RW) × rⁿ(r-1)/(rⁿ-1) + RW × (r-1)
  const Rn = gikD.minus(rvD).mul(rn.mul(rMinus1)).div(rn.minus(1))
    .plus(rvD.mul(rMinus1));
  // Advance: Rv = Rn / r
  const Rv = Rn.div(r);

  return Rv.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

// Operating lease — residual set internally at 30% GIK, never disclosed to customer (tax law)
export const OPERATING_RESIDUAL_PCT = 0.3;

export function calculateOperatingLeaseResidual(gik: number): number {
  return new Decimal(gik).mul(OPERATING_RESIDUAL_PCT).toDecimalPlaces(2).toNumber();
}

export function calculateContractStampDuty(
  totalPayments: number,
  fixedTerm: boolean,
  monthlyPayment?: number
): number {
  if (fixedTerm) {
    return new Decimal(totalPayments).mul('0.01').toDecimalPlaces(2).toNumber();
  }
  // Open term: 1% × 36 × monthly rate
  return new Decimal(monthlyPayment ?? 0).mul(36).mul('0.01').toDecimalPlaces(2).toNumber();
}

// Austrian tax validation rules
export const VALIDATION = {
  PKW_USEFUL_LIFE_MONTHS: 96,       // 8 years
  MAX_TERM_PCT: 0.9,                 // 90% of useful life = 84 months
  MIN_TERM_PCT: 0.4,                 // 40% of useful life = 38 months (Vollamortisation)
  MAX_ADVANCE_PCT: 0.3,              // 30% of net acquisition cost
  MAX_OWN_CONTRIBUTION_PCT: 0.5,    // 50% of net acquisition cost
  PKW_ADEQUACY_LIMIT_EUR: 40000,    // incl. VAT + NoVA
  VAT_RATE: 0.2,
} as const;

export function validateTermMonths(termMonths: number, usefulLifeMonths: number): string | null {
  const max = Math.floor(usefulLifeMonths * VALIDATION.MAX_TERM_PCT);
  const min = Math.ceil(usefulLifeMonths * VALIDATION.MIN_TERM_PCT);
  if (termMonths > max) return `Term exceeds max allowed ${max} months (90% of ${usefulLifeMonths}mo useful life)`;
  if (termMonths < min) return `Term below min required ${min} months (40% of ${usefulLifeMonths}mo useful life)`;
  return null;
}

export function validateAdvancePayment(advancePayment: number, netAcquisitionCost: number): string | null {
  const max = new Decimal(netAcquisitionCost).mul(VALIDATION.MAX_ADVANCE_PCT).toNumber();
  if (advancePayment > max) return `Advance payment exceeds 30% cap (max ${max})`;
  return null;
}

export function validateOwnContribution(
  advancePayment: number,
  deposit: number,
  caution: number,
  netAcquisitionCost: number
): string | null {
  const total = new Decimal(advancePayment).plus(deposit).plus(caution).toNumber();
  const max = new Decimal(netAcquisitionCost).mul(VALIDATION.MAX_OWN_CONTRIBUTION_PCT).toNumber();
  if (total > max) return `Total own contribution exceeds 50% cap (max ${max})`;
  return null;
}
