import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ApiService } from '../../shared/services/api.service';
import { Profitability } from '../../shared/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profitability',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  template: `
    <div class="page-sm">
      @if (profitability) {
        <div class="section-header mb-8">
          <div>
            <a [routerLink]="['/admin/contracts', contractId]" class="text-xs text-slate-500 hover:text-indigo-600 mb-2 block">
              ← Back to contract
            </a>
            <h1>Profitability Breakdown</h1>
            <p class="text-sm text-slate-500 mt-1">Contract {{ contractId | slice:0:8 }}…</p>
          </div>
          <button (click)="downloadPdf()" class="btn-ghost">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            PDF Report
          </button>
        </div>

        <!-- Net margin hero -->
        <div class="card mb-5 flex items-center justify-between"
          [class.border-emerald-200]="profitability.isProfit"
          [class.bg-emerald-50]="profitability.isProfit"
          [class.border-red-200]="!profitability.isProfit"
          [class.bg-red-50]="!profitability.isProfit">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide"
              [class.text-emerald-700]="profitability.isProfit"
              [class.text-red-700]="!profitability.isProfit">
              {{ profitability.isProfit ? 'Profitable Contract' : 'Loss-making Contract' }}
            </p>
            <p class="text-3xl font-bold mt-1"
              [class.text-emerald-700]="profitability.isProfit"
              [class.text-red-700]="!profitability.isProfit">
              {{ profitability.netMargin | currency:'EUR' }}
            </p>
            <p class="text-sm mt-1"
              [class.text-emerald-600]="profitability.isProfit"
              [class.text-red-600]="!profitability.isProfit">
              {{ profitability.marginPct | number:'1.2-2' }}% margin on GIK
            </p>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-500">Spread</p>
            <p class="text-2xl font-bold text-indigo-600">{{ (profitability.spread * 100) | number:'1.3-3' }}%</p>
            <p class="text-xs text-slate-500 mt-0.5">Nominal − EURIBOR</p>
          </div>
        </div>

        <!-- Income vs cost breakdown -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div class="card">
            <h2 class="mb-4 text-emerald-700">Income</h2>
            <div class="space-y-0">
              <div class="dl-row">
                <span class="dl-label">Total Payments</span>
                <span class="dl-value text-emerald-600 font-semibold">{{ profitability.totalPayments | currency:'EUR' }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">of which Interest</span>
                <span class="dl-value">{{ profitability.totalInterestIncome | currency:'EUR' }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Contract Fee (1%)</span>
                <span class="dl-value">{{ profitability.contractFeeIncome | currency:'EUR' }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Residual Value Recovery</span>
                <span class="dl-value">{{ profitability.residualValueIncome | currency:'EUR' }}</span>
              </div>
            </div>
          </div>

          <div class="card">
            <h2 class="mb-4 text-red-600">Costs</h2>
            <div class="space-y-0">
              <div class="dl-row">
                <span class="dl-label">Refinancing Cost (EURIBOR)</span>
                <span class="dl-value text-red-600">{{ profitability.refinancingCost | currency:'EUR' }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Operating Cost</span>
                <span class="dl-value text-red-600">{{ profitability.operatingCost | currency:'EUR' }}</span>
              </div>
              <div class="dl-row border-t-2 border-slate-200 pt-2">
                <span class="dl-label font-semibold">Net Margin</span>
                <span class="font-bold" [class.text-emerald-600]="profitability.isProfit" [class.text-red-600]="!profitability.isProfit">
                  {{ profitability.netMargin | currency:'EUR' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProfitabilityComponent implements OnInit {
  profitability: Profitability | null = null;
  contractId = '';

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    this.contractId = this.route.snapshot.paramMap.get('id')!;
    this.api.adminGetProfitability(this.contractId).subscribe((p) => (this.profitability = p));
  }

  downloadPdf(): void {
    this.api.downloadPdf(
      `${environment.apiUrl}/admin/contracts/${this.contractId}/profitability/pdf`,
      `profitability-${this.contractId}.pdf`
    );
  }
}
