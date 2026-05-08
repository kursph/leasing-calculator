import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';

const LABELS: Record<string, { label: string; hint: string }> = {
  EURIBOR_RATE:                { label: 'EURIBOR Base Rate', hint: 'Current 3-month EURIBOR (e.g. 0.039 = 3.9%)' },
  LIQUIDITY_COST:              { label: 'Liquidity Cost', hint: 'Funding liquidity premium' },
  FUNDING_COST:                { label: 'Funding Cost', hint: 'Capital market funding spread' },
  CAPITAL_COST:                { label: 'Capital Cost', hint: 'Equity capital allocation cost' },
  RISK_PREMIUM:                { label: 'Risk Premium', hint: 'Credit risk allowance' },
  PROCESS_COST:                { label: 'Process Cost', hint: 'Operational processing cost' },
  LENDER_MARGIN:               { label: 'Lender Margin (Profit)', hint: 'THE profit component — spread above refinancing cost' },
  OPERATING_COST_PER_CONTRACT: { label: 'Operating Cost / Contract (EUR)', hint: 'Fixed cost charged per contract (flat EUR amount)' },
};

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-sm">
      <div class="section-header mb-8">
        <div>
          <h1>Rate Configuration</h1>
          <p class="text-sm text-slate-500 mt-1">Changes apply to new quotes only — existing contracts are unaffected</p>
        </div>
      </div>

      @if (config) {
        <!-- Nominal rate preview -->
        <div class="card bg-indigo-50 border-indigo-200 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Current Nominal Rate (preview)</p>
              <p class="text-3xl font-bold text-indigo-700 mt-1">{{ nominalRatePct() }}%</p>
            </div>
            <div class="text-right text-xs text-indigo-600 space-y-0.5">
              <p>EURIBOR {{ pct('EURIBOR_RATE') }}</p>
              <p>+ Costs {{ costsSum() }}</p>
              <p class="font-bold">+ Margin {{ pct('LENDER_MARGIN') }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="space-y-5">
            @for (key of configKeys; track key) {
              <div class="field" [class.border-l-4]="key === 'LENDER_MARGIN'"
                [class.border-emerald-400]="key === 'LENDER_MARGIN'"
                [class.pl-4]="key === 'LENDER_MARGIN'">
                <label class="label">
                  {{ meta(key).label }}
                  @if (key === 'LENDER_MARGIN') {
                    <span class="ml-2 badge-approved text-xs">Profit component</span>
                  }
                </label>
                <div class="flex items-center gap-3">
                  <input [(ngModel)]="config[key]" type="number" step="0.001" min="0"
                    class="input max-w-xs font-mono text-right" />
                  @if (key !== 'OPERATING_COST_PER_CONTRACT') {
                    <span class="text-sm text-slate-500">= {{ toPercent(config[key]) }}%</span>
                  }
                </div>
                <p class="text-xs text-slate-400 mt-1">{{ meta(key).hint }}</p>
              </div>
            }
          </div>

          @if (message) {
            <div class="mt-5" [class]="isError ? 'alert-error' : 'alert-success'">{{ message }}</div>
          }

          <div class="flex gap-3 mt-6 pt-5 border-t border-slate-100">
            <button (click)="save()" [disabled]="saving" class="btn-primary">
              @if (saving) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              }
              {{ saving ? 'Saving…' : 'Save Configuration' }}
            </button>
            <p class="text-xs text-slate-400 self-center">Applies to new quotes immediately</p>
          </div>
        </div>
      }
    </div>
  `,
})
export class ConfigComponent implements OnInit {
  config: Record<string, string> | null = null;
  configKeys = Object.keys(LABELS);
  saving = false;
  message = '';
  isError = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.adminGetConfig().subscribe((c) => (this.config = c));
  }

  meta(key: string) { return LABELS[key] ?? { label: key, hint: '' }; }

  toPercent(v: string): string {
    return (parseFloat(v || '0') * 100).toFixed(3);
  }

  nominalRatePct(): string {
    if (!this.config) return '—';
    const keys = ['EURIBOR_RATE','LIQUIDITY_COST','FUNDING_COST','CAPITAL_COST','RISK_PREMIUM','PROCESS_COST','LENDER_MARGIN'];
    const sum = keys.reduce((a, k) => a + parseFloat(this.config![k] || '0'), 0);
    return (sum * 100).toFixed(3);
  }

  pct(key: string): string {
    return this.config ? `${(parseFloat(this.config[key] || '0') * 100).toFixed(2)}%` : '—';
  }

  costsSum(): string {
    if (!this.config) return '—';
    const keys = ['LIQUIDITY_COST','FUNDING_COST','CAPITAL_COST','RISK_PREMIUM','PROCESS_COST'];
    const sum = keys.reduce((a, k) => a + parseFloat(this.config![k] || '0'), 0);
    return `${(sum * 100).toFixed(3)}%`;
  }

  save(): void {
    if (!this.config) return;
    this.saving = true;
    this.api.adminUpdateConfig(this.config).subscribe({
      next: () => { this.message = 'Configuration saved successfully.'; this.isError = false; this.saving = false; },
      error: (err: any) => { this.message = err.error?.error || 'Save failed'; this.isError = true; this.saving = false; },
    });
  }
}
