# Calculation Engine

Pure TypeScript. Zero Express dependencies. All formulas implemented from the VÖL brochure "Leasing in Österreich" (March 2017). 100% unit test coverage enforced.

**Interest convention throughout:** 30 days/month, 360 days/year (kaufmännische Zinsmethode).  
**Payment timing:** advance (vorschüssig) — first payment due at contract start.

---

## LeasingEngine.ts

### `calculateGIK` — Total Investment (Gesamtinvestitionskosten)

**Source:** VÖL Brochure Appendix p. 58, formula (1)

```
GIK = NetPurchasePrice + SideCostsActivatable + (NoVA − NoVARefund) + NonActivatableCosts
```

- `NoVARefund = NoVA × 16.67%` — the leasing company reclaims this from the tax authority
- Net NoVA (= NoVA − refund) is included in GIK, not passed to customer directly

### `calculateNominalRate` — Nominal Interest Rate (Sollzinssatz)

**Source:** VÖL Brochure p. 18–19

```
NominalRate = EURIBOR + LiquidityCost + FundingCost + CapitalCost
            + RiskPremium + ProcessCost + LenderMargin
```

- All components are stored on the contract at signing
- `LenderMargin` is the profit component — configurable by admin, immutable post-contract

### `calculateFullAmortizationPayment` — Vollamortisation (residual = 0)

**Source:** VÖL Brochure Appendix p. 58–59, formula (2)

```
r  = 1 + annualRate/12                     (monthly compounding factor)
Rn = GIK × rⁿ(r−1) / (rⁿ−1)              (arrears / nachschüssig)
Rv = Rn / r                                (advance / vorschüssig)
```

### `calculatePartialAmortizationPayment` — Teilamortisation (residual > 0)

**Source:** VÖL Brochure Appendix p. 59–60, formula (3)

```
Rn = (GIK − RW) × rⁿ(r−1)/(rⁿ−1) + RW × (r−1)
Rv = Rn / r
```

Where `RW` = Restwert (residual value).

### `calculateOperatingLeaseResidual`

**Source:** EStR internal convention — 30% of GIK  
Residual is set by the lessor internally and **must not be disclosed to the customer** (Austrian tax law).

### Validation Functions

**Source:** EStR 2000, §§ 7-9 (PKW/Kombi rules)

| Function | Rule | Value |
|----------|------|-------|
| `validateTermMonths` | Max term = 90% of useful life | PKW: max 86mo of 96mo |
|  | Min term = 40% of useful life | PKW: min 39mo |
| `validateAdvancePayment` | Advance ≤ 30% net price | Hard cap |
| `validateOwnContribution` | Advance + deposit + caution ≤ 50% net price | Hard cap |

---

## NovaCalculator.ts

**Source:** NoVAG §6; VÖL Brochure p. 24–25

### `calculateNoVA`

```
deduction = 300  (year ≥ 2016)
           400  (year = 2015)
           450  (year < 2015)

taxRate = max(0, (CO₂_g/km − 90) / 5 − deduction / netPrice × 100)
taxRate = round(taxRate, 2 decimal places)

novaAmount   = netPrice × taxRate / 100
leasingRefund = novaAmount × 0.1667     (= 20/100 × 100/120, leasing company reclaims)
```

Special cases:
- Electric vehicles (CO₂ = 0, year ≥ 2016): NoVA = 0
- CO₂ surcharge: +20 EUR per g/km above 250 g/km

---

## AmortizationSchedule.ts

**Source:** VÖL Brochure Appendix p. 60–61

### `generateSchedule`

Advance payments (vorschüssig): payment is made at the start of each period. Interest accrues on capital after deducting the payment.

```
For each period i = 1..n:
  interest              = (capital − payment) × monthlyRate
  principal             = payment − interest
  capitalAfterPayment   = capital − principal
```

---

## EffectiveRateCalculator.ts

**Source:** VKrG 2010, Appendix 1 (legally required APR calculation)

### `calculateEffectiveRate` — Newton-Raphson Iteration

Solves for `r_eff` such that present value of all payments equals GIK minus advance payment:

```
GIK − advancePayment = Σ [payment_t / (1 + r_eff)^t]  for t=1..n
                     + residualValue / (1 + r_eff)^n

f(r)  = GIK − advance − PV(r)
f'(r) = −dPV/dr

r_new = r − f(r)/f'(r)     iterate until |r_new − r| < 1e-8
```

Annualised result: `APR = r_monthly × 12`  
Converges in < 20 iterations for all realistic lease parameters.

---

## ProfitabilityEngine.ts

**Source:** VÖL Brochure p. 18–22 (internal leasing company calculation)

### `calculateProfitability`

```
totalPayments       = monthlyPayment × termMonths
totalInterestIncome = Σ interest rows from amortization schedule
refinancingCost     = euriborRate × GIK × (termMonths / 12)
contractFeeIncome   = totalPayments × 1%    (Bestandvertragsgebühr)
grossIncome         = totalPayments + contractFeeIncome + residualValue
totalCosts          = GIK + refinancingCost + operatingCost
netMargin           = grossIncome − totalCosts
marginPct           = netMargin / GIK × 100
spread              = nominalRate − euriborRate
isProfit            = netMargin > 0
```

**Critical:** `spread` proves the lender margin was positive and covers costs. A `spread` of 0 means the company broke even on interest; `isProfit = false` means the deal lost money.
