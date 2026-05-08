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
    <div class="max-w-6xl mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6">All Contracts</h1>
      <div class="mb-4 flex gap-3">
        <select [(ngModel)]="statusFilter" (ngModelChange)="load()" class="border rounded px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          <option>DRAFT</option><option>UNDER_REVIEW</option><option>APPROVED</option>
          <option>REJECTED</option><option>ACTIVE</option><option>CLOSED</option>
        </select>
      </div>
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left">Customer</th>
              <th class="px-4 py-3 text-left">Vehicle</th>
              <th class="px-4 py-3 text-right">GIK</th>
              <th class="px-4 py-3 text-right">Monthly</th>
              <th class="px-4 py-3 text-left">Status</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            @for (contract of contracts; track contract.id) {
              <tr class="border-t hover:bg-gray-50">
                <td class="px-4 py-3">{{ contract.customer?.firstName }} {{ contract.customer?.lastName }}</td>
                <td class="px-4 py-3">{{ contract.vehicle?.make }} {{ contract.vehicle?.model }}</td>
                <td class="px-4 py-3 text-right">{{ contract.gik | currency:'EUR' }}</td>
                <td class="px-4 py-3 text-right">{{ contract.monthlyPayment | currency:'EUR' }}</td>
                <td class="px-4 py-3">
                  <span [class]="statusClass(contract.status)" class="text-xs font-medium px-2 py-1 rounded">
                    {{ contract.status }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <a [routerLink]="['/admin/contracts', contract.id]" class="text-blue-600 hover:underline">View</a>
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
  contracts: (LeasingContract & { customer?: any })[] = [];
  statusFilter = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.adminGetContracts(this.statusFilter || undefined).subscribe((c) => (this.contracts = c as any));
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-blue-100 text-blue-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  }
}
