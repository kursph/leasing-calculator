import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <nav class="bg-white shadow-sm border-b px-6 py-3 flex items-center justify-between">
      <a routerLink="/" class="text-xl font-bold text-blue-700">KFZ Leasing</a>
      <div class="flex gap-4 items-center text-sm">
        @if (auth.isLoggedIn()) {
          @if (auth.isAdmin()) {
            <a routerLink="/admin/dashboard" class="text-gray-600 hover:text-blue-600">Dashboard</a>
            <a routerLink="/admin/contracts" class="text-gray-600 hover:text-blue-600">Contracts</a>
            <a routerLink="/admin/config" class="text-gray-600 hover:text-blue-600">Config</a>
          } @else {
            <a routerLink="/customer/vehicles" class="text-gray-600 hover:text-blue-600">Vehicles</a>
            <a routerLink="/customer/contracts" class="text-gray-600 hover:text-blue-600">My Contracts</a>
          }
          <button (click)="auth.logout()" class="text-red-500 hover:text-red-700">Logout</button>
        } @else {
          <a routerLink="/auth/login" class="text-gray-600 hover:text-blue-600">Login</a>
          <a routerLink="/auth/register" class="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">Register</a>
        }
      </div>
    </nav>
    <main class="min-h-screen bg-gray-50">
      <router-outlet />
    </main>
  `,
})
export class App {
  constructor(public auth: AuthService) {}
}
