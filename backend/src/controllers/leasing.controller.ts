import { Request, Response } from 'express';
import { LeasingService } from '../services/leasing.service';
import { PdfService } from '../services/pdf.service';

const leasingService = new LeasingService();
const pdfService = new PdfService();

export async function getQuote(req: Request, res: Response): Promise<void> {
  const result = await leasingService.calculateQuote(req.body);
  res.json(result);
}

export async function applyForLease(req: Request, res: Response): Promise<void> {
  const contract = await leasingService.createApplication(req.user!.userId, req.body);
  res.status(201).json(contract);
}

export async function listContracts(req: Request, res: Response): Promise<void> {
  const contracts = await leasingService.getCustomerContracts(req.user!.userId);
  res.json(contracts);
}

export async function getContract(req: Request, res: Response): Promise<void> {
  const contract = await leasingService.getContract(req.params['id'] as string, req.user!.userId);
  if (!contract) {
    res.status(404).json({ error: 'Contract not found' });
    return;
  }
  res.json(contract);
}

export async function getAmortizationSchedule(req: Request, res: Response): Promise<void> {
  const schedule = await leasingService.getSchedule(req.params['id'] as string, req.user!.userId);
  if (!schedule) {
    res.status(404).json({ error: 'Contract not found' });
    return;
  }
  res.json(schedule);
}

export async function getSecci(req: Request, res: Response): Promise<void> {
  const secci = await leasingService.generateSecci(req.params['id'] as string, req.user!.userId);
  if (!secci) {
    res.status(404).json({ error: 'Contract not found' });
    return;
  }
  res.json(secci);
}

export async function downloadContractPdf(req: Request, res: Response): Promise<void> {
  const contract = await leasingService.getContract(req.params['id'] as string, req.user!.userId);
  if (!contract) {
    res.status(404).json({ error: 'Contract not found' });
    return;
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="contract-${req.params['id'] as string}.pdf"`);
  await pdfService.generateContractPdf(contract, res);
}

export async function submitCreditCheck(req: Request, res: Response): Promise<void> {
  const result = await leasingService.submitCreditCheck(
    req.params['id'] as string,
    req.user!.userId,
    req.body
  );
  res.json(result);
}
