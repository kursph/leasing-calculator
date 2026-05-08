import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
      <div class="w-full max-w-md">

        <div class="text-center mb-8">
          <div class="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p class="text-slate-500 text-sm mt-1">Sign in to your leasing account</p>
        </div>

        <div class="card">
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
            <div class="field">
              <label class="label">Email address</label>
              <input formControlName="email" type="email" placeholder="you@example.com" class="input" />
            </div>
            <div class="field">
              <label class="label">Password</label>
              <input formControlName="password" type="password" placeholder="••••••••" class="input" />
            </div>

            @if (error) {
              <div class="alert-error">{{ error }}</div>
            }

            <button type="submit" [disabled]="form.invalid || loading" class="btn-full mt-2">
              @if (loading) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              }
              {{ loading ? 'Signing in…' : 'Sign in' }}
            </button>
          </form>
        </div>

        <p class="text-center text-sm text-slate-500 mt-6">
          No account?
          <a routerLink="/auth/register" class="text-indigo-600 font-medium hover:text-indigo-700">Create one</a>
        </p>

        <div class="mt-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 space-y-0.5">
          <p class="font-semibold">Demo credentials</p>
          <p>Admin: admin&#64;leasing.at / Admin1234!</p>
          <p>Customer: demo&#64;leasing.at / Demo1234!</p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  loading = false;
  error = '';

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: (res) => this.router.navigate([res.user.role === 'ADMIN' ? '/admin/dashboard' : '/customer/vehicles']),
      error: (err) => { this.error = err.error?.error || 'Invalid credentials'; this.loading = false; },
    });
  }
}
