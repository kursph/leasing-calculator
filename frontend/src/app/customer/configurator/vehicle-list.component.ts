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
    <div class="max-w-6xl mx-auto p-6">
      <h1 class="text-3xl font-bold mb-8">Available Vehicles</h1>
      @if (loading) {
        <p class="text-gray-500">Loading vehicles...</p>
      }
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (vehicle of vehicles; track vehicle.id) {
          <div class="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
            <h3 class="text-xl font-semibold">{{ vehicle.make }} {{ vehicle.model }}</h3>
            <p class="text-gray-500">{{ vehicle.year }}</p>
            <div class="mt-4 space-y-1 text-sm text-gray-600">
              <p>Net Price: <strong>{{ vehicle.netPrice | currency:'EUR' }}</strong></p>
              <p>CO₂: <strong>{{ vehicle.co2Emissions }} g/km</strong></p>
              <p>NoVA Rate: <strong>{{ vehicle.novaRate }}%</strong></p>
            </div>
            <a [routerLink]="['/customer/configurator', vehicle.id]"
              class="mt-4 block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
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

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getVehicles().subscribe({
      next: (v) => { this.vehicles = v; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
