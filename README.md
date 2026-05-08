# Austrian KFZ Leasing Platform

Full-stack web application for an Austrian car leasing company. Implements Austrian leasing law (VÖL 2017, VKrG 2010, NoVAG 1991) from scratch — no third-party leasing libraries.

**Two portals, one backend:**
- **Customer portal** — browse vehicles, configure lease, pass credit check, receive contract PDF
- **Admin back-office** — review applications, see per-contract profitability/margin, configure rates

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 21 + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Calculation Engine | Pure TypeScript (Decimal.js, no float arithmetic) |
| Database | PostgreSQL 16 + Prisma ORM |
| Auth | JWT + bcrypt (CUSTOMER / ADMIN roles) |
| PDF | PDFKit |
| Testing | Jest (100% coverage on engine) |
| Containerization | Docker + docker-compose |

## Quick Start

### One command (Docker)

```bash
docker-compose up
```

- Frontend: http://localhost:4200
- Backend API: http://localhost:3000
- API Docs (Swagger): http://localhost:3000/api-docs

Seed credentials are created automatically:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@leasing.at | Admin1234! |
| Customer | demo@leasing.at | Demo1234! |

### Local Development

**Prerequisites:** Node.js 22+, PostgreSQL 16

```bash
# Backend
cd backend
cp .env.example .env          # edit DATABASE_URL if needed
npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev                   # :3000

# Frontend (separate terminal)
cd frontend
npm install
npm start                     # :4200
```

## Running Tests

```bash
cd backend
npm test                      # all tests
npm run test:coverage         # with coverage report (engine must be 100%)
npx jest --testPathPattern="LeasingEngine"   # single file
```

## Calculation Engine

All formulas implemented from the VÖL brochure (Appendix pp. 58–61):

- **GIK** (Gesamtinvestitionskosten) — total investment including net NoVA
- **NoVA** — Austrian vehicle tax per NoVAG §6; year-dependent deduction; 16.67% refund deducted from GIK
- **Nominal rate** — EURIBOR + liquidity + funding + capital + risk + process + **lender margin**
- **Monthly payment** — advance (vorschüssig), 30/360 commercial calendar; full and partial amortisation formulas
- **APR** — Newton-Raphson iteration per VKrG Appendix 1
- **Profitability** — spread, net margin, refinancing cost; calculated atomically on contract approval

> The lender margin is stored as a separate column on every contract. This is the audit trail for profit — it must never be derived post-hoc.

## API

Full REST API at `/api`. See Swagger UI at `/api-docs` when the backend is running.

| Group | Base path |
|-------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Vehicles | `GET /api/vehicles` |
| Customer | `POST /api/leasing/quote`, `POST /api/leasing/apply`, `GET /api/leasing/contracts/:id/...` |
| Admin | `GET /api/admin/dashboard`, `PUT /api/admin/contracts/:id/approve`, `GET /api/admin/config` |

## Austrian Legal Constraints

| Rule | Value |
|------|-------|
| Max lease term (PKW) | 84 months (90% of 8-year useful life) |
| Min lease term (Vollamortisation) | 38 months (40% of useful life) |
| Max advance payment | 30% of net acquisition cost |
| Max total own contribution | 50% of net acquisition cost |
| PKW adequacy limit | EUR 40,000 (incl. VAT + NoVA) |
| VAT on payments | 20% |
| Contract stamp duty | 1% of total payments (fixed term) |
| SECCI form | Mandatory before application submission (§6 VKrG) |
| Credit check | Required; rejection must include reason (§7 VKrG) |

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/leasing_db
JWT_SECRET=<strong-random-secret>
PORT=3000
CORS_ORIGIN=http://localhost:4200
NODE_ENV=development
```

Rate configuration (EURIBOR, margins, costs) is managed at runtime via the admin UI — stored in the `SystemConfig` table, not env vars.
