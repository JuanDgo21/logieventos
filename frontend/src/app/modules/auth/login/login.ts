import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  alertTimeout: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      ]]
    });

    // Validación en tiempo real
    this.loginForm.valueChanges.subscribe(() => {
      if (this.showAlert) {
        this.dismissAlert();
      }
    });
  }

  getAlertIcon(): string {
    return {
      'success': 'fa-check-circle',
      'danger': 'fa-exclamation-triangle',
      'warning': 'fa-exclamation-circle'
    }[this.alertType] || 'fa-info-circle';
  }

  getAlertTitle(): string {
    return {
      'success': 'Éxito!',
      'danger': 'Error!',
      'warning': 'Advertencia!'
    }[this.alertType] || 'Información';
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  showAlertMessage(type: string, message: string, duration: number = 5000): void {
    this.alertType = type;
    this.alertMessage = message;
    this.showAlert = true;
    
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
    
    this.alertTimeout = setTimeout(() => {
      this.dismissAlert();
    }, duration);
  }

  dismissAlert(): void {
    this.showAlert = false;
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
  }

  navigateToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.showAlertMessage('warning', 'Por favor completa todos los campos correctamente');
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.showAlertMessage('success', 'Inicio de sesión exitoso! Redirigiendo...');
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        const message = err.error?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
        this.showAlertMessage('danger', message);
      }
    });
  }
}