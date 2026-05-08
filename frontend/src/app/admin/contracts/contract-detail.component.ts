import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { LeasingContract } from '../../shared/models';

@Component({
  selector: 'app-admin-contract-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, PercentPipe, RouterLink, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto p-6">
      @if (contract) {
        <div class="flex justify-between items-start mb-6">
          <div>
            <h1 class="text-3xl font-bold">Contract Review</h1>
            <p class="text-gray-500">{{ contract.vehicle?.make }} {{ contract.vehicle?.model }} — {{ contract.status }}</p>
          </div>
          @if (contract.status === 'APPROVED') {
            <a [routerLink]="['/admin/contracts', contract.id, 'profitability']"
              class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
              View Profitability
            </a>
          }
        </div>

        <div class="grid grid-cols-2 gap-4 bg-white rounded-lg shadow p-6 mb-6">
          <div><p class="text-gray-500 text-sm">GIK</p><p class="font-bold text-lg">{{ contract.gik | currency:'EUR' }}</p></div>
          <div><p class="text-gray-500 text-sm">Monthly Payment</p><p class="font-bold text-blue-600 text-lg">{{ contract.monthlyPayment | currency:'EUR' }}</p></div>
          <div><p class="text-gray-500 text-sm">Nominal Rate</p><p>{{ contract.nominalRate | percent:'1.3-3' }}</p></div>
          <div><p class="text-gray-500 text-sm">Effective Rate</p><p>{{ contract.effectiveRate | percent:'1.3-3' }}</p></div>
          <div><p class="text-gray-500 text-sm">EURIBOR Base</p><p>{{ contract.euriborRate | percent:'1.3-3' }}</p></div>
          <div><p class="text-gray-500 text-sm">Lender Margin (Profit)</p><p class="font-semibold text-green-700">{{ contract.lenderMargin | percent:'1.3-3' }}</p></div>
          <div><p class="text-gray-500 text-sm">Term</p><p>{{ contract.termMonths }} months</p></div>
          <div><p class="text-gray-500 text-sm">Contract Type</p><p>{{ contract.contractType }}</p></div>
        </div>

        @if (contract.status === 'UNDER_REVIEW') {
          <div class="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 class="text-lg font-semibold">Decision</h2>
            <div class="flex gap-4">
              <button (click)="approve()"
                class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                [disabled]="acting">
                Approve
              </button>
              <button (click)="showReject = true"
                class="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                [disabled]="acting">
                Reject
              </button>
            </div>
            @if (showReject) {
              <div class="space-y-2">
                <textarea [(ngModel)]="rejectReason" placeholder="Rejection reason (required per §7 VKrG)"
                  class="w-full border rounded p-2 text-sm" rows="3"></textarea>
                <button (click)="reject()" [disabled]="!rejectReason"
                  class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 text-sm">
                  Confirm Rejection
                </button>
              </div>
            }
            @if (message) { <p class="text-sm font-medium" [class.text-green-600]="!error" [class.text-red-600]="error">{{ message }}</p> }
          </div>
        }
      }
    </div>
  `,
})
export class AdminContractDetailComponent implements OnInit {
  contract: (LeasingContract & { customer?: any }) | null = null;
  acting = false;
  showReject = false;
  rejectReason = '';
  message = '';
  error = false;

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.adminGetContract(id).subscribe((c) => (this.contract = c as any));
  }

  approve(): void {
    if (!this.contract) return;
    this.acting = true;
    this.api.adminApprove(this.contract.id).subscribe({
      next: (c) => { this.contract = c as any; this.message = 'Approved. Profitability record created.'; this.error = false; this.acting = false; },
      error: (err: any) => { this.message = err.error?.error || 'Failed'; this.error = true; this.acting = false; },
    });
  }

  reject(): void {
    if (!this.contract || !this.rejectReason) return;
    this.acting = true;
    this.api.adminReject(this.contract.id, this.rejectReason).subscribe({
      next: (c) => { this.contract = c as any; this.message = 'Rejected.'; this.error = false; this.acting = false; },
      error: (err: any) => { this.message = err.error?.error || 'Failed'; this.error = true; this.acting = false; },
    });
  }
}
