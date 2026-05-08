import PDFDocument from 'pdfkit';
import { Response } from 'express';

export class PdfService {
  async generateContractPdf(contract: unknown, res: Response): Promise<void> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    const c = contract as Record<string, unknown>;
    const vehicle = c.vehicle as Record<string, unknown>;

    doc.fontSize(20).text('KFZ Leasing Contract', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Contract ID: ${c.id}`);
    doc.text(`Vehicle: ${vehicle?.make} ${vehicle?.model} (${vehicle?.year})`);
    doc.text(`Monthly Payment: EUR ${Number(c.monthlyPayment).toFixed(2)}`);
    doc.text(`Term: ${c.termMonths} months`);
    doc.text(`Nominal Rate: ${(Number(c.nominalRate) * 100).toFixed(2)}%`);
    doc.text(`Effective Rate (APR): ${(Number(c.effectiveRate) * 100).toFixed(2)}%`);
    doc.text(`Total GIK: EUR ${Number(c.gik).toFixed(2)}`);
    doc.text(`Status: ${c.status}`);
    doc.moveDown();
    doc.fillColor('grey').fontSize(10).text('This document is generated per VKrG 2010 requirements.');

    doc.end();
  }

  async generateProfitabilityPdf(profitability: unknown, res: Response): Promise<void> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    const p = profitability as Record<string, unknown>;

    doc.fontSize(20).text('Contract Profitability Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Contract ID: ${p.contractId}`);
    doc.text(`Net Margin: EUR ${Number(p.netMargin).toFixed(2)}`);
    doc.text(`Margin %: ${Number(p.marginPct).toFixed(2)}%`);
    doc.text(`Spread: ${(Number(p.spread) * 100).toFixed(3)}%`);
    doc.text(`Total Interest Income: EUR ${Number(p.totalInterestIncome).toFixed(2)}`);
    doc.text(`Refinancing Cost: EUR ${Number(p.refinancingCost).toFixed(2)}`);
    doc.text(`Profitable: ${p.isProfit ? 'Yes' : 'No'}`);
    doc.moveDown();
    doc.fillColor('grey').fontSize(10).text('CONFIDENTIAL — Admin use only');

    doc.end();
  }
}
