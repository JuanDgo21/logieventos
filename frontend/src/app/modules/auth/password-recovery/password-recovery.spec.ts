// Importamos las herramientas necesarias para testing de componentes Angular
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
// Importamos módulos para formularios reactivos
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
// Importamos Router para probar navegación
import { Router } from '@angular/router';
// Importamos NO_ERRORS_SCHEMA para ignorar elementos HTML desconocidos en las pruebas
import { NO_ERRORS_SCHEMA } from '@angular/core';
// Importamos operadores de RxJS para crear observables simulados
import { of, throwError, delay } from 'rxjs';
// Importamos el servicio de autenticación que el componente usa
import { AuthService } from '../../../core/services/auth';
// Importamos el componente que vamos a probar - recuperación de contraseña
import { PasswordRecoveryComponent } from './password-recovery';

// Suite de pruebas para el PasswordRecoveryComponent
describe('PasswordRecoveryComponent', () => {
  let component: PasswordRecoveryComponent; // Instancia del componente
  let fixture: ComponentFixture<PasswordRecoveryComponent>; // Fixture para manejar el componente en el DOM
  
  // Spies para las dependencias - objetos simulados que reemplazan los servicios reales
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  // Configuración que se ejecuta ANTES de cada prueba
  beforeEach(async () => {
    // 1. Crear los Spies (objetos simulados) para los servicios
    mockAuthService = jasmine.createSpyObj('AuthService', ['forgotPassword', 'resetPassword']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Configuramos el módulo de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [PasswordRecoveryComponent], // Declaramos el componente a probar
      imports: [
        ReactiveFormsModule // Importamos módulo de formularios reactivos
        // Eliminamos RouterTestingModule para evitar el error de 'root'
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService }, // Usamos el mock de AuthService
        { provide: Router, useValue: mockRouter }, // Usamos el mock de Router
        FormBuilder // Proveemos FormBuilder real para crear formularios
      ],
      // Agregamos esto para que ignore [routerLink] en el HTML sin fallar
      // NO_ERRORS_SCHEMA le dice a Angular que ignore cualquier elemento o atributo que no reconozca
      schemas: [NO_ERRORS_SCHEMA] 
    })
    .compileComponents(); // Compilamos el componente y su template

    // Creamos el fixture y la instancia del componente
    fixture = TestBed.createComponent(PasswordRecoveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Disparamos el ciclo de detección de cambios inicial
  });

  // ==========================================
  // PRUEBAS DE CREACIÓN E INICIALIZACIÓN
  // ==========================================

  // Prueba básica: verificar que el componente se crea correctamente
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Prueba: El formulario de recuperación debe inicializarse con valores vacíos y validadores
  it('should initialize the form with empty values and validators', () => {
    const form = component.recoveryForm;
    expect(form).toBeDefined(); // El formulario debe existir
    // Todos los campos deben empezar vacíos
    expect(form.get('email')?.value).toBe('');
    expect(form.get('newPassword')?.value).toBe('');
    expect(form.get('confirmPassword')?.value).toBe('');
    expect(form.valid).toBeFalse(); // El formulario completo debe ser inválido inicialmente
  });

  // ==========================================
  // PRUEBAS DE VALIDADORES (Coverage 100% en branches)
  // ==========================================

  // Prueba: El validador personalizado debe verificar que las contraseñas coincidan
  it('should validate that passwords match (match vs mismatch)', () => {
    const passwordControl = component.recoveryForm.get('newPassword');
    const confirmControl = component.recoveryForm.get('confirmPassword');

    // Caso 1: Contraseñas NO coinciden (Cubre branch { mismatch: true })
    passwordControl?.setValue('SecurePass1');
    confirmControl?.setValue('DifferentPass2');
    
    // Forzamos la actualización para que corra el validador de grupo
    component.recoveryForm.updateValueAndValidity();
    
    // El formulario debe tener error 'mismatch'
    expect(component.recoveryForm.hasError('mismatch')).toBeTrue();

    // Caso 2: Contraseñas SÍ coinciden (Cubre branch null - sin error)
    confirmControl?.setValue('SecurePass1');
    component.recoveryForm.updateValueAndValidity();

    // El formulario NO debe tener error 'mismatch'
    expect(component.recoveryForm.hasError('mismatch')).toBeFalse();
  });

  // Prueba: El validador de patrón debe verificar la complejidad de la contraseña
  it('should validate password complexity (regex)', () => {
    const passwordControl = component.recoveryForm.get('newPassword');

    // Caso Inválido: solo letras minúsculas (falta mayúscula y número)
    passwordControl?.setValue('weakpassword');
    expect(passwordControl?.hasError('pattern')).toBeTrue();

    // Caso Válido: Tiene mayúscula, minúscula y número
    passwordControl?.setValue('Valid1Pass');
    expect(passwordControl?.valid).toBeTrue();
  });

  // ==========================================
  // PRUEBAS DE UI Y VALUECHANGES (Coverage para dismissAlert)
  // ==========================================

  // Prueba: dismissAlert debe llamarse cuando el formulario cambia Y hay alerta visible
  it('should call dismissAlert when form value changes IF showAlert is true', () => {
    // Espiamos el método real para verificar que se llama
    spyOn(component, 'dismissAlert').and.callThrough();
    
    // 1. Forzamos la condición para entrar al IF (showAlert debe ser true)
    component.showAlert = true; 
    
    // 2. Disparar cambio en el formulario (esto debería activar el valueChanges)
    component.recoveryForm.get('email')?.setValue('cambio@test.com');
    
    // 3. Verificar que se llamó y que showAlert NO se reseteó (según lógica actual del TS)
    expect(component.dismissAlert).toHaveBeenCalled();
    // NOTA: En la lógica actual, dismissAlert() no pone showAlert a false, debe seguir true
    expect(component.showAlert).toBeTrue(); 
  });

  // Prueba: dismissAlert NO debe llamarse cuando no hay alerta visible
  it('should NOT call dismissAlert when form value changes IF showAlert is false', () => {
    spyOn(component, 'dismissAlert');
    
    component.showAlert = false; // No hay alerta visible
    component.recoveryForm.get('email')?.setValue('otro@test.com'); // Cambio en formulario
    
    // dismissAlert NO debe llamarse porque no hay alerta visible
    expect(component.dismissAlert).not.toHaveBeenCalled();
  });

  // ==========================================
  // PRUEBAS DE FUERZA DE CONTRASEÑA
  // ==========================================

  // Prueba: El cálculo de fuerza de contraseña debe funcionar correctamente
  it('should calculate password strength correctly', () => {
    const passwordControl = component.recoveryForm.get('newPassword');

    // Caso 1: Vacío (Cubre return '')
    passwordControl?.setValue('');
    expect(component.getPasswordStrengthClass()).toBe(''); // Sin clase
    expect(component.getPasswordStrengthText()).toBe(''); // Sin texto (CUBRE default del switch)

    // Caso 2: Débil (< 6 caracteres)
    passwordControl?.setValue('12345');
    expect(component.getPasswordStrengthClass()).toBe('weak'); // Clase 'weak'
    expect(component.getPasswordStrengthText()).toBe('Débil'); // Texto 'Débil'

    // Caso 3: Moderada (Longitud < 8, pero tiene letras + números)
    passwordControl?.setValue('Abc1234'); 
    expect(component.getPasswordStrengthClass()).toBe('medium'); // Clase 'medium'
    expect(component.getPasswordStrengthText()).toBe('Moderada'); // Texto 'Moderada'

    // Caso 4: Moderada (Longitud >= 8, pero solo letras mayúsculas)
    passwordControl?.setValue('AAAAAAAA'); 
    expect(component.getPasswordStrengthClass()).toBe('medium'); // Clase 'medium'

    // Caso 5: Moderada (Longitud >= 8, Letras + Números, SIN caracteres especiales) 
    // **ESTE CUBRE EL ÚLTIMO RETURN 'medium' EN LA LÓGICA**
    passwordControl?.setValue('ValidPass1'); 
    expect(component.getPasswordStrengthClass()).toBe('medium'); // Clase 'medium'

    // Caso 6: Fuerte (Letras + Números + Caracteres especiales + >= 8 caracteres)
    passwordControl?.setValue('SecurePass1@');
    expect(component.getPasswordStrengthClass()).toBe('strong'); // Clase 'strong'
    expect(component.getPasswordStrengthText()).toBe('Fuerte'); // Texto 'Fuerte'
  });

  // ==========================================
  // PASO 1: verifyEmail (VERIFICACIÓN DE EMAIL)
  // ==========================================

  // Prueba: Verificación de email exitosa
  it('should verify email successfully', fakeAsync(() => {
    // Simulamos respuesta exitosa del servicio
    const mockResponse = { token: 'fake-jwt-token' };
    mockAuthService.forgotPassword.and.returnValue(of(mockResponse).pipe(delay(100)));

    // Configuramos email válido en el formulario
    component.recoveryForm.get('email')?.setValue('test@test.com');
    component.verifyEmail(); // Ejecutamos la verificación

    expect(component.isLoading).toBeTrue(); // Debe estar en estado de carga
    
    tick(100); // Avanzamos el tiempo para completar la llamada HTTP

    expect(component.isLoading).toBeFalse(); // Debe salir del estado de carga
    expect(component.recoveryToken).toBe('fake-jwt-token'); // Debe guardar el token
    expect(component.emailVerified).toBeTrue(); // Debe marcar email como verificado
    expect(component.successMessage).toContain('Se ha enviado un token'); // Mensaje de éxito
  }));

  // Prueba: Manejo de error específico en verificación de email
  it('should handle error in verifyEmail', fakeAsync(() => {
    // Error con mensaje específico, cubre la parte izquierda del OR en el código
    mockAuthService.forgotPassword.and.returnValue(throwError(() => ({ message: 'Email no encontrado' })).pipe(delay(100)));

    component.recoveryForm.get('email')?.setValue('fail@test.com');
    component.verifyEmail();
    
    tick(100); // Completamos la llamada HTTP con error

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('Email no encontrado'); // Mensaje específico del error
    expect(component.emailVerified).toBeFalse(); // Email NO debe estar verificado
  }));

  // Prueba: Manejo de error genérico en verificación de email (Fallback)
  it('should handle generic error in verifyEmail (Error Fallback)', fakeAsync(() => {
    // Error sin mensaje específico, cubre la parte derecha del OR ('Error al verificar el email')
    mockAuthService.forgotPassword.and.returnValue(throwError(() => ({} as any)).pipe(delay(100)));

    component.recoveryForm.get('email')?.setValue('generic-fail@test.com');
    component.verifyEmail();
    
    tick(100); // Completamos la llamada HTTP con error

    expect(component.isLoading).toBeFalse();
    // **AQUÍ LA CLAVE**: El test debe esperar el valor por defecto cuando no hay mensaje específico
    expect(component.errorMessage).toBe('Error al verificar el email'); 
    expect(component.emailVerified).toBeFalse();
  }));

  // Prueba: No debe llamar al servicio si el email es inválido
  it('should not call service if email is invalid in verifyEmail', () => {
    // Configuramos email inválido
    component.recoveryForm.get('email')?.setValue('invalid-email');
    component.verifyEmail();
    
    // El servicio NO debe llamarse porque el formulario es inválido
    expect(mockAuthService.forgotPassword).not.toHaveBeenCalled();
    // El campo debe marcarse como "touched" para mostrar errores de validación
    expect(component.recoveryForm.get('email')?.touched).toBeTrue();
  });

  // ==========================================
  // PASO 2: resetPassword (RESTABLECIMIENTO DE CONTRASEÑA)
  // ==========================================

  // Prueba: Restablecimiento de contraseña exitoso con navegación después de timeout
  it('should reset password successfully and navigate after timeout', fakeAsync(() => {
    // Configuramos token de recuperación (simula que pasamos el paso 1)
    component.recoveryToken = 'valid-token';
    mockAuthService.resetPassword.and.returnValue(of({}).pipe(delay(100)));

    // Configuramos el formulario con contraseñas válidas y coincidentes
    component.recoveryForm.patchValue({
      email: 'test@test.com',
      newPassword: 'ValidPassword1',
      confirmPassword: 'ValidPassword1'
    });

    component.resetPassword(); // Ejecutamos el restablecimiento
    expect(component.isLoading).toBeTrue(); // Debe estar en estado de carga

    tick(100); // Completar llamada al servicio

    expect(component.isLoading).toBeFalse(); // Debe salir del estado de carga
    expect(component.resetSuccess).toBeTrue(); // Debe indicar éxito en el restablecimiento
    expect(component.successMessage).toBeTruthy(); // Debe haber mensaje de éxito
    
    // Verificar redirección después de 3 segundos (timeout para mostrar mensaje)
    expect(mockRouter.navigate).not.toHaveBeenCalled(); // Aún no debe navegar
    tick(3000); // Avanzamos 3 segundos (tiempo de redirección)
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']); // Ahora debe navegar al login
  }));

  // Prueba: Manejo de error genérico en restablecimiento de contraseña
  it('should handle generic error in resetPassword', fakeAsync(() => {
    const errorMsg = { message: 'Error del servidor' };
    mockAuthService.resetPassword.and.returnValue(throwError(() => errorMsg).pipe(delay(100)));

    component.recoveryForm.patchValue({
      email: 'test@test.com',
      newPassword: 'ValidPassword1',
      confirmPassword: 'ValidPassword1'
    });

    component.resetPassword();
    tick(100); // Completamos la llamada HTTP con error

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('Error del servidor'); // Mensaje específico del error
  }));

  // --- PRUEBA CLAVE PARA COVERAGE (Token inválido/expirado) ---
  // Prueba: Debe resetear el flag emailVerified si el token es inválido o expirado
  it('should reset emailVerified flag if token is invalid or expired', fakeAsync(() => {
    // Importante: El mensaje debe contener "inválido" o "expirado" para entrar al IF en el código
    const errorMsg = { message: 'El token es inválido' }; 
    mockAuthService.resetPassword.and.returnValue(throwError(() => errorMsg).pipe(delay(100)));

    // Pre-condición: estábamos en el paso 2 (email ya verificado)
    component.emailVerified = true; 
    component.recoveryForm.patchValue({
      email: 'test@test.com',
      newPassword: 'ValidPassword1',
      confirmPassword: 'ValidPassword1'
    });

    component.resetPassword();
    tick(100); // Completamos la llamada HTTP con error

    // Verificamos que el flag cambió a false (regresa al paso 1 para re-verificar email)
    expect(component.emailVerified).toBeFalse();
    expect(component.errorMessage).toBe('El token es inválido');
  }));

  // Prueba: No debe llamar a resetPassword si el formulario es inválido
  it('should not call resetPassword if form is invalid', () => {
    // Configuramos contraseña inválida (muy corta)
    component.recoveryForm.get('newPassword')?.setValue('short'); 
    component.resetPassword();

    // El servicio NO debe llamarse porque el formulario es inválido
    expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
    // Angular marca todo el formulario como "touched" para mostrar errores de validación
    expect(component.recoveryForm.touched).toBeTrue();
  });

});