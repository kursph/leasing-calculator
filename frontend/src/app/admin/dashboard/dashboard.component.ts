import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { DashboardKPIs } from '../../shared/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  template: `
    <div class="page">
      <div class="section-header mb-8">
        <div>
          <h1>Portfolio Dashboard</h1>
          <p class="text-sm text-slate-500 mt-1">Live view of all lease contracts and profitability</p>
        </div>
        <div class="flex gap-3">
          <a routerLink="/admin/contracts" class="btn-ghost">All Contracts</a>
          <a routerLink="/admin/config" class="btn-primary">Rate Config</a>
        </div>
      </div>

      @if (kpis) {
        <!-- KPI grid -->
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div class="stat-card">
            <span class="stat-label">Portfolio Volume</span>
            <span class="stat-value">{{ kpis.totalPortfolioVolume | currency:'EUR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Avg. Margin</span>
            <span class="stat-value" [class.text-emerald-600]="kpis.averageMarginPct > 0">
              {{ kpis.averageMarginPct | number:'1.2-2' }}%
            </span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Avg. Spread</span>
            <span class="stat-value text-indigo-600">{{ (kpis.averageSpread * 100) | number:'1.3-3' }}%</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Interest Income</span>
            <span class="stat-value">{{ kpis.totalInterestIncome | currency:'EUR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Net Profit</span>
            <span class="stat-value" [class.text-emerald-600]="kpis.totalNetProfit > 0" [class.text-red-600]="kpis.totalNetProfit < 0">
              {{ kpis.totalNetProfit | currency:'EUR':'symbol':'1.0-0' }}
            </span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Loss-making</span>
            <span class="stat-value" [class.text-red-600]="kpis.lossMakingContracts > 0">
              {{ kpis.lossMakingContracts }}
            </span>
            @if (kpis.lossMakingContracts === 0) {
              <span class="text-xs text-emerald-600 font-medium">All profitable ✓</span>
            }
          </div>
        </div>

        <!-- Status breakdown -->
        <div class="card">
          <h2 class="mb-5">Contracts by Status</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            @for (entry of statusEntries; track entry.key) {
              <a [routerLink]="['/admin/contracts']" [queryParams]="{status: entry.key}"
                class="flex flex-col items-center p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all cursor-pointer">
                <span class="text-2xl font-bold text-slate-900">{{ entry.value }}</span>
                <span [class]="badgeForStatus(entry.key)" class="mt-1.5">{{ entry.key | titlecase }}</span>
              </a>
            }
          </div>
        </div>
      } @else {
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="stat-card animate-pulse">
              <div class="h-3 bg-slate-200 rounded w-1/2 mb-3"></div>
              <div class="h-7 bg-slate-200 rounded w-3/4"></div>
            </div>
          }
        </div>
      }
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

  badgeForStatus(s: string): string {
    const map: Record<string, string> = {
      APPROVED: 'badge-approved', ACTIVE: 'badge-active',
      UNDER_REVIEW: 'badge-review', REJECTED: 'badge-rejected',
      DRAFT: 'badge-draft', CLOSED: 'badge-closed',
    };
    return map[s] ?? 'badge-draft';
  }
}
