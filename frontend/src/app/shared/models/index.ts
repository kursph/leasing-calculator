export type Role = 'CUSTOMER' | 'ADMIN';
export type ContractType = 'VOLL_AMORTISATION' | 'TEIL_AMORTISATION' | 'OPERATING';
export type ContractStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'CLOSED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  netPrice: number;
  co2Emissions: number;
  novaRate: number;
  usefulLifeMonths: number;
  imageUrl?: string;
  novaBreakdown?: NoVABreakdown;
}

export interface NoVABreakdown {
  taxRate: number;
  novaAmount: number;
  leasingRefund: number;
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
  novaBreakdown: NoVABreakdown;
  schedule: ScheduleRow[];
}

export interface ScheduleRow {
  period: number;
  payment: number;
  interest: number;
  principal: number;
  capitalAfterPayment: number;
  capitalAtPeriodEnd: number;
}

export interface CreditCheck {
  id: string;
  result: 'PASSED' | 'FAILED';
  score: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  existingObligations: number;
  notes?: string;
  createdAt: string;
}

export interface LeasingContract {
  id: string;
  contractType: ContractType;
  gik: number;
  novaAmount: number;
  residualValue: number;
  termMonths: number;
  nominalRate: number;
  effectiveRate: number;
  monthlyPayment: number;
  advancePayment: number;
  deposit: number;
  euriborRate: number;
  lenderMargin: number;
  contractFee: number;
  vatAmount: number;
  status: ContractStatus;
  rejectionReason?: string;
  vehicle?: Vehicle;
  customer?: User;
  creditCheck?: CreditCheck;
  createdAt: string;
  approvedAt?: string;
}

export interface SecciData {
  contractId: string;
  lender: { name: string; address: string };
  borrower: { name: string; email: string };
  vehicle: string;
  gik: number;
  termMonths: number;
  monthlyPayment: number;
  nominalRate: number;
  effectiveRate: number;
  advancePayment: number;
  residualValue: number;
  contractFee: number;
  vatAmount: number;
  totalCost: number;
  generatedAt: string;
}

export interface CreditCheckInput {
  monthlyIncome: number;
  monthlyExpenses: number;
  existingObligations: number;
  idDocumentUrl?: string;
  incomeProofUrl?: string;
}

export interface Profitability {
  id: string;
  contractId: string;
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
  calculatedAt: string;
}

export interface DashboardKPIs {
  totalPortfolioVolume: number;
  averageMarginPct: number;
  averageSpread: number;
  totalInterestIncome: number;
  totalNetProfit: number;
  lossMakingContracts: number;
  contractsByStatus: Record<ContractStatus, number>;
}
