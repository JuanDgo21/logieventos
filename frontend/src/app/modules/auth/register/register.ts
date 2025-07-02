import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';


@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  // registerForm: FormGroup;
  // isLoading = false;
  // errorMessage = '';
  // successMessage = '';

  // constructor(
  //   private fb: FormBuilder,
  //   private authService: AuthService,
  //   private router: Router
  // ) {
  //   this.registerForm = this.fb.group({
  //     username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
  //     email: ['', [Validators.required, Validators.email]],
  //     password: ['', [Validators.required, Validators.minLength(8)]]
  //   });
  // }

  // onSubmit(): void {
  //   if (this.registerForm.invalid) {
  //     return;
  //   }

  //   this.isLoading = true;
  //   this.errorMessage = '';
  //   this.successMessage = '';

  //   const userData = {
  //     ...this.registerForm.value,
  //     role: 'lider' // Rol por defecto como se especifica
  //   };

  //   this.authService.register(userData).subscribe({
  //     next: (response) => {
  //       this.isLoading = false;
  //       this.successMessage = 'Registro exitoso! Redirigiendo...';
  //       setTimeout(() => {
  //         this.router.navigate(['/auth/login']);
  //       }, 2000);
  //     },
  //     error: (error) => {
  //       this.isLoading = false;
  //       this.errorMessage = this.getErrorMessage(error);
  //     }
  //   });
  // }

  // private getErrorMessage(error: any): string {
  //   if (error.error && error.error.message) {
  //     return error.error.message;
  //   }
  //   if (error.status === 400) {
  //     return 'Datos inválidos. Por favor verifica la información.';
  //   }
  //   if (error.status === 409) {
  //     return 'El correo electrónico ya está registrado.';
  //   }
  //   return 'Ocurrió un error durante el registro. Por favor intenta nuevamente.';
  // }
}