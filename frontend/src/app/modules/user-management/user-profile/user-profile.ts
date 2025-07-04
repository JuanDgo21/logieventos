import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { apiRouters } from '../../../core/constants/apiRouters';

@Component({
  selector: 'app-user-profile',
  standalone: false,
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss'
})
export class UserProfileComponent {
  // perfilForm: FormGroup;
  // usuarioActual: any;
  // cargando = false;
  // mensajeError: string | null = null;
  // mensajeExito: string | null = null;

  // constructor(
  //   private fb: FormBuilder,
  //   private authService: AuthService,
  //   private apiService: ApiService,
  //   private router: Router
  // ) {
  //   this.perfilForm = this.fb.group({
  //     document: ['', [Validators.required, Validators.pattern(/^[0-9]*$/)]],
  //     fullname: ['', Validators.required],
  //     username: ['', Validators.required],
  //     email: ['', [Validators.required, Validators.email]],
  //     password: [''],
  //     confirmPassword: ['']
  //   }, { validator: this.comprobarContrasenas });
  // }

  // ngOnInit(): void {
  //   this.cargarDatosUsuario();
  // }

  // cargarDatosUsuario(): void {
  //   const token = this.authService.getToken();
  //   if (!token) {
  //     this.router.navigate(['/auth/login']);
  //     return;
  //   }

  //   const decodedToken: any = jwtDecode(token);
  //   this.usuarioActual = {
  //     _id: decodedToken.id,
  //     document: decodedToken.document,
  //     fullname: decodedToken.fullname,
  //     username: decodedToken.username,
  //     email: decodedToken.email
  //   };
    
  //   this.perfilForm.patchValue({
  //     document: this.usuarioActual.document,
  //     fullname: this.usuarioActual.fullname,
  //     username: this.usuarioActual.username,
  //     email: this.usuarioActual.email
  //   });
  // }

  // comprobarContrasenas(group: FormGroup): any {
  //   const pass = group.get('password')?.value;
  //   const confirmPass = group.get('confirmPassword')?.value;
    
  //   return pass === confirmPass ? null : { noCoinciden: true };
  // }

  // async guardarCambios(): Promise<void> {
  //   if (this.perfilForm.invalid) {
  //     this.mensajeError = 'Por favor complete todos los campos requeridos correctamente';
  //     return;
  //   }

  //   this.cargando = true;
  //   this.mensajeError = null;
  //   this.mensajeExito = null;
    
  //   const datosActualizados = {
  //     document: this.perfilForm.value.document,
  //     fullname: this.perfilForm.value.fullname,
  //     username: this.perfilForm.value.username,
  //     email: this.perfilForm.value.email,
  //     ...(this.perfilForm.value.password && { password: this.perfilForm.value.password })
  //   };

  //   try {
  //     const response = await this.apiService.putPromise(
  //       apiRouters.USERS.BY_ID(this.usuarioActual._id),
  //       datosActualizados
  //     );

  //     this.mensajeExito = 'Perfil actualizado correctamente';
  //     this.cargando = false;

  //     if (response.token) {
  //       this.authService.saveUserData(response);
  //     }
  //   } catch (error: any) {
  //     this.cargando = false;
  //     this.mensajeError = error.error?.message || 'Error al actualizar el perfil';
  //     console.error('Error al actualizar perfil:', error);
  //   }
  // }

  // cancelar(): void {
  //   this.router.navigate(['/dashboard']);
  }