# Entity-Relationship Diagram

```mermaid
erDiagram
    Customer {
        uuid id PK
        string email UK
        string passwordHash
        string firstName
        string lastName
        Role role
        datetime createdAt
    }

    Vehicle {
        uuid id PK
        string make
        string model
        int year
        decimal netPrice
        int co2Emissions
        decimal novaRate
        int usefulLifeMonths
        string imageUrl
        datetime createdAt
    }

    LeasingContract {
        uuid id PK
        uuid customerId FK
        uuid vehicleId FK
        ContractType contractType
        decimal gik
        decimal novaAmount
        decimal residualValue
        int termMonths
        decimal nominalRate
        decimal effectiveRate
        decimal monthlyPayment
        decimal advancePayment
        decimal deposit
        decimal euriborRate
        decimal lenderMargin
        decimal liquidityCost
        decimal riskPremium
        decimal contractFee
        decimal vatAmount
        ContractStatus status
        string rejectionReason
        datetime createdAt
        datetime approvedAt
        string approvedBy
    }

    AmortizationRow {
        uuid id PK
        uuid contractId FK
        int period
        decimal payment
        decimal interest
        decimal principal
        decimal capitalAfterPayment
        decimal capitalAtPeriodEnd
    }

    ContractProfitability {
        uuid id PK
        uuid contractId FK UK
        decimal totalPayments
        decimal totalInterestIncome
        decimal refinancingCost
        decimal operatingCost
        decimal contractFeeIncome
        decimal residualValueIncome
        decimal netMargin
        decimal marginPct
        decimal spread
        boolean isProfit
        datetime calculatedAt
    }

    CreditCheck {
        uuid id PK
        uuid customerId FK
        uuid contractId FK UK
        decimal monthlyIncome
        decimal monthlyExpenses
        decimal existingObligations
        string idDocumentUrl
        string incomeProofUrl
        string result
        int score
        string notes
        datetime checkedAt
    }

    SystemConfig {
        uuid id PK
        string key UK
        string value
        datetime updatedAt
        string updatedBy
    }

    Customer ||--o{ LeasingContract : "applies for"
    Vehicle  ||--o{ LeasingContract : "leased as"
    LeasingContract ||--o{ AmortizationRow : "has schedule"
    LeasingContract ||--o| ContractProfitability : "generates (on approval)"
    LeasingContract ||--o| CreditCheck : "has"
    Customer ||--o{ CreditCheck : "submits"
```

## Key Design Notes

| Table | Note |
|-------|------|
| `LeasingContract.lenderMargin` | Stored separately — immutable profit audit trail per contract |
| `LeasingContract.euriborRate` | Snapshot at application time — rate changes don't alter historical contracts |
| `ContractProfitability` | `@unique` on `contractId` — exactly one record per approved contract, created atomically |
| `AmortizationRow` | One row per month — 84 rows max for PKW (84-month max term) |
| `SystemConfig` | Key/value store for EURIBOR, margins, costs — changed at runtime via admin UI |
| All monetary columns | `DECIMAL(12,2)` — never FLOAT (compliance requirement) |
