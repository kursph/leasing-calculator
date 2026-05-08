import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { LeasingContract } from '../../shared/models';

@Component({
  selector: 'app-admin-contract-list',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, FormsModule],
  template: `
    <div class="page">
      <div class="section-header mb-6">
        <div>
          <h1>All Contracts</h1>
          <p class="text-sm text-slate-500 mt-1">Review and manage lease applications</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex gap-2 mb-5 flex-wrap">
        @for (s of statuses; track s) {
          <button (click)="filterBy(s)"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            [class]="statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-300 hover:border-indigo-300'">
            {{ s || 'All' }}
          </button>
        }
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Vehicle</th>
              <th class="text-right">GIK</th>
              <th class="text-right">Monthly</th>
              <th class="text-right">Term</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @if (contracts.length === 0) {
              <tr>
                <td colspan="7" class="text-center text-slate-400 py-12">No contracts found</td>
              </tr>
            }
            @for (c of contracts; track c.id) {
              <tr>
                <td>
                  <span class="font-medium text-slate-900">
                    {{ c.customer?.firstName }} {{ c.customer?.lastName }}
                  </span>
                  <div class="text-xs text-slate-400">{{ c.customer?.email }}</div>
                </td>
                <td>
                  <span class="font-medium">{{ c.vehicle?.make }} {{ c.vehicle?.model }}</span>
                  <div class="text-xs text-slate-400">{{ c.vehicle?.year }}</div>
                </td>
                <td class="text-right font-medium">{{ c.gik | currency:'EUR':'symbol':'1.0-0' }}</td>
                <td class="text-right font-semibold text-indigo-600">{{ c.monthlyPayment | currency:'EUR' }}</td>
                <td class="text-right text-slate-600">{{ c.termMonths }} mo</td>
                <td><span [class]="badgeClass(c.status)">{{ c.status }}</span></td>
                <td class="text-right">
                  <a [routerLink]="['/admin/contracts', c.id]"
                    class="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                    Review →
                  </a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminContractListComponent implements OnInit {
  contracts: LeasingContract[] = [];
  statusFilter = '';
  statuses = ['', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'CLOSED', 'DRAFT'];

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  filterBy(s: string): void { this.statusFilter = s; this.load(); }

  load(): void {
    this.api.adminGetContracts(this.statusFilter || undefined).subscribe((c) => (this.contracts = c));
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
