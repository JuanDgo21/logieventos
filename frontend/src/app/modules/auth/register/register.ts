import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';
import { User } from '../../../shared/interfaces/user';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  showAlert = false;
  alertType = 'success';
  alertMessage = '';
  passwordVisible = false;
  
  // Roles válidos según la interfaz User
  validRoles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'coordinador', label: 'Coordinador' },
    { value: 'lider', label: 'Líder' }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.registerForm = this.fb.group({
      document: ['', [Validators.required, Validators.pattern(/^\d{8,12}$/)]],
      fullname: ['', [Validators.required, Validators.minLength(5)]],
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      ]],
      role: ['', [Validators.required, Validators.pattern(/^(admin|coordinador|lider)$/)]],
      active: [true]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.showAlert = false;

    const formValue = this.registerForm.value;
    
    const userData = {
      document: Number(formValue.document),
      fullname: formValue.fullname,
      username: formValue.username,
      email: formValue.email,
      password: formValue.password,
      role: formValue.role,
      active: true,
      deletedAt: null
    } as Omit<User, '_id' | 'createdAt' | 'updatedAt'> & { deletedAt: Date | null };

    this.authService.register(userData).subscribe({
      next: () => {
        this.showSuccessAlert('Registro completado con éxito. Redirigiendo...');
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (error) => {
        this.showErrorAlert(error.error?.message || 'Error en el registro');
        this.isLoading = false;
      }
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  onDocumentInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replaceAll(/\D/g, '');
    this.registerForm.get('document')?.setValue(value, { emitEvent: false });
  }

  private showSuccessAlert(message: string): void {
    this.alertType = 'success';
    this.alertMessage = message;
    this.showAlert = true;
  }

  private showErrorAlert(message: string): void {
    this.alertType = 'danger';
    this.alertMessage = message;
    this.showAlert = true;
  }

  getAlertIcon(): string {
    return this.alertType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  }

  getAlertTitle(): string {
    return this.alertType === 'success' ? 'Éxito!' : 'Error!';
  }
}