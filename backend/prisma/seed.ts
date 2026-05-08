import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Stable UUIDs so upsert works across re-runs
const VEHICLE_IDS = {
  VW_GOLF:     'a1000001-0000-4000-8000-000000000001',
  BMW_3:       'a1000002-0000-4000-8000-000000000002',
  TESLA_M3:    'a1000003-0000-4000-8000-000000000003',
  AUDI_A4:     'a1000004-0000-4000-8000-000000000004',
  SKODA_OCT:   'a1000005-0000-4000-8000-000000000005',
};

async function main() {
  // System config defaults
  const configs = [
    { key: 'EURIBOR_RATE',                value: '0.039' },
    { key: 'LIQUIDITY_COST',              value: '0.005' },
    { key: 'FUNDING_COST',               value: '0.003' },
    { key: 'CAPITAL_COST',               value: '0.004' },
    { key: 'RISK_PREMIUM',               value: '0.003' },
    { key: 'PROCESS_COST',               value: '0.002' },
    { key: 'LENDER_MARGIN',              value: '0.015' },
    { key: 'OPERATING_COST_PER_CONTRACT', value: '500'   },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      create: { ...config, updatedBy: 'seed' },
      update: { value: config.value, updatedBy: 'seed' },
    });
  }

  // Admin user
  await prisma.customer.upsert({
    where: { email: 'admin@leasing.at' },
    create: {
      email: 'admin@leasing.at',
      passwordHash: await bcrypt.hash('Admin1234!', 12),
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
    },
    update: {},
  });

  // Demo customer
  await prisma.customer.upsert({
    where: { email: 'demo@leasing.at' },
    create: {
      email: 'demo@leasing.at',
      passwordHash: await bcrypt.hash('Demo1234!', 12),
      firstName: 'Max',
      lastName: 'Mustermann',
    },
    update: {},
  });

  // Sample vehicles with stable UUIDs
  const vehicles = [
    { id: VEHICLE_IDS.VW_GOLF,   make: 'Volkswagen', model: 'Golf',     year: 2024, netPrice: 28000, co2Emissions: 118, novaRate: 3.56, usefulLifeMonths: 96 },
    { id: VEHICLE_IDS.BMW_3,     make: 'BMW',        model: '3 Series',  year: 2024, netPrice: 45000, co2Emissions: 132, novaRate: 6.40, usefulLifeMonths: 96 },
    { id: VEHICLE_IDS.TESLA_M3,  make: 'Tesla',      model: 'Model 3',   year: 2024, netPrice: 42000, co2Emissions: 0,   novaRate: 0,    usefulLifeMonths: 96 },
    { id: VEHICLE_IDS.AUDI_A4,   make: 'Audi',       model: 'A4',        year: 2024, netPrice: 38000, co2Emissions: 124, novaRate: 4.80, usefulLifeMonths: 96 },
    { id: VEHICLE_IDS.SKODA_OCT, make: 'Skoda',      model: 'Octavia',   year: 2024, netPrice: 24000, co2Emissions: 112, novaRate: 2.40, usefulLifeMonths: 96 },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where:  { id: v.id },
      create: v,
      update: {},
    });
  }

  console.log('Seed complete');
}

main().finally(() => prisma.$disconnect());
