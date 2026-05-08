import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: 'vehicles',
    loadComponent: () =>
      import('./configurator/vehicle-list.component').then((m) => m.VehicleListComponent),
  },
  {
    path: 'configurator/:vehicleId',
    loadComponent: () =>
      import('./configurator/configurator.component').then((m) => m.ConfiguratorComponent),
  },
  {
    path: 'application/:contractId',
    loadComponent: () =>
      import('./application/application.component').then((m) => m.ApplicationComponent),
  },
  {
    path: 'contracts',
    loadComponent: () =>
      import('./contract/contract-list.component').then((m) => m.ContractListComponent),
  },
  {
    path: 'contracts/:id',
    loadComponent: () =>
      import('./contract/contract-detail.component').then((m) => m.ContractDetailComponent),
  },
  { path: '', redirectTo: 'vehicles', pathMatch: 'full' },
];
