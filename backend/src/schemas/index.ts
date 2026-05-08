import { z } from 'zod';
import { ContractType } from '../types';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const quoteSchema = z.object({
  vehicleId: z.string().uuid(),
  contractType: z.nativeEnum(ContractType),
  termMonths: z.number().int().min(38).max(84),
  advancePayment: z.number().min(0),
  residualValue: z.number().min(0),
  deposit: z.number().min(0).optional().default(0),
});

export const applySchema = quoteSchema;

export const creditCheckSchema = z.object({
  monthlyIncome: z.number().positive(),
  monthlyExpenses: z.number().min(0),
  existingObligations: z.number().min(0),
  idDocumentUrl: z.string().url().optional(),
  incomeProofUrl: z.string().url().optional(),
});

export const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason required (§7 VKrG)'),
});

const CONFIG_KEYS = [
  'EURIBOR_RATE',
  'LIQUIDITY_COST',
  'FUNDING_COST',
  'CAPITAL_COST',
  'RISK_PREMIUM',
  'PROCESS_COST',
  'LENDER_MARGIN',
  'OPERATING_COST_PER_CONTRACT',
] as const;

export const configUpdateSchema = z
  .object(
    Object.fromEntries(
      CONFIG_KEYS.map((k) => [k, z.string().regex(/^\d+(\.\d+)?$/, `${k} must be numeric`)])
    ) as Record<(typeof CONFIG_KEYS)[number], z.ZodString>
  )
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, 'At least one config key required');
