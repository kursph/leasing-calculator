import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { CommonModule, CurrencyPipe, PercentPipe } from '@angular/common';
import { ApiService } from '../../shared/services/api.service';
import { Vehicle, QuoteResult } from '../../shared/models';

@Component({
  selector: 'app-configurator',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, CurrencyPipe, PercentPipe, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/customer/vehicles" class="text-xs text-slate-500 hover:text-indigo-600 mb-6 block">
        ← Back to vehicles
      </a>

      @if (vehicle) {
        <div class="section-header mb-8">
          <div>
            <h1>Configure Lease</h1>
            <p class="text-slate-500 text-sm mt-1">
              {{ vehicle.make }} {{ vehicle.model }} · {{ vehicle.year }} ·
              <span class="font-medium text-indigo-600">{{ vehicle.netPrice | currency:'EUR':'symbol':'1.0-0' }}</span>
            </p>
          </div>
          @if (vehicle.co2Emissions === 0) {
            <span class="badge-approved">Zero emission ⚡</span>
          }
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Configuration form -->
        <div class="card">
          <h2 class="mb-6">Lease Parameters</h2>
          <form [formGroup]="form" (ngSubmit)="calculate()" class="space-y-5">

            <div class="field">
              <label class="label">Contract Type</label>
              <select formControlName="contractType" class="input">
                <option value="VOLL_AMORTISATION">Full Amortisation (Vollamortisation)</option>
                <option value="TEIL_AMORTISATION">Partial Amortisation (Teilamortisation)</option>
                <option value="OPERATING">Operating Lease</option>
              </select>
            </div>

            <div class="field">
              <label class="label">
                Lease Term
                <span class="font-normal text-slate-400 ml-1">38 – 84 months</span>
              </label>
              <div class="flex items-center gap-3">
                <input formControlName="termMonths" type="number" min="38" max="84" class="input max-w-32" />
                <span class="text-sm text-slate-500">months</span>
              </div>
              <p class="text-xs text-slate-400 mt-1">PKW: min 40% / max 90% of 8yr useful life</p>
            </div>

            <div class="field">
              <label class="label">
                Advance Payment
                <span class="font-normal text-slate-400 ml-1">max 30% of net price</span>
              </label>
              <div class="flex items-center gap-3">
                <span class="text-slate-500 text-sm">EUR</span>
                <input formControlName="advancePayment" type="number" min="0" class="input" />
              </div>
              @if (vehicle) {
                <p class="text-xs text-slate-400 mt-1">
                  Max: {{ +vehicle.netPrice * 0.3 | currency:'EUR':'symbol':'1.0-0' }}
                </p>
              }
            </div>

            @if (form.get('contractType')?.value === 'TEIL_AMORTISATION') {
              <div class="field">
                <label class="label">Residual Value (EUR)</label>
                <div class="flex items-center gap-3">
                  <span class="text-slate-500 text-sm">EUR</span>
                  <input formControlName="residualValue" type="number" min="0" class="input" />
                </div>
              </div>
            }

            @if (form.get('contractType')?.value === 'OPERATING') {
              <div class="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
                <p class="font-semibold mb-0.5">Operating Lease</p>
                Residual value is determined by the lessor and not disclosed per Austrian tax law (EStR).
              </div>
            }

            @if (error) { <div class="alert-error">{{ error }}</div> }

            <button type="submit" [disabled]="form.invalid || calculating" class="btn-primary w-full">
              @if (calculating) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              }
              {{ calculating ? 'Calculating…' : 'Calculate Monthly Rate' }}
            </button>
          </form>
        </div>

        <!-- Quote result -->
        @if (quote) {
          <div class="card flex flex-col">
            <div class="flex items-center justify-between mb-6">
              <h2>Quote Summary</h2>
              <span class="badge-draft text-xs">SECCI · §6 VKrG</span>
            </div>

            <!-- Hero payment -->
            <div class="rounded-xl bg-indigo-50 border border-indigo-100 p-5 mb-5 text-center">
              <p class="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Monthly Payment (advance)</p>
              <p class="text-4xl font-bold text-indigo-700">{{ quote.monthlyPayment | currency:'EUR' }}</p>
            </div>

            <!-- Rate breakdown -->
            <div class="space-y-0 flex-1 mb-5">
              <div class="dl-row">
                <span class="dl-label">Total Investment (GIK)</span>
                <span class="dl-value font-semibold">{{ quote.gik | currency:'EUR' }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Nominal Rate (Sollzinssatz)</span>
                <span class="dl-value">{{ quote.nominalRate | percent:'1.3-3' }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Effective Rate / APR</span>
                <span class="dl-value font-semibold text-indigo-600">{{ quote.effectiveRate | percent:'1.3-3' }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Contract Stamp Duty (1%)</span>
                <span class="dl-value">{{ quote.contractStampDuty | currency:'EUR' }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Total Cost</span>
                <span class="dl-value font-semibold">{{ quote.totalCost | currency:'EUR' }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">NoVA</span>
                <span class="dl-value">{{ quote.novaBreakdown.novaAmount | currency:'EUR' }} ({{ quote.novaBreakdown.taxRate }}%)</span>
              </div>
            </div>

            <!-- SECCI acknowledgment gate -->
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-4">
              <p class="text-xs font-semibold text-slate-700 mb-2">Pre-contractual acknowledgment (§6 VKrG 2010)</p>
              <label class="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" [(ngModel)]="secciAcknowledged" class="mt-0.5 rounded text-indigo-600" />
                <span class="text-xs text-slate-600 leading-relaxed">
                  I confirm I have read and understood the pre-contractual information:
                  nominal rate <strong>{{ quote.nominalRate | percent:'1.2-2' }}</strong>,
                  APR <strong>{{ quote.effectiveRate | percent:'1.2-2' }}</strong>,
                  total cost <strong>{{ quote.totalCost | currency:'EUR' }}</strong>.
                </span>
              </label>
            </div>

            <button (click)="applyNow()" [disabled]="!secciAcknowledged || applying" class="btn-success w-full">
              @if (applying) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              }
              {{ applying ? 'Submitting application…' : 'Apply for this Lease' }}
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
  applying = false;
  secciAcknowledged = false;
  error = '';
  form: ReturnType<FormBuilder['group']>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private api: ApiService,
    private cdr: ChangeDetectorRef
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
    this.api.getVehicle(id).subscribe((v) => {
      this.vehicle = v;
      this.cdr.detectChanges();
    });
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
      next: (q) => {
        this.quote = q;
        this.calculating = false;
        this.secciAcknowledged = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || err.error?.error || 'Calculation failed';
        this.calculating = false;
        this.cdr.detectChanges();
      },
    });
  }

  applyNow(): void {
    if (!this.vehicle || !this.quote || !this.secciAcknowledged) return;
    this.applying = true;
    const { contractType, termMonths, advancePayment, residualValue } = this.form.value;
    this.api.applyForLease({
      vehicleId: this.vehicle.id,
      contractType: contractType as any,
      termMonths: termMonths!,
      advancePayment: advancePayment!,
      residualValue: residualValue!,
    }).subscribe({
      next: (contract: any) => this.router.navigate(['/customer/application', contract.id]),
      error: (err: any) => { this.error = err.error?.message || err.error?.error || 'Application failed'; this.applying = false; },
    });
  }
}
