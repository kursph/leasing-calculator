import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { Vehicle } from '../../shared/models';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  template: `
    <div class="page">
      <div class="section-header">
        <div>
          <h1>Available Vehicles</h1>
          <p class="text-sm text-slate-500 mt-1">Select a vehicle to configure your lease</p>
        </div>
        <span class="badge-draft">{{ vehicles.length }} vehicles</span>
      </div>

      @if (error) {
        <div class="alert-error mb-4">{{ error }}</div>
      }

      @if (loading) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="card animate-pulse">
              <div class="h-5 bg-slate-200 rounded w-2/3 mb-4"></div>
              <div class="h-3 bg-slate-100 rounded w-1/3 mb-6"></div>
              <div class="space-y-2 mb-6">
                <div class="h-3 bg-slate-100 rounded"></div>
                <div class="h-3 bg-slate-100 rounded w-3/4"></div>
              </div>
              <div class="h-10 bg-slate-200 rounded-xl"></div>
            </div>
          }
        </div>
      }

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        @for (vehicle of vehicles; track vehicle.id) {
          <div class="card hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h2 class="font-bold text-slate-900">{{ vehicle.make }} {{ vehicle.model }}</h2>
                <p class="text-sm text-slate-500">{{ vehicle.year }}</p>
              </div>
              <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8zM13 6l2 4h4l1 3-1 3h-1"/>
                </svg>
              </div>
            </div>
            <div class="space-y-2 flex-1 mb-5">
              <div class="dl-row">
                <span class="dl-label">Net Price</span>
                <span class="dl-value font-semibold text-indigo-600">{{ vehicle.netPrice | currency:'EUR':'symbol':'1.0-0' }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">CO₂ Emissions</span>
                <span class="dl-value">
                  @if (vehicle.co2Emissions === 0) {
                    <span class="badge-approved">0 g/km ⚡</span>
                  } @else {
                    {{ vehicle.co2Emissions }} g/km
                  }
                </span>
              </div>
              <div class="dl-row">
                <span class="dl-label">NoVA Rate</span>
                <span class="dl-value">{{ vehicle.novaRate }}%</span>
              </div>
            </div>
            <a [routerLink]="['/customer/configurator', vehicle.id]" class="btn-primary w-full text-center">
              Configure Lease
            </a>
          </div>
        }
      </div>
    </div>
  `,
})
export class VehicleListComponent implements OnInit {
  vehicles: Vehicle[] = [];
  loading = true;
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getVehicles().subscribe({
      next: (v) => {
        this.vehicles = v ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.error = `Failed to load: ${err?.status ?? 'network error'}`;
        this.loading = false;
      },
    });
  }
}
