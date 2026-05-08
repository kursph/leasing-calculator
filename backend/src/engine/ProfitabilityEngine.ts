import Decimal from 'decimal.js';
import { ProfitabilityResult, ScheduleRow } from '../types';

export function calculateProfitability(contract: {
  gik: number;
  monthlyPayment: number;
  termMonths: number;
  nominalRate: number;
  euriborRate: number;
  lenderMargin: number;
  residualValue: number;
  schedule: ScheduleRow[];
  operatingCostConfig: number;
}): ProfitabilityResult {
  const totalPayments = new Decimal(contract.monthlyPayment)
    .mul(contract.termMonths)
    .toDecimalPlaces(2)
    .toNumber();

  const totalInterestIncome = contract.schedule
    .reduce((sum, r) => new Decimal(sum).plus(r.interest).toNumber(), 0);

  // Refinancing cost: euriborBase × GIK × (termMonths / 12)
  const refinancingCost = new Decimal(contract.euriborRate)
    .mul(contract.gik)
    .mul(new Decimal(contract.termMonths).div(12))
    .toDecimalPlaces(2)
    .toNumber();

  // Bestandvertragsgebühr: 1% of total payments
  const contractFeeIncome = new Decimal(totalPayments).mul('0.01').toDecimalPlaces(2).toNumber();

  const grossIncome = new Decimal(totalPayments)
    .plus(contractFeeIncome)
    .plus(contract.residualValue)
    .toNumber();

  const totalCosts = new Decimal(contract.gik)
    .plus(refinancingCost)
    .plus(contract.operatingCostConfig)
    .toNumber();

  const netMargin = new Decimal(grossIncome).minus(totalCosts).toDecimalPlaces(2).toNumber();
  const marginPct = new Decimal(netMargin).div(contract.gik).mul(100).toDecimalPlaces(4).toNumber();
  const spread = new Decimal(contract.nominalRate).minus(contract.euriborRate).toDecimalPlaces(6).toNumber();

  return {
    totalPayments,
    totalInterestIncome: new Decimal(totalInterestIncome).toDecimalPlaces(2).toNumber(),
    refinancingCost,
    operatingCost: contract.operatingCostConfig,
    contractFeeIncome,
    residualValueIncome: contract.residualValue,
    netMargin,
    marginPct,
    spread,
    isProfit: netMargin > 0,
  };
}
