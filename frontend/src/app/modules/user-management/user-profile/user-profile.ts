  import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '../../../shared/interfaces/user';
import { UserService } from '../../../core/services/user';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';

  @Component({
    selector: 'app-user-profile',
    standalone: false,
    templateUrl: './user-profile.html',
    styleUrl: './user-profile.scss'
  })
  export class UserProfileComponent {
  profileForm: FormGroup;
  isLoading = false;
  currentUser: User | null = null;
  passwordVisible = false;
  showPasswordFields = false;
  alertMessage: string = '';
  alertType: string = '';
  showAlert: boolean = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private cdRef: ChangeDetectorRef
  ) {
    this.profileForm = this.fb.group({
      document: ['', [Validators.required, Validators.pattern(/^[0-9]*$/)]],
      fullname: ['', [Validators.required, Validators.minLength(3)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      currentPassword: [''],
      newPassword: ['', [Validators.minLength(8)]],
      confirmPassword: ['']
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private passwordMatchValidator(form: FormGroup) {
    if (form.get('newPassword')?.value !== form.get('confirmPassword')?.value) {
      form.get('confirmPassword')?.setErrors({ mismatch: true });
    } else {
      form.get('confirmPassword')?.setErrors(null);
    }
  }

  private showBootstrapAlert(type: string, message: string): void {
    this.alertType = type;
    this.alertMessage = message;
    this.showAlert = true;
    setTimeout(() => {
      this.showAlert = false;
      this.cdRef.detectChanges();
    }, 5000);
    this.cdRef.detectChanges();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    console.log('Cargando perfil de usuario...');
    
    this.userService.getProfile().subscribe({
      next: (user: any) => {
        console.log('Perfil recibido:', user);
        
        // Maneja tanto respuesta directa como {success, data}
        const userData = user.data || user;
        this.currentUser = userData;
        
        this.profileForm.patchValue({
          document: userData.document,
          fullname: userData.fullname,
          username: userData.username,
          email: userData.email
        });
        
        this.isLoading = false;
        console.log('Perfil cargado exitosamente');
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
        this.showBootstrapAlert('danger', 'Error al cargar el perfil: ' + (err.message || 'Verifica tu conexión'));
        this.isLoading = false;
      }
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  togglePasswordFields(): void {
    this.showPasswordFields = !this.showPasswordFields;
    
    if (!this.showPasswordFields) {
      this.profileForm.get('currentPassword')?.reset();
      this.profileForm.get('newPassword')?.reset();
      this.profileForm.get('confirmPassword')?.setErrors(null);
      this.profileForm.get('confirmPassword')?.reset();
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      console.warn('Formulario inválido:', this.profileForm.errors);
      this.showBootstrapAlert('warning', 'Por favor completa todos los campos requeridos correctamente');
      return;
    }

    this.isLoading = true;
    const formData = this.profileForm.value;
    console.log('Datos del formulario a enviar:', formData);

    // Preparar datos para actualización
    const updateData: Partial<User> = {
      document: formData.document,
      fullname: formData.fullname,
      username: formData.username,
      email: formData.email
    };

    // Si estamos cambiando la contraseña
    if (this.showPasswordFields && formData.newPassword) {
      console.log('Iniciando cambio de contraseña...');
      this.userService.changePassword(formData.currentPassword, formData.newPassword).subscribe({
        next: () => {
          console.log('Contraseña cambiada exitosamente, ahora actualizando perfil...');
          this.updateProfile(updateData);
        },
        error: (err) => {
          console.error('Error al cambiar contraseña:', err);
          this.isLoading = false;
          this.showBootstrapAlert('danger', err.error?.message || 'La contraseña actual es incorrecta');
        }
      });
    } else {
      this.updateProfile(updateData);
    }
  }

  private updateProfile(updateData: Partial<User>): void {
    console.log('Iniciando actualización de perfil con datos:', updateData);
    
    if (!this.currentUser?._id) {
      console.error('No se encontró ID de usuario');
      this.showBootstrapAlert('danger', 'No se pudo identificar al usuario');
      this.isLoading = false;
      return;
    }

    this.userService.updateUser(this.currentUser._id, updateData).subscribe({
      next: (response: any) => {
        console.log('Respuesta del servidor:', response);
        
        // Maneja ambos formatos de respuesta
        const updatedUser = response.data || response;
        
        if (updatedUser._id) {
          console.log('Perfil actualizado exitosamente:', updatedUser);
          this.currentUser = updatedUser;
          this.showBootstrapAlert('success', '¡Tus datos se han actualizado correctamente!');
          
          // Redirección después de 3 segundos
        setTimeout(() => {
          this.router.navigate(['/pages/principal']); // Ajusta la ruta según tu configuración
        }, 3000);


          // Resetear campos de contraseña si es necesario
          if (this.showPasswordFields) {
            this.showPasswordFields = false;
            this.profileForm.get('currentPassword')?.reset();
            this.profileForm.get('newPassword')?.reset();
            this.profileForm.get('confirmPassword')?.reset();
          }
        } else {
          console.warn('Respuesta inesperada del servidor:', response);
          this.showBootstrapAlert('warning', 'Actualización exitosa pero no se recibieron datos actualizados');
        }
        
        this.isLoading = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        console.error('Error en la actualización:', err);
        
        // Verifica si el error es por respuesta no parseada
        if (err.error && err.error.text) {
          try {
            const parsedResponse = JSON.parse(err.error.text);
            if (parsedResponse.success) {
              console.log('Actualización exitosa (error de parseo):', parsedResponse);
              this.showBootstrapAlert('success', '¡Tus datos se han actualizado correctamente!');
              this.loadUserProfile(); // Recargar perfil para asegurar datos actualizados
              this.isLoading = false;
              return;
            }
          } catch (e) {
            console.error('Error parseando respuesta:', e);
          }
        }
        
        this.showBootstrapAlert('danger', err.error?.message || 'No se pudo actualizar el perfil');
        this.isLoading = false;
      }
    });
  }

  getRoleName(): string {
    if (!this.currentUser) return 'Usuario';
    
    switch(this.currentUser.role) {
      case 'admin': return 'Administrador';
      case 'coordinador': return 'Coordinador';
      case 'lider': return 'Líder';
      default: return 'Usuario';
    }
  }
}