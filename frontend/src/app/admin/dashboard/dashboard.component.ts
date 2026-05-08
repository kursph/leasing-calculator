import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, PercentPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { DashboardKPIs } from '../../shared/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, PercentPipe, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto p-6">
      <h1 class="text-3xl font-bold mb-8">Admin Dashboard</h1>

      @if (kpis) {
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-5">
            <p class="text-gray-500 text-sm">Total Portfolio Volume</p>
            <p class="text-2xl font-bold text-blue-600">{{ kpis.totalPortfolioVolume | currency:'EUR':'symbol':'1.0-0' }}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-5">
            <p class="text-gray-500 text-sm">Avg. Margin %</p>
            <p class="text-2xl font-bold text-green-600">{{ kpis.averageMarginPct | number:'1.2-2' }}%</p>
          </div>
          <div class="bg-white rounded-lg shadow p-5">
            <p class="text-gray-500 text-sm">Avg. Spread</p>
            <p class="text-2xl font-bold">{{ (kpis.averageSpread * 100) | number:'1.3-3' }}%</p>
          </div>
          <div class="bg-white rounded-lg shadow p-5">
            <p class="text-gray-500 text-sm">Total Interest Income</p>
            <p class="text-2xl font-bold">{{ kpis.totalInterestIncome | currency:'EUR':'symbol':'1.0-0' }}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-5">
            <p class="text-gray-500 text-sm">Total Net Profit</p>
            <p class="text-2xl font-bold" [class.text-green-600]="kpis.totalNetProfit > 0" [class.text-red-600]="kpis.totalNetProfit < 0">
              {{ kpis.totalNetProfit | currency:'EUR':'symbol':'1.0-0' }}
            </p>
          </div>
          <div class="bg-white rounded-lg shadow p-5">
            <p class="text-gray-500 text-sm">Loss-making Contracts</p>
            <p class="text-2xl font-bold" [class.text-red-600]="kpis.lossMakingContracts > 0">{{ kpis.lossMakingContracts }}</p>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4">Contracts by Status</h2>
          <div class="flex flex-wrap gap-3">
            @for (entry of statusEntries; track entry.key) {
              <div class="bg-gray-50 rounded px-4 py-2">
                <span class="text-sm font-medium text-gray-600">{{ entry.key }}</span>
                <span class="ml-2 font-bold">{{ entry.value }}</span>
              </div>
            }
          </div>
        </div>
      }

      <div class="flex gap-4">
        <a routerLink="/admin/contracts" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          All Contracts
        </a>
        <a routerLink="/admin/config" class="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300">
          Rate Configuration
        </a>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  kpis: DashboardKPIs | null = null;
  statusEntries: { key: string; value: number }[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.adminGetDashboard().subscribe((k) => {
      this.kpis = k;
      this.statusEntries = Object.entries(k.contractsByStatus).map(([key, value]) => ({ key, value }));
    });
  }
}
