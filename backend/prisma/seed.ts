import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // System config defaults
  const configs = [
    { key: 'EURIBOR_RATE', value: '0.039' },
    { key: 'LIQUIDITY_COST', value: '0.005' },
    { key: 'FUNDING_COST', value: '0.003' },
    { key: 'CAPITAL_COST', value: '0.004' },
    { key: 'RISK_PREMIUM', value: '0.003' },
    { key: 'PROCESS_COST', value: '0.002' },
    { key: 'LENDER_MARGIN', value: '0.015' },
    { key: 'OPERATING_COST_PER_CONTRACT', value: '500' },
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

  // Sample vehicles
  const vehicles = [
    { make: 'Volkswagen', model: 'Golf', year: 2024, netPrice: 28000, co2Emissions: 118, novaRate: 3.56, usefulLifeMonths: 96 },
    { make: 'BMW', model: '3 Series', year: 2024, netPrice: 45000, co2Emissions: 132, novaRate: 6.4, usefulLifeMonths: 96 },
    { make: 'Tesla', model: 'Model 3', year: 2024, netPrice: 42000, co2Emissions: 0, novaRate: 0, usefulLifeMonths: 96 },
    { make: 'Audi', model: 'A4', year: 2024, netPrice: 38000, co2Emissions: 124, novaRate: 4.8, usefulLifeMonths: 96 },
    { make: 'Skoda', model: 'Octavia', year: 2024, netPrice: 24000, co2Emissions: 112, novaRate: 2.4, usefulLifeMonths: 96 },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { id: `seed-${v.make}-${v.model}`.toLowerCase().replace(/\s+/g, '-') },
      create: { ...v, id: `seed-${v.make}-${v.model}`.toLowerCase().replace(/\s+/g, '-') },
      update: {},
    });
  }

  console.log('Seed complete');
}

main().finally(() => prisma.$disconnect());
