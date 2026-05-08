-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('VOLL_AMORTISATION', 'TEIL_AMORTISATION', 'OPERATING');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'CLOSED');

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "netPrice" DECIMAL(12,2) NOT NULL,
    "co2Emissions" INTEGER NOT NULL,
    "novaRate" DECIMAL(5,2) NOT NULL,
    "usefulLifeMonths" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeasingContract" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "gik" DECIMAL(12,2) NOT NULL,
    "novaAmount" DECIMAL(10,2) NOT NULL,
    "residualValue" DECIMAL(12,2) NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "nominalRate" DECIMAL(6,4) NOT NULL,
    "effectiveRate" DECIMAL(6,4) NOT NULL,
    "monthlyPayment" DECIMAL(10,2) NOT NULL,
    "advancePayment" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deposit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "euriborRate" DECIMAL(6,4) NOT NULL,
    "lenderMargin" DECIMAL(6,4) NOT NULL,
    "liquidityCost" DECIMAL(6,4) NOT NULL,
    "riskPremium" DECIMAL(6,4) NOT NULL,
    "contractFee" DECIMAL(10,2) NOT NULL,
    "vatAmount" DECIMAL(10,2) NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,

    CONSTRAINT "LeasingContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmortizationRow" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "period" INTEGER NOT NULL,
    "payment" DECIMAL(10,2) NOT NULL,
    "interest" DECIMAL(10,2) NOT NULL,
    "principal" DECIMAL(10,2) NOT NULL,
    "capitalAfterPayment" DECIMAL(12,2) NOT NULL,
    "capitalAtPeriodEnd" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "AmortizationRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractProfitability" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "totalPayments" DECIMAL(14,2) NOT NULL,
    "totalInterestIncome" DECIMAL(12,2) NOT NULL,
    "refinancingCost" DECIMAL(12,2) NOT NULL,
    "operatingCost" DECIMAL(10,2) NOT NULL,
    "contractFeeIncome" DECIMAL(10,2) NOT NULL,
    "residualValueIncome" DECIMAL(12,2) NOT NULL,
    "netMargin" DECIMAL(12,2) NOT NULL,
    "marginPct" DECIMAL(6,4) NOT NULL,
    "spread" DECIMAL(6,4) NOT NULL,
    "isProfit" BOOLEAN NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractProfitability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditCheck" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "monthlyIncome" DECIMAL(10,2) NOT NULL,
    "monthlyExpenses" DECIMAL(10,2) NOT NULL,
    "existingObligations" DECIMAL(10,2) NOT NULL,
    "idDocumentUrl" TEXT,
    "incomeProofUrl" TEXT,
    "result" TEXT NOT NULL,
    "score" INTEGER,
    "notes" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ContractProfitability_contractId_key" ON "ContractProfitability"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditCheck_contractId_key" ON "CreditCheck"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- AddForeignKey
ALTER TABLE "LeasingContract" ADD CONSTRAINT "LeasingContract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeasingContract" ADD CONSTRAINT "LeasingContract_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmortizationRow" ADD CONSTRAINT "AmortizationRow_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "LeasingContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractProfitability" ADD CONSTRAINT "ContractProfitability_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "LeasingContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCheck" ADD CONSTRAINT "CreditCheck_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCheck" ADD CONSTRAINT "CreditCheck_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "LeasingContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
