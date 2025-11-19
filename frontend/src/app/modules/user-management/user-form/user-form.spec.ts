import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { UserFormComponent } from './user-form';
import { UserService } from '../../../core/services/user';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { User } from '../../../shared/interfaces/user';
import { of, throwError } from 'rxjs';

describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;
  
  // Spies (Mocks)
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;

  // Datos de prueba (Mock Data)
  const mockUser: User = {
    _id: '123',
    document: 12345678,
    fullname: 'Juan Perez',
    username: 'juanp',
    email: 'juan@test.com',
    role: 'coordinador',
    active: true
  };

  beforeEach(async () => {
    // 1. Configurar los espías
    const userSpy = jasmine.createSpyObj('UserService', ['createUser', 'updateUser']);
    const modalSpy = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);

    await TestBed.configureTestingModule({
      declarations: [UserFormComponent], // Standalone: false, va aquí
      imports: [ReactiveFormsModule],    // Necesario para formularios
      providers: [
        { provide: UserService, useValue: userSpy },
        { provide: NgbActiveModal, useValue: modalSpy }
      ]
    })
    .compileComponents();

    // 2. Inyectar dependencias
    userServiceSpy = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    activeModalSpy = TestBed.inject(NgbActiveModal) as jasmine.SpyObj<NgbActiveModal>;

    // 3. Crear componente
    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    // Nota: No llamamos a detectChanges() aquí para poder manipular @Input en los tests
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize form empty when creating a new user', () => {
      component.user = null;
      fixture.detectChanges();

      expect(component.userForm.get('document')?.value).toBe('');
      // Password es requerido al crear
      const passwordControl = component.userForm.get('password');
      passwordControl?.setValue('');
      expect(passwordControl?.valid).toBeFalse();
    });

    it('should initialize form with data when editing an existing user', () => {
      component.user = mockUser;
      fixture.detectChanges();

      expect(component.userForm.get('fullname')?.value).toBe(mockUser.fullname);
      // Password NO es requerido al editar
      const passwordControl = component.userForm.get('password');
      passwordControl?.setValue('');
      expect(passwordControl?.valid).toBeTrue();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => fixture.detectChanges());

    it('should return null for passwordMatchValidator if passwords match', () => {
      component.userForm.patchValue({
        password: '123',
        confirmPassword: '123'
      });
      // Ejecutamos el validador manualmente o actualizamos el form
      component.userForm.updateValueAndValidity();
      expect(component.userForm.hasError('mismatch')).toBeFalse();
    });

    it('should return mismatch error if passwords do not match', () => {
      component.userForm.patchValue({
        password: '123',
        confirmPassword: '456'
      });
      component.userForm.updateValueAndValidity();
      expect(component.userForm.hasError('mismatch')).toBeTrue();
    });
  });

  describe('onSubmit Logic', () => {
    
    // CASO 1: Formulario Inválido (Cubre el branch: if (this.userForm.invalid))
    it('should stop execution and mark fields as touched if form is invalid', () => {
      fixture.detectChanges();
      component.userForm.patchValue({ email: 'bad-email' }); // Form invalido

      component.onSubmit();

      // Verificamos que NO se llamó al servicio
      expect(userServiceSpy.createUser).not.toHaveBeenCalled();
      expect(userServiceSpy.updateUser).not.toHaveBeenCalled();
      // Verificamos que se marcaron los campos (touched)
      expect(component.userForm.touched).toBeTrue();
    });

    // CASO 2: Crear Usuario Exitoso
    it('should call createUser and close modal on success (Create Mode)', () => {
      fixture.detectChanges();
      userServiceSpy.createUser.and.returnValue(of(mockUser));

      // Llenamos formulario válido
      component.userForm.patchValue({
        document: '111',
        fullname: 'New',
        username: 'new',
        email: 'n@t.com',
        role: 'admin',
        password: '123',
        confirmPassword: '123'
      });

      component.onSubmit();

      expect(component.loading).toBeTrue();
      expect(userServiceSpy.createUser).toHaveBeenCalled();
      expect(activeModalSpy.close).toHaveBeenCalledWith('saved');
    });

    // CASO 3: Editar Usuario Exitoso (y limpieza de password)
    // Cubre el branch: if (this.user && !userData.password)
    it('should call updateUser and remove empty password field (Edit Mode)', () => {
      component.user = mockUser;
      fixture.detectChanges();
      userServiceSpy.updateUser.and.returnValue(of(mockUser));

      // Simulamos edición sin cambiar contraseña
      component.userForm.patchValue({ fullname: 'Updated Name' });
      component.userForm.controls['password'].setValue(''); 

      component.onSubmit();

      expect(userServiceSpy.updateUser).toHaveBeenCalled();
      // Obtenemos los argumentos con los que se llamó a updateUser
      const callArgs = userServiceSpy.updateUser.calls.mostRecent().args;
      const idArg = callArgs[0];
      const dataArg = callArgs[1];

      expect(idArg).toBe(mockUser._id as any);
      expect(dataArg.password).toBeUndefined(); // Verifica que se eliminó la key password
      expect(activeModalSpy.close).toHaveBeenCalledWith('saved');
    });

    // CASO 4: Error con mensaje del servidor (Lado izquierdo del OR ||)
    it('should display server error message if available', () => {
      fixture.detectChanges();
      const errorRes = { error: { message: 'El usuario ya existe' } };
      userServiceSpy.createUser.and.returnValue(throwError(() => errorRes));

      // Llenamos form válido para pasar la primera validación
      component.userForm.patchValue({
        document: '1', fullname: 'A', username: 'b', email: 'a@a.com', role: 'admin', password: '1', confirmPassword: '1'
      });

      component.onSubmit();

      expect(component.errorMessage).toBe('El usuario ya existe');
      expect(component.loading).toBeFalse();
    });

    // CASO 5: Error sin mensaje (Lado derecho del OR ||) - ESTE ES EL QUE FALTABA
    it('should display default error message if server response has no message', () => {
      fixture.detectChanges();
      // Simulamos un error genérico sin estructura error.message
      const genericError = { status: 500 }; 
      userServiceSpy.createUser.and.returnValue(throwError(() => genericError));

      component.userForm.patchValue({
        document: '1', fullname: 'A', username: 'b', email: 'a@a.com', role: 'admin', password: '1', confirmPassword: '1'
      });

      component.onSubmit();

      // Aquí verifica que entre al fallback string
      expect(component.errorMessage).toBe('Error al guardar el usuario');
      expect(component.loading).toBeFalse();
    });
  });
});