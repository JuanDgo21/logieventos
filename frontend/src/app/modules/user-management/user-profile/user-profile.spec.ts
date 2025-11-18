// Importamos las herramientas necesarias para testing de componentes Angular
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
// Importamos módulos para formularios reactivos y template-driven
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
// Importamos Router para probar navegación
import { Router } from '@angular/router';
// Importamos CUSTOM_ELEMENTS_SCHEMA para ignorar elementos HTML personalizados en las pruebas
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'; 
// Importamos operadores de RxJS para crear observables simulados
import { of, throwError } from 'rxjs';

// Componente que vamos a probar
import { UserProfileComponent } from './user-profile';

// Servicios e Interfaces que el componente utiliza
import { UserService } from '../../../core/services/user';
import { AuthService } from '../../../core/services/auth';
import { User } from '../../../shared/interfaces/user';

// Suite de pruebas para el UserProfileComponent
describe('UserProfileComponent', () => {
  let component: UserProfileComponent; // Instancia del componente
  let fixture: ComponentFixture<UserProfileComponent>; // Fixture para manejar el componente en el DOM

  // Spies para las dependencias - objetos simulados que reemplazan los servicios reales
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  // Datos mock de usuario para usar en múltiples pruebas
  const mockUser: User = {
    _id: '123',
    document: 1001,
    fullname: 'Juan Perez',
    username: 'juanp',
    email: 'juan@test.com',
    role: 'admin',
    active: true
  };

  // Helper para asegurar que el formulario base es válido antes de cada prueba compleja
  // Esto evita tener que repetir la configuración del formulario en cada prueba
  const makeFormValid = () => {
    component.profileForm.patchValue({
      document: '12345',
      fullname: 'Test User',
      username: 'testuser',
      email: 'test@test.com',
      currentPassword: '', // Campos de contraseña vacíos por defecto
      newPassword: '',
      confirmPassword: ''
    });
  };

  // Configuración que se ejecuta ANTES de cada prueba
  beforeEach(async () => {
    // Creamos spies (objetos simulados) para todos los servicios
    userServiceSpy = jasmine.createSpyObj('UserService', ['getProfile', 'changePassword', 'updateUser']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Configuración Happy Path por defecto - todas las llamadas exitosas
    userServiceSpy.getProfile.and.returnValue(of(mockUser)); // Perfil carga exitosamente
    userServiceSpy.updateUser.and.returnValue(of({ success: true, data: mockUser })); // Actualización exitosa
    userServiceSpy.changePassword.and.returnValue(of({ success: true })); // Cambio de contraseña exitoso

    // Configuramos el módulo de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [UserProfileComponent], // Declaramos el componente a probar
      imports: [ReactiveFormsModule, FormsModule], // Importamos módulos de formularios
      providers: [
        { provide: UserService, useValue: userServiceSpy }, // Usamos el mock de UserService
        { provide: AuthService, useValue: authServiceSpy }, // Usamos el mock de AuthService
        { provide: Router, useValue: routerSpy } // Usamos el mock de Router
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA] // Ignoramos elementos HTML personalizados
    }).compileComponents();

    // Creamos el fixture y la instancia del componente
    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Disparamos el ciclo de detección de cambios inicial (dispara ngOnInit -> loadUserProfile)
  });

  // =================================================
  // 1. CREACIÓN Y CARGA INICIAL
  // Pruebas del ciclo de vida del componente y carga inicial de datos
  // =================================================

  // Prueba básica: verificar que el componente se crea correctamente
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Prueba: El componente debe cargar el perfil del usuario al inicializarse
  it('should load user profile on init', () => {
    // Verificamos que se llamó al servicio para obtener el perfil
    expect(userServiceSpy.getProfile).toHaveBeenCalled();
    // Verificamos que el formulario se llenó con los datos del usuario mock
    expect(component.profileForm.get('email')?.value).toBe(mockUser.email);
    // Verificamos que no está en estado de carga después de completar
    expect(component.isLoading).toBeFalse();
  });

  // Prueba: Manejo de error específico al cargar el perfil
  it('should show specific error message when profile load fails', () => {
    // Configuramos el servicio para que falle con un mensaje específico
    userServiceSpy.getProfile.and.returnValue(throwError(() => ({ message: 'Error 500' })));
    // Forzamos la reinicialización del componente (ngOnInit)
    component.ngOnInit();
    // Verificamos que se muestra el mensaje de error específico
    expect(component.alertMessage).toContain('Error 500');
    // Verificamos que el tipo de alerta es 'danger' (error)
    expect(component.alertType).toBe('danger');
  });

  // Prueba: La alerta debe cerrarse automáticamente después de 5 segundos
  it('should show alert and auto-close it after 5 seconds', fakeAsync(() => {
    // Usamos error sin mensaje para probar el fallback 'Verifica tu conexión'
    userServiceSpy.getProfile.and.returnValue(throwError(() => ({})));
    
    // Forzamos la reinicialización del componente
    component.ngOnInit();
    
    // Verificamos que la alerta se muestra
    expect(component.showAlert).toBeTrue();
    // Verificamos que usa el mensaje por defecto cuando no hay mensaje específico
    expect(component.alertMessage).toContain('Verifica tu conexión');

    // Avanzamos el tiempo para disparar el callback del setTimeout (5 segundos)
    tick(5000);
    
    // Verificamos que la alerta se cerró automáticamente
    expect(component.showAlert).toBeFalse();
  }));

  // =================================================
  // 2. LÓGICA DE UI (Toggles y Validadores)
  // Pruebas de la interfaz de usuario y validación de formularios
  // =================================================

  // Prueba: Alternar visibilidad de la contraseña debe cambiar el estado
  it('should toggle password visibility', () => {
    expect(component.passwordVisible).toBeFalse(); // Estado inicial: oculta
    component.togglePasswordVisibility(); // Primera llamada
    expect(component.passwordVisible).toBeTrue(); // Ahora debe estar visible
  });

  // Prueba: Alternar campos de contraseña debe mostrar/ocultar y resetear los campos
  it('should toggle password fields and reset them', () => {
    // Activamos los campos de contraseña
    component.togglePasswordFields();
    expect(component.showPasswordFields).toBeTrue(); // Deben estar visibles
    
    // Simulamos que el usuario escribió algo
    component.profileForm.patchValue({ newPassword: '123' });
    
    // Desactivamos los campos de contraseña
    component.togglePasswordFields();
    expect(component.showPasswordFields).toBeFalse(); // Deben estar ocultos
    // Los campos de contraseña deben resetearse a null
    expect(component.profileForm.get('newPassword')?.value).toBeNull();
  });

  // Prueba: El validador debe verificar que las contraseñas coincidan
  it('should validate password matching', () => {
    const newPass = component.profileForm.get('newPassword');
    const confirmPass = component.profileForm.get('confirmPassword');

    // Caso Mismatch: contraseñas no coinciden
    newPass?.setValue('123');
    confirmPass?.setValue('456');
    component.profileForm.updateValueAndValidity(); // Forzamos validación
    expect(confirmPass?.hasError('mismatch')).toBeTrue(); // Debe tener error
    
    // Caso Match: contraseñas coinciden (Cubre el 'else' del validador)
    confirmPass?.setValue('123');
    component.profileForm.updateValueAndValidity(); // Forzamos validación
    expect(confirmPass?.hasError('mismatch')).toBeFalse(); // No debe tener error
  });

  // =================================================
  // 3. ENVÍO DE FORMULARIO (OnSubmit)
  // Pruebas del comportamiento cuando el usuario envía el formulario
  // =================================================

  // Prueba: Debe mostrar advertencia si el formulario es inválido al enviar
  it('should show warning if form is invalid on submit', () => {
    // Hacemos el formulario inválido (nombre vacío)
    component.profileForm.patchValue({ fullname: '' });
    component.onSubmit(); // Intentamos enviar
    expect(component.alertType).toBe('warning'); // Debe mostrar advertencia
    expect(userServiceSpy.updateUser).not.toHaveBeenCalled(); // No debe llamar al servicio
  });

  // ESCENARIO: Actualización simple (sin tocar contraseñas)
  // Cubre: Rama else principal del onSubmit (cuando no hay campos de contraseña visibles)
  it('should perform standard update (no password change) when password fields are hidden', () => {
    makeFormValid(); // Hacemos el formulario válido
    component.showPasswordFields = false; // Campos de contraseña ocultos

    component.onSubmit(); // Enviamos el formulario

    // No debe llamar a changePassword porque no hay cambio de contraseña
    expect(userServiceSpy.changePassword).not.toHaveBeenCalled();
    // Debe llamar a updateUser para actualizar los datos básicos
    expect(userServiceSpy.updateUser).toHaveBeenCalled();
    // Verificamos que NO intentó limpiar campos de password (porque estaban ocultos)
    expect(component.showPasswordFields).toBeFalse();
  });

  // ESCENARIO: Usuario abre toggle pero NO escribe contraseña (o la borra)
  // Cubre: "if (this.showPasswordFields)" dentro del success de updateProfile
  it('should update profile AND reset password fields if they were open but empty', () => {
    makeFormValid(); // Formulario básico válido
    component.showPasswordFields = true; // Campos de contraseña visibles
    component.profileForm.patchValue({ newPassword: '' }); // Pero contraseña vacía

    component.onSubmit(); // Enviamos el formulario

    // No debe llamar a changePassword porque la contraseña está vacía
    expect(userServiceSpy.changePassword).not.toHaveBeenCalled();
    // Debe llamar a updateUser para actualizar datos básicos
    expect(userServiceSpy.updateUser).toHaveBeenCalled();
    
    // Aquí verificamos que updateProfile SÍ entró al if de limpieza
    // (los campos de contraseña deben ocultarse y limpiarse)
    expect(component.showPasswordFields).toBeFalse();
    expect(component.profileForm.get('currentPassword')?.value).toBeNull();
  });

  // ESCENARIO: Cambio de contraseña exitoso
  // CORREGIDO: Usamos contraseñas válidas (>8 chars) para evitar el error de validación
  it('should change password AND update profile', () => {
    makeFormValid(); // Formulario básico válido
    component.showPasswordFields = true; // Campos de contraseña visibles
    // Configuramos contraseñas válidas y coincidentes
    component.profileForm.patchValue({
      currentPassword: 'oldPassword',
      newPassword: 'newPassword123', // Cumple minLength(8)
      confirmPassword: 'newPassword123'
    });

    component.onSubmit(); // Enviamos el formulario

    // Debe llamar a changePassword con las contraseñas correctas
    expect(userServiceSpy.changePassword).toHaveBeenCalledWith('oldPassword', 'newPassword123');
    // También debe llamar a updateUser para actualizar datos básicos
    expect(userServiceSpy.updateUser).toHaveBeenCalled();
  });

  // ESCENARIO: Error al cambiar contraseña
  // CORREGIDO: Usamos contraseñas válidas para llegar a la llamada del servicio
  it('should handle change password error', () => {
    makeFormValid(); // Formulario básico válido
    component.showPasswordFields = true; // Campos de contraseña visibles
    component.profileForm.patchValue({
      currentPassword: 'wrongPassword', // Contraseña actual incorrecta
      newPassword: 'newPassword123', // Cumple minLength(8)
      confirmPassword: 'newPassword123'
    });

    // Configuramos el servicio para que falle al cambiar contraseña
    userServiceSpy.changePassword.and.returnValue(throwError(() => ({ error: {} })));

    component.onSubmit(); // Enviamos el formulario

    // Debe mostrar el mensaje de error específico para contraseña incorrecta
    expect(component.alertMessage).toBe('La contraseña actual es incorrecta');
    // Debe salir del estado de carga
    expect(component.isLoading).toBeFalse();
  });

  // =================================================
  // 4. ACTUALIZACIÓN (Respuestas y Errores Complejos)
  // Pruebas de diferentes formatos de respuesta y manejo de errores
  // =================================================

  // Prueba: Manejo de respuesta con estructura { data: user }
  it('should handle update response structure { data: user }', () => {
    makeFormValid(); // Formulario válido
    const updatedUser = { ...mockUser, fullname: 'Data User' }; // Usuario actualizado
    userServiceSpy.updateUser.and.returnValue(of({ data: updatedUser })); // Respuesta con estructura data
    
    component.onSubmit(); // Enviamos formulario
    // El usuario actual debe actualizarse con los nuevos datos
    expect(component.currentUser?.fullname).toBe('Data User');
  });

  // Prueba: Manejo de respuesta con usuario directo (sin estructura data)
  it('should handle update response structure (direct user object)', () => {
    makeFormValid(); // Formulario válido
    const updatedUser = { ...mockUser, fullname: 'Direct User' }; // Usuario actualizado
    userServiceSpy.updateUser.and.returnValue(of(updatedUser)); // Respuesta directa con usuario
    
    component.onSubmit(); // Enviamos formulario
    // El usuario actual debe actualizarse con los nuevos datos
    expect(component.currentUser?.fullname).toBe('Direct User');
  });

  // Prueba: No debe actualizar si no hay ID de usuario
  it('should abort update if currentUser ID is missing', () => {
    makeFormValid(); // Formulario válido
    component.currentUser = null; // No hay usuario actual
    component.onSubmit(); // Intentamos enviar
    // No debe llamar al servicio de actualización
    expect(userServiceSpy.updateUser).not.toHaveBeenCalled();
    // Debe mostrar mensaje de error apropiado
    expect(component.alertMessage).toBe('No se pudo identificar al usuario');
  });

  // Prueba: Manejo de actualización exitosa pero sin datos
  it('should show warning if update returns success but no data', () => {
    makeFormValid(); // Formulario válido
    // Servicio responde éxito pero sin datos de usuario
    userServiceSpy.updateUser.and.returnValue(of({ success: true, data: null })); 
    component.onSubmit(); // Enviamos formulario
    // Debe mostrar advertencia indicando que no llegaron datos
    expect(component.alertMessage).toContain('no se recibieron datos');
  });

  // Prueba: Recuperación de error cuando la respuesta contiene JSON exitoso en el campo text
  it('should recover from update error if text contains success JSON', () => {
    makeFormValid(); // Formulario válido
    // Creamos un JSON de éxito como string (simula respuesta de error con datos útiles)
    const successJson = JSON.stringify({ success: true, data: mockUser });
    userServiceSpy.updateUser.and.returnValue(throwError(() => ({ 
      error: { text: successJson } // Error pero con JSON exitoso en text
    })));
    
    // Espiamos loadUserProfile para verificar que se llama para recargar datos
    spyOn(component, 'loadUserProfile');
    component.onSubmit(); // Enviamos formulario

    // A pesar del error técnico, debe mostrar éxito porque el JSON interno era exitoso
    expect(component.alertType).toBe('success');
    // Debe recargar el perfil del usuario
    expect(component.loadUserProfile).toHaveBeenCalled();
  });

  // Prueba: Manejo de error cuando el JSON es válido pero indica fallo
  it('should handle error if text is valid JSON but success is false', () => {
    makeFormValid(); // Formulario válido
    // Creamos un JSON de fallo como string
    const failureJson = JSON.stringify({ success: false, message: 'Logical Fail' });
    userServiceSpy.updateUser.and.returnValue(throwError(() => ({ 
      error: { text: failureJson } // Error con JSON de fallo en text
    })));

    component.onSubmit(); // Enviamos formulario

    // Debe caer al manejo de error normal (tipo danger)
    expect(component.alertType).toBe('danger');
    // Como el mensaje de error original era undefined, usa el mensaje por defecto
    expect(component.alertMessage).toContain('No se pudo actualizar el perfil');
  });

  // Prueba: Manejo de error con JSON inválido en el campo text
  it('should handle regular update error (invalid JSON)', () => {
    makeFormValid(); // Formulario válido
    userServiceSpy.updateUser.and.returnValue(throwError(() => ({ 
      error: { text: 'INVALID JSON' } // JSON inválido en text
    })));

    component.onSubmit(); // Enviamos formulario

    // Debe manejar como error normal
    expect(component.alertType).toBe('danger');
    // Debe usar mensaje de error por defecto
    expect(component.alertMessage).toContain('No se pudo actualizar el perfil');
  });

  // Prueba: Redirección después de actualización exitosa
  it('should redirect after successful update', fakeAsync(() => {
    makeFormValid(); // Formulario válido
    userServiceSpy.updateUser.and.returnValue(of(mockUser)); // Actualización exitosa
    
    component.onSubmit(); // Enviamos formulario
    
    tick(3000); // Ejecuta callback de redirección (3 segundos)
    // Debe navegar a la página principal después del timeout
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/pages/principal']);
  }));

  // Prueba: getRoleName debe devolver los nombres de rol correctos
  it('should return correct role names', () => {
    // Probamos todos los roles posibles
    component.currentUser = { ...mockUser, role: 'admin' };
    expect(component.getRoleName()).toBe('Administrador');
    
    component.currentUser = { ...mockUser, role: 'coordinador' };
    expect(component.getRoleName()).toBe('Coordinador');
    
    component.currentUser = { ...mockUser, role: 'lider' };
    expect(component.getRoleName()).toBe('Líder');
    
    component.currentUser = { ...mockUser, role: 'user' as any };
    expect(component.getRoleName()).toBe('Usuario');
    
    // Caso borde: usuario null
    component.currentUser = null;
    expect(component.getRoleName()).toBe('Usuario');
  });
});