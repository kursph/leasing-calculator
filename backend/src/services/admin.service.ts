import { PrismaClient, Prisma } from '@prisma/client';
import type { SystemConfig } from '@prisma/client';
import { calculateProfitability } from '../engine/ProfitabilityEngine';
import { ContractStatus, DashboardKPIs } from '../types';
import { sendApprovalNotification, sendRejectionNotification } from './email.service';

const prisma = new PrismaClient();

const CONFIG_KEYS = [
  'EURIBOR_RATE',
  'LIQUIDITY_COST',
  'FUNDING_COST',
  'CAPITAL_COST',
  'RISK_PREMIUM',
  'PROCESS_COST',
  'LENDER_MARGIN',
  'OPERATING_COST_PER_CONTRACT',
];

export class AdminService {
  async listContracts(query: Record<string, unknown>): Promise<Prisma.LeasingContractGetPayload<{ include: { vehicle: true; customer: { select: { firstName: true; lastName: true; email: true } } } }>[]> {
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    return prisma.leasingContract.findMany({
      where,
      include: { vehicle: true, customer: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getContract(contractId: string): Promise<Prisma.LeasingContractGetPayload<{ include: { vehicle: true; customer: { select: { firstName: true; lastName: true; email: true } }; creditCheck: true; profitability: true; amortizationSchedule: true } }> | null> {
    return prisma.leasingContract.findUnique({
      where: { id: contractId },
      include: {
        vehicle: true,
        customer: { select: { firstName: true, lastName: true, email: true } },
        creditCheck: true,
        profitability: true,
        amortizationSchedule: { orderBy: { period: 'asc' } },
      },
    });
  }

  async approveContract(contractId: string, adminId: string): Promise<Prisma.LeasingContractGetPayload<{ include: { customer: true } }>> {
    const contract = await prisma.leasingContract.findUniqueOrThrow({
      where: { id: contractId },
      include: { amortizationSchedule: true },
    });

    const configs = await prisma.systemConfig.findMany();
    const config = Object.fromEntries(configs.map((c) => [c.key, parseFloat(c.value)]));

    const profResult = calculateProfitability({
      gik: Number(contract.gik),
      monthlyPayment: Number(contract.monthlyPayment),
      termMonths: contract.termMonths,
      nominalRate: Number(contract.nominalRate),
      euriborRate: Number(contract.euriborRate),
      lenderMargin: Number(contract.lenderMargin),
      residualValue: Number(contract.residualValue),
      schedule: contract.amortizationSchedule.map((r) => ({
        period: r.period,
        payment: Number(r.payment),
        interest: Number(r.interest),
        principal: Number(r.principal),
        capitalAfterPayment: Number(r.capitalAfterPayment),
        capitalAtPeriodEnd: Number(r.capitalAtPeriodEnd),
      })),
      operatingCostConfig: config['OPERATING_COST_PER_CONTRACT'] ?? 0,
    });

    // Atomic: update status + create profitability record
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.leasingContract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.APPROVED,
          approvedAt: new Date(),
          approvedBy: adminId,
        },
        include: { customer: true },
      });

      await tx.contractProfitability.create({
        data: {
          contractId,
          totalPayments: profResult.totalPayments,
          totalInterestIncome: profResult.totalInterestIncome,
          refinancingCost: profResult.refinancingCost,
          operatingCost: profResult.operatingCost,
          contractFeeIncome: profResult.contractFeeIncome,
          residualValueIncome: profResult.residualValueIncome,
          netMargin: profResult.netMargin,
          marginPct: profResult.marginPct,
          spread: profResult.spread,
          isProfit: profResult.isProfit,
        },
      });

      return updated;
    });

    // Fire-and-forget: email failure must not roll back the approval
    sendApprovalNotification(
      result.customer.email,
      `${result.customer.firstName} ${result.customer.lastName}`,
      contractId,
      Number(result.monthlyPayment)
    ).catch((err) => console.error('[EMAIL] Approval notification failed:', err));

    return result;
  }

  async rejectContract(contractId: string, reason: string): Promise<Prisma.LeasingContractGetPayload<{ include: { customer: true } }>> {
    const updated = await prisma.leasingContract.update({
      where: { id: contractId },
      data: { status: ContractStatus.REJECTED, rejectionReason: reason },
      include: { customer: true },
    });

    // §7 VKrG: notify applicant of rejection with reason
    sendRejectionNotification(
      updated.customer.email,
      `${updated.customer.firstName} ${updated.customer.lastName}`,
      contractId,
      reason
    ).catch((err) => console.error('[EMAIL] Rejection notification failed:', err));

    return updated;
  }

  async getProfitability(contractId: string): Promise<Prisma.ContractProfitabilityGetPayload<{ include: { contract: { include: { vehicle: true } } } }> | null> {
    return prisma.contractProfitability.findUnique({
      where: { contractId },
      include: { contract: { include: { vehicle: true } } },
    });
  }

  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const contracts = await prisma.leasingContract.findMany({
      where: { status: { in: [ContractStatus.APPROVED, ContractStatus.ACTIVE] } },
      include: { profitability: true },
    });

    const allProfitability = await prisma.contractProfitability.findMany();

    const totalVolume = contracts.reduce((sum, c) => sum + Number(c.gik), 0);
    const avgMarginPct = allProfitability.length
      ? allProfitability.reduce((s, p) => s + Number(p.marginPct), 0) / allProfitability.length
      : 0;
    const avgSpread = allProfitability.length
      ? allProfitability.reduce((s, p) => s + Number(p.spread), 0) / allProfitability.length
      : 0;
    const totalInterestIncome = allProfitability.reduce((s, p) => s + Number(p.totalInterestIncome), 0);
    const totalNetProfit = allProfitability.reduce((s, p) => s + Number(p.netMargin), 0);
    const lossContracts = allProfitability.filter((p) => !p.isProfit).length;

    const statusCounts = await prisma.leasingContract.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    return {
      totalPortfolioVolume: totalVolume,
      averageMarginPct: avgMarginPct,
      averageSpread: avgSpread,
      totalInterestIncome,
      totalNetProfit,
      lossMakingContracts: lossContracts,
      contractsByStatus: Object.fromEntries(statusCounts.map((s) => [s.status, s._count.status])),
    };
  }

  async getConfig(): Promise<Record<string, string>> {
    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: CONFIG_KEYS } },
    });
    return Object.fromEntries(configs.map((c) => [c.key, c.value]));
  }

  async updateConfig(updates: Record<string, string>, adminId: string): Promise<SystemConfig[]> {
    const ops = Object.entries(updates)
      .filter(([key]) => CONFIG_KEYS.includes(key))
      .map(([key, value]) =>
        prisma.systemConfig.upsert({
          where: { key },
          create: { key, value, updatedBy: adminId },
          update: { value, updatedBy: adminId },
        })
      );
    return Promise.all(ops);
  }
}
