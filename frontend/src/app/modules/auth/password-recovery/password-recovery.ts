import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-password-recovery',
  standalone: false,
  templateUrl: './password-recovery.html',
  styleUrl: './password-recovery.scss'
})
export class PasswordRecoveryComponent {
  recoveryForm: FormGroup;
  isLoading = false;
  emailVerified = false;
  resetSuccess = false;
  errorMessage = '';
  resetToken = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('newPassword')?.value === form.get('confirmPassword')?.value 
      ? null : { mismatch: true };
  }

  verifyEmail(): void {
    if (this.recoveryForm.get('email')?.invalid) {
      this.errorMessage = 'Por favor ingresa un correo electrónico válido';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.forgotPassword(this.recoveryForm.value.email).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Guarda el token exactamente como viene del backend
          this.resetToken = response.token;
          this.emailVerified = true;
          console.log('Token recibido del backend:', this.resetToken);
        } else {
          this.errorMessage = response.message || 'Error al verificar el email';
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al procesar la solicitud';
        console.error('Error en verifyEmail:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  } 

  resetPassword(): void {
    if (this.recoveryForm.invalid) {
      this.errorMessage = 'Por favor completa todos los campos correctamente';
      return;
    }

    const newPassword = this.recoveryForm.value.newPassword;
    const confirmPassword = this.recoveryForm.value.confirmPassword;

    if (newPassword !== confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.resetPassword(this.resetToken, newPassword).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response?.success) {
          this.resetSuccess = true;
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        } else {
          this.errorMessage = response?.message || 'Error al actualizar la contraseña';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Error al resetear la contraseña';
        console.error('Error completo:', error);
      }
    });
  }

}