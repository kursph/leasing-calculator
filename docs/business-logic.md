# Business Logic: Profit Margin Flow

## How the Leasing Company Makes Money

The leasing company borrows money at the EURIBOR base rate and lends it to customers at a higher nominal rate. The difference — the **spread** — is the profit. This spread is explicitly configured, stored, and visible per contract.

```
Nominal Rate = EURIBOR + Liquidity Cost + Funding Cost + Capital Cost
             + Risk Premium + Process Cost + LENDER MARGIN ← profit component
```

## Configuration → Quote → Contract → Dashboard

```
Admin configures rates (SystemConfig table)
    │
    │  EURIBOR_RATE = 0.039 (3.9%)
    │  LENDER_MARGIN = 0.015 (1.5%)   ← this is the profit lever
    │  ... other cost components
    │
    ▼
Customer requests quote
    │
    │  LeasingEngine.calculateNominalRate() sums all components
    │  → Nominal rate = 0.071 (7.1%)
    │
    │  LeasingEngine.calculateFullAmortizationPayment() or Partial
    │  → Monthly payment (advance/vorschüssig, 30/360 interest)
    │
    │  EffectiveRateCalculator.calculateEffectiveRate()
    │  → APR via Newton-Raphson (required by VKrG Appendix 1)
    │
    ▼
Customer applies → Contract created (status: UNDER_REVIEW)
    │
    │  Contract stores (as snapshot, immutable):
    │    euriborRate    = 0.039  ← what the company pays to borrow
    │    lenderMargin   = 0.015  ← THE PROFIT COMPONENT
    │    nominalRate    = 0.071  ← what customer pays
    │    monthlyPayment = calculated
    │    full amortization schedule (84 rows max)
    │
    ▼
Admin approves → ContractProfitability created atomically
    │
    │  ProfitabilityEngine.calculateProfitability():
    │    totalPayments       = monthlyPayment × termMonths
    │    totalInterestIncome = sum of all interest rows from schedule
    │    refinancingCost     = euriborRate × GIK × (termMonths/12)
    │    contractFeeIncome   = totalPayments × 1%  (Bestandvertragsgebühr)
    │    netMargin           = grossIncome - totalCosts
    │    spread              = nominalRate - euriborRate = 0.032 (3.2%)
    │    marginPct           = netMargin / GIK × 100
    │    isProfit            = netMargin > 0
    │
    ▼
Admin dashboard aggregates across all contracts
    │
    │  totalPortfolioVolume = Σ GIK (active contracts)
    │  averageMarginPct     = mean(marginPct)
    │  averageSpread        = mean(spread)
    │  totalNetProfit       = Σ netMargin
    │  lossMakingContracts  = count(isProfit = false)  ← should always be 0
```

## Why lenderMargin Is Stored Per Contract

If the admin updates `LENDER_MARGIN` in `SystemConfig`, future quotes reflect the new margin. Historical contracts are unaffected — their `lenderMargin` column is a permanent snapshot. This means:

- The profitability dashboard always shows the true margin *that was agreed at signing*
- Auditors can verify: `spread = nominalRate - euriborRate` matches `lenderMargin + other_cost_components`
- No post-hoc derivation is possible — the profit is locked at contract creation

## Customer Workflow (Step-by-Step)

```
1. Browse vehicles        → GET /api/vehicles
2. Configure lease        → POST /api/leasing/quote  (real-time, no DB write)
3. Review SECCI form      → GET /api/leasing/contracts/:id/secci (§6 VKrG)
4. Apply                  → POST /api/leasing/apply  (contract created, status: UNDER_REVIEW)
5. Credit check           → POST /api/leasing/contracts/:id/credit-check (§7 VKrG)
6. Wait for admin review  → email notification on decision
7. If approved            → view contract, download PDF, view amortization schedule
8. If rejected            → email with rejection reason (§7 VKrG mandatory)
```

## Admin Workflow (Step-by-Step)

```
1. Dashboard              → GET /api/admin/dashboard  (portfolio KPIs)
2. Review application     → GET /api/admin/contracts/:id (customer, vehicle, credit check)
3. Preview profitability  → shown inline before approving
4. Approve                → PUT /api/admin/contracts/:id/approve
                            → ContractProfitability created (same DB transaction)
                            → Customer notified by email
   OR
   Reject                 → PUT /api/admin/contracts/:id/reject  {reason}
                            → Reason stored on contract
                            → Customer notified with reason (§7 VKrG)
5. Monitor portfolio      → GET /api/admin/dashboard (updated KPIs)
6. Adjust rates           → PUT /api/admin/config  (affects future quotes only)
```

## Austrian Law Constraints Enforced in Code

| Constraint | Source | Enforcement |
|------------|--------|-------------|
| Max term 84 months (PKW) | EStR | `LeasingEngine.validateTermMonths()` |
| Min term 38 months | EStR | same |
| Advance payment ≤ 30% net price | EStR | `LeasingEngine.validateAdvancePayment()` |
| Own contribution ≤ 50% net price | EStR | `LeasingEngine.validateOwnContribution()` |
| NoVA refund 16.67% deducted from GIK | NoVAG §6 | `NovaCalculator → calculateGIK()` |
| APR must be calculated and shown | VKrG Appendix 1 | `EffectiveRateCalculator` |
| SECCI form before application | VKrG §6 | `/secci` endpoint |
| Rejection reason mandatory | VKrG §7 | Zod schema + email notification |
| Operating lease residual not shown | EStR | Stripped from API response |
| Profitability created at approval | Internal | Prisma `$transaction` in `AdminService` |
