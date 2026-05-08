import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { Role } from '../types';
import * as auth from '../controllers/auth.controller';
import * as vehicles from '../controllers/vehicle.controller';
import * as leasing from '../controllers/leasing.controller';
import * as admin from '../controllers/admin.controller';

const router = Router();

// Auth
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);

// Vehicles (public)
router.get('/vehicles', vehicles.listVehicles);
router.get('/vehicles/:id', vehicles.getVehicle);

// Quote (public)
router.post('/leasing/quote', leasing.getQuote);

// Customer routes
router.post('/leasing/apply', authenticate, requireRole(Role.CUSTOMER), leasing.applyForLease);
router.get('/leasing/contracts', authenticate, requireRole(Role.CUSTOMER), leasing.listContracts);
router.get('/leasing/contracts/:id', authenticate, requireRole(Role.CUSTOMER), leasing.getContract);
router.get('/leasing/contracts/:id/schedule', authenticate, requireRole(Role.CUSTOMER), leasing.getAmortizationSchedule);
router.get('/leasing/contracts/:id/secci', authenticate, requireRole(Role.CUSTOMER), leasing.getSecci);
router.get('/leasing/contracts/:id/pdf', authenticate, requireRole(Role.CUSTOMER), leasing.downloadContractPdf);
router.post('/leasing/contracts/:id/credit-check', authenticate, requireRole(Role.CUSTOMER), leasing.submitCreditCheck);

// Admin routes
router.get('/admin/contracts', authenticate, requireRole(Role.ADMIN), admin.listAllContracts);
router.get('/admin/contracts/:id', authenticate, requireRole(Role.ADMIN), admin.getContractAdmin);
router.put('/admin/contracts/:id/approve', authenticate, requireRole(Role.ADMIN), admin.approveContract);
router.put('/admin/contracts/:id/reject', authenticate, requireRole(Role.ADMIN), admin.rejectContract);
router.get('/admin/contracts/:id/profitability', authenticate, requireRole(Role.ADMIN), admin.getProfitability);
router.get('/admin/contracts/:id/profitability/pdf', authenticate, requireRole(Role.ADMIN), admin.downloadProfitabilityPdf);
router.get('/admin/dashboard', authenticate, requireRole(Role.ADMIN), admin.getDashboard);
router.get('/admin/config', authenticate, requireRole(Role.ADMIN), admin.getConfig);
router.put('/admin/config', authenticate, requireRole(Role.ADMIN), admin.updateConfig);

export default router;
