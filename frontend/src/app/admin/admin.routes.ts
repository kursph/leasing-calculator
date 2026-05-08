import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'contracts',
    loadComponent: () =>
      import('./contracts/contract-list.component').then((m) => m.AdminContractListComponent),
  },
  {
    path: 'contracts/:id',
    loadComponent: () =>
      import('./contracts/contract-detail.component').then((m) => m.AdminContractDetailComponent),
  },
  {
    path: 'contracts/:id/profitability',
    loadComponent: () =>
      import('./profitability/profitability.component').then((m) => m.ProfitabilityComponent),
  },
  {
    path: 'config',
    loadComponent: () =>
      import('./config/config.component').then((m) => m.ConfigComponent),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
