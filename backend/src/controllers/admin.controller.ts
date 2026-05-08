import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { PdfService } from '../services/pdf.service';

const adminService = new AdminService();
const pdfService = new PdfService();

export async function listAllContracts(req: Request, res: Response): Promise<void> {
  const contracts = await adminService.listContracts(req.query);
  res.json(contracts);
}

export async function getContractAdmin(req: Request, res: Response): Promise<void> {
  const contract = await adminService.getContract(req.params['id'] as string);
  if (!contract) {
    res.status(404).json({ error: 'Contract not found' });
    return;
  }
  res.json(contract);
}

export async function approveContract(req: Request, res: Response): Promise<void> {
  const contract = await adminService.approveContract(req.params['id'] as string, req.user!.userId);
  res.json(contract);
}

export async function rejectContract(req: Request, res: Response): Promise<void> {
  const { reason } = req.body;
  if (!reason) {
    res.status(400).json({ error: 'Rejection reason required (§7 VKrG)' });
    return;
  }
  const contract = await adminService.rejectContract(req.params['id'] as string, reason);
  res.json(contract);
}

export async function getProfitability(req: Request, res: Response): Promise<void> {
  const profitability = await adminService.getProfitability(req.params['id'] as string);
  if (!profitability) {
    res.status(404).json({ error: 'Profitability record not found' });
    return;
  }
  res.json(profitability);
}

export async function getDashboard(_req: Request, res: Response): Promise<void> {
  const kpis = await adminService.getDashboardKPIs();
  res.json(kpis);
}

export async function getConfig(_req: Request, res: Response): Promise<void> {
  const config = await adminService.getConfig();
  res.json(config);
}

export async function updateConfig(req: Request, res: Response): Promise<void> {
  const config = await adminService.updateConfig(req.body, req.user!.userId);
  res.json(config);
}

export async function downloadProfitabilityPdf(req: Request, res: Response): Promise<void> {
  const profitability = await adminService.getProfitability(req.params['id'] as string);
  if (!profitability) {
    res.status(404).json({ error: 'Profitability record not found' });
    return;
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="profitability-${req.params.id}.pdf"`
  );
  await pdfService.generateProfitabilityPdf(profitability, res);
}
