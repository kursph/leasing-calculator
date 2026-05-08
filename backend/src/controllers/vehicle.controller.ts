import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateNoVA } from '../engine/NovaCalculator';

const prisma = new PrismaClient();

export async function listVehicles(_req: Request, res: Response): Promise<void> {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(vehicles);
}

export async function getVehicle(req: Request, res: Response): Promise<void> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params['id'] as string },
  });
  if (!vehicle) {
    res.status(404).json({ error: 'Vehicle not found' });
    return;
  }

  const novaBreakdown = calculateNoVA(
    vehicle.co2Emissions,
    Number(vehicle.netPrice),
    vehicle.year
  );

  res.json({ ...vehicle, novaBreakdown });
}
