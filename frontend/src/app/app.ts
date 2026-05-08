import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="min-h-screen flex flex-col">
      <header class="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4">
          <div class="flex items-center justify-between h-16">

            <!-- Brand -->
            <a routerLink="/" class="flex items-center gap-2.5">
              <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-2h8zM13 6l2 4h4l1 3-1 3h-1"/>
                </svg>
              </div>
              <span class="font-bold text-slate-900">KFZ<span class="text-indigo-600">Leasing</span></span>
            </a>

            <!-- Nav links -->
            <nav class="flex items-center gap-1">
              @if (auth.isLoggedIn()) {
                @if (auth.isAdmin()) {
                  <a routerLink="/admin/dashboard" routerLinkActive="text-indigo-600 bg-indigo-50"
                    class="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors">
                    Dashboard
                  </a>
                  <a routerLink="/admin/contracts" routerLinkActive="text-indigo-600 bg-indigo-50"
                    class="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors">
                    Contracts
                  </a>
                  <a routerLink="/admin/config" routerLinkActive="text-indigo-600 bg-indigo-50"
                    class="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors">
                    Rates
                  </a>
                } @else {
                  <a routerLink="/customer/vehicles" routerLinkActive="text-indigo-600 bg-indigo-50"
                    class="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors">
                    Vehicles
                  </a>
                  <a routerLink="/customer/contracts" routerLinkActive="text-indigo-600 bg-indigo-50"
                    class="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors">
                    My Contracts
                  </a>
                }

                <!-- User + logout -->
                <div class="flex items-center gap-3 ml-4 pl-4 border-l border-slate-200">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span class="text-xs font-semibold text-indigo-700">
                        {{ auth.currentUser()?.firstName?.[0] }}{{ auth.currentUser()?.lastName?.[0] }}
                      </span>
                    </div>
                    <span class="text-sm text-slate-600 hidden sm:block">
                      {{ auth.currentUser()?.firstName }}
                    </span>
                    @if (auth.isAdmin()) {
                      <span class="badge-review text-xs">Admin</span>
                    }
                  </div>
                  <button (click)="auth.logout()"
                    class="text-xs text-slate-500 hover:text-red-600 transition-colors font-medium">
                    Sign out
                  </button>
                </div>
              } @else {
                <a routerLink="/auth/login"
                  class="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                  Sign in
                </a>
                <a routerLink="/auth/register" class="btn-primary ml-1">
                  Get started
                </a>
              }
            </nav>
          </div>
        </div>
      </header>

      <main class="flex-1 bg-slate-50">
        <router-outlet />
      </main>

      <footer class="border-t border-slate-200 bg-white py-4">
        <p class="text-center text-xs text-slate-400">
          Austrian KFZ Leasing Platform · VÖL 2017 · VKrG 2010 · NoVAG 1991
        </p>
      </footer>
    </div>
  `,
})
export class App {
  constructor(public auth: AuthService) {}
}
