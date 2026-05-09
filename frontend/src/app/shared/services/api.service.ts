import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Vehicle, QuoteInput, QuoteResult, LeasingContract,
  ScheduleRow, SecciData, CreditCheckInput,
  Profitability, DashboardKPIs,
} from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Vehicles
  getVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.base}/vehicles`);
  }

  getVehicle(id: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.base}/vehicles/${id}`);
  }

  // Leasing
  getQuote(input: QuoteInput): Observable<QuoteResult> {
    return this.http.post<QuoteResult>(`${this.base}/leasing/quote`, input);
  }

  applyForLease(input: QuoteInput): Observable<LeasingContract> {
    return this.http.post<LeasingContract>(`${this.base}/leasing/apply`, input);
  }

  getContracts(): Observable<LeasingContract[]> {
    return this.http.get<LeasingContract[]>(`${this.base}/leasing/contracts`);
  }

  getContract(id: string): Observable<LeasingContract> {
    return this.http.get<LeasingContract>(`${this.base}/leasing/contracts/${id}`);
  }

  getSchedule(id: string): Observable<ScheduleRow[]> {
    return this.http.get<ScheduleRow[]>(`${this.base}/leasing/contracts/${id}/schedule`);
  }

  getSecci(id: string): Observable<SecciData> {
    return this.http.get<SecciData>(`${this.base}/leasing/contracts/${id}/secci`);
  }

  getContractPdfUrl(id: string): string {
    return `${this.base}/leasing/contracts/${id}/pdf`;
  }

  submitCreditCheck(id: string, data: CreditCheckInput): Observable<unknown> {
    return this.http.post(`${this.base}/leasing/contracts/${id}/credit-check`, data);
  }

  downloadPdf(url: string, filename: string): void {
    this.http.get(url, { responseType: 'blob' }).subscribe((blob) => {
      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(blob);
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(anchor.href);
    });
  }

  // Admin
  adminGetContracts(status?: string): Observable<LeasingContract[]> {
    const params: Record<string, string> = status ? { status } : {};
    return this.http.get<LeasingContract[]>(`${this.base}/admin/contracts`, { params });
  }

  adminGetContract(id: string): Observable<LeasingContract> {
    return this.http.get<LeasingContract>(`${this.base}/admin/contracts/${id}`);
  }

  adminApprove(id: string): Observable<LeasingContract> {
    return this.http.put<LeasingContract>(`${this.base}/admin/contracts/${id}/approve`, {});
  }

  adminReject(id: string, reason: string): Observable<LeasingContract> {
    return this.http.put<LeasingContract>(`${this.base}/admin/contracts/${id}/reject`, { reason });
  }

  adminGetProfitabilityPreview(id: string): Observable<Profitability> {
    return this.http.get<Profitability>(`${this.base}/admin/contracts/${id}/profitability-preview`);
  }

  adminGetProfitability(id: string): Observable<Profitability> {
    return this.http.get<Profitability>(`${this.base}/admin/contracts/${id}/profitability`);
  }

  adminGetDashboard(): Observable<DashboardKPIs> {
    return this.http.get<DashboardKPIs>(`${this.base}/admin/dashboard`);
  }

  adminGetConfig(): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(`${this.base}/admin/config`);
  }

  adminUpdateConfig(config: Record<string, string>): Observable<unknown> {
    return this.http.put(`${this.base}/admin/config`, config);
  }
}
