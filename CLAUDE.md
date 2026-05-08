# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (`backend/`)
```bash
npm run setup          # first-time only: push schema to DB + seed
npm run dev            # dev server with hot reload
npm run build          # tsc compile to dist/
npm test                      # run all Jest tests (unit + integration)
npm run test:unit             # engine unit tests only
npm run test:integration      # supertest integration tests only (Prisma mocked)
npm run test:coverage         # engine unit tests with 100% coverage enforcement
npx jest --testPathPattern="LeasingEngine"  # run single test file
npm run prisma:migrate # apply DB migrations
npm run prisma:seed    # seed DB (vehicles, admin user, system config)
npm run prisma:studio  # open Prisma Studio GUI
npx tsc --noEmit       # type-check without emitting
```

### Frontend (`frontend/`)
```bash
npm start              # ng serve on :4200
npm run build          # production build
ng build --configuration=development  # dev build (faster)
```

### Docker (full stack)
```bash
docker-compose up      # starts PostgreSQL + backend + nginx frontend
```

Seed credentials: `admin@leasing.at` / `Admin1234!` (ADMIN), `demo@leasing.at` / `Demo1234!` (CUSTOMER).

## Architecture

Dual-view SPA (customer portal + admin back-office) sharing one backend. Core business constraint: the leasing company's profit comes from the **spread** between nominal rate and EURIBOR — this must be stored per contract and visible in admin views.

### Calculation Engine (`backend/src/engine/`)
Pure TypeScript, zero Express dependencies. All formulas from VÖL brochure (Appendix pp. 58–61).

- **`LeasingEngine.ts`** — GIK (total investment), nominal rate from components, full/partial amortisation payment formulas (advance/vorschüssig), Austrian validation rules (term 38–84mo, advance ≤30%, own contribution ≤50%)
- **`NovaCalculator.ts`** — Austrian NoVA vehicle tax; year-dependent deduction (300/400/450); 16.67% leasingRefund deducted from GIK
- **`AmortizationSchedule.ts`** — row-by-row schedule generator; advance payments, dekursiv interest
- **`EffectiveRateCalculator.ts`** — APR via Newton-Raphson iteration (VKrG Appendix 1)
- **`ProfitabilityEngine.ts`** — per-contract margin, spread, refinancing cost; used only at approval time

**Never use JS floats for money.** All engine functions use `Decimal.js`. Database uses `DECIMAL(12,2)`. Interest convention: 30/360.

### Backend (`backend/src/`)
Standard Express layering: `routes/index.ts` → controllers → services → Prisma. `express-async-errors` handles thrown errors globally; `errorHandler` middleware catches them.

- `services/LeasingService.ts` — quote calculation, contract creation (stores full amortisation schedule in one transaction), credit check mock (1.2× payment disposable income rule)
- `services/AdminService.ts` — contract approval atomically creates `ContractProfitability` record in same DB transaction; dashboard KPI aggregation
- `services/PdfService.ts` — PDFKit; contract PDF + profitability PDF streamed directly to response

**Auth:** JWT (`CUSTOMER` | `ADMIN` roles). `authenticate` middleware attaches `req.user`. `requireRole(...roles)` guards admin routes.

**System config** (EURIBOR, margins, costs) lives in `SystemConfig` table — fetched at quote-calculation time, never hardcoded.

### Database (`backend/prisma/schema.prisma`)
Key relationships: `LeasingContract` → `AmortizationRow[]` (one per month), `ContractProfitability` (created on approval, `@unique` on contractId), `CreditCheck` (`@unique` on contractId), `SystemConfig` (key/value store).

`lenderMargin` is stored as a separate column on `LeasingContract` — this is the audit trail for profit. Never derive it post-hoc.

### Frontend (`frontend/src/app/`)
Angular 21 standalone components with lazy-loaded routes. No NgModules.

- `customer/` — lazy module at `/customer/**`: vehicle browser → configurator (real-time quote) → credit-check application → contract list/detail with amortisation table
- `admin/` — lazy module at `/admin/**`, guarded by `adminGuard`: dashboard KPIs, contract review (approve/reject), profitability breakdown, rate config
- `shared/services/auth.service.ts` — stores JWT + user in localStorage, exposes `currentUser` signal
- `shared/services/api.service.ts` — typed wrappers for every REST endpoint
- `shared/services/auth-interceptor.service.ts` — functional interceptor that injects Bearer token
- `shared/guards/auth.guard.ts` — `authGuard` (logged in) + `adminGuard` (ADMIN role)

Use `inject()` for dependency injection in field initializers (not constructor params) — Angular 21 strict mode rejects `this.fb` before constructor runs when `form = this.fb.group(...)` is a class field.

## Key Invariants (Austrian Law)

| Rule | Where enforced |
|------|---------------|
| Max PKW term: 84mo (90% of 96mo useful life) | `LeasingEngine.validateTermMonths` |
| Min term: 38mo (40% of useful life) | same |
| Advance payment ≤ 30% net price | `LeasingEngine.validateAdvancePayment` |
| Own contribution ≤ 50% net price | `LeasingEngine.validateOwnContribution` |
| NoVA refund 16.67% deducted from GIK | `NovaCalculator` + `LeasingEngine.calculateGIK` |
| Profitability record created atomically on approval | `AdminService.approveContract` |
| Rejection must store reason (§7 VKrG) | admin controller guards empty reason |
| Operating leasing: residual value not shown to customer | frontend configurator only shows residual for TEIL_AMORTISATION |
