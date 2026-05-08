import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe, PercentPipe } from '@angular/common';
import { ApiService } from '../../shared/services/api.service';
import { LeasingContract, ScheduleRow } from '../../shared/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, PercentPipe, RouterLink],
  template: `
    <div class="page">
      @if (contract) {
        <!-- Header -->
        <div class="section-header mb-8">
          <div>
            <a routerLink="/customer/contracts" class="text-xs text-slate-500 hover:text-indigo-600 mb-2 block">
              ← Back to contracts
            </a>
            <h1>{{ contract.vehicle?.make }} {{ contract.vehicle?.model }}</h1>
            <div class="flex items-center gap-3 mt-2">
              <span [class]="badgeClass(contract.status)">{{ contract.status }}</span>
              <span class="text-xs text-slate-400">{{ contract.id | slice:0:8 }}…</span>
            </div>
          </div>
          <div class="flex gap-2">
            <button (click)="downloadSecci()" class="btn-ghost" title="Pre-contractual information (§6 VKrG)">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              SECCI
            </button>
            <button (click)="downloadPdf()" class="btn-ghost">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Contract PDF
            </button>
          </div>
        </div>

        <!-- KPI strip -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="stat-card">
            <span class="stat-label">Monthly Payment</span>
            <span class="stat-value text-indigo-600">{{ contract.monthlyPayment | currency:'EUR' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Total GIK</span>
            <span class="stat-value">{{ contract.gik | currency:'EUR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Nominal Rate</span>
            <span class="stat-value">{{ contract.nominalRate | percent:'1.2-2' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">APR (Effective)</span>
            <span class="stat-value">{{ contract.effectiveRate | percent:'1.2-2' }}</span>
          </div>
        </div>

        <!-- Details -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <div class="card">
            <h2 class="mb-4">Contract Details</h2>
            <div class="space-y-0">
              <div class="dl-row">
                <span class="dl-label">Contract Type</span>
                <span class="dl-value">{{ contract.contractType }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Term</span>
                <span class="dl-value">{{ contract.termMonths }} months</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Advance Payment</span>
                <span class="dl-value">{{ contract.advancePayment | currency:'EUR' }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Residual Value</span>
                <span class="dl-value">{{ contract.residualValue | currency:'EUR' }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Contract Stamp Duty</span>
                <span class="dl-value">{{ contract.contractFee | currency:'EUR' }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">VAT (20%)</span>
                <span class="dl-value">{{ contract.vatAmount | currency:'EUR' }}</span>
              </div>
            </div>
          </div>

          <div class="card">
            <h2 class="mb-4">Interest Rate Components</h2>
            <div class="space-y-0">
              <div class="dl-row">
                <span class="dl-label">EURIBOR Base</span>
                <span class="dl-value">{{ contract.euriborRate | percent:'1.3-3' }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Lender Components</span>
                <span class="dl-value text-slate-400">—</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Nominal Rate (total)</span>
                <span class="dl-value font-semibold">{{ contract.nominalRate | percent:'1.3-3' }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Effective Rate / APR</span>
                <span class="dl-value font-semibold text-indigo-600">{{ contract.effectiveRate | percent:'1.3-3' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Amortization schedule -->
        @if (schedule.length > 0) {
          <div class="card p-0 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100">
              <h2>Amortization Schedule</h2>
              <p class="text-xs text-slate-400 mt-0.5">{{ schedule.length }} monthly payments · advance (vorschüssig) · 30/360</p>
            </div>
            <div class="overflow-x-auto max-h-96">
              <table class="table">
                <thead class="sticky top-0">
                  <tr>
                    <th>#</th>
                    <th class="text-right">Payment</th>
                    <th class="text-right">Interest</th>
                    <th class="text-right">Principal</th>
                    <th class="text-right">Remaining Capital</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of schedule; track row.period) {
                    <tr>
                      <td class="text-slate-400 font-mono text-xs">{{ row.period }}</td>
                      <td class="text-right font-medium">{{ row.payment | currency:'EUR' }}</td>
                      <td class="text-right text-amber-600">{{ row.interest | currency:'EUR' }}</td>
                      <td class="text-right text-emerald-600">{{ row.principal | currency:'EUR' }}</td>
                      <td class="text-right text-slate-600">{{ row.capitalAtPeriodEnd | currency:'EUR' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class ContractDetailComponent implements OnInit {
  contract: LeasingContract | null = null;
  schedule: ScheduleRow[] = [];
  private contractId = '';

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    this.contractId = this.route.snapshot.paramMap.get('id')!;
    this.api.getContract(this.contractId).subscribe((c) => (this.contract = c));
    this.api.getSchedule(this.contractId).subscribe((s) => (this.schedule = s));
  }

  downloadSecci(): void {
    this.api.getSecci(this.contractId).subscribe((secci) => {
      const blob = new Blob([JSON.stringify(secci, null, 2)], { type: 'application/json' });
      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(blob);
      anchor.download = `SECCI-${this.contractId}.json`;
      anchor.click();
      URL.revokeObjectURL(anchor.href);
    });
  }

  downloadPdf(): void {
    this.api.downloadPdf(
      `${environment.apiUrl}/leasing/contracts/${this.contractId}/pdf`,
      `contract-${this.contractId}.pdf`
    );
  }

  badgeClass(status: string): string {
    const map: Record<string, string> = {
      APPROVED: 'badge-approved', ACTIVE: 'badge-active',
      UNDER_REVIEW: 'badge-review', REJECTED: 'badge-rejected',
      DRAFT: 'badge-draft', CLOSED: 'badge-closed',
    };
    return map[status] ?? 'badge-draft';
  }
}
