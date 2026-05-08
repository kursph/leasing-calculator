# System Architecture

## Dual-View Architecture

Both customer portal and admin back-office share one backend. Role-based access control (JWT + `CUSTOMER`/`ADMIN` role) determines which routes and data are accessible.

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│                                                                 │
│  ┌──────────────────────────┐  ┌─────────────────────────────┐ │
│  │   Customer Portal        │  │   Admin Back-Office         │ │
│  │   /customer/**           │  │   /admin/**                 │ │
│  │                          │  │                             │ │
│  │  - Vehicle browser       │  │  - Portfolio dashboard      │ │
│  │  - Lease configurator    │  │  - Contract review          │ │
│  │  - Credit check form     │  │  - Profitability breakdown  │ │
│  │  - Contract / PDF view   │  │  - Rate configuration       │ │
│  │                          │  │                             │ │
│  │  Angular 21 lazy module  │  │  Angular 21 lazy module     │ │
│  └──────────┬───────────────┘  └───────────────┬─────────────┘ │
│             │  HTTP + JWT Bearer                │               │
└─────────────┼─────────────────────────────────-┼───────────────┘
              │                                   │
              ▼                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  Node.js + Express + TypeScript  (:3000)                        │
│                                                                 │
│  ┌────────────────┐  ┌─────────────────────────────────────┐   │
│  │  Auth Layer    │  │  REST API Routes                    │   │
│  │  JWT + bcrypt  │  │  Zod validation on every endpoint   │   │
│  │  Role guards   │  │  Swagger UI at /api-docs            │   │
│  └────────────────┘  └─────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  CALCULATION ENGINE  (pure TypeScript, zero Express dep) │   │
│  │                                                          │   │
│  │  LeasingEngine.ts        GIK, nominal rate, payments     │   │
│  │  NovaCalculator.ts       Austrian NoVA tax (NoVAG §6)    │   │
│  │  AmortizationSchedule.ts Row-by-row schedule generator   │   │
│  │  EffectiveRateCalculator.ts  APR via Newton-Raphson      │   │
│  │  ProfitabilityEngine.ts  Spread, margin, refinancing     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────┐  ┌───────────────┐  ┌──────────────────┐   │
│  │  LeasingService│  │  AdminService │  │  EmailService    │   │
│  │  Quote, apply  │  │  Approve,     │  │  Nodemailer      │   │
│  │  Credit check  │  │  reject, KPIs │  │  (mock in dev)   │   │
│  └────────────────┘  └───────────────┘  └──────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Prisma ORM                                            │     │
│  └────────────────────────────┬───────────────────────────┘     │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │  PostgreSQL 16                  │
              │  DECIMAL(12,2) for all money    │
              │  (never FLOAT)                  │
              └─────────────────────────────────┘
```

## Request Lifecycle

```
Browser → Angular HttpClient (authInterceptor adds Bearer token)
       → Express router → Zod validateBody middleware
       → Role guard (authenticate + requireRole)
       → Controller → Service → Calculation Engine → Prisma → PostgreSQL
       → JSON response
```

## Key Isolation Points

| Boundary | Why |
|----------|-----|
| Engine has no Express deps | Can be unit-tested without HTTP; formulas are auditable in isolation |
| `lenderMargin` stored on every contract | Profit is immutable per-contract — admin can change global config without altering historical margin |
| `ContractProfitability` created atomically in same transaction as approval | No approved contract exists without a profitability record |
| Email sent after transaction commit | Email failure cannot roll back a legally binding approval |

## Calculation Engine — Formula Source Map

See [`backend/src/engine/README.md`](../backend/src/engine/README.md) for formula-to-VÖL-brochure page mappings.
