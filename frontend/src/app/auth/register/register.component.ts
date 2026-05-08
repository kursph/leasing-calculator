import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
      <div class="w-full max-w-md">

        <div class="text-center mb-8">
          <div class="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-slate-900">Create your account</h1>
          <p class="text-slate-500 text-sm mt-1">Start your leasing journey</p>
        </div>

        <div class="card">
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
            <div class="grid grid-cols-2 gap-4">
              <div class="field">
                <label class="label">First name</label>
                <input formControlName="firstName" placeholder="Max" class="input" />
              </div>
              <div class="field">
                <label class="label">Last name</label>
                <input formControlName="lastName" placeholder="Mustermann" class="input" />
              </div>
            </div>
            <div class="field">
              <label class="label">Email address</label>
              <input formControlName="email" type="email" placeholder="you@example.com" class="input" />
            </div>
            <div class="field">
              <label class="label">Password</label>
              <input formControlName="password" type="password" placeholder="Min. 8 characters" class="input" />
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
              {{ loading ? 'Creating account…' : 'Create account' }}
            </button>
          </form>
        </div>

        <p class="text-center text-sm text-slate-500 mt-6">
          Already have an account?
          <a routerLink="/auth/login" class="text-indigo-600 font-medium hover:text-indigo-700">Sign in</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  loading = false;
  error = '';

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.register(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/customer/vehicles']),
      error: (err) => { this.error = err.error?.error || 'Registration failed'; this.loading = false; },
    });
  }
}
