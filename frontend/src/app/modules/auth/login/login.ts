import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {
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
    private router: Router,
    private cdRef: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
        ]
      ]
    });

    this.loginForm.valueChanges.subscribe(() => {
      if (this.showAlert) this.dismissAlert();
    });
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigateByUrl('/pages/principal');
    }
  }

  getAlertIcon(): string {
    return (
      {
        success: 'fa-check-circle',
        danger: 'fa-exclamation-triangle',
        warning: 'fa-exclamation-circle'
      }[this.alertType] || 'fa-info-circle'
    );
  }

  getAlertTitle(): string {
    return (
      {
        success: 'Éxito!',
        danger: 'Error!',
        warning: 'Advertencia!'
      }[this.alertType] || 'Información'
    );
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  showAlertMessage(type: string, message: string, duration: number = 4000): void {
    this.alertType = type;
    this.alertMessage = message;
    this.showAlert = true;

    if (this.alertTimeout) clearTimeout(this.alertTimeout);

    this.alertTimeout = setTimeout(() => {
      this.dismissAlert();
    }, duration);
  }

  dismissAlert(): void {
    this.showAlert = false;
    if (this.alertTimeout) clearTimeout(this.alertTimeout);
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
        this.isLoading = false;
        this.showAlertMessage('success', 'Inicio de sesión exitoso! Redirigiendo...');

        // 🔹 Validación de token con retardo controlado
        setTimeout(() => {
          const token = localStorage.getItem('token');
          if (token && this.authService.isLoggedIn()) {
            this.cdRef.detectChanges();
            this.router.navigateByUrl('/pages/principal');
          } else {
            // 🔁 Segundo intento rápido
            setTimeout(() => {
              const retryToken = localStorage.getItem('token');
              if (retryToken && this.authService.isLoggedIn()) {
                this.router.navigateByUrl('/pages/principal');
              } else {
                this.showAlertMessage('danger', 'Error al autenticar. Intenta nuevamente.');
              }
            }, 400);
          }
        }, 300);
      },
      error: (err) => {
        this.isLoading = false;
        const message =
          err.error?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
        this.showAlertMessage('danger', message);
      }
    });
  }
}
