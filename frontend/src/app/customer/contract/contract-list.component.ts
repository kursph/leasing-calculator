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
    <div class="max-w-4xl mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6">My Contracts</h1>
      @if (contracts.length === 0 && !loading) {
        <p class="text-gray-500">No contracts yet. <a routerLink="/customer/vehicles" class="text-blue-600">Browse vehicles</a></p>
      }
      <div class="space-y-4">
        @for (contract of contracts; track contract.id) {
          <div class="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <div>
              <p class="font-semibold">{{ contract.vehicle?.make }} {{ contract.vehicle?.model }}</p>
              <p class="text-sm text-gray-500">{{ contract.termMonths }} months — {{ contract.monthlyPayment | currency:'EUR' }}/mo</p>
            </div>
            <div class="text-right">
              <span [class]="statusClass(contract.status)" class="text-sm font-medium px-2 py-1 rounded">
                {{ contract.status }}
              </span>
              <a [routerLink]="['/customer/contracts', contract.id]"
                class="ml-3 text-blue-600 hover:underline text-sm">Details</a>
            </div>
          </div>
        }
      </div>
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

  statusClass(status: string): string {
    const map: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
      DRAFT: 'bg-gray-100 text-gray-800',
      ACTIVE: 'bg-blue-100 text-blue-800',
      CLOSED: 'bg-gray-100 text-gray-500',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  }
}
