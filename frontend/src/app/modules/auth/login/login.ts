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
  loading = false;
  passwordVisible = false;
  showAlert = false;
  alertMessage = '';
  alertType = 'danger';

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

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormAsTouched();
      return;
    }

    this.loading = true;
    this.showAlert = false;
    const { email, password } = this.loginForm.value;

    console.log('Intentando iniciar sesión con:', email); // Console.log añadido

    this.authService.login(email, password).subscribe({
      next: (response) => {
        console.log('Inicio de sesión exitoso', response); // Console.log añadido
        console.log('Rol del usuario:', this.authService.getUserRoles()); // Console.log añadido para el rol
        
        this.showAlertMessage('Bienvenido al sistema', 'success');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Error al iniciar sesión:', error); // Console.log añadido
        this.loading = false;
        const errorMessage = error.error?.message || 'Error al iniciar sesión';
        this.showAlertMessage(errorMessage, 'danger');
      }
    });
  }

  private markFormAsTouched(): void {
    Object.values(this.loginForm.controls).forEach(control => {
      control.markAsTouched();
    });
    this.showAlertMessage('Por favor complete el formulario correctamente', 'danger');
  }

  private showAlertMessage(message: string, type: 'danger' | 'success'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }
}

//subida