import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core'; // <-- SOLUCIÓN: Ignora routerLink en el HTML
import { of, throwError, delay } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { PasswordRecoveryComponent } from './password-recovery';

describe('PasswordRecoveryComponent', () => {
  let component: PasswordRecoveryComponent;
  let fixture: ComponentFixture<PasswordRecoveryComponent>;
  
  // Spies para las dependencias
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    // 1. Crear los Spies
    mockAuthService = jasmine.createSpyObj('AuthService', ['forgotPassword', 'resetPassword']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [PasswordRecoveryComponent],
      imports: [
        ReactiveFormsModule
        // Eliminamos RouterTestingModule para evitar el error de 'root'
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        FormBuilder
      ],
      // Agregamos esto para que ignore [routerLink] en el HTML sin fallar
      schemas: [NO_ERRORS_SCHEMA] 
    })
    .compileComponents();

    fixture = TestBed.createComponent(PasswordRecoveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- Pruebas de Creación e Inicialización ---

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty values and validators', () => {
    const form = component.recoveryForm;
    expect(form).toBeDefined();
    expect(form.get('email')?.value).toBe('');
    expect(form.get('newPassword')?.value).toBe('');
    expect(form.get('confirmPassword')?.value).toBe('');
    expect(form.valid).toBeFalse();
  });

  // --- Pruebas de Validadores (Coverage 100% en branches) ---

  it('should validate that passwords match (match vs mismatch)', () => {
    const passwordControl = component.recoveryForm.get('newPassword');
    const confirmControl = component.recoveryForm.get('confirmPassword');

    // Caso 1: No coinciden (Cubre branch { mismatch: true })
    passwordControl?.setValue('SecurePass1');
    confirmControl?.setValue('DifferentPass2');
    
    // Forzamos la actualización para que corra el validador de grupo
    component.recoveryForm.updateValueAndValidity();
    
    expect(component.recoveryForm.hasError('mismatch')).toBeTrue();

    // Caso 2: Coinciden (Cubre branch null)
    confirmControl?.setValue('SecurePass1');
    component.recoveryForm.updateValueAndValidity();

    expect(component.recoveryForm.hasError('mismatch')).toBeFalse();
  });

  it('should validate password complexity (regex)', () => {
    const passwordControl = component.recoveryForm.get('newPassword');

    // Caso Inválido (solo letras minúsculas)
    passwordControl?.setValue('weakpassword');
    expect(passwordControl?.hasError('pattern')).toBeTrue();

    // Caso Válido (Mayúscula + Minúscula + Número)
    passwordControl?.setValue('Valid1Pass');
    expect(passwordControl?.valid).toBeTrue();
  });

  // --- Pruebas de UI y ValueChanges (Coverage para dismissAlert) ---

  it('should call dismissAlert when form value changes IF showAlert is true', () => {
    // Espiamos el método real
    spyOn(component, 'dismissAlert').and.callThrough();
    
    // 1. Forzamos la condición para entrar al IF (línea coverage)
    component.showAlert = true; 
    
    // 2. Disparar cambio en el formulario
    component.recoveryForm.get('email')?.setValue('cambio@test.com');
    
    // 3. Verificar que se llamó y se reseteó
    expect(component.dismissAlert).toHaveBeenCalled();
    expect(component.showAlert).toBeFalse(); // dismissAlert pone showAlert en false (implícito o explícito en lógica UI)
  });

  it('should NOT call dismissAlert when form value changes IF showAlert is false', () => {
    spyOn(component, 'dismissAlert');
    
    component.showAlert = false; 
    component.recoveryForm.get('email')?.setValue('otro@test.com');
    
    expect(component.dismissAlert).not.toHaveBeenCalled();
  });

  // --- Pruebas de Fuerza de Contraseña ---

  it('should calculate password strength correctly', () => {
    const passwordControl = component.recoveryForm.get('newPassword');

    // Vacío
    passwordControl?.setValue('');
    expect(component.getPasswordStrengthClass()).toBe('');

    // Weak (< 6)
    passwordControl?.setValue('12345');
    expect(component.getPasswordStrengthClass()).toBe('weak');
    expect(component.getPasswordStrengthText()).toBe('Débil');

    // Medium (Length < 8)
    passwordControl?.setValue('Abc1234'); 
    expect(component.getPasswordStrengthClass()).toBe('medium');
    expect(component.getPasswordStrengthText()).toBe('Moderada');

    // Medium (Sin números o sin letras)
    passwordControl?.setValue('AAAAAAAA'); 
    expect(component.getPasswordStrengthClass()).toBe('medium');

    // Strong (Letras + Números + Especial + >= 8)
    passwordControl?.setValue('SecurePass1@');
    expect(component.getPasswordStrengthClass()).toBe('strong');
    expect(component.getPasswordStrengthText()).toBe('Fuerte');
  });

  // --- Paso 1: verifyEmail ---

  it('should verify email successfully', fakeAsync(() => {
    const mockResponse = { token: 'fake-jwt-token' };
    mockAuthService.forgotPassword.and.returnValue(of(mockResponse).pipe(delay(100)));

    component.recoveryForm.get('email')?.setValue('test@test.com');
    component.verifyEmail();

    expect(component.isLoading).toBeTrue();
    
    tick(100);

    expect(component.isLoading).toBeFalse();
    expect(component.recoveryToken).toBe('fake-jwt-token');
    expect(component.emailVerified).toBeTrue();
    expect(component.successMessage).toContain('Se ha enviado un token');
  }));

  it('should handle error in verifyEmail', fakeAsync(() => {
    mockAuthService.forgotPassword.and.returnValue(throwError(() => ({ message: 'Email no encontrado' })).pipe(delay(100)));

    component.recoveryForm.get('email')?.setValue('fail@test.com');
    component.verifyEmail();
    
    tick(100);

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('Email no encontrado');
    expect(component.emailVerified).toBeFalse();
  }));

  it('should not call service if email is invalid in verifyEmail', () => {
    component.recoveryForm.get('email')?.setValue('invalid-email');
    component.verifyEmail();
    
    expect(mockAuthService.forgotPassword).not.toHaveBeenCalled();
    expect(component.recoveryForm.get('email')?.touched).toBeTrue();
  });

  // --- Paso 2: resetPassword ---

  it('should reset password successfully and navigate after timeout', fakeAsync(() => {
    component.recoveryToken = 'valid-token';
    mockAuthService.resetPassword.and.returnValue(of({}).pipe(delay(100)));

    component.recoveryForm.patchValue({
      email: 'test@test.com',
      newPassword: 'ValidPassword1',
      confirmPassword: 'ValidPassword1'
    });

    component.resetPassword();
    expect(component.isLoading).toBeTrue();

    tick(100); // Completar servicio

    expect(component.isLoading).toBeFalse();
    expect(component.resetSuccess).toBeTrue();
    expect(component.successMessage).toBeTruthy();
    
    // Verificar redirección después de 3 segundos
    expect(mockRouter.navigate).not.toHaveBeenCalled();
    tick(3000);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
  }));

  it('should handle generic error in resetPassword', fakeAsync(() => {
    const errorMsg = { message: 'Error del servidor' };
    mockAuthService.resetPassword.and.returnValue(throwError(() => errorMsg).pipe(delay(100)));

    component.recoveryForm.patchValue({
      email: 'test@test.com',
      newPassword: 'ValidPassword1',
      confirmPassword: 'ValidPassword1'
    });

    component.resetPassword();
    tick(100);

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('Error del servidor');
  }));

  // --- PRUEBA CLAVE PARA COVERAGE (Token inválido/expirado) ---
  it('should reset emailVerified flag if token is invalid or expired', fakeAsync(() => {
    // Importante: El mensaje debe contener "inválido" o "expirado" para entrar al IF
    const errorMsg = { message: 'El token es inválido' }; 
    mockAuthService.resetPassword.and.returnValue(throwError(() => errorMsg).pipe(delay(100)));

    component.emailVerified = true; // Pre-condición: estábamos en el paso 2
    component.recoveryForm.patchValue({
      email: 'test@test.com',
      newPassword: 'ValidPassword1',
      confirmPassword: 'ValidPassword1'
    });

    component.resetPassword();
    tick(100);

    // Verificamos que el flag cambió a false (regresa al paso 1)
    expect(component.emailVerified).toBeFalse();
    expect(component.errorMessage).toBe('El token es inválido');
  }));

  it('should not call resetPassword if form is invalid', () => {
    component.recoveryForm.get('newPassword')?.setValue('short'); 
    component.resetPassword();

    expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
    // Angular marca todo como touched
    expect(component.recoveryForm.touched).toBeTrue();
  });

});