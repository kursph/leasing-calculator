import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { LeasingContract, Profitability } from '../../shared/models';

@Component({
  selector: 'app-admin-contract-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, PercentPipe, RouterLink, FormsModule],
  template: `
    <div class="page">
      @if (contract) {
        <!-- Header -->
        <div class="section-header mb-8">
          <div>
            <a routerLink="/admin/contracts" class="text-xs text-slate-500 hover:text-indigo-600 mb-2 block">← Back to contracts</a>
            <h1>{{ contract.vehicle?.make }} {{ contract.vehicle?.model }}</h1>
            <div class="flex items-center gap-3 mt-2">
              <span [class]="badgeClass(contract.status)">{{ contract.status }}</span>
              <span class="text-xs text-slate-400">{{ contract.id | slice:0:8 }}…</span>
            </div>
          </div>
          @if (contract.status === 'APPROVED') {
            <a [routerLink]="['/admin/contracts', contract.id, 'profitability']" class="btn-success">
              View Profitability →
            </a>
          }
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="stat-card">
            <span class="stat-label">GIK</span>
            <span class="stat-value">{{ contract.gik | currency:'EUR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Monthly Payment</span>
            <span class="stat-value text-indigo-600">{{ contract.monthlyPayment | currency:'EUR' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Lender Margin</span>
            <span class="stat-value text-emerald-600">{{ contract.lenderMargin | percent:'1.3-3' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Spread</span>
            <span class="stat-value text-indigo-600">
              {{ ((contract.nominalRate - contract.euriborRate) * 100) | number:'1.3-3' }}%
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <!-- Contract details -->
          <div class="card">
            <h2 class="mb-4">Contract Parameters</h2>
            <div class="space-y-0">
              <div class="dl-row"><span class="dl-label">Type</span><span class="dl-value">{{ contract.contractType }}</span></div>
              <div class="dl-row"><span class="dl-label">Term</span><span class="dl-value">{{ contract.termMonths }} months</span></div>
              <div class="dl-row"><span class="dl-label">Nominal Rate</span><span class="dl-value">{{ contract.nominalRate | percent:'1.3-3' }}</span></div>
              <div class="dl-row"><span class="dl-label">Effective Rate (APR)</span><span class="dl-value">{{ contract.effectiveRate | percent:'1.3-3' }}</span></div>
              <div class="dl-row"><span class="dl-label">EURIBOR Base</span><span class="dl-value">{{ contract.euriborRate | percent:'1.3-3' }}</span></div>
              <div class="dl-row"><span class="dl-label">NoVA Amount</span><span class="dl-value">{{ contract.novaAmount | currency:'EUR' }}</span></div>
            </div>
          </div>

          <!-- Customer -->
          <div class="card">
            <h2 class="mb-4">Customer</h2>
            <div class="space-y-0">
              <div class="dl-row">
                <span class="dl-label">Name</span>
                <span class="dl-value">{{ contract.customer?.firstName }} {{ contract.customer?.lastName }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Email</span>
                <span class="dl-value text-indigo-600">{{ contract.customer?.email }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Credit Check</span>
                <span class="dl-value">
                  @if (contract.creditCheck?.result === 'PASSED') {
                    <span class="badge-approved">PASSED (score {{ contract.creditCheck?.score }})</span>
                  } @else if (contract.creditCheck?.result === 'FAILED') {
                    <span class="badge-rejected">FAILED</span>
                  } @else {
                    <span class="badge-draft">Pending</span>
                  }
                </span>
              </div>
              @if (contract.creditCheck) {
                <div class="dl-row">
                  <span class="dl-label">Monthly Income</span>
                  <span class="dl-value">{{ contract.creditCheck.monthlyIncome | currency:'EUR' }}</span>
                </div>
                <div class="dl-row">
                  <span class="dl-label">Expenses + Obligations</span>
                  <span class="dl-value">
                    {{ (contract.creditCheck.monthlyExpenses + contract.creditCheck.existingObligations) | currency:'EUR' }}
                  </span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Profitability preview (UNDER_REVIEW only) -->
        @if (contract.status === 'UNDER_REVIEW') {
          <div class="card border-indigo-200 bg-indigo-50/40 mb-5">
            <h2 class="mb-1">Projected Profitability</h2>
            <p class="text-xs text-slate-500 mb-4">Calculated from current rates — not yet stored. Finalised on approval.</p>
            @if (preview) {
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div class="stat-card">
                  <span class="stat-label">Net Margin</span>
                  <span [class]="preview.isProfit ? 'stat-value text-emerald-600' : 'stat-value text-red-600'">
                    {{ preview.netMargin | currency:'EUR' }}
                  </span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Margin %</span>
                  <span [class]="preview.isProfit ? 'stat-value text-emerald-600' : 'stat-value text-red-600'">
                    {{ preview.marginPct | number:'1.2-2' }}%
                  </span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Spread</span>
                  <span class="stat-value text-indigo-600">{{ (preview.spread * 100) | number:'1.3-3' }}%</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Interest Income</span>
                  <span class="stat-value">{{ preview.totalInterestIncome | currency:'EUR' }}</span>
                </div>
              </div>
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm">
                <div class="dl-row"><span class="dl-label">Total Payments</span><span class="dl-value">{{ preview.totalPayments | currency:'EUR' }}</span></div>
                <div class="dl-row"><span class="dl-label">Refinancing Cost</span><span class="dl-value text-red-500">{{ preview.refinancingCost | currency:'EUR' }}</span></div>
                <div class="dl-row"><span class="dl-label">Contract Fee Income</span><span class="dl-value">{{ preview.contractFeeIncome | currency:'EUR' }}</span></div>
              </div>
              @if (!preview.isProfit) {
                <div class="alert-error mt-4">
                  Warning: this contract projects a loss. Review rates before approving.
                </div>
              }
            } @else {
              <div class="text-sm text-slate-400 animate-pulse">Calculating…</div>
            }
          </div>
        }

        <!-- Decision panel -->
        @if (contract.status === 'UNDER_REVIEW') {
          <div class="card border-amber-200 bg-amber-50/50">
            <h2 class="mb-4">Decision Required</h2>

            @if (!showReject) {
              <div class="flex gap-3">
                <button (click)="approve()" [disabled]="acting" class="btn-success">
                  @if (acting) {
                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  }
                  Approve Contract
                </button>
                <button (click)="showReject = true" [disabled]="acting" class="btn-danger">
                  Reject
                </button>
              </div>
            } @else {
              <div class="space-y-3">
                <div class="field">
                  <label class="label">Rejection reason <span class="text-red-500">*</span> (required per §7 VKrG)</label>
                  <textarea [(ngModel)]="rejectReason" rows="3"
                    placeholder="Describe the reason for rejection…"
                    class="input resize-none"></textarea>
                </div>
                <div class="flex gap-3">
                  <button (click)="reject()" [disabled]="!rejectReason || acting" class="btn-danger">
                    Confirm Rejection
                  </button>
                  <button (click)="showReject = false" class="btn-ghost">Cancel</button>
                </div>
              </div>
            }

            @if (message) {
              <div class="mt-4" [class]="isError ? 'alert-error' : 'alert-success'">{{ message }}</div>
            }
          </div>
        }

        @if (contract.status === 'REJECTED' && contract.rejectionReason) {
          <div class="alert-error">
            <span class="font-semibold">Rejection reason:</span> {{ contract.rejectionReason }}
          </div>
        }
      }
    </div>
  `,
})
export class AdminContractDetailComponent implements OnInit {
  contract: LeasingContract | null = null;
  preview: Profitability | null = null;
  acting = false;
  showReject = false;
  rejectReason = '';
  message = '';
  isError = false;

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.adminGetContract(id).subscribe((c) => {
      this.contract = c;
      if (c.status === 'UNDER_REVIEW') {
        this.api.adminGetProfitabilityPreview(id).subscribe((p) => (this.preview = p));
      }
    });
  }

  approve(): void {
    if (!this.contract) return;
    this.acting = true;
    this.api.adminApprove(this.contract.id).subscribe({
      next: (c) => { this.contract = c; this.message = 'Contract approved. Profitability record created.'; this.isError = false; this.acting = false; },
      error: (err: any) => { this.message = err.error?.error || 'Approval failed'; this.isError = true; this.acting = false; },
    });
  }

  reject(): void {
    if (!this.contract || !this.rejectReason) return;
    this.acting = true;
    this.api.adminReject(this.contract.id, this.rejectReason).subscribe({
      next: (c) => { this.contract = c; this.message = 'Contract rejected. Customer notified.'; this.isError = false; this.acting = false; },
      error: (err: any) => { this.message = err.error?.error || 'Rejection failed'; this.isError = true; this.acting = false; },
    });
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
