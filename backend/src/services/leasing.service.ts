import { Prisma } from '@prisma/client';
import type { LeasingContract as PrismaLeasingContract, AmortizationRow, CreditCheck as PrismaCreditCheck } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { calculateNoVA } from '../engine/NovaCalculator';
import {
  calculateGIK,
  calculateNominalRate,
  calculateFullAmortizationPayment,
  calculatePartialAmortizationPayment,
  calculateOperatingLeaseResidual,
  validateTermMonths,
  validateAdvancePayment,
  validateOwnContribution,
  VALIDATION,
} from '../engine/LeasingEngine';
import { generateSchedule } from '../engine/AmortizationSchedule';
import { calculateEffectiveRate } from '../engine/EffectiveRateCalculator';
import { ContractType, ContractStatus, QuoteInput, QuoteResult, SecciData } from '../types';
import Decimal from 'decimal.js';

export class LeasingService {
  private async getSystemConfig(): Promise<Record<string, number>> {
    const configs = await prisma.systemConfig.findMany();
    return Object.fromEntries(
      configs.map((c) => [c.key, parseFloat(c.value)])
    );
  }

  async calculateQuote(input: QuoteInput): Promise<QuoteResult> {
    const vehicle = await prisma.vehicle.findUniqueOrThrow({ where: { id: input.vehicleId } });
    const config = await this.getSystemConfig();

    const netPrice = Number(vehicle.netPrice);
    const novaResult = calculateNoVA(vehicle.co2Emissions, netPrice, vehicle.year);

    const gik = calculateGIK({
      netPurchasePrice: netPrice,
      sideCostsActivatable: 0,
      nova: novaResult.novaAmount,
      novaRefund: novaResult.leasingRefund,
    });

    const termError = validateTermMonths(input.termMonths, vehicle.usefulLifeMonths);
    if (termError) throw new Error(termError);

    const advanceError = validateAdvancePayment(input.advancePayment, netPrice);
    if (advanceError) throw new Error(advanceError);

    const ownContribError = validateOwnContribution(
      input.advancePayment,
      input.deposit ?? 0,
      0,
      netPrice
    );
    if (ownContribError) throw new Error(ownContribError);

    const nominalRate = calculateNominalRate({
      euriborBase: config['EURIBOR_RATE'] ?? 0,
      liquidityCost: config['LIQUIDITY_COST'] ?? 0,
      fundingCost: config['FUNDING_COST'] ?? 0,
      capitalCost: config['CAPITAL_COST'] ?? 0,
      riskPremium: config['RISK_PREMIUM'] ?? 0,
      processCost: config['PROCESS_COST'] ?? 0,
      lenderMargin: config['LENDER_MARGIN'] ?? 0,
    });

    const effectiveGIK = new Decimal(gik).minus(input.advancePayment).toNumber();

    // Operating lease: residual set internally — never exposed to customer (tax law)
    const internalResidual =
      input.contractType === ContractType.OPERATING
        ? calculateOperatingLeaseResidual(effectiveGIK)
        : input.residualValue;

    let monthlyPayment: number;
    if (input.contractType === ContractType.VOLL_AMORTISATION) {
      monthlyPayment = calculateFullAmortizationPayment(effectiveGIK, input.termMonths, nominalRate);
    } else {
      monthlyPayment = calculatePartialAmortizationPayment(
        effectiveGIK,
        internalResidual,
        input.termMonths,
        nominalRate
      );
    }

    const schedule = generateSchedule(
      effectiveGIK,
      monthlyPayment,
      input.termMonths,
      nominalRate,
      internalResidual
    );

    const effectiveRate = calculateEffectiveRate(
      gik,
      monthlyPayment,
      input.termMonths,
      internalResidual,
      input.advancePayment
    );

    const totalPayments = new Decimal(monthlyPayment).mul(input.termMonths).toNumber();
    const contractStampDuty = new Decimal(totalPayments).mul('0.01').toDecimalPlaces(2).toNumber();
    const vatAmount = new Decimal(monthlyPayment).mul(VALIDATION.VAT_RATE)
      .mul(input.termMonths).toDecimalPlaces(2).toNumber();

    return {
      gik,
      monthlyPayment,
      nominalRate,
      effectiveRate,
      totalCost: new Decimal(totalPayments).plus(input.advancePayment).toNumber(),
      contractStampDuty,
      vatAmount,
      novaBreakdown: novaResult,
      // Operating lease: residual omitted from customer-facing response (tax law)
      ...(input.contractType !== ContractType.OPERATING && { residualValue: internalResidual }),
      schedule,
    };
  }

  async createApplication(customerId: string, input: QuoteInput & { deposit?: number }): Promise<PrismaLeasingContract> {
    const quote = await this.calculateQuote(input);
    const config = await this.getSystemConfig();

    await prisma.vehicle.findUniqueOrThrow({ where: { id: input.vehicleId } });

    // Resolve true residual stored on contract (operating lease uses internal value)
    const effectiveGIK = new Decimal(quote.gik).minus(input.advancePayment).toNumber();
    const storedResidual =
      input.contractType === ContractType.OPERATING
        ? calculateOperatingLeaseResidual(effectiveGIK)
        : input.residualValue;

    return prisma.$transaction(async (tx) => {
      const contract = await tx.leasingContract.create({
        data: {
          customerId,
          vehicleId: input.vehicleId,
          contractType: input.contractType,
          gik: quote.gik,
          novaAmount: quote.novaBreakdown.novaAmount,
          residualValue: storedResidual,
          termMonths: input.termMonths,
          nominalRate: quote.nominalRate,
          effectiveRate: quote.effectiveRate,
          monthlyPayment: quote.monthlyPayment,
          advancePayment: input.advancePayment,
          deposit: input.deposit ?? 0,
          euriborRate: config['EURIBOR_RATE'] ?? 0,
          lenderMargin: config['LENDER_MARGIN'] ?? 0,
          liquidityCost: config['LIQUIDITY_COST'] ?? 0,
          riskPremium: config['RISK_PREMIUM'] ?? 0,
          contractFee: quote.contractStampDuty,
          vatAmount: quote.vatAmount,
          status: ContractStatus.UNDER_REVIEW,
        },
      });

      await tx.amortizationRow.createMany({
        data: quote.schedule.map((row) => ({
          contractId: contract.id,
          period: row.period,
          payment: row.payment,
          interest: row.interest,
          principal: row.principal,
          capitalAfterPayment: row.capitalAfterPayment,
          capitalAtPeriodEnd: row.capitalAtPeriodEnd,
        })),
      });

      return contract;
    });
  }

  async getCustomerContracts(customerId: string): Promise<Prisma.LeasingContractGetPayload<{ include: { vehicle: true } }>[]> {
    return prisma.leasingContract.findMany({
      where: { customerId },
      include: { vehicle: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getContract(contractId: string, customerId: string): Promise<Prisma.LeasingContractGetPayload<{ include: { vehicle: true; creditCheck: true } }> | null> {
    return prisma.leasingContract.findFirst({
      where: { id: contractId, customerId },
      include: { vehicle: true, creditCheck: true },
    });
  }

  async getSchedule(contractId: string, customerId: string): Promise<AmortizationRow[] | null> {
    const contract = await prisma.leasingContract.findFirst({
      where: { id: contractId, customerId },
    });
    if (!contract) return null;

    return prisma.amortizationRow.findMany({
      where: { contractId },
      orderBy: { period: 'asc' },
    });
  }

  async generateSecci(contractId: string, customerId: string): Promise<SecciData | null> {
    const contract = await prisma.leasingContract.findFirst({
      where: { id: contractId, customerId },
      include: { vehicle: true, customer: true },
    });
    if (!contract) return null;

    return {
      contractId: contract.id,
      lender: { name: 'Austrian Leasing GmbH', address: 'Vienna, Austria' },
      borrower: {
        name: `${contract.customer.firstName} ${contract.customer.lastName}`,
        email: contract.customer.email,
      },
      vehicle: `${contract.vehicle.make} ${contract.vehicle.model} (${contract.vehicle.year})`,
      gik: Number(contract.gik),
      termMonths: contract.termMonths,
      monthlyPayment: Number(contract.monthlyPayment),
      nominalRate: Number(contract.nominalRate),
      effectiveRate: Number(contract.effectiveRate),
      advancePayment: Number(contract.advancePayment),
      residualValue: Number(contract.residualValue),
      contractFee: Number(contract.contractFee),
      vatAmount: Number(contract.vatAmount),
      totalCost: new Decimal(contract.monthlyPayment)
        .mul(contract.termMonths)
        .plus(contract.advancePayment)
        .plus(contract.residualValue)
        .toNumber(),
      generatedAt: new Date().toISOString(),
    };
  }

  async submitCreditCheck(
    contractId: string,
    customerId: string,
    data: {
      monthlyIncome: number;
      monthlyExpenses: number;
      existingObligations: number;
      idDocumentUrl?: string;
      incomeProofUrl?: string;
    }
  ): Promise<PrismaCreditCheck> {
    const contract = await prisma.leasingContract.findFirst({
      where: { id: contractId, customerId },
    });
    if (!contract) throw new Error('Contract not found');

    // Mock KSV check: disposable income must cover 1.2× monthly payment
    const disposable = data.monthlyIncome - data.monthlyExpenses - data.existingObligations;
    const passes = disposable >= Number(contract.monthlyPayment) * 1.2;

    return prisma.creditCheck.upsert({
      where: { contractId },
      create: {
        customerId,
        contractId,
        monthlyIncome: data.monthlyIncome,
        monthlyExpenses: data.monthlyExpenses,
        existingObligations: data.existingObligations,
        idDocumentUrl: data.idDocumentUrl,
        incomeProofUrl: data.incomeProofUrl,
        result: passes ? 'PASSED' : 'FAILED',
        score: Math.round(Math.min(100, (disposable / Number(contract.monthlyPayment)) * 50)),
        notes: passes ? undefined : 'Insufficient disposable income per KSV simulation',
      },
      update: {
        monthlyIncome: data.monthlyIncome,
        monthlyExpenses: data.monthlyExpenses,
        existingObligations: data.existingObligations,
        idDocumentUrl: data.idDocumentUrl,
        incomeProofUrl: data.incomeProofUrl,
        result: passes ? 'PASSED' : 'FAILED',
        score: Math.round(Math.min(100, (disposable / Number(contract.monthlyPayment)) * 50)),
        notes: passes ? null : 'Insufficient disposable income per KSV simulation',
      },
    });
  }
}
