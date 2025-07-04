import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-password-recovery',
  standalone: false,
  templateUrl: './password-recovery.html',
  styleUrl: './password-recovery.scss'
})
export class PasswordRecoveryComponent {
  recoveryForm: FormGroup;
  emailVerified = false;
  resetSuccess = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  recoveryToken = '';
  showNewPassword = false;
  showConfirmPassword = false;
  showAlert = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });

    // Ocultar alertas cuando el usuario modifica el formulario
    this.recoveryForm.valueChanges.subscribe(() => {
      if (this.showAlert) {
        this.dismissAlert();
      }
    });
  }

  // Validador personalizado para coincidencia de contraseñas
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  // Paso 1: Verificar email y generar token
  verifyEmail(): void {
    if (this.recoveryForm.get('email')?.invalid) {
      this.recoveryForm.get('email')?.markAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const email = this.recoveryForm.get('email')?.value;

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.recoveryToken = response.token;
        this.emailVerified = true;
        this.isLoading = false;
        this.successMessage = 'Se ha enviado un token de verificación. Por favor ingresa tu nueva contraseña.';
      },
      error: (error) => {
        this.errorMessage = error.message || 'Error al verificar el email';
        this.isLoading = false;
      }
    });
  }

  // Paso 2: Resetear contraseña
  resetPassword(): void {
    if (this.recoveryForm.invalid) {
      this.recoveryForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const newPassword = this.recoveryForm.get('newPassword')?.value;

    this.authService.resetPassword(this.recoveryToken, newPassword).subscribe({
      next: () => {
        this.resetSuccess = true;
        this.isLoading = false;
        this.successMessage = '¡Contraseña actualizada correctamente!';
        
        // Redirigir después de 3 segundos
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
        
        // Si el token es inválido, volver al paso 1
        if (error.message.includes('inválido') || error.message.includes('expirado')) {
          this.emailVerified = false;
        }
      }
    });
  }

  // Añade estos métodos
  getPasswordStrengthClass(): string {
    const password = this.recoveryForm.get('newPassword')?.value;
    if (!password) return '';
    
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const length = password.length;
    
    if (length < 6) return 'weak';
    if (length < 8 || !(hasLetters && hasNumbers)) return 'medium';
    if (hasLetters && hasNumbers && hasSpecial && length >= 8) return 'strong';
    
    return 'medium';
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrengthClass();
    switch(strength) {
      case 'weak': return 'Débil';
      case 'medium': return 'Moderada';
      case 'strong': return 'Fuerte';
      default: return '';
    }
  }

  dismissAlert(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

}