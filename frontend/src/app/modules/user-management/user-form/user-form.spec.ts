// Importación de módulos y dependencias necesarias para las pruebas
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { UserFormComponent } from './user-form';
import { UserService } from '../../../core/services/user';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { User } from '../../../shared/interfaces/user';
import { of, throwError } from 'rxjs';

// Bloque principal de pruebas para el componente UserFormComponent
describe('UserFormComponent', () => {
  let component: UserFormComponent;  // Instancia del componente a probar
  let fixture: ComponentFixture<UserFormComponent>;  // Fixture para manipular el componente y su entorno
  
  // Espías (mocks) para las dependencias del componente
  let userServiceSpy: jasmine.SpyObj<UserService>;  // Mock del servicio de usuarios
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;  // Mock del modal activo

  // Datos de prueba simulados (mock data) que representan un usuario existente
  const mockUser: User = {
    _id: '123',
    document: 12345678,
    fullname: 'Juan Perez',
    username: 'juanp',
    email: 'juan@test.com',
    role: 'coordinador',
    active: true
  };

  // Configuración inicial que se ejecuta antes de cada prueba
  beforeEach(async () => {
    // 1. Crear espías (mocks) para los servicios con métodos específicos
    const userSpy = jasmine.createSpyObj('UserService', ['createUser', 'updateUser']);
    const modalSpy = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);

    // Configurar el módulo de testing con todas las dependencias necesarias
    await TestBed.configureTestingModule({
      declarations: [UserFormComponent],  // Componente a probar
      imports: [ReactiveFormsModule],     // Módulo necesario para formularios reactivos
      providers: [
        { provide: UserService, useValue: userSpy },      // Proveer el mock del servicio de usuarios
        { provide: NgbActiveModal, useValue: modalSpy }   // Proveer el mock del modal
      ]
    })
    .compileComponents();  // Compilar componentes y plantillas

    // 2. Obtener las instancias de los servicios mockeados
    userServiceSpy = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    activeModalSpy = TestBed.inject(NgbActiveModal) as jasmine.SpyObj<NgbActiveModal>;

    // 3. Crear una instancia del componente para testing
    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    // Nota: No llamamos a detectChanges() aquí para poder manipular @Input en los tests
  });

  // Prueba básica: Verificar que el componente se crea correctamente
  it('should create', () => {
    fixture.detectChanges();  // Detectar cambios iniciales
    expect(component).toBeTruthy();  // Confirmar que el componente existe
  });

  // Grupo de pruebas para la inicialización del componente
  describe('Initialization', () => {
    // Prueba: El formulario debe inicializarse vacío cuando se crea un nuevo usuario
    it('should initialize form empty when creating a new user', () => {
      component.user = null;        // Modo creación (sin usuario existente)
      fixture.detectChanges();      // Disparar detección de cambios

      // Verificar que el campo documento esté vacío
      expect(component.userForm.get('document')?.value).toBe('');
      
      // Verificar que la contraseña es requerida en modo creación
      const passwordControl = component.userForm.get('password');
      passwordControl?.setValue('');        // Establecer contraseña vacía
      expect(passwordControl?.valid).toBeFalse();  // Debe ser inválido (required)
    });

    // Prueba: El formulario debe inicializarse con datos cuando se edita un usuario existente
    it('should initialize form with data when editing an existing user', () => {
      component.user = mockUser;    // Modo edición (con usuario existente)
      fixture.detectChanges();      // Disparar detección de cambios

      // Verificar que el campo fullname tenga el valor del usuario mock
      expect(component.userForm.get('fullname')?.value).toBe(mockUser.fullname);
      
      // Verificar que la contraseña NO es requerida en modo edición
      const passwordControl = component.userForm.get('password');
      passwordControl?.setValue('');        // Establecer contraseña vacía
      expect(passwordControl?.valid).toBeTrue();  // Debe ser válido (no required)
    });
  });

  // Grupo de pruebas para la validación del formulario
  describe('Form Validation', () => {
    // Ejecutar antes de cada prueba en este grupo
    beforeEach(() => fixture.detectChanges());

    // Prueba: El validador de coincidencia de contraseñas debe retornar null cuando coinciden
    it('should return null for passwordMatchValidator if passwords match', () => {
      // Establecer contraseñas que coinciden
      component.userForm.patchValue({
        password: '123',
        confirmPassword: '123'
      });
      // Forzar la validación del formulario
      component.userForm.updateValueAndValidity();
      // Verificar que NO existe error de mismatch
      expect(component.userForm.hasError('mismatch')).toBeFalse();
    });

    // Prueba: El validador debe retornar error cuando las contraseñas no coinciden
    it('should return mismatch error if passwords do not match', () => {
      // Establecer contraseñas diferentes
      component.userForm.patchValue({
        password: '123',
        confirmPassword: '456'
      });
      // Forzar la validación del formulario
      component.userForm.updateValueAndValidity();
      // Verificar que SÍ existe error de mismatch
      expect(component.userForm.hasError('mismatch')).toBeTrue();
    });
  });

  // Grupo de pruebas para el envío del formulario (onSubmit)
  describe('onSubmit Logic', () => {
    
    // CASO 1: Formulario Inválido - No debe enviar datos
    it('should stop execution and mark fields as touched if form is invalid', () => {
      fixture.detectChanges();
      // Hacer el formulario inválido estableciendo un email incorrecto
      component.userForm.patchValue({ email: 'bad-email' });

      // Ejecutar el método onSubmit
      component.onSubmit();

      // VERIFICACIONES:
      // No se debe llamar al servicio de creación
      expect(userServiceSpy.createUser).not.toHaveBeenCalled();
      // No se debe llamar al servicio de actualización
      expect(userServiceSpy.updateUser).not.toHaveBeenCalled();
      // Los campos del formulario deben marcarse como "touched"
      expect(component.userForm.touched).toBeTrue();
    });

    // CASO 2: Crear Usuario Exitoso
    it('should call createUser and close modal on success (Create Mode)', () => {
      fixture.detectChanges();
      // Configurar el espía para que retorne un observable exitoso
      userServiceSpy.createUser.and.returnValue(of(mockUser));

      // Llenar el formulario con datos válidos
      component.userForm.patchValue({
        document: '111',
        fullname: 'New',
        username: 'new',
        email: 'n@t.com',
        role: 'admin',
        password: '123',
        confirmPassword: '123'
      });

      // Ejecutar el método onSubmit
      component.onSubmit();

      // VERIFICACIONES:
      // El loading debe activarse durante la operación
      expect(component.loading).toBeTrue();
      // Se debe llamar al método createUser del servicio
      expect(userServiceSpy.createUser).toHaveBeenCalled();
      // El modal debe cerrarse con el mensaje 'saved'
      expect(activeModalSpy.close).toHaveBeenCalledWith('saved');
    });

    // CASO 3: Editar Usuario Exitoso con limpieza de campo password
    it('should call updateUser and remove empty password field (Edit Mode)', () => {
      // Establecer el componente en modo edición
      component.user = mockUser;
      fixture.detectChanges();
      // Configurar el espía para retorno exitoso
      userServiceSpy.updateUser.and.returnValue(of(mockUser));

      // Simular edición sin cambiar la contraseña
      component.userForm.patchValue({ fullname: 'Updated Name' });
      component.userForm.controls['password'].setValue('');  // Contraseña vacía

      // Ejecutar el método onSubmit
      component.onSubmit();

      // VERIFICACIONES:
      // Se debe llamar al método updateUser
      expect(userServiceSpy.updateUser).toHaveBeenCalled();
      
      // Obtener los argumentos con los que se llamó a updateUser
      const callArgs = userServiceSpy.updateUser.calls.mostRecent().args;
      const idArg = callArgs[0];    // Primer argumento: ID del usuario
      const dataArg = callArgs[1];  // Segundo argumento: datos del formulario

      // El ID debe coincidir con el usuario mock
      expect(idArg).toBe(mockUser._id as any);
      // El campo password debe ser undefined (se eliminó del envío)
      expect(dataArg.password).toBeUndefined();
      // El modal debe cerrarse con 'saved'
      expect(activeModalSpy.close).toHaveBeenCalledWith('saved');
    });

    // CASO 4: Error con mensaje específico del servidor
    it('should display server error message if available', () => {
      fixture.detectChanges();
      // Simular error del servidor con mensaje específico
      const errorRes = { error: { message: 'El usuario ya existe' } };
      userServiceSpy.createUser.and.returnValue(throwError(() => errorRes));

      // Llenar formulario con datos válidos para pasar validación inicial
      component.userForm.patchValue({
        document: '1', 
        fullname: 'A', 
        username: 'b', 
        email: 'a@a.com', 
        role: 'admin', 
        password: '1', 
        confirmPassword: '1'
      });

      // Ejecutar el método onSubmit
      component.onSubmit();

      // VERIFICACIONES:
      // El mensaje de error debe coincidir con el del servidor
      expect(component.errorMessage).toBe('El usuario ya existe');
      // El loading debe desactivarse después del error
      expect(component.loading).toBeFalse();
    });

    // CASO 5: Error genérico sin mensaje específico del servidor
    it('should display default error message if server response has no message', () => {
      fixture.detectChanges();
      // Simular error genérico sin estructura específica
      const genericError = { status: 500 }; 
      userServiceSpy.createUser.and.returnValue(throwError(() => genericError));

      // Llenar formulario con datos válidos
      component.userForm.patchValue({
        document: '1', 
        fullname: 'A', 
        username: 'b', 
        email: 'a@a.com', 
        role: 'admin', 
        password: '1', 
        confirmPassword: '1'
      });

      // Ejecutar el método onSubmit
      component.onSubmit();

      // VERIFICACIONES:
      // Debe mostrar mensaje de error por defecto
      expect(component.errorMessage).toBe('Error al guardar el usuario');
      // El loading debe desactivarse
      expect(component.loading).toBeFalse();
    });
  });
});