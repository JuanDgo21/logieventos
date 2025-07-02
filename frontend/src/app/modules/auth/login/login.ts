import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  passwordVisible = false;
  showAlert = false;
  alertType = 'danger';
  alertMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  getAlertIcon(): string {
    return {
      'success': 'fa-check-circle',
      'danger': 'fa-exclamation-triangle',
      'warning': 'fa-exclamation-circle',
      'info': 'fa-info-circle'
    }[this.alertType] || 'fa-info-circle';
  }

  getAlertTitle(): string {
    return {
      'success': 'Éxito',
      'danger': 'Error',
      'warning': 'Advertencia',
      'info': 'Información'
    }[this.alertType] || 'Mensaje';
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.showAlert = false;

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.alertType = 'success';
        this.alertMessage = 'Inicio de sesión exitoso';
        this.showAlert = true;
        setTimeout(() => this.router.navigate(['/home']), 1500);
      },
      error: (err) => {
        this.alertType = 'danger';
        this.alertMessage = err.error?.message || 'Error al iniciar sesión';
        this.showAlert = true;
        this.isLoading = false;
      }
    });
  }
}