import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { Role } from '../types';
import { registerSchema, loginSchema } from '../schemas';

const JWT_SECRET = process.env['JWT_SECRET'];
if (!JWT_SECRET) throw new Error('JWT_SECRET env var not set');

export async function register(req: Request, res: Response): Promise<void> {
  const data = req.body as ReturnType<typeof registerSchema.parse>;

  const existing = await prisma.customer.findUnique({ where: { email: data.email } });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const customer = await prisma.customer.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  const token = jwt.sign(
    { userId: customer.id, email: customer.email, role: customer.role },
    JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  res.status(201).json({ token, user: customer });
}

export async function login(req: Request, res: Response): Promise<void> {
  const data = req.body as ReturnType<typeof loginSchema.parse>;

  const customer = await prisma.customer.findUnique({ where: { email: data.email } });
  if (!customer) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(data.password, customer.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    { userId: customer.id, email: customer.email, role: customer.role as Role },
    JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      role: customer.role,
    },
  });
}
