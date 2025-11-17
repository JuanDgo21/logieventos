import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError, delay } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { LoginComponent } from './login';

// --- Mocks y Spies ---
let mockAuthService: jasmine.SpyObj<AuthService>;
let mockRouter: jasmine.SpyObj<Router>;

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['login', 'isLoggedIn']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        FormBuilder 
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- Pruebas de Creación y Formulario ---

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize loginForm with validators', () => {
    const loginForm = component.loginForm;
    const email = loginForm.controls['email'];
    const password = loginForm.controls['password'];

    expect(loginForm).toBeTruthy();
    
    // Probar campo de email
    expect(email).toBeTruthy();
    email.setValue('');
    expect(email.hasError('required')).toBeTrue();
    email.setValue('not-an-email');
    expect(email.hasError('email')).toBeTrue();
    email.setValue('test@test.com');
    expect(email.valid).toBeTrue();

    // Probar campo de password
    expect(password).toBeTruthy();
    password.setValue('');
    expect(password.hasError('required')).toBeTrue();
    password.setValue('short');
    // CORRECCIÓN: El validador es 'minlength', no 'minLength'
    expect(password.hasError('minlength')).toBeTrue();

    // Caso 1: Solo minúsculas y números (falta Mayúscula) -> Debe dar error
    password.setValue('onlylowercase1');
    expect(password.hasError('pattern')).toBeTrue();
    
    // Caso 2: Solo mayúsculas y números (falta Minúscula) -> Debe dar error
    password.setValue('ONLYUPPERCASE1');
    expect(password.hasError('pattern')).toBeTrue();

    // Caso 3: Solo letras (falta Número) -> Debe dar error
    password.setValue('OnlyLetters');
    expect(password.hasError('pattern')).toBeTrue();
    
    // Caso 4: Contraseña válida (tiene todo) -> No debe dar error
    password.setValue('ValidPass1');
    expect(password.valid).toBeTrue();
  });

  it('should call dismissAlert when form value changes and alert is showing', () => {
    spyOn(component, 'dismissAlert');
    component.showAlert = true;
    component.loginForm.controls['email'].setValue('test@test.com');
    expect(component.dismissAlert).toHaveBeenCalled();
  });

  // --- Pruebas de Métodos de Alerta ---

  it('should return correct icon for getAlertIcon', () => {
    component.alertType = 'success';
    expect(component.getAlertIcon()).toBe('fa-check-circle');
    component.alertType = 'danger';
    expect(component.getAlertIcon()).toBe('fa-exclamation-triangle');
    component.alertType = 'warning';
    expect(component.getAlertIcon()).toBe('fa-exclamation-circle');
    component.alertType = 'unknown';
    expect(component.getAlertIcon()).toBe('fa-info-circle');
  });

  it('should return correct title for getAlertTitle', () => {
    component.alertType = 'success';
    expect(component.getAlertTitle()).toBe('Éxito!');
    component.alertType = 'danger';
    expect(component.getAlertTitle()).toBe('Error!');
    component.alertType = 'warning';
    expect(component.getAlertTitle()).toBe('Advertencia!');
    component.alertType = 'unknown';
    expect(component.getAlertTitle()).toBe('Información');
  });

  it('should toggle passwordVisibility', () => {
    expect(component.passwordVisible).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.passwordVisible).toBeTrue();
    component.togglePasswordVisibility();
    expect(component.passwordVisible).toBeFalse();
  });

  it('should show alert message and dismiss it after duration', fakeAsync(() => {
    spyOn(component, 'dismissAlert').and.callThrough();
    
    component.showAlertMessage('success', 'Test message', 1000);

    expect(component.alertType).toBe('success');
    expect(component.alertMessage).toBe('Test message');
    expect(component.showAlert).toBeTrue();
    expect(component.dismissAlert).not.toHaveBeenCalled();

    tick(1000);

    expect(component.dismissAlert).toHaveBeenCalled();
    expect(component.showAlert).toBeFalse();
  }));

  it('should clear existing timeout when showing new alert', fakeAsync(() => {
    const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callThrough();

    component.showAlertMessage('warning', 'First message', 5000);
    const firstTimeout = component.alertTimeout;
    expect(clearTimeoutSpy).not.toHaveBeenCalled();

    component.showAlertMessage('danger', 'Second message', 5000);
    
    expect(clearTimeoutSpy).toHaveBeenCalledWith(firstTimeout);

    tick(5000);
    expect(component.showAlert).toBeFalse();
  }));

  it('should dismiss alert and clear timeout', fakeAsync(() => {
    const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callThrough();
    
    component.showAlertMessage('info', 'Message', 5000);
    const timeoutId = component.alertTimeout;

    component.dismissAlert();
    
    expect(component.showAlert).toBeFalse();
    expect(clearTimeoutSpy).toHaveBeenCalledWith(timeoutId);

    tick(5000);
    expect(clearTimeoutSpy.calls.count()).toBe(1);
  }));

  // --- Pruebas de Navegación ---

  it('should navigate to forgot-password', () => {
    component.navigateToForgotPassword();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/forgot-password']);
  });

  // --- Pruebas de onSubmit (Lógica principal) ---

  it('should show warning if form is invalid on submit', () => {
    spyOn(component, 'showAlertMessage');
    component.loginForm.controls['email'].setValue('not-an-email');
    
    component.onSubmit();

    expect(component.showAlertMessage).toHaveBeenCalledWith(
      'warning', 
      'Por favor completa todos los campos correctamente'
    );
    expect(mockAuthService.login).not.toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
  });

  it('should handle login success, check isLoggedIn, and navigate', fakeAsync(() => {
    spyOn(component, 'showAlertMessage');

    mockAuthService.login.and.returnValue(of({ token: 'fake-token' }).pipe(delay(100)));
    mockAuthService.isLoggedIn.and.returnValue(true);

    component.loginForm.setValue({
      email: 'valid@test.com',
      password: 'ValidPass1'
    });

    component.onSubmit();

    expect(component.isLoading).toBeTrue();
    
    tick(100); 
    fixture.detectChanges();

    expect(component.isLoading).toBeFalse(); 
    
    expect(component.showAlertMessage).toHaveBeenCalledWith(
      'success', 
      'Inicio de sesión exitoso! Redirigiendo...'
    );
    expect(mockAuthService.isLoggedIn).toHaveBeenCalled();

    expect(mockRouter.navigate).not.toHaveBeenCalled();
    
    tick(1500); 

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/pages/principal']);
  }));

  it('should show error if login succeeds but isLoggedIn returns false', fakeAsync(() => {
    spyOn(component, 'showAlertMessage');

    mockAuthService.login.and.returnValue(of({ token: 'fake-token' }).pipe(delay(100)));
    mockAuthService.isLoggedIn.and.returnValue(false);

    component.loginForm.setValue({
      email: 'valid@test.com',
      password: 'ValidPass1'
    });

    component.onSubmit();
    expect(component.isLoading).toBeTrue();

    tick(100);
    
    expect(component.isLoading).toBeFalse();
    expect(component.showAlertMessage).toHaveBeenCalledWith(
      'success', 
      'Inicio de sesión exitoso! Redirigiendo...'
    );
    expect(mockAuthService.isLoggedIn).toHaveBeenCalled();
    
    expect(component.showAlertMessage).toHaveBeenCalledWith(
      'danger', 
      'Error en la autenticación. Intenta nuevamente.'
    );
    
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  }));

  // it('should handle login error from API', fakeAsync(() => {
  //   spyOn(component, 'showAlertMessage');

  //   const errorResponse = {
  //     error: { message: 'Credenciales inválidas' },
  //     status: 401
  //   };

  //   mockAuthService.login.and.returnValue(
  //     throwError(() => errorResponse).pipe(delay(100))
  //   );

  //   component.loginForm.setValue({
  //     email: 'valid@test.com',
  //     password: 'ValidPass1'
  //   });

  //   component.onSubmit();
  //   expect(component.isLoading).toBeTrue();

  //   tick(100);
  //   tick();
  //   fixture.detectChanges();

  //   expect(component.isLoading).toBeFalse();
  //   expect(component.showAlertMessage).toHaveBeenCalledWith(
  //     'danger',
  //     'Credenciales inválidas'
  //   );
  //   expect(mockRouter.navigate).not.toHaveBeenCalled();
  // }));


  it('should handle generic login error', fakeAsync(() => {
    spyOn(component, 'showAlertMessage');

    const genericError = { message: 'Error de red' };
    mockAuthService.login.and.returnValue(throwError(() => genericError).pipe(delay(100)));

    component.loginForm.setValue({
      email: 'valid@test.com',
      password: 'ValidPass1'
    });

    component.onSubmit();
    tick(100);

    expect(component.isLoading).toBeFalse();
    expect(component.showAlertMessage).toHaveBeenCalledWith(
      'danger',
      'Error de red'
    );
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  }));

  it('should handle fallback login error message', fakeAsync(() => {
    spyOn(component, 'showAlertMessage');

    mockAuthService.login.and.returnValue(throwError(() => ({})).pipe(delay(100)));

    component.loginForm.setValue({
      email: 'valid@test.com',
      password: 'ValidPass1'
    });

    component.onSubmit();
    tick(100);

    expect(component.isLoading).toBeFalse();
    expect(component.showAlertMessage).toHaveBeenCalledWith(
      'danger',
      'Error al iniciar sesión. Verifica tus credenciales.'
    );
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  }));

  it('should use default duration if not provided in showAlertMessage', fakeAsync(() => {
    spyOn(component, 'dismissAlert').and.callThrough();
    
    component.showAlertMessage('success', 'Default duration test');

    expect(component.showAlert).toBeTrue();

    tick(4999);
    expect(component.dismissAlert).not.toHaveBeenCalled();

    tick(1);
    expect(component.dismissAlert).toHaveBeenCalled();
    expect(component.showAlert).toBeFalse();
  }));
});