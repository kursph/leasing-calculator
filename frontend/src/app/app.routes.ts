import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/customer/vehicles', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'customer',
    canActivate: [authGuard],
    loadChildren: () => import('./customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: '/customer/vehicles' },
];
