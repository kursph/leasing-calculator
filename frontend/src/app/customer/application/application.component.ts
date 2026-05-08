import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ApiService } from '../../shared/services/api.service';
import { LeasingContract } from '../../shared/models';

@Component({
  selector: 'app-application',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, CurrencyPipe],
  template: `
    <div class="page-sm">
      <a routerLink="/customer/contracts" class="text-xs text-slate-500 hover:text-indigo-600 mb-6 block">
        ← Back to contracts
      </a>

      <div class="mb-8">
        <h1>Credit Check</h1>
        <p class="text-sm text-slate-500 mt-1">Required by §7 VKrG 2010 before application is processed</p>
      </div>

      @if (contract) {
        <div class="card bg-indigo-50 border-indigo-200 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">Lease Summary</p>
              <p class="font-semibold text-indigo-900">
                {{ contract.vehicle?.make }} {{ contract.vehicle?.model }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-xs text-indigo-600">Monthly Payment</p>
              <p class="text-xl font-bold text-indigo-700">{{ contract.monthlyPayment | currency:'EUR' }}</p>
            </div>
          </div>
        </div>
      }

      <div class="card">
        <h2 class="mb-1">Financial Self-Declaration</h2>
        <p class="text-xs text-slate-500 mb-6">All figures are monthly, net of tax</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
          <div class="field">
            <label class="label">Monthly Net Income (EUR)</label>
            <input formControlName="monthlyIncome" type="number" min="0" placeholder="e.g. 3500" class="input" />
          </div>
          <div class="field">
            <label class="label">Monthly Living Expenses (EUR)</label>
            <input formControlName="monthlyExpenses" type="number" min="0" placeholder="e.g. 1200" class="input" />
          </div>
          <div class="field">
            <label class="label">Existing Loan Obligations / month (EUR)</label>
            <input formControlName="existingObligations" type="number" min="0" placeholder="e.g. 300" class="input" />
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label class="flex items-start gap-3 cursor-pointer">
              <input formControlName="consent" type="checkbox" class="mt-0.5 rounded text-indigo-600" />
              <span class="text-xs text-slate-600">
                I declare that all information provided is accurate and complete.
                I consent to the credit worthiness assessment as required by §7 VKrG 2010.
              </span>
            </label>
          </div>

          @if (error) { <div class="alert-error">{{ error }}</div> }
          @if (success) { <div class="alert-success">{{ success }}</div> }

          <button type="submit" [disabled]="form.invalid || loading" class="btn-full">
            @if (loading) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            }
            {{ loading ? 'Submitting…' : 'Submit Credit Check' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class ApplicationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private api = inject(ApiService);

  contract: LeasingContract | null = null;
  loading = false;
  error = '';
  success = '';

  form = this.fb.group({
    monthlyIncome: [null, [Validators.required, Validators.min(0)]],
    monthlyExpenses: [null, [Validators.required, Validators.min(0)]],
    existingObligations: [0, [Validators.required, Validators.min(0)]],
    consent: [false, Validators.requiredTrue],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('contractId')!;
    this.api.getContract(id).subscribe((c) => (this.contract = c));
  }

  submit(): void {
    if (!this.contract) return;
    this.loading = true;
    const { monthlyIncome, monthlyExpenses, existingObligations } = this.form.value;
    this.api.submitCreditCheck(this.contract.id, {
      monthlyIncome: monthlyIncome!,
      monthlyExpenses: monthlyExpenses!,
      existingObligations: existingObligations!,
    }).subscribe({
      next: () => {
        this.success = 'Credit check submitted. You will be notified of the decision by email.';
        setTimeout(() => this.router.navigate(['/customer/contracts']), 2500);
      },
      error: (err: any) => { this.error = err.error?.error || 'Submission failed'; this.loading = false; },
    });
  }
}
