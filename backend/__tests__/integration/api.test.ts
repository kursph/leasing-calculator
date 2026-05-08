import request from 'supertest';
import app from '../../src/app';
import { ContractType, ContractStatus } from '../../src/types';

// ─── Prisma mock ──────────────────────────────────────────────────────────────

const VEHICLE_ID = '11111111-1111-1111-1111-111111111111';
const CUSTOMER_ID = '22222222-2222-2222-2222-222222222222';
const CONTRACT_ID = '33333333-3333-3333-3333-333333333333';
const ADMIN_ID = '44444444-4444-4444-4444-444444444444';

const mockVehicle = {
  id: VEHICLE_ID,
  make: 'Volkswagen',
  model: 'Golf',
  year: 2024,
  netPrice: '28000.00',
  co2Emissions: 118,
  novaRate: '3.56',
  usefulLifeMonths: 96,
  imageUrl: null,
  createdAt: new Date(),
};

const mockCustomer = {
  id: CUSTOMER_ID,
  email: 'test@example.com',
  passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/o3LQwAaGq', // 'Password1!'
  firstName: 'Max',
  lastName: 'Mustermann',
  role: 'CUSTOMER',
  createdAt: new Date(),
};

const mockSystemConfigs = [
  { key: 'EURIBOR_RATE', value: '0.039', updatedBy: 'seed', updatedAt: new Date() },
  { key: 'LIQUIDITY_COST', value: '0.005', updatedBy: 'seed', updatedAt: new Date() },
  { key: 'FUNDING_COST', value: '0.003', updatedBy: 'seed', updatedAt: new Date() },
  { key: 'CAPITAL_COST', value: '0.004', updatedBy: 'seed', updatedAt: new Date() },
  { key: 'RISK_PREMIUM', value: '0.003', updatedBy: 'seed', updatedAt: new Date() },
  { key: 'PROCESS_COST', value: '0.002', updatedBy: 'seed', updatedAt: new Date() },
  { key: 'LENDER_MARGIN', value: '0.015', updatedBy: 'seed', updatedAt: new Date() },
  { key: 'OPERATING_COST_PER_CONTRACT', value: '500', updatedBy: 'seed', updatedAt: new Date() },
];

const mockContract = {
  id: CONTRACT_ID,
  customerId: CUSTOMER_ID,
  vehicleId: VEHICLE_ID,
  contractType: ContractType.VOLL_AMORTISATION,
  gik: '25000.00',
  novaAmount: '1000.00',
  residualValue: '0.00',
  termMonths: 48,
  nominalRate: '0.0710',
  effectiveRate: '0.0735',
  monthlyPayment: '598.00',
  advancePayment: '0.00',
  deposit: '0.00',
  euriborRate: '0.0390',
  lenderMargin: '0.0150',
  liquidityCost: '0.0050',
  riskPremium: '0.0030',
  contractFee: '287.00',
  vatAmount: '5740.00',
  status: ContractStatus.UNDER_REVIEW,
  rejectionReason: null,
  createdAt: new Date(),
  approvedAt: null,
  approvedBy: null,
};

const mockScheduleRows = Array.from({ length: 48 }, (_, i) => ({
  id: `row-${i}`,
  contractId: CONTRACT_ID,
  period: i + 1,
  payment: '598.00',
  interest: '60.00',
  principal: '538.00',
  capitalAfterPayment: `${25000 - (i + 1) * 538}.00`,
  capitalAtPeriodEnd: `${25000 - (i + 1) * 538}.00`,
}));

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    customer: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    vehicle: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    leasingContract: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    amortizationRow: {
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    contractProfitability: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    creditCheck: {
      upsert: jest.fn(),
    },
    systemConfig: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

// Grab mock instance after jest.mock hoisting
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── JWT helper ───────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';

function customerToken() {
  return jwt.sign(
    { userId: CUSTOMER_ID, email: 'test@example.com', role: 'CUSTOMER' },
    'dev-secret-change-in-prod',
    { expiresIn: '1h' }
  );
}

function adminToken() {
  return jwt.sign(
    { userId: ADMIN_ID, email: 'admin@leasing.at', role: 'ADMIN' },
    'dev-secret-change-in-prod',
    { expiresIn: '1h' }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'dev-secret-change-in-prod';
  (prisma.systemConfig.findMany as jest.Mock).mockResolvedValue(mockSystemConfigs);
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('creates account and returns token', async () => {
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.customer.create as jest.Mock).mockResolvedValue({
      id: CUSTOMER_ID,
      email: 'new@example.com',
      firstName: 'Anna',
      lastName: 'Muster',
      role: 'CUSTOMER',
    });

    const res = await request(app).post('/api/auth/register').send({
      email: 'new@example.com',
      password: 'Password1!',
      firstName: 'Anna',
      lastName: 'Muster',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('new@example.com');
  });

  it('rejects duplicate email with 409', async () => {
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue(mockCustomer);

    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'Password1!',
      firstName: 'Max',
      lastName: 'Mustermann',
    });

    expect(res.status).toBe(409);
  });

  it('rejects invalid email with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'Password1!',
      firstName: 'Max',
      lastName: 'Mustermann',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
  });

  it('rejects password shorter than 8 chars with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'x@example.com',
      password: 'short',
      firstName: 'A',
      lastName: 'B',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('returns token for valid credentials', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Password1!', 1);
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ ...mockCustomer, passwordHash: hash });

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'Password1!',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('returns 401 for unknown email', async () => {
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app).post('/api/auth/login').send({
      email: 'ghost@example.com',
      password: 'Password1!',
    });

    expect(res.status).toBe(401);
  });

  it('rejects missing body fields with 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'x@example.com' });
    expect(res.status).toBe(400);
  });
});

// ─── Vehicles ─────────────────────────────────────────────────────────────────

describe('GET /api/vehicles', () => {
  it('returns vehicle list', async () => {
    (prisma.vehicle.findMany as jest.Mock).mockResolvedValue([mockVehicle]);

    const res = await request(app).get('/api/vehicles');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].make).toBe('Volkswagen');
  });
});

describe('GET /api/vehicles/:id', () => {
  it('returns vehicle with novaBreakdown', async () => {
    (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(mockVehicle);

    const res = await request(app).get(`/api/vehicles/${VEHICLE_ID}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('novaBreakdown');
    expect(res.body.novaBreakdown).toHaveProperty('taxRate');
    expect(res.body.novaBreakdown).toHaveProperty('novaAmount');
    expect(res.body.novaBreakdown).toHaveProperty('leasingRefund');
  });

  it('returns 404 for unknown vehicle', async () => {
    (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get(`/api/vehicles/${VEHICLE_ID}`);
    expect(res.status).toBe(404);
  });
});

// ─── Quote ────────────────────────────────────────────────────────────────────

describe('POST /api/leasing/quote', () => {
  const validQuote = {
    vehicleId: VEHICLE_ID,
    contractType: 'VOLL_AMORTISATION',
    termMonths: 48,
    advancePayment: 0,
    residualValue: 0,
  };

  beforeEach(() => {
    (prisma.vehicle.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockVehicle);
  });

  it('returns quote with monthlyPayment, nominalRate, effectiveRate, schedule', async () => {
    const res = await request(app).post('/api/leasing/quote').send(validQuote);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('monthlyPayment');
    expect(res.body).toHaveProperty('nominalRate');
    expect(res.body).toHaveProperty('effectiveRate');
    expect(res.body).toHaveProperty('gik');
    expect(res.body.schedule).toHaveLength(48);
  });

  it('rejects term below 38 months with 400', async () => {
    const res = await request(app)
      .post('/api/leasing/quote')
      .send({ ...validQuote, termMonths: 12 });
    expect(res.status).toBe(400);
  });

  it('rejects term above 84 months with 400', async () => {
    const res = await request(app)
      .post('/api/leasing/quote')
      .send({ ...validQuote, termMonths: 90 });
    expect(res.status).toBe(400);
  });

  it('rejects non-uuid vehicleId with 400', async () => {
    const res = await request(app)
      .post('/api/leasing/quote')
      .send({ ...validQuote, vehicleId: 'not-a-uuid' });
    expect(res.status).toBe(400);
  });

  it('rejects advance payment exceeding 30% cap', async () => {
    const res = await request(app)
      .post('/api/leasing/quote')
      .send({ ...validQuote, advancePayment: 10000 }); // > 30% of 28000
    expect(res.status).toBe(500); // engine throws, caught by error handler
  });
});

// ─── Lease application ────────────────────────────────────────────────────────

describe('POST /api/leasing/apply', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/api/leasing/apply').send({});
    expect(res.status).toBe(401);
  });

  it('creates contract and returns it', async () => {
    (prisma.vehicle.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockVehicle);
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: Function) =>
      fn({
        leasingContract: { create: jest.fn().mockResolvedValue(mockContract) },
        amortizationRow: { createMany: jest.fn().mockResolvedValue({ count: 48 }) },
      })
    );

    const res = await request(app)
      .post('/api/leasing/apply')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({
        vehicleId: VEHICLE_ID,
        contractType: 'VOLL_AMORTISATION',
        termMonths: 48,
        advancePayment: 0,
        residualValue: 0,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(CONTRACT_ID);
    expect(res.body.status).toBe(ContractStatus.UNDER_REVIEW);
  });
});

// ─── Customer contract endpoints ──────────────────────────────────────────────

describe('GET /api/leasing/contracts', () => {
  it('returns own contracts', async () => {
    (prisma.leasingContract.findMany as jest.Mock).mockResolvedValue([
      { ...mockContract, vehicle: mockVehicle },
    ]);

    const res = await request(app)
      .get('/api/leasing/contracts')
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/leasing/contracts');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/leasing/contracts/:id/secci', () => {
  it('returns SECCI data with required fields', async () => {
    (prisma.leasingContract.findFirst as jest.Mock).mockResolvedValue({
      ...mockContract,
      vehicle: mockVehicle,
      customer: { firstName: 'Max', lastName: 'Mustermann', email: 'test@example.com' },
    });

    const res = await request(app)
      .get(`/api/leasing/contracts/${CONTRACT_ID}/secci`)
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nominalRate');
    expect(res.body).toHaveProperty('effectiveRate');
    expect(res.body).toHaveProperty('monthlyPayment');
    expect(res.body).toHaveProperty('totalCost');
    expect(res.body).toHaveProperty('contractFee');
  });
});

// ─── Credit check ─────────────────────────────────────────────────────────────

describe('POST /api/leasing/contracts/:id/credit-check', () => {
  it('passes when disposable income > 1.2x monthly payment', async () => {
    (prisma.leasingContract.findFirst as jest.Mock).mockResolvedValue(mockContract);
    (prisma.creditCheck.upsert as jest.Mock).mockResolvedValue({
      id: 'cc-1',
      contractId: CONTRACT_ID,
      result: 'PASSED',
      score: 80,
    });

    const res = await request(app)
      .post(`/api/leasing/contracts/${CONTRACT_ID}/credit-check`)
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({
        monthlyIncome: 3000,
        monthlyExpenses: 800,
        existingObligations: 200,
      });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('PASSED');
  });

  it('fails when disposable income insufficient', async () => {
    (prisma.leasingContract.findFirst as jest.Mock).mockResolvedValue(mockContract);
    (prisma.creditCheck.upsert as jest.Mock).mockResolvedValue({
      id: 'cc-2',
      contractId: CONTRACT_ID,
      result: 'FAILED',
      score: 10,
    });

    const res = await request(app)
      .post(`/api/leasing/contracts/${CONTRACT_ID}/credit-check`)
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({
        monthlyIncome: 800,
        monthlyExpenses: 700,
        existingObligations: 0,
      });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('FAILED');
  });

  it('rejects missing required fields with 400', async () => {
    const res = await request(app)
      .post(`/api/leasing/contracts/${CONTRACT_ID}/credit-check`)
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ monthlyIncome: 2000 }); // missing monthlyExpenses + existingObligations

    expect(res.status).toBe(400);
  });
});

// ─── Admin: approve / reject ──────────────────────────────────────────────────

describe('PUT /api/admin/contracts/:id/approve', () => {
  it('approves contract and creates profitability record atomically', async () => {
    (prisma.leasingContract.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      ...mockContract,
      amortizationSchedule: mockScheduleRows,
    });
    const mockCustomerData = { email: 'test@example.com', firstName: 'Max', lastName: 'Mustermann' };
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: Function) =>
      fn({
        leasingContract: {
          update: jest.fn().mockResolvedValue({
            ...mockContract,
            status: ContractStatus.APPROVED,
            customer: mockCustomerData,
          }),
        },
        contractProfitability: { create: jest.fn().mockResolvedValue({ id: 'prof-1' }) },
      })
    );

    const res = await request(app)
      .put(`/api/admin/contracts/${CONTRACT_ID}/approve`)
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(ContractStatus.APPROVED);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('returns 403 for CUSTOMER token', async () => {
    const res = await request(app)
      .put(`/api/admin/contracts/${CONTRACT_ID}/approve`)
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/admin/contracts/:id/reject', () => {
  it('rejects with reason stored', async () => {
    (prisma.leasingContract.update as jest.Mock).mockResolvedValue({
      ...mockContract,
      status: ContractStatus.REJECTED,
      rejectionReason: 'Credit score insufficient',
      customer: { email: 'test@example.com', firstName: 'Max', lastName: 'Mustermann' },
    });

    const res = await request(app)
      .put(`/api/admin/contracts/${CONTRACT_ID}/reject`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ reason: 'Credit score insufficient' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(ContractStatus.REJECTED);
  });

  it('rejects empty reason with 400 (§7 VKrG)', async () => {
    const res = await request(app)
      .put(`/api/admin/contracts/${CONTRACT_ID}/reject`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ reason: '' });

    expect(res.status).toBe(400);
  });

  it('rejects missing reason body with 400', async () => {
    const res = await request(app)
      .put(`/api/admin/contracts/${CONTRACT_ID}/reject`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ─── Admin: dashboard + config ────────────────────────────────────────────────

describe('GET /api/admin/dashboard', () => {
  it('returns all KPI fields', async () => {
    (prisma.leasingContract.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.contractProfitability.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.leasingContract.groupBy as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalPortfolioVolume');
    expect(res.body).toHaveProperty('averageMarginPct');
    expect(res.body).toHaveProperty('averageSpread');
    expect(res.body).toHaveProperty('totalNetProfit');
    expect(res.body).toHaveProperty('lossMakingContracts');
    expect(res.body).toHaveProperty('contractsByStatus');
  });
});

describe('PUT /api/admin/config', () => {
  it('rejects non-numeric values with 400', async () => {
    const res = await request(app)
      .put('/api/admin/config')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ EURIBOR_RATE: 'not-a-number' });

    expect(res.status).toBe(400);
  });

  it('accepts valid numeric config update', async () => {
    (prisma.systemConfig.upsert as jest.Mock).mockResolvedValue({
      key: 'EURIBOR_RATE',
      value: '0.042',
    });

    const res = await request(app)
      .put('/api/admin/config')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ EURIBOR_RATE: '0.042' });

    expect(res.status).toBe(200);
  });

  it('rejects empty body with 400', async () => {
    const res = await request(app)
      .put('/api/admin/config')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({});

    expect(res.status).toBe(400);
  });
});
