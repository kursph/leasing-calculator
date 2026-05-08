import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { LeasingContract } from '../../shared/models';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  template: `
    <div class="page">
      <div class="section-header">
        <div>
          <h1>My Contracts</h1>
          <p class="text-sm text-slate-500 mt-1">Track your lease applications and active contracts</p>
        </div>
        <a routerLink="/customer/vehicles" class="btn-primary">New lease</a>
      </div>

      @if (!loading && contracts.length === 0) {
        <div class="card text-center py-16">
          <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h2 class="text-slate-900 mb-2">No contracts yet</h2>
          <p class="text-sm text-slate-500 mb-6">Browse vehicles and configure your first lease</p>
          <a routerLink="/customer/vehicles" class="btn-primary">Browse vehicles</a>
        </div>
      }

      @if (contracts.length > 0) {
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Type</th>
                <th class="text-right">Monthly</th>
                <th class="text-right">Term</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (c of contracts; track c.id) {
                <tr>
                  <td class="font-medium text-slate-900">
                    {{ c.vehicle?.make }} {{ c.vehicle?.model }}
                    <div class="text-xs text-slate-400">{{ c.vehicle?.year }}</div>
                  </td>
                  <td class="text-xs text-slate-500">{{ c.contractType | slice:0:4 }}</td>
                  <td class="text-right font-semibold text-indigo-600">{{ c.monthlyPayment | currency:'EUR' }}</td>
                  <td class="text-right text-slate-600">{{ c.termMonths }} mo</td>
                  <td><span [class]="badgeClass(c.status)">{{ c.status | titlecase }}</span></td>
                  <td class="text-right">
                    <a [routerLink]="['/customer/contracts', c.id]"
                      class="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                      View →
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class ContractListComponent implements OnInit {
  contracts: LeasingContract[] = [];
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getContracts().subscribe({
      next: (c) => { this.contracts = c; this.loading = false; },
      error: () => { this.loading = false; },
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
