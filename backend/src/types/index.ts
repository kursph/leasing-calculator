export enum Role {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

export enum ContractType {
  VOLL_AMORTISATION = 'VOLL_AMORTISATION',
  TEIL_AMORTISATION = 'TEIL_AMORTISATION',
  OPERATING = 'OPERATING',
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface RateComponents {
  euriborBase: number;
  liquidityCost: number;
  fundingCost: number;
  capitalCost: number;
  riskPremium: number;
  processCost: number;
  lenderMargin: number;
}

export interface GIKInput {
  netPurchasePrice: number;
  sideCostsActivatable: number;
  nova: number;
  novaRefund: number;
  nonActivatableCosts?: number;
}

export interface ScheduleRow {
  period: number;
  payment: number;
  interest: number;
  principal: number;
  capitalAfterPayment: number;
  capitalAtPeriodEnd: number;
}

export interface NoVAResult {
  taxRate: number;
  novaAmount: number;
  leasingRefund: number;
}

export interface ProfitabilityResult {
  totalPayments: number;
  totalInterestIncome: number;
  refinancingCost: number;
  operatingCost: number;
  contractFeeIncome: number;
  residualValueIncome: number;
  netMargin: number;
  marginPct: number;
  spread: number;
  isProfit: boolean;
}

export interface QuoteInput {
  vehicleId: string;
  contractType: ContractType;
  termMonths: number;
  advancePayment: number;
  residualValue: number;
  deposit?: number;
}

export interface QuoteResult {
  gik: number;
  monthlyPayment: number;
  nominalRate: number;
  effectiveRate: number;
  totalCost: number;
  contractStampDuty: number;
  vatAmount: number;
  novaBreakdown: NoVAResult;
  schedule: ScheduleRow[];
}
