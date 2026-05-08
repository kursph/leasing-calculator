import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto p-6">
      <h1 class="text-3xl font-bold mb-2">Rate Configuration</h1>
      <p class="text-gray-500 mb-6">Changes take effect on next quote calculation</p>

      @if (config) {
        <div class="bg-white rounded-lg shadow p-6 space-y-4">
          @for (key of configKeys; track key) {
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-gray-700 w-48">{{ label(key) }}</label>
              <input [(ngModel)]="config[key]" type="number" step="0.001" min="0"
                class="border rounded px-3 py-1.5 text-sm w-36 text-right" />
            </div>
          }
          @if (message) {
            <p class="text-sm font-medium" [class.text-green-600]="!error" [class.text-red-600]="error">{{ message }}</p>
          }
          <button (click)="save()" [disabled]="saving"
            class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {{ saving ? 'Saving...' : 'Save Configuration' }}
          </button>
        </div>
      }
    </div>
  `,
})
export class ConfigComponent implements OnInit {
  config: Record<string, string> | null = null;
  configKeys = [
    'EURIBOR_RATE', 'LIQUIDITY_COST', 'FUNDING_COST', 'CAPITAL_COST',
    'RISK_PREMIUM', 'PROCESS_COST', 'LENDER_MARGIN', 'OPERATING_COST_PER_CONTRACT',
  ];
  saving = false;
  message = '';
  error = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.adminGetConfig().subscribe((c) => (this.config = c));
  }

  label(key: string): string {
    const map: Record<string, string> = {
      EURIBOR_RATE: 'EURIBOR Base Rate',
      LIQUIDITY_COST: 'Liquidity Cost',
      FUNDING_COST: 'Funding Cost',
      CAPITAL_COST: 'Capital Cost',
      RISK_PREMIUM: 'Risk Premium',
      PROCESS_COST: 'Process Cost',
      LENDER_MARGIN: 'Lender Margin (Profit)',
      OPERATING_COST_PER_CONTRACT: 'Operating Cost / Contract (EUR)',
    };
    return map[key] || key;
  }

  save(): void {
    if (!this.config) return;
    this.saving = true;
    this.api.adminUpdateConfig(this.config).subscribe({
      next: () => { this.message = 'Config saved.'; this.error = false; this.saving = false; },
      error: (err: any) => { this.message = err.error?.error || 'Save failed'; this.error = true; this.saving = false; },
    });
  }
}
