import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, CurrencyPipe, PercentPipe } from '@angular/common';
import { ApiService } from '../../shared/services/api.service';
import { Profitability } from '../../shared/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profitability',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, PercentPipe],
  template: `
    <div class="max-w-3xl mx-auto p-6">
      <div class="flex justify-between items-start mb-6">
        <h1 class="text-3xl font-bold">Profitability Breakdown</h1>
        @if (profitability) {
          <a [href]="pdfUrl" target="_blank" class="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded text-sm">
            Download PDF
          </a>
        }
      </div>

      @if (profitability) {
        <div class="bg-white rounded-lg shadow p-6 space-y-3">
          <div class="flex justify-between items-center border-b pb-3">
            <span class="text-lg font-semibold">Net Margin</span>
            <span class="text-2xl font-bold" [class.text-green-600]="profitability.isProfit" [class.text-red-600]="!profitability.isProfit">
              {{ profitability.netMargin | currency:'EUR' }}
            </span>
          </div>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between"><dt class="text-gray-600">Margin %</dt><dd class="font-semibold">{{ profitability.marginPct | number:'1.2-2' }}%</dd></div>
            <div class="flex justify-between"><dt class="text-gray-600">Spread (Nominal - EURIBOR)</dt><dd class="font-semibold text-blue-600">{{ (profitability.spread * 100) | number:'1.3-3' }}%</dd></div>
            <hr>
            <div class="flex justify-between"><dt class="text-gray-600">Total Payments Received</dt><dd>{{ profitability.totalPayments | currency:'EUR' }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-600">Total Interest Income</dt><dd>{{ profitability.totalInterestIncome | currency:'EUR' }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-600">Contract Fee Income (1%)</dt><dd>{{ profitability.contractFeeIncome | currency:'EUR' }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-600">Residual Value Recovery</dt><dd>{{ profitability.residualValueIncome | currency:'EUR' }}</dd></div>
            <hr>
            <div class="flex justify-between text-red-600"><dt>Refinancing Cost</dt><dd>−{{ profitability.refinancingCost | currency:'EUR' }}</dd></div>
            <div class="flex justify-between text-red-600"><dt>Operating Cost</dt><dd>−{{ profitability.operatingCost | currency:'EUR' }}</dd></div>
          </dl>
          <div class="pt-3 border-t">
            <span class="text-sm font-medium px-3 py-1 rounded" [class]="profitability.isProfit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
              {{ profitability.isProfit ? 'PROFITABLE' : 'LOSS-MAKING' }}
            </span>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProfitabilityComponent implements OnInit {
  profitability: Profitability | null = null;
  pdfUrl = '';

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.pdfUrl = `${environment.apiUrl}/admin/contracts/${id}/profitability/pdf`;
    this.api.adminGetProfitability(id).subscribe((p) => (this.profitability = p));
  }
}
