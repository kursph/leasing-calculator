import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, CurrencyPipe, PercentPipe } from '@angular/common';
import { ApiService } from '../../shared/services/api.service';
import { Vehicle, QuoteResult } from '../../shared/models';

@Component({
  selector: 'app-configurator',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, CurrencyPipe, PercentPipe],
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <h1 class="text-3xl font-bold mb-2">Configure Your Lease</h1>
      @if (vehicle) {
        <p class="text-gray-500 mb-6">{{ vehicle.make }} {{ vehicle.model }} ({{ vehicle.year }})</p>
      }

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Lease Parameters</h2>
          <form [formGroup]="form" (ngSubmit)="calculate()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Contract Type</label>
              <select formControlName="contractType" class="mt-1 block w-full border rounded px-3 py-2">
                <option value="VOLL_AMORTISATION">Full Amortisation (Vollamortisation)</option>
                <option value="TEIL_AMORTISATION">Partial Amortisation (Teilamortisation)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Term (months)</label>
              <input formControlName="termMonths" type="number" min="38" max="84"
                class="mt-1 block w-full border rounded px-3 py-2" />
              <p class="text-xs text-gray-400 mt-1">Min 38 / Max 84 months (PKW rules)</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Advance Payment (EUR)</label>
              <input formControlName="advancePayment" type="number" min="0"
                class="mt-1 block w-full border rounded px-3 py-2" />
              <p class="text-xs text-gray-400 mt-1">Max 30% of net price</p>
            </div>
            @if (form.get('contractType')?.value === 'TEIL_AMORTISATION') {
              <div>
                <label class="block text-sm font-medium text-gray-700">Residual Value (EUR)</label>
                <input formControlName="residualValue" type="number" min="0"
                  class="mt-1 block w-full border rounded px-3 py-2" />
              </div>
            }
            @if (error) {
              <p class="text-red-600 text-sm">{{ error }}</p>
            }
            <button type="submit" [disabled]="form.invalid || calculating"
              class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
              {{ calculating ? 'Calculating...' : 'Calculate Monthly Rate' }}
            </button>
          </form>
        </div>

        @if (quote) {
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Quote Summary (SECCI)</h2>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between">
                <dt class="text-gray-600">Monthly Payment</dt>
                <dd class="font-bold text-lg text-blue-600">{{ quote.monthlyPayment | currency:'EUR' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-600">GIK (Total Investment)</dt>
                <dd class="font-semibold">{{ quote.gik | currency:'EUR' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-600">Nominal Rate (Sollzinssatz)</dt>
                <dd>{{ quote.nominalRate | percent:'1.2-2' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-600">Effective Rate / APR</dt>
                <dd>{{ quote.effectiveRate | percent:'1.2-2' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-600">Contract Stamp Duty</dt>
                <dd>{{ quote.contractStampDuty | currency:'EUR' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-600">Total Cost</dt>
                <dd class="font-semibold">{{ quote.totalCost | currency:'EUR' }}</dd>
              </div>
              <hr class="my-2">
              <div class="flex justify-between">
                <dt class="text-gray-600">NoVA Amount</dt>
                <dd>{{ quote.novaBreakdown.novaAmount | currency:'EUR' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-600">NoVA Tax Rate</dt>
                <dd>{{ quote.novaBreakdown.taxRate }}%</dd>
              </div>
            </dl>
            <button (click)="applyNow()"
              class="mt-6 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              Apply for this Lease
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class ConfiguratorComponent implements OnInit {
  vehicle: Vehicle | null = null;
  quote: QuoteResult | null = null;
  calculating = false;
  error = '';
  form: ReturnType<FormBuilder['group']>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private api: ApiService
  ) {
    this.form = this.fb.group({
      contractType: ['VOLL_AMORTISATION', Validators.required],
      termMonths: [48, [Validators.required, Validators.min(38), Validators.max(84)]],
      advancePayment: [0, [Validators.required, Validators.min(0)]],
      residualValue: [0, Validators.min(0)],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('vehicleId')!;
    this.api.getVehicle(id).subscribe((v) => (this.vehicle = v));
  }

  calculate(): void {
    if (!this.vehicle) return;
    this.calculating = true;
    this.error = '';
    const { contractType, termMonths, advancePayment, residualValue } = this.form.value;
    this.api.getQuote({
      vehicleId: this.vehicle.id,
      contractType: contractType as any,
      termMonths: termMonths!,
      advancePayment: advancePayment!,
      residualValue: residualValue!,
    }).subscribe({
      next: (q) => { this.quote = q; this.calculating = false; },
      error: (err) => { this.error = err.error?.message || 'Calculation failed'; this.calculating = false; },
    });
  }

  applyNow(): void {
    if (!this.vehicle || !this.quote) return;
    const { contractType, termMonths, advancePayment, residualValue } = this.form.value;
    this.api.applyForLease({
      vehicleId: this.vehicle.id,
      contractType: contractType as any,
      termMonths: termMonths!,
      advancePayment: advancePayment!,
      residualValue: residualValue!,
    }).subscribe({
      next: (contract: any) => this.router.navigate(['/customer/application', contract.id]),
      error: (err: any) => { this.error = err.error?.message || 'Application failed'; },
    });
  }
}
