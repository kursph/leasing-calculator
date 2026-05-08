import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, CurrencyPipe, PercentPipe } from '@angular/common';
import { ApiService } from '../../shared/services/api.service';
import { LeasingContract, ScheduleRow } from '../../shared/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, PercentPipe],
  template: `
    <div class="max-w-4xl mx-auto p-6">
      @if (contract) {
        <div class="flex justify-between items-start mb-6">
          <div>
            <h1 class="text-3xl font-bold">Contract Details</h1>
            <p class="text-gray-500">{{ contract.vehicle?.make }} {{ contract.vehicle?.model }} — {{ contract.status }}</p>
          </div>
          <a [href]="pdfUrl" target="_blank"
            class="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded text-sm font-medium">
            Download PDF
          </a>
        </div>

        <div class="grid grid-cols-2 gap-4 bg-white rounded-lg shadow p-6 mb-6">
          <div><p class="text-gray-500 text-sm">Monthly Payment</p><p class="text-xl font-bold text-blue-600">{{ contract.monthlyPayment | currency:'EUR' }}</p></div>
          <div><p class="text-gray-500 text-sm">Total GIK</p><p class="font-semibold">{{ contract.gik | currency:'EUR' }}</p></div>
          <div><p class="text-gray-500 text-sm">Nominal Rate</p><p>{{ contract.nominalRate | percent:'1.2-2' }}</p></div>
          <div><p class="text-gray-500 text-sm">Effective Rate (APR)</p><p>{{ contract.effectiveRate | percent:'1.2-2' }}</p></div>
          <div><p class="text-gray-500 text-sm">Term</p><p>{{ contract.termMonths }} months</p></div>
          <div><p class="text-gray-500 text-sm">Contract Type</p><p>{{ contract.contractType }}</p></div>
        </div>

        @if (schedule.length > 0) {
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Amortization Schedule</h2>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-gray-50">
                    <th class="px-3 py-2 text-left">Period</th>
                    <th class="px-3 py-2 text-right">Payment</th>
                    <th class="px-3 py-2 text-right">Interest</th>
                    <th class="px-3 py-2 text-right">Principal</th>
                    <th class="px-3 py-2 text-right">Remaining Capital</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of schedule; track row.period) {
                    <tr class="border-t">
                      <td class="px-3 py-1.5">{{ row.period }}</td>
                      <td class="px-3 py-1.5 text-right">{{ row.payment | currency:'EUR' }}</td>
                      <td class="px-3 py-1.5 text-right">{{ row.interest | currency:'EUR' }}</td>
                      <td class="px-3 py-1.5 text-right">{{ row.principal | currency:'EUR' }}</td>
                      <td class="px-3 py-1.5 text-right">{{ row.capitalAtPeriodEnd | currency:'EUR' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class ContractDetailComponent implements OnInit {
  contract: LeasingContract | null = null;
  schedule: ScheduleRow[] = [];
  pdfUrl = '';

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.pdfUrl = `${environment.apiUrl}/leasing/contracts/${id}/pdf`;
    this.api.getContract(id).subscribe((c) => (this.contract = c));
    this.api.getSchedule(id).subscribe((s) => (this.schedule = s));
  }
}
