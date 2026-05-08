import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../shared/services/api.service';
import { LeasingContract } from '../../shared/models';

@Component({
  selector: 'app-application',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="max-w-2xl mx-auto p-6">
      <h1 class="text-3xl font-bold mb-2">Credit Check</h1>
      <p class="text-gray-500 mb-6">Required per §7 VKrG 2010</p>

      @if (contract) {
        <div class="bg-blue-50 rounded p-4 mb-6 text-sm">
          <p><strong>Contract:</strong> {{ contract.id }}</p>
          <p><strong>Monthly Payment:</strong> EUR {{ contract.monthlyPayment }}</p>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" class="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 class="text-lg font-semibold">Financial Information (Self-Declaration)</h2>
        <div>
          <label class="block text-sm font-medium text-gray-700">Monthly Net Income (EUR)</label>
          <input formControlName="monthlyIncome" type="number" min="0"
            class="mt-1 block w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Monthly Expenses (EUR)</label>
          <input formControlName="monthlyExpenses" type="number" min="0"
            class="mt-1 block w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Existing Obligations (EUR/month)</label>
          <input formControlName="existingObligations" type="number" min="0"
            class="mt-1 block w-full border rounded px-3 py-2" />
        </div>

        <div class="border-t pt-4">
          <p class="text-xs text-gray-500 mb-2">
            By submitting, I confirm all information is accurate and complete (§7 VKrG 2010).
          </p>
          <label class="flex items-center space-x-2">
            <input formControlName="consent" type="checkbox" class="rounded" />
            <span class="text-sm">I consent to the credit worthiness check</span>
          </label>
        </div>

        @if (error) { <p class="text-red-600 text-sm">{{ error }}</p> }
        @if (success) { <p class="text-green-600 text-sm">{{ success }}</p> }

        <button type="submit" [disabled]="form.invalid || loading"
          class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {{ loading ? 'Submitting...' : 'Submit Credit Check' }}
        </button>
      </form>
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
        this.success = 'Credit check submitted. You will be notified of the decision.';
        setTimeout(() => this.router.navigate(['/customer/contracts']), 2000);
      },
      error: (err: any) => { this.error = err.error?.error || 'Submission failed'; this.loading = false; },
    });
  }
}
