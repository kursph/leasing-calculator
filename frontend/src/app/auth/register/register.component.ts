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
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 class="text-2xl font-bold text-center mb-6">Create Account</h2>
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">First Name</label>
              <input formControlName="firstName" class="mt-1 block w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Last Name</label>
              <input formControlName="lastName" class="mt-1 block w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input formControlName="email" type="email" class="mt-1 block w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Password</label>
            <input formControlName="password" type="password" class="mt-1 block w-full border rounded px-3 py-2" />
          </div>
          @if (error) {
            <p class="text-red-600 text-sm">{{ error }}</p>
          }
          <button type="submit" [disabled]="form.invalid || loading"
            class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {{ loading ? 'Creating...' : 'Register' }}
          </button>
        </form>
        <p class="mt-4 text-center text-sm">
          Have an account? <a routerLink="/auth/login" class="text-blue-600 hover:underline">Login</a>
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
      error: (err) => {
        this.error = err.error?.error || 'Registration failed';
        this.loading = false;
      },
    });
  }
}
