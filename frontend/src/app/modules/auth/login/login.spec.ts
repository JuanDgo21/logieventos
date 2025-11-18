// Importamos las herramientas necesarias para testing de componentes Angular
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
// Importamos módulos para formularios reactivos
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
// Importamos Router para probar navegación
import { Router } from '@angular/router';
// Importamos operadores de RxJS para crear observables simulados
import { of, throwError, delay } from 'rxjs';
// Importamos el servicio de autenticación que el componente usa
import { AuthService } from '../../../core/services/auth';
// Importamos el componente que vamos a probar
import { LoginComponent } from './login';

// --- Declaramos variables globales para los mocks y spies ---
let mockAuthService: jasmine.SpyObj<AuthService>;
let mockRouter: jasmine.SpyObj<Router>;

// Suite de pruebas para el LoginComponent
describe('LoginComponent', () => {
  let component: LoginComponent; // Instancia del componente
  let fixture: ComponentFixture<LoginComponent>; // Fixture para manejar el componente en el DOM

  // Configuración que se ejecuta ANTES de cada prueba
  beforeEach(async () => {
    // Creamos spies (objetos simulados) para AuthService y Router
    mockAuthService = jasmine.createSpyObj('AuthService', ['login', 'isLoggedIn']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Configuramos el módulo de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [LoginComponent], // Declaramos el componente a probar
      imports: [ReactiveFormsModule], // Importamos módulo de formularios reactivos
      providers: [
        { provide: AuthService, useValue: mockAuthService }, // Usamos el mock de AuthService
        { provide: Router, useValue: mockRouter }, // Usamos el mock de Router
        FormBuilder // Proveemos FormBuilder real para crear formularios
      ]
    })
    .compileComponents(); // Compilamos el componente y su template

    // Creamos el fixture y la instancia del componente
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Disparamos el ciclo de detección de cambios inicial
  });

  // ==========================================
  // PRUEBAS BÁSICAS DE CREACIÓN Y FORMULARIO
  // ==========================================

  // Prueba básica: verificar que el componente se crea correctamente
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Prueba: El formulario de login debe inicializarse con validadores correctos
  it('should initialize loginForm with validators', () => {
    const loginForm = component.loginForm;
    const email = loginForm.controls['email'];
    const password = loginForm.controls['password'];

    expect(loginForm).toBeTruthy(); // El formulario debe existir
    
    // --- PRUEBAS DEL CAMPO EMAIL ---
    expect(email).toBeTruthy(); // El control email debe existir
    
    // Prueba: email vacío debe tener error 'required'
    email.setValue('');
    expect(email.hasError('required')).toBeTrue();
    
    // Prueba: email inválido debe tener error 'email'
    email.setValue('not-an-email');
    expect(email.hasError('email')).toBeTrue();
    
    // Prueba: email válido debe ser válido
    email.setValue('test@test.com');
    expect(email.valid).toBeTrue();

    // --- PRUEBAS DEL CAMPO PASSWORD ---
    expect(password).toBeTruthy(); // El control password debe existir
    
    // Prueba: password vacío debe tener error 'required'
    password.setValue('');
    expect(password.hasError('required')).toBeTrue();
    
    // Prueba: password muy corto debe tener error 'minlength'
    password.setValue('short');
    // CORRECCIÓN: El validador es 'minlength', no 'minLength'
    expect(password.hasError('minlength')).toBeTrue();

    // Prueba: Patrón de contraseña - solo minúsculas y números (falta Mayúscula)
    password.setValue('onlylowercase1');
    expect(password.hasError('pattern')).toBeTrue();
    
    // Prueba: Patrón de contraseña - solo mayúsculas y números (falta Minúscula)
    password.setValue('ONLYUPPERCASE1');
    expect(password.hasError('pattern')).toBeTrue();

    // Prueba: Patrón de contraseña - solo letras (falta Número)
    password.setValue('OnlyLetters');
    expect(password.hasError('pattern')).toBeTrue();
    
    // Prueba: Contraseña válida (tiene mayúscula, minúscula y número)
    password.setValue('ValidPass1');
    expect(password.valid).toBeTrue();
  });

  // Prueba: El método dismissAlert debe llamarse cuando el formulario cambia y hay alerta visible
  it('should call dismissAlert when form value changes and alert is showing', () => {
    // Espiamos el método dismissAlert para verificar que se llama
    spyOn(component, 'dismissAlert');
    component.showAlert = true; // Simulamos que hay una alerta visible
    component.loginForm.controls['email'].setValue('test@test.com'); // Cambiamos un valor del formulario
    expect(component.dismissAlert).toHaveBeenCalled(); // dismissAlert debe haberse llamado
  });

  // ==========================================
  // PRUEBAS DE MÉTODOS DE ALERTA
  // ==========================================

  // Prueba: getAlertIcon debe devolver el icono correcto según el tipo de alerta
  it('should return correct icon for getAlertIcon', () => {
    component.alertType = 'success';
    expect(component.getAlertIcon()).toBe('fa-check-circle'); // Éxito: check verde
    
    component.alertType = 'danger';
    expect(component.getAlertIcon()).toBe('fa-exclamation-triangle'); // Error: triángulo rojo
    
    component.alertType = 'warning';
    expect(component.getAlertIcon()).toBe('fa-exclamation-circle'); // Advertencia: círculo naranja
    
    component.alertType = 'unknown';
    expect(component.getAlertIcon()).toBe('fa-info-circle'); // Tipo desconocido: info azul
  });

  // Prueba: getAlertTitle debe devolver el título correcto según el tipo de alerta
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

  // Prueba: togglePasswordVisibility debe alternar la visibilidad de la contraseña
  it('should toggle passwordVisibility', () => {
    expect(component.passwordVisible).toBeFalse(); // Inicialmente oculta
    component.togglePasswordVisibility();
    expect(component.passwordVisible).toBeTrue(); // Primera vez: visible
    component.togglePasswordVisibility();
    expect(component.passwordVisible).toBeFalse(); // Segunda vez: oculta nuevamente
  });

  // Prueba: showAlertMessage debe mostrar la alerta y ocultarla automáticamente después del tiempo especificado
  it('should show alert message and dismiss it after duration', fakeAsync(() => {
    // Espiamos dismissAlert para verificar que se llama automáticamente
    spyOn(component, 'dismissAlert').and.callThrough();
    
    // Mostramos una alerta que debe durar 1000ms
    component.showAlertMessage('success', 'Test message', 1000);

    // Verificamos que la alerta se muestra correctamente
    expect(component.alertType).toBe('success');
    expect(component.alertMessage).toBe('Test message');
    expect(component.showAlert).toBeTrue();
    expect(component.dismissAlert).not.toHaveBeenCalled(); // Aún no debe haberse llamado

    // Avanzamos el tiempo simulado 1000ms
    tick(1000);

    // Ahora dismissAlert debe haberse llamado automáticamente
    expect(component.dismissAlert).toHaveBeenCalled();
    expect(component.showAlert).toBeFalse(); // La alerta debe estar oculta
  }));

  // Prueba: Al mostrar una nueva alerta, debe limpiar el timeout de la alerta anterior
  it('should clear existing timeout when showing new alert', fakeAsync(() => {
    // Espiamos clearTimeout para verificar que se llama
    const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callThrough();

    // Mostramos primera alerta
    component.showAlertMessage('warning', 'First message', 5000);
    const firstTimeout = component.alertTimeout; // Guardamos el ID del timeout
    expect(clearTimeoutSpy).not.toHaveBeenCalled(); // Aún no debe limpiar nada

    // Mostramos segunda alerta (debe limpiar la primera)
    component.showAlertMessage('danger', 'Second message', 5000);
    
    // Debe haber limpiado el timeout anterior
    expect(clearTimeoutSpy).toHaveBeenCalledWith(firstTimeout);

    // Avanzamos el tiempo y verificamos que solo la segunda alerta se oculta
    tick(5000);
    expect(component.showAlert).toBeFalse();
  }));

  // Prueba: dismissAlert debe ocultar la alerta y limpiar el timeout
  it('should dismiss alert and clear timeout', fakeAsync(() => {
    const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callThrough();
    
    // Mostramos una alerta
    component.showAlertMessage('info', 'Message', 5000);
    const timeoutId = component.alertTimeout; // Guardamos el ID del timeout

    // Llamamos dismissAlert manualmente
    component.dismissAlert();
    
    // Verificamos que la alerta se oculta y se limpia el timeout
    expect(component.showAlert).toBeFalse();
    expect(clearTimeoutSpy).toHaveBeenCalledWith(timeoutId);

    // Avanzamos el tiempo y verificamos que no se llama clearTimeout nuevamente
    tick(5000);
    expect(clearTimeoutSpy.calls.count()).toBe(1);
  }));

  // ==========================================
  // PRUEBAS DE NAVEGACIÓN
  // ==========================================

  // Prueba: Navegación a la página de "olvidé mi contraseña"
  it('should navigate to forgot-password', () => {
    component.navigateToForgotPassword();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/forgot-password']);
  });

  // ==========================================
  // PRUEBAS DE onSubmit (LÓGICA PRINCIPAL)
  // ==========================================

  // Prueba: Debe mostrar advertencia si el formulario es inválido al enviar
  it('should show warning if form is invalid on submit', () => {
    spyOn(component, 'showAlertMessage');
    // Configuramos un email inválido
    component.loginForm.controls['email'].setValue('not-an-email');
    
    // Intentamos enviar el formulario
    component.onSubmit();

    // Debe mostrar advertencia y NO llamar al servicio de login
    expect(component.showAlertMessage).toHaveBeenCalledWith(
      'warning', 
      'Por favor completa todos los campos correctamente'
    );
    expect(mockAuthService.login).not.toHaveBeenCalled();
    expect(component.isLoading).toBeFalse(); // No debe estar en estado de carga
  });

  // Prueba: Login exitoso - debe verificar autenticación y navegar
  it('should handle login success, check isLoggedIn, and navigate', fakeAsync(() => {
    spyOn(component, 'showAlertMessage');

    // Configuramos el servicio para simular login exitoso con delay
    mockAuthService.login.and.returnValue(of({ token: 'fake-token' }).pipe(delay(100)));
    mockAuthService.isLoggedIn.and.returnValue(true); // Simulamos que está autenticado

    // Configuramos el formulario con datos válidos
    component.loginForm.setValue({
      email: 'valid@test.com',
      password: 'ValidPass1'
    });

    // Enviamos el formulario
    component.onSubmit();

    expect(component.isLoading).toBeTrue(); // Debe estar en estado de carga
    
    tick(100); // Avanzamos el tiempo para completar la llamada HTTP
    fixture.detectChanges(); // Disparamos detección de cambios

    expect(component.isLoading).toBeFalse(); // Debe salir del estado de carga
    
    // Debe mostrar mensaje de éxito
    expect(component.showAlertMessage).toHaveBeenCalledWith(
      'success', 
      'Inicio de sesión exitoso! Redirigiendo...'
    );
    expect(mockAuthService.isLoggedIn).toHaveBeenCalled(); // Debe verificar autenticación

    // Aún no debe navegar (espera el timeout de redirección)
    expect(mockRouter.navigate).not.toHaveBeenCalled();
    
    tick(1500); // Avanzamos el tiempo de redirección

    // Ahora debe navegar a la página principal
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/pages/principal']);
  }));

  // Prueba: Login exitoso pero verificación de autenticación falla
  it('should show error if login succeeds but isLoggedIn returns false', fakeAsync(() => {
    spyOn(component, 'showAlertMessage');

    // Login exitoso pero isLoggedIn devuelve false (raro pero posible)
    mockAuthService.login.and.returnValue(of({ token: 'fake-token' }).pipe(delay(100)));
    mockAuthService.isLoggedIn.and.returnValue(false);

    component.loginForm.setValue({
      email: 'valid@test.com',
      password: 'ValidPass1'
    });

    component.onSubmit();
    expect(component.isLoading).toBeTrue();

    tick(100); // Completamos la llamada HTTP
    
    expect(component.isLoading).toBeFalse();
    // Primero muestra éxito (porque el login API fue exitoso)
    expect(component.showAlertMessage).toHaveBeenCalledWith(
      'success', 
      'Inicio de sesión exitoso! Redirigiendo...'
    );
    expect(mockAuthService.isLoggedIn).toHaveBeenCalled();
    
    // Luego muestra error porque isLoggedIn devolvió false
    expect(component.showAlertMessage).toHaveBeenCalledWith(
      'danger', 
      'Error en la autenticación. Intenta nuevamente.'
    );
    
    expect(mockRouter.navigate).not.toHaveBeenCalled(); // No debe navegar
  }));

  // Prueba: Manejo de error genérico del login
  it('should handle generic login error', fakeAsync(() => {
    spyOn(component, 'showAlertMessage');

    // Simulamos un error genérico (ej: error de red)
    const genericError = { message: 'Error de red' };
    mockAuthService.login.and.returnValue(throwError(() => genericError).pipe(delay(100)));

    component.loginForm.setValue({
      email: 'valid@test.com',
      password: 'ValidPass1'
    });

    component.onSubmit();
    tick(100); // Completamos la llamada HTTP con error

    expect(component.isLoading).toBeFalse();
    // Debe mostrar el mensaje de error específico
    expect(component.showAlertMessage).toHaveBeenCalledWith(
      'danger',
      'Error de red'
    );
    expect(mockRouter.navigate).not.toHaveBeenCalled(); // No debe navegar
  }));

  // Prueba: Manejo de error cuando no hay mensaje específico (fallback)
  it('should handle fallback login error message', fakeAsync(() => {
    spyOn(component, 'showAlertMessage');

    // Simulamos error sin mensaje específico
    mockAuthService.login.and.returnValue(throwError(() => ({})).pipe(delay(100)));

    component.loginForm.setValue({
      email: 'valid@test.com',
      password: 'ValidPass1'
    });

    component.onSubmit();
    tick(100);

    expect(component.isLoading).toBeFalse();
    // Debe mostrar mensaje de error por defecto
    expect(component.showAlertMessage).toHaveBeenCalledWith(
      'danger',
      'Error al iniciar sesión. Verifica tus credenciales.'
    );
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  }));

  // Prueba: showAlertMessage debe usar duración por defecto si no se especifica
  it('should use default duration if not provided in showAlertMessage', fakeAsync(() => {
    spyOn(component, 'dismissAlert').and.callThrough();
    
    // Mostramos alerta sin especificar duración (debe usar 5000ms por defecto)
    component.showAlertMessage('success', 'Default duration test');

    expect(component.showAlert).toBeTrue();

    tick(4999); // Avanzamos casi todo el tiempo por defecto
    expect(component.dismissAlert).not.toHaveBeenCalled(); // Aún no debe ocultarse

    tick(1); // Avanzamos 1ms más para completar 5000ms
    expect(component.dismissAlert).toHaveBeenCalled(); // Ahora debe ocultarse
    expect(component.showAlert).toBeFalse();
  }));
});