import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { Role } from '../types';
import * as auth from '../controllers/auth.controller';
import * as vehicles from '../controllers/vehicle.controller';
import * as leasing from '../controllers/leasing.controller';
import * as admin from '../controllers/admin.controller';
import {
  registerSchema,
  loginSchema,
  quoteSchema,
  applySchema,
  creditCheckSchema,
  rejectSchema,
  configUpdateSchema,
} from '../schemas';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Registration and login
 *   - name: Vehicles
 *     description: Vehicle catalogue
 *   - name: Leasing
 *     description: Customer lease operations
 *   - name: Admin
 *     description: Back-office operations (ADMIN role)
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new customer account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *     responses:
 *       201:
 *         description: Account created — returns JWT token
 *       409:
 *         description: Email already registered
 */
router.post('/auth/register', validateBody(registerSchema), auth.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: JWT token + user object
 *       401:
 *         description: Invalid credentials
 */
router.post('/auth/login', validateBody(loginSchema), auth.login);

// ─── Vehicles ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /vehicles:
 *   get:
 *     tags: [Vehicles]
 *     summary: List all leasable vehicles
 *     responses:
 *       200:
 *         description: Array of vehicles
 */
router.get('/vehicles', vehicles.listVehicles);

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     tags: [Vehicles]
 *     summary: Vehicle detail with NoVA breakdown
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Vehicle + novaBreakdown (taxRate, novaAmount, leasingRefund)
 *       404:
 *         description: Vehicle not found
 */
router.get('/vehicles/:id', vehicles.getVehicle);

// ─── Leasing (public quote) ───────────────────────────────────────────────────

/**
 * @swagger
 * /leasing/quote:
 *   post:
 *     tags: [Leasing]
 *     summary: Calculate monthly rate (no contract created)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, contractType, termMonths, advancePayment, residualValue]
 *             properties:
 *               vehicleId: { type: string, format: uuid }
 *               contractType: { type: string, enum: [VOLL_AMORTISATION, TEIL_AMORTISATION, OPERATING] }
 *               termMonths: { type: integer, minimum: 38, maximum: 84 }
 *               advancePayment: { type: number, minimum: 0 }
 *               residualValue: { type: number, minimum: 0 }
 *               deposit: { type: number, minimum: 0 }
 *     responses:
 *       200:
 *         description: gik, monthlyPayment, nominalRate, effectiveRate, totalCost, schedule[]
 *       400:
 *         description: Validation error or Austrian law violation
 */
router.post('/leasing/quote', validateBody(quoteSchema), leasing.getQuote);

// ─── Leasing (authenticated customer) ────────────────────────────────────────

/**
 * @swagger
 * /leasing/apply:
 *   post:
 *     tags: [Leasing]
 *     summary: Submit full lease application
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuoteInput'
 *     responses:
 *       201:
 *         description: Contract created with status UNDER_REVIEW
 *       400:
 *         description: Validation or Austrian law violation
 */
router.post(
  '/leasing/apply',
  authenticate,
  requireRole(Role.CUSTOMER),
  validateBody(applySchema),
  leasing.applyForLease
);

/**
 * @swagger
 * /leasing/contracts:
 *   get:
 *     tags: [Leasing]
 *     summary: List own contracts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of LeasingContract
 */
router.get('/leasing/contracts', authenticate, requireRole(Role.CUSTOMER), leasing.listContracts);

/**
 * @swagger
 * /leasing/contracts/{id}:
 *   get:
 *     tags: [Leasing]
 *     summary: Contract detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Full contract with vehicle
 *       404:
 *         description: Not found
 */
router.get('/leasing/contracts/:id', authenticate, requireRole(Role.CUSTOMER), leasing.getContract);

/**
 * @swagger
 * /leasing/contracts/{id}/schedule:
 *   get:
 *     tags: [Leasing]
 *     summary: Full amortisation schedule
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Array of AmortizationRow (period, payment, interest, principal, capital)
 */
router.get(
  '/leasing/contracts/:id/schedule',
  authenticate,
  requireRole(Role.CUSTOMER),
  leasing.getAmortizationSchedule
);

/**
 * @swagger
 * /leasing/contracts/{id}/secci:
 *   get:
 *     tags: [Leasing]
 *     summary: SECCI pre-contract information form (§6 VKrG)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: SECCI data object (nominal rate, APR, total cost, all required disclosures)
 */
router.get('/leasing/contracts/:id/secci', authenticate, requireRole(Role.CUSTOMER), leasing.getSecci);

/**
 * @swagger
 * /leasing/contracts/{id}/pdf:
 *   get:
 *     tags: [Leasing]
 *     summary: Download contract PDF
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: PDF binary stream
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 */
router.get(
  '/leasing/contracts/:id/pdf',
  authenticate,
  requireRole(Role.CUSTOMER),
  leasing.downloadContractPdf
);

/**
 * @swagger
 * /leasing/contracts/{id}/credit-check:
 *   post:
 *     tags: [Leasing]
 *     summary: Submit credit check self-declaration (§7 VKrG)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [monthlyIncome, monthlyExpenses, existingObligations]
 *             properties:
 *               monthlyIncome: { type: number, minimum: 0 }
 *               monthlyExpenses: { type: number, minimum: 0 }
 *               existingObligations: { type: number, minimum: 0 }
 *               idDocumentUrl: { type: string, format: uri }
 *               incomeProofUrl: { type: string, format: uri }
 *     responses:
 *       200:
 *         description: CreditCheck result (PASSED / FAILED / MANUAL_REVIEW)
 */
router.post(
  '/leasing/contracts/:id/credit-check',
  authenticate,
  requireRole(Role.CUSTOMER),
  validateBody(creditCheckSchema),
  leasing.submitCreditCheck
);

// ─── Admin ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/contracts:
 *   get:
 *     tags: [Admin]
 *     summary: List all contracts with optional status filter
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, UNDER_REVIEW, APPROVED, REJECTED, ACTIVE, CLOSED]
 *     responses:
 *       200:
 *         description: Array of contracts with customer + vehicle info
 */
router.get('/admin/contracts', authenticate, requireRole(Role.ADMIN), admin.listAllContracts);

/**
 * @swagger
 * /admin/contracts/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Full contract detail including credit check and profitability
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Contract with all relations
 */
router.get('/admin/contracts/:id', authenticate, requireRole(Role.ADMIN), admin.getContractAdmin);

/**
 * @swagger
 * /admin/contracts/{id}/approve:
 *   put:
 *     tags: [Admin]
 *     summary: Approve contract — atomically creates ContractProfitability record
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Updated contract with status APPROVED
 */
router.put(
  '/admin/contracts/:id/approve',
  authenticate,
  requireRole(Role.ADMIN),
  admin.approveContract
);

/**
 * @swagger
 * /admin/contracts/{id}/reject:
 *   put:
 *     tags: [Admin]
 *     summary: Reject contract with mandatory reason (§7 VKrG)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Updated contract with status REJECTED and rejectionReason stored
 *       400:
 *         description: Missing rejection reason
 */
router.put(
  '/admin/contracts/:id/reject',
  authenticate,
  requireRole(Role.ADMIN),
  validateBody(rejectSchema),
  admin.rejectContract
);

/**
 * @swagger
 * /admin/contracts/{id}/profitability-preview:
 *   get:
 *     tags: [Admin]
 *     summary: Projected profitability before approval — read-only, no DB write
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Projected ProfitabilityResult (same shape as stored record, not persisted)
 */
router.get(
  '/admin/contracts/:id/profitability-preview',
  authenticate,
  requireRole(Role.ADMIN),
  admin.getProfitabilityPreview
);

/**
 * @swagger
 * /admin/contracts/{id}/profitability:
 *   get:
 *     tags: [Admin]
 *     summary: Per-contract profitability breakdown (spread, margin, refinancing cost)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: ContractProfitability record
 */
router.get(
  '/admin/contracts/:id/profitability',
  authenticate,
  requireRole(Role.ADMIN),
  admin.getProfitability
);

/**
 * @swagger
 * /admin/contracts/{id}/profitability/pdf:
 *   get:
 *     tags: [Admin]
 *     summary: Profitability report as PDF
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: PDF binary stream
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 */
router.get(
  '/admin/contracts/:id/profitability/pdf',
  authenticate,
  requireRole(Role.ADMIN),
  admin.downloadProfitabilityPdf
);

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Aggregated portfolio KPIs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: totalPortfolioVolume, averageMarginPct, averageSpread, totalInterestIncome, totalNetProfit, lossMakingContracts, contractsByStatus
 */
router.get('/admin/dashboard', authenticate, requireRole(Role.ADMIN), admin.getDashboard);

/**
 * @swagger
 * /admin/config:
 *   get:
 *     tags: [Admin]
 *     summary: Current rate and margin configuration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Key-value map of EURIBOR_RATE, LENDER_MARGIN, etc.
 *   put:
 *     tags: [Admin]
 *     summary: Update rate/margin/cost configuration
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               EURIBOR_RATE: { type: string }
 *               LIQUIDITY_COST: { type: string }
 *               FUNDING_COST: { type: string }
 *               CAPITAL_COST: { type: string }
 *               RISK_PREMIUM: { type: string }
 *               PROCESS_COST: { type: string }
 *               LENDER_MARGIN: { type: string }
 *               OPERATING_COST_PER_CONTRACT: { type: string }
 *     responses:
 *       200:
 *         description: Updated SystemConfig records
 */
router.get('/admin/config', authenticate, requireRole(Role.ADMIN), admin.getConfig);
router.put(
  '/admin/config',
  authenticate,
  requireRole(Role.ADMIN),
  validateBody(configUpdateSchema),
  admin.updateConfig
);

export default router;
