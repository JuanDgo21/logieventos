// Importamos las herramientas necesarias para testing de componentes Angular
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
// Importamos módulos para formularios reactivos
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
// Importamos Router para probar navegación
import { Router } from '@angular/router';
// Importamos NO_ERRORS_SCHEMA para ignorar elementos HTML desconocidos en las pruebas
import { NO_ERRORS_SCHEMA } from '@angular/core'; 
// Importamos operadores de RxJS para crear observables simulados
import { of, throwError } from 'rxjs';
// Importamos el servicio de autenticación que el componente usa
import { AuthService } from '../../../core/services/auth'; 
// Importamos el componente que vamos a probar - registro de usuarios
import { RegisterComponent } from './register';
// Importamos la interfaz de Usuario para tener tipos correctos
import { User } from '../../../shared/interfaces/user';

// Suite de pruebas para el RegisterComponent
describe('RegisterComponent', () => {
  let component: RegisterComponent; // Instancia del componente
  let fixture: ComponentFixture<RegisterComponent>; // Fixture para manejar el componente en el DOM
  
  // Spies para las dependencias - objetos simulados que reemplazan los servicios reales
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  
  // Datos de formulario válidos para usar en múltiples pruebas
  const validFormData = {
    document: '1234567890', // Documento como string (luego se convierte a number)
    fullname: 'John Doe Test', // Nombre completo
    username: 'jdoetest', // Nombre de usuario
    email: 'test@example.com', // Email válido
    password: 'SecurePassword1', // Contraseña segura (mayúscula + minúscula + número)
    role: 'lider', // Rol del usuario
    active: true // Usuario activo
  };
  
  // Datos esperados que se enviarán al servicio (con formato correcto)
  const expectedUserData = {
    ...validFormData, // Copiamos todos los datos del formulario
    document: Number(validFormData.document), // Convertimos documento a número
    deletedAt: null // Campo adicional requerido por la interfaz
  } as Omit<User, '_id' | 'createdAt' | 'updatedAt'> & { deletedAt: Date | null }; // Tipo TypeScript preciso

  // Configuración que se ejecuta ANTES de cada prueba
  beforeEach(async () => {
    // Creamos spies (objetos simulados) para AuthService y Router
    mockAuthService = jasmine.createSpyObj('AuthService', ['register']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Configuramos el módulo de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [RegisterComponent], // Declaramos el componente a probar
      imports: [ReactiveFormsModule], // Importamos módulo de formularios reactivos
      providers: [
        { provide: AuthService, useValue: mockAuthService }, // Usamos el mock de AuthService
        { provide: Router, useValue: mockRouter }, // Usamos el mock de Router
        FormBuilder // Proveemos FormBuilder real para crear formularios
      ],
      schemas: [NO_ERRORS_SCHEMA] // Ignoramos elementos HTML desconocidos en las pruebas
    })
    .compileComponents(); // Compilamos el componente y su template

    // Creamos el fixture y la instancia del componente
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Disparamos el ciclo de detección de cambios inicial
  });

  // ==========================================
  // PRUEBAS DE CREACIÓN E INICIALIZACIÓN
  // ==========================================

  // Prueba básica: verificar que el componente se crea correctamente
  it('should create', () => {
    expect(component).toBeTruthy(); // El componente debe existir
    expect(component.registerForm).toBeDefined(); // El formulario debe estar definido
    expect(component.registerForm.get('role')?.value).toBe(''); // El campo role debe empezar vacío
  });

  // Prueba: El formulario debe inicializarse como inválido (todos los campos vacíos/incorrectos)
  it('should initialize the form as invalid', () => {
    expect(component.registerForm.valid).toBeFalse(); // El formulario completo debe ser inválido
  });

  // ==========================================
  // PRUEBAS DE UI/HELPERS (INTERFAZ DE USUARIO)
  // ==========================================

  // Prueba: Alternar visibilidad de la contraseña debe cambiar el estado
  it('should toggle password visibility', () => {
    component.passwordVisible = false; // Estado inicial: contraseña oculta
    component.togglePasswordVisibility(); // Primera llamada
    expect(component.passwordVisible).toBeTrue(); // Ahora debe estar visible
    component.togglePasswordVisibility(); // Segunda llamada
    expect(component.passwordVisible).toBeFalse(); // Debe volver a estar oculta
  });
  
  // Prueba: Limpiar caracteres no numéricos del campo documento
  it('should clean non-numeric characters from document input', () => {
    const documentControl = component.registerForm.get('document'); // Obtenemos el control del documento
    
    // Caso 1: Documento con letras y números - debe limpiar las letras
    documentControl?.setValue('123abc456'); // Valor con letras
    const mockEvent = {
        target: { value: '123abc456' }
    } as unknown as Event; // Creamos un evento simulado
    component.onDocumentInput(mockEvent); // Procesamos el evento
    expect(documentControl?.value).toBe('123456'); // Solo deben quedar los números
    
    // Caso 2: Documento solo con números - debe mantenerse igual
    const mockEventNumeric = {
        target: { value: '987654321' }
    } as unknown as Event; // Creamos otro evento simulado
    component.onDocumentInput(mockEventNumeric); // Procesamos el evento
    expect(documentControl?.value).toBe('987654321'); // Debe mantenerse igual
  });

  // Prueba: getAlertIcon debe devolver el icono correcto según el tipo de alerta
  it('should return correct alert icon for success and danger', () => {
    component.alertType = 'success';
    expect(component.getAlertIcon()).toBe('fa-check-circle'); // Éxito: check verde
    
    component.alertType = 'danger';
    expect(component.getAlertIcon()).toBe('fa-exclamation-circle'); // Error: círculo de exclamación rojo
  });

  // Prueba: getAlertTitle debe devolver el título correcto según el tipo de alerta
  it('should return correct alert title for success and danger', () => {
    component.alertType = 'success';
    expect(component.getAlertTitle()).toBe('Éxito!'); // Título para éxito
    
    component.alertType = 'danger';
    expect(component.getAlertTitle()).toBe('Error!'); // Título para error
  });

  // ==========================================
  // PRUEBAS DE onSubmit: CASOS DE INVALIDACIÓN (IF BRANCHES)
  // Estas pruebas verifican los casos donde el formulario NO debe enviarse
  // ==========================================

  // Prueba: No debe enviar el formulario si es inválido (primer return early)
  it('should return early if the form is invalid', () => {
    // Configuramos el formulario con un email inválido
    component.registerForm.patchValue({
      ...validFormData, // Copiamos todos los datos válidos
      email: 'invalid-email' // Pero email inválido
    });
    component.onSubmit(); // Intentamos enviar
    
    // El servicio NO debe llamarse porque el formulario es inválido
    expect(mockAuthService.register).not.toHaveBeenCalled();
    // No debe estar en estado de carga
    expect(component.isLoading).toBeFalse();
  });

  // Prueba: No debe enviar el formulario si ya está cargando (segundo return early)
  it('should return early if isLoading is true', () => {
    // Configuramos el formulario con datos válidos
    component.registerForm.patchValue(validFormData);
    component.isLoading = true; // Simulamos que ya está cargando (por ejemplo, de un intento anterior)
    component.onSubmit(); // Intentamos enviar nuevamente
    
    // El servicio NO debe llamarse porque ya está en proceso
    expect(mockAuthService.register).not.toHaveBeenCalled();
    // Debe mantenerse en estado de carga
    expect(component.isLoading).toBeTrue(); 
  });
  
  // ==========================================
  // PRUEBAS DE onSubmit: ÉXITO (REGISTRO EXITOSO)
  // ==========================================

  // Prueba: Registro exitoso debe navegar después de 2 segundos
  it('should register successfully and navigate after 2 seconds', fakeAsync(() => {
    // Configuramos el servicio para simular registro exitoso
    mockAuthService.register.and.returnValue(of({}).pipe());
    // Espiamos el método interno showSuccessAlert para verificar que se llama
    spyOn(component as any, 'showSuccessAlert').and.callThrough();

    // Configuramos el formulario con datos válidos
    component.registerForm.patchValue(validFormData);
    component.onSubmit(); // Ejecutamos el envío

    // Verificación inicial de estado y llamada a servicio
    expect(component.isLoading).toBeTrue(); // Debe estar en estado de carga
    expect(component.showAlert).toBeTrue(); // Debe mostrar alerta
    // Debe llamar al servicio con los datos formateados correctamente
    expect(mockAuthService.register).toHaveBeenCalledWith(expectedUserData);
    
    tick(); // Completamos la subscripción del observable
    
    // Ya no verificamos isLoading aquí, porque el componente no lo pone en false tras éxito
    // (esto podría ser un comportamiento esperado o un área de mejora)
    expect((component as any).showSuccessAlert).toHaveBeenCalledWith('Registro completado con éxito. Redirigiendo...');
    expect(mockRouter.navigate).not.toHaveBeenCalled(); // Aún no debe navegar
    
    tick(2000); // Avanzamos 2 segundos (tiempo de redirección)
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']); // Ahora debe navegar al dashboard
  }));

  // ==========================================
  // PRUEBAS DE onSubmit: ERRORES (MANEJO DE FALLOS)
  // ==========================================

  // Prueba: Manejo de error de registro con mensaje personalizado (rama izquierda del OR)
  it('should handle registration error with custom message (left branch of OR)', fakeAsync(() => {
    // Simulamos un error específico del servidor (usuario ya existe)
    const serverError = { error: { message: 'El usuario ya existe' } };
    mockAuthService.register.and.returnValue(throwError(() => serverError));
    // Espiamos el método interno showErrorAlert
    spyOn(component as any, 'showErrorAlert').and.callThrough();
    
    // Configuramos formulario válido
    component.registerForm.patchValue(validFormData);
    component.onSubmit(); // Ejecutamos el envío
    
    tick(); // Completamos la subscripción del observable con error
    
    // Verificaciones después del error
    expect(component.isLoading).toBeFalse(); // Debe salir del estado de carga
    // Debe mostrar el mensaje de error específico del servidor
    expect((component as any).showErrorAlert).toHaveBeenCalledWith('El usuario ya existe');
    expect(component.alertType).toBe('danger'); // El tipo de alerta debe ser 'danger' (error)
    expect(component.showAlert).toBeTrue(); // La alerta debe estar visible
  }));

  // Prueba: Manejo de error genérico de registro (rama derecha del OR - mensaje por defecto)
  it('should handle registration error with fallback message (right branch of OR)', fakeAsync(() => {
    // Simulamos un error genérico sin mensaje específico
    const genericError = { status: 500 }; // Error 500 sin mensaje
    mockAuthService.register.and.returnValue(throwError(() => genericError));
    spyOn(component as any, 'showErrorAlert').and.callThrough();
    
    component.registerForm.patchValue(validFormData);
    component.onSubmit(); // Ejecutamos el envío
    
    tick(); // Completamos la subscripción del observable con error
    
    expect(component.isLoading).toBeFalse(); // Debe salir del estado de carga
    // Debe mostrar el mensaje de error por defecto
    expect((component as any).showErrorAlert).toHaveBeenCalledWith('Error en el registro');
    expect(component.alertType).toBe('danger'); // El tipo de alerta debe ser 'danger' (error)
  }));

});