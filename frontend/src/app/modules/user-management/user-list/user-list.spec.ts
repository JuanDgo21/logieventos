import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms'; // <--- CRUCIAL: Necesario para [(ngModel)]
import { UserListComponent } from './user-list';
import { UserService } from '../../../core/services/user';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';
import { User } from '../../../shared/interfaces/user';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

// Bloque principal de pruebas para el componente UserListComponent
describe('UserListComponent', () => {
  // Variables que se usarán en todas las pruebas
  let component: UserListComponent; // Instancia del componente a probar
  let fixture: ComponentFixture<UserListComponent>; // Contenedor del componente y su entorno de prueba
  let userServiceSpy: jasmine.SpyObj<UserService>; // Servicio de usuarios simulado (mock)
  let modalServiceSpy: jasmine.SpyObj<NgbModal>; // Servicio de modales simulado (mock)

  // Datos de prueba simulados que representan usuarios
  const mockUsers: User[] = [
    { _id: '1', fullname: 'Juan Perez', email: 'juan@test.com', username: 'juanp', document: 1001, role: 'admin', active: true },
    { _id: '2', fullname: 'Maria Gomez', email: 'maria@test.com', username: 'mariag', document: 1002, role: 'coordinador', active: false },
    { _id: '3', fullname: 'Carlos Ruiz', email: 'carlos@test.com', username: 'carlosr', document: 1003, role: 'lider', active: true }
  ];

  // Configuración que se ejecuta antes de cada prueba
  beforeEach(async () => {
    // Crear objetos simulados (spies) para los servicios
    // Estos spies nos permiten controlar y verificar las llamadas a los métodos
    userServiceSpy = jasmine.createSpyObj('UserService', ['getAllUsers', 'deleteUser', 'updateUser']);
    modalServiceSpy = jasmine.createSpyObj('NgbModal', ['open']);

    // Configurar el comportamiento por defecto del servicio de usuarios
    // Cuando se llame a getAllUsers, devolverá nuestros usuarios de prueba
    userServiceSpy.getAllUsers.and.returnValue(of(mockUsers));

    // Configurar el módulo de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [UserListComponent], // Componente a probar
      imports: [
        FormsModule // <--- Import necesario para que funcione [(ngModel)] en el componente
      ],
      providers: [
        // Proporcionar los servicios simulados en lugar de los reales
        { provide: UserService, useValue: userServiceSpy },
        { provide: NgbModal, useValue: modalServiceSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA] // Ignorar elementos HTML personalizados no reconocidos
    })
    .compileComponents(); // Compilar el componente y su template

    // Crear el componente dentro del entorno de prueba
    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    
    // Primera detección de cambios - esto dispara ngOnInit() que llama a loadUsers()
    fixture.detectChanges();
  });

  // =================================================
  // 1. PRUEBAS DE INICIALIZACIÓN Y CARGA (LoadUsers)
  // =================================================

  // Prueba que verifica que el componente se crea correctamente y carga los usuarios
  it('should create and load users correctly', () => {
    // Verificar que el componente existe
    expect(component).toBeTruthy();
    // Verificar que se cargaron todos los usuarios mock
    expect(component.users.length).toBe(3);
    // Verificar que los usuarios filtrados inicialmente son todos
    expect(component.filteredUsers.length).toBe(3);
    // Verificar que el indicador de carga se desactiva después de cargar
    expect(component.loading).toBeFalse();
  });

  // Prueba que verifica que el componente maneja correctamente respuestas con estructura {data: ...}
  it('should handle response with {data: ...} structure', () => {
    // Configurar el servicio para devolver datos con estructura {data: array}
    userServiceSpy.getAllUsers.and.returnValue(of({ data: mockUsers } as any));
    // Forzar la carga de usuarios
    component.loadUsers();
    // Verificar que se procesaron correctamente los 3 usuarios
    expect(component.users.length).toBe(3);
  });

  // Prueba que verifica el manejo de respuestas vacías o nulas
  it('should handle empty/null response gracefully', () => {
    // Configurar el servicio para devolver data null
    userServiceSpy.getAllUsers.and.returnValue(of({ data: null } as any));
    // Forzar la carga de usuarios
    component.loadUsers();
    // Verificar que el componente establece un array vacío como respaldo
    expect(component.users).toEqual([]);
  });

  // Prueba que verifica el manejo de errores durante la carga de usuarios
  it('should handle error during loadUsers', () => {
    // Espiar console.error para evitar ruido en la consola de pruebas
    spyOn(console, 'error');
    // Configurar el servicio para devolver un error
    userServiceSpy.getAllUsers.and.returnValue(throwError(() => new Error('Load failed')));
    
    // Forzar la carga de usuarios (que fallará)
    component.loadUsers();
    
    // Verificar que el loading se desactiva incluso en caso de error
    expect(component.loading).toBeFalse();
    // Verificar que los arrays de usuarios se limpian
    expect(component.users).toEqual([]);
    expect(component.filteredUsers).toEqual([]);
    // Verificar que se registró el error
    expect(console.error).toHaveBeenCalled();
  });

  // =================================================
  // 2. PRUEBAS DE FILTROS (ApplyFilters) - COBERTURA CRÍTICA
  // =================================================

  // Prueba que verifica el manejo de casos donde users no es un array (seguridad)
  it('should handle case where users is not an array (Safety check)', () => {
    // Espiar console.error para capturar el mensaje de error
    spyOn(console, 'error');
    // Forzar una condición inválida estableciendo users como null
    component.users = null as any;
    
    // Aplicar filtros (debería manejar el caso null)
    component.applyFilters();
    
    // Verificar que filteredUsers es un array vacío como respaldo seguro
    expect(component.filteredUsers).toEqual([]);
    // Verificar que se registró el error
    expect(console.error).toHaveBeenCalledWith('Users is not an array:', null);
  });

  // Prueba que verifica el filtrado por término de búsqueda en nombre (case insensitive)
  it('should filter by search term (fullname case insensitive)', () => {
    // Establecer término de búsqueda
    component.searchTerm = 'juan';
    // Aplicar filtros
    component.applyFilters();
    // Verificar que solo se encontró 1 usuario
    expect(component.filteredUsers.length).toBe(1);
    // Verificar que es el usuario correcto
    expect(component.filteredUsers[0].fullname).toBe('Juan Perez');
  });

  // Prueba que verifica el filtrado por término de búsqueda en email
  it('should filter by search term (email)', () => {
    // Establecer término de búsqueda parcial de email
    component.searchTerm = 'maria@test';
    // Aplicar filtros
    component.applyFilters();
    // Verificar que solo se encontró 1 usuario
    expect(component.filteredUsers.length).toBe(1);
    // Verificar que es el usuario correcto
    expect(component.filteredUsers[0].email).toBe('maria@test.com');
  });

  // Prueba que verifica el filtrado por término de búsqueda en documento
  it('should filter by search term (document)', () => {
    // Establecer término de búsqueda como string de documento
    component.searchTerm = '1003';
    // Aplicar filtros
    component.applyFilters();
    // Verificar que solo se encontró 1 usuario
    expect(component.filteredUsers.length).toBe(1);
    // Verificar que es el usuario correcto
    expect(component.filteredUsers[0].document).toBe(1003);
  });

  // Prueba que verifica el filtrado por estado activo
  it('should filter by status (active)', () => {
    // Establecer filtro de estado como 'active'
    component.statusFilter = 'active';
    // Aplicar filtros
    component.applyFilters();
    // Deberían quedar 2 usuarios activos: Juan(active) y Carlos(active)
    expect(component.filteredUsers.length).toBe(2);
    // Verificar que todos los usuarios filtrados están activos
    expect(component.filteredUsers.every(u => u.active)).toBeTrue();
  });

  // Prueba que verifica el filtrado por estado inactivo
  it('should filter by status (inactive)', () => {
    // Establecer filtro de estado como 'inactive'
    component.statusFilter = 'inactive';
    // Aplicar filtros
    component.applyFilters();
    // Solo Maria está inactiva
    expect(component.filteredUsers.length).toBe(1);
    // Verificar que el usuario filtrado está inactivo
    expect(component.filteredUsers[0].active).toBeFalse();
  });

  // Prueba que verifica el filtrado por rol
  it('should filter by role', () => {
    // Establecer filtro de rol como 'admin'
    component.roleFilter = 'admin';
    // Aplicar filtros
    component.applyFilters();
    // Solo Juan es admin
    expect(component.filteredUsers.length).toBe(1);
    // Verificar que el usuario tiene el rol correcto
    expect(component.filteredUsers[0].role).toBe('admin');
  });

  // Prueba que verifica la combinación de múltiples filtros (AND lógico)
  it('should match combined filters (Search AND Status AND Role)', () => {
    // Configurar múltiples filtros que deberían coincidir con Carlos
    component.searchTerm = 'Carlos'; // Busca por nombre
    component.statusFilter = 'active'; // Filtra por estado activo
    component.roleFilter = 'lider'; // Filtra por rol líder
    
    // Aplicar filtros
    component.applyFilters();
    
    // Verificar que solo se encontró 1 usuario que cumple todas las condiciones
    expect(component.filteredUsers.length).toBe(1);
    // Verificar que es el usuario correcto
    expect(component.filteredUsers[0].username).toBe('carlosr');
  });

  // Prueba que verifica que los filtros combinados devuelven vacío cuando no hay coincidencias
  it('should return empty if combined filters match nothing', () => {
    // Configurar filtros contradictorios
    component.searchTerm = 'Juan'; // Busca a Juan
    component.statusFilter = 'inactive'; // Pero Juan es active, no inactive
    
    // Aplicar filtros
    component.applyFilters();
    
    // Verificar que no se encontraron usuarios
    expect(component.filteredUsers.length).toBe(0);
  });

  // Prueba que verifica el reinicio de filtros a sus valores por defecto
  it('should reset filters to default', () => {
    // Establecer filtros con valores específicos
    component.searchTerm = 'xyz';
    component.statusFilter = 'active';
    component.roleFilter = 'admin';
    component.applyFilters(); // Esto dejaría filteredUsers vacío

    // Ejecutar el reinicio de filtros
    component.resetFilters();

    // Verificar que los filtros volvieron a sus valores por defecto
    expect(component.searchTerm).toBe('');
    expect(component.statusFilter).toBe('all');
    expect(component.roleFilter).toBe('all');
    // Verificar que se muestran todos los usuarios nuevamente
    expect(component.filteredUsers.length).toBe(3);
  });

  // =================================================
  // 3. PRUEBAS DE MODALES Y ACCIONES
  // =================================================

  // Prueba para abrir el formulario de usuario en modo creación
  it('should open user form and reload on save', fakeAsync(() => {
    // Simular la referencia del modal que se devuelve al abrirlo
    const mockModalRef = {
      componentInstance: { user: null }, // Sin usuario = modo creación
      result: Promise.resolve('saved') // Simular cierre exitoso con guardado
    };
    // Configurar el servicio de modales para devolver nuestro modal simulado
    modalServiceSpy.open.and.returnValue(mockModalRef as any);
    // Espiar el método loadUsers para verificar que se llama después del guardado
    spyOn(component, 'loadUsers');

    // Abrir el formulario (modo creación)
    component.openUserForm();
    tick(); // Avanzar el tiempo para resolver la promesa

    // Verificar que se abrió el modal
    expect(modalServiceSpy.open).toHaveBeenCalled();
    // Verificar que se recargaron los usuarios después del guardado
    expect(component.loadUsers).toHaveBeenCalled();
  }));

  // Prueba para abrir el formulario de usuario en modo edición
  it('should open user form with data (Edit mode)', () => {
    // Simular la referencia del modal
    const mockModalRef: any = {
      componentInstance: { user: null }, // Inicialmente sin usuario
      result: new Promise(() => {}) // Promesa pendiente (no nos interesa el resultado aquí)
    };
    // Configurar el servicio de modales
    modalServiceSpy.open.and.returnValue(mockModalRef as any);

    // Abrir el formulario pasando un usuario (modo edición)
    component.openUserForm(mockUsers[0]);

    // Verificar que se abrió el modal
    expect(modalServiceSpy.open).toHaveBeenCalled();
    // Verificar que se pasó el usuario al componente del modal
    expect(mockModalRef.componentInstance.user).toEqual(mockUsers[0]);
  });

  // Prueba para manejar la cancelación del modal (cuando el usuario hace clic fuera o presiona Escape)
  it('should handle modal dismissal without error', fakeAsync(() => {
    // Simular modal que se rechaza (dismiss)
    const mockModalRef = {
      componentInstance: {},
      result: Promise.reject('dismissed') // Simular cancelación del modal
    };
    modalServiceSpy.open.and.returnValue(mockModalRef as any);
    // Espiar loadUsers para verificar que NO se llama después de cancelar
    spyOn(component, 'loadUsers');

    // Abrir el formulario
    component.openUserForm();
    tick(); // Avanzar el tiempo para ejecutar el bloque catch

    // Verificar que NO se recargaron los usuarios después de cancelar
    expect(component.loadUsers).not.toHaveBeenCalled();
    // Si el test no falla, significa que el .catch(() => {}) funcionó correctamente
  }));

  // Prueba para confirmar eliminación de usuario (caso exitoso)
  it('should open confirm modal and delete user if confirmed', fakeAsync(() => {
    // Simular modal de confirmación
    const mockModalRef = {
      componentInstance: { title: '', message: '', confirmText: '', confirmClass: '' },
      result: Promise.resolve(true) // Usuario confirma la eliminación
    };
    modalServiceSpy.open.and.returnValue(mockModalRef as any);
    // Configurar el servicio para eliminar exitosamente
    userServiceSpy.deleteUser.and.returnValue(of(undefined));
    // Espiar loadUsers para verificar que se llama después de eliminar
    spyOn(component, 'loadUsers');

    // Ejecutar confirmación de eliminación
    component.confirmDelete(mockUsers[0]);
    tick(); // Avanzar el tiempo para resolver la promesa

    // Verificar que se llamó al servicio de eliminación con el ID correcto
    expect(userServiceSpy.deleteUser).toHaveBeenCalledWith('1');
    // Verificar que se recargó la lista de usuarios
    expect(component.loadUsers).toHaveBeenCalled();
  }));

  // Prueba para manejar error durante la eliminación
  it('should log error if delete fails', fakeAsync(() => {
    // Simular modal de confirmación
    const mockModalRef = {
      componentInstance: {},
      result: Promise.resolve(true) // Usuario confirma
    };
    modalServiceSpy.open.and.returnValue(mockModalRef as any);
    // Configurar el servicio para fallar al eliminar
    userServiceSpy.deleteUser.and.returnValue(throwError(() => 'Delete error'));
    // Espiar console.error para capturar el error
    spyOn(console, 'error');

    // Ejecutar confirmación de eliminación
    component.confirmDelete(mockUsers[0]);
    tick(); // Avanzar el tiempo

    // Verificar que se registró el error
    expect(console.error).toHaveBeenCalled();
  }));

  // =================================================
  // 4. PRUEBAS DE CAMBIO DE ESTADO Y CLICS DE BOTONES
  // =================================================

  // Prueba para cambiar el estado de usuario exitosamente
  it('should toggle user status successfully', () => {
    // Crear copia del usuario para no modificar el original
    const user = { ...mockUsers[0], active: true };
    // Configurar el servicio para actualizar exitosamente
    userServiceSpy.updateUser.and.returnValue(of({}));
    // Espiar applyFilters para verificar que se llama después del cambio
    spyOn(component, 'applyFilters');

    // Cambiar el estado del usuario (de active a inactive)
    component.toggleUserStatus(user);

    // Verificar que se llamó al servicio con los parámetros correctos
    expect(userServiceSpy.updateUser).toHaveBeenCalledWith('1', { active: false });
    // Verificar que el estado se cambió localmente
    expect(user.active).toBeFalse();
    // Verificar que se aplicaron los filtros para actualizar la vista
    expect(component.applyFilters).toHaveBeenCalled();
  });

  // Prueba para manejar error al cambiar el estado
  it('should handle error when toggling status', () => {
    // Crear copia del usuario
    const user = { ...mockUsers[0], active: true };
    // Configurar el servicio para fallar
    userServiceSpy.updateUser.and.returnValue(throwError(() => 'Update fail'));
    // Espiar console.error para capturar el error
    spyOn(console, 'error');

    // Intentar cambiar el estado
    component.toggleUserStatus(user);

    // Verificar que se registró el error
    expect(console.error).toHaveBeenCalled();
    // Verificar que el estado NO cambió localmente (según implementación actual)
    expect(user.active).toBeTrue();
  });

  // Prueba para manejar clics en botones con prevención de propagación
  it('should handle button clicks with propagation stopping', () => {
    // Simular evento de clic con métodos para prevenir comportamientos por defecto
    const mockEvent = jasmine.createSpyObj('MouseEvent', ['preventDefault', 'stopPropagation', 'stopImmediatePropagation']);
    
    // Espiar los métodos que deberían llamarse para cada acción
    spyOn(component, 'openUserForm');
    spyOn(component, 'confirmDelete');
    spyOn(component, 'toggleUserStatus');

    // Probar acción: Editar
    component.handleButtonClick('edit', mockUsers[0], mockEvent);
    // Verificar que se previno el comportamiento por defecto del evento
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    // Verificar que se llamó al método correcto con el usuario correcto
    expect(component.openUserForm).toHaveBeenCalledWith(mockUsers[0]);

    // Probar acción: Eliminar
    component.handleButtonClick('delete', mockUsers[0], mockEvent);
    expect(component.confirmDelete).toHaveBeenCalledWith(mockUsers[0]);

    // Probar acción: Cambiar estado
    component.handleButtonClick('toggle', mockUsers[0], mockEvent);
    expect(component.toggleUserStatus).toHaveBeenCalledWith(mockUsers[0]);
  });
});