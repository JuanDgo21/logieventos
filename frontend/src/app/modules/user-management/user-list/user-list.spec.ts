// Importamos las herramientas necesarias para testing en Angular
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms'; // Necesario para ngModel en formularios
import { UserListComponent } from './user-list'; // Componente que vamos a probar
import { UserService } from '../../../core/services/user'; // Servicio de usuarios
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'; // Servicio de modales de Bootstrap
import { of, throwError } from 'rxjs'; // Utilidades RxJS para crear observables
import { User } from '../../../shared/interfaces/user'; // Interfaz del usuario
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'; // Para ignorar elementos personalizados

// Bloque principal de pruebas para el componente UserListComponent
describe('UserListComponent', () => {
  let component: UserListComponent;  // Instancia del componente que vamos a probar
  let fixture: ComponentFixture<UserListComponent>;  // Contenedor del componente para testing
  let userServiceSpy: jasmine.SpyObj<UserService>;  // Spy del servicio de usuarios
  let modalServiceSpy: jasmine.SpyObj<NgbModal>;  // Spy del servicio de modales

  // ==========================================
  // DATOS DE PRUEBA SIMULADOS (MOCKS)
  // ==========================================

  // Creamos datos de prueba realistas para simular usuarios de la aplicación
  const mockUsers: User[] = [
    { _id: '1', fullname: 'Juan Perez', email: 'juan@test.com', username: 'juanp', document: 1001, role: 'admin', active: true },
    { _id: '2', fullname: 'Maria Gomez', email: 'maria@test.com', username: 'mariag', document: 1002, role: 'coordinador', active: false },
    { _id: '3', fullname: 'Carlos Ruiz', email: 'carlos@test.com', username: 'carlosr', document: 1003, role: 'lider', active: true }
  ];

  // 'beforeEach' se ejecuta ANTES de cada prueba individual
  beforeEach(async () => {
    // Creamos objetos espía para los servicios
    userServiceSpy = jasmine.createSpyObj('UserService', ['getAllUsers', 'deleteUser', 'updateUser']);
    modalServiceSpy = jasmine.createSpyObj('NgbModal', ['open']);

    // Configurar comportamiento por defecto del servicio
    // Simulamos que getAllUsers devuelve la lista mock de usuarios
    userServiceSpy.getAllUsers.and.returnValue(of(mockUsers));

    // Configuramos el módulo de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [UserListComponent],  // Componente a probar
      imports: [FormsModule],  // Necesario para formularios con ngModel
      providers: [
        // Inyectamos los servicios simulados
        { provide: UserService, useValue: userServiceSpy },
        { provide: NgbModal, useValue: modalServiceSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]  // Ignora elementos HTML personalizados
    })
    .compileComponents();  // Compila el componente y su template

    // Creamos una instancia del componente
    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Ejecuta ngOnInit -> loadUsers (inicialización del componente)
  });

  // =================================================
  // 1. PRUEBAS DE INICIALIZACIÓN Y CARGA
  // =================================================

  // Prueba básica: verifica que el componente se crea y carga datos correctamente
  it('should create and load users correctly', () => {
    expect(component).toBeTruthy();  // Verifica que el componente existe
    expect(component.users.length).toBe(3);  // Debe tener 3 usuarios
    expect(component.filteredUsers.length).toBe(3);  // Lista filtrada inicialmente igual
    expect(component.loading).toBeFalse();  // El loading debe desactivarse después de cargar
  });

  // Prueba: manejo de estructura de respuesta anidada {data: [...]}
  it('should handle response with {data: ...} structure', () => {
    // Algunas APIs devuelven los datos dentro de una propiedad 'data'
    userServiceSpy.getAllUsers.and.returnValue(of({ data: mockUsers } as any));
    component.loadUsers();  // Llamamos manualmente a cargar usuarios
    expect(component.users.length).toBe(3);  // Debe extraer correctamente los datos
  });

  // Prueba: manejo de respuestas vacías o nulas
  it('should handle empty/null response gracefully', () => {
    userServiceSpy.getAllUsers.and.returnValue(of({ data: null } as any));
    component.loadUsers();
    expect(component.users).toEqual([]);  // Debe manejar null convirtiéndolo a array vacío
  });

  // Prueba: manejo de errores durante la carga
  it('should handle error during loadUsers', () => {
    spyOn(console, 'error');  // Espiamos console.error para verificar que se llama
    userServiceSpy.getAllUsers.and.returnValue(throwError(() => new Error('Load failed')));
    
    component.loadUsers();
    
    expect(component.loading).toBeFalse();  // Loading debe desactivarse incluso en error
    expect(component.users).toEqual([]);  // Lista de usuarios debe estar vacía
    expect(component.filteredUsers).toEqual([]);  // Lista filtrada también vacía
    expect(console.error).toHaveBeenCalled();  // Debe registrar el error
  });

  // =================================================
  // 2. PRUEBAS DE FILTROS
  // =================================================

  // Prueba de seguridad: manejo cuando users no es un array
  it('should handle case where users is not an array (Safety check)', () => {
    spyOn(console, 'error');
    component.users = null as any;  // Forzamos un valor inválido
    
    component.applyFilters();  // Aplicamos filtros
    
    expect(component.filteredUsers).toEqual([]);  // Debe devolver array vacío como fallback
    expect(console.error).toHaveBeenCalledWith('Users is not an array:', null);  // Debe loguear error
  });

  // Prueba: filtrado por término de búsqueda (nombre, case insensitive)
  it('should filter by search term (fullname case insensitive)', () => {
    component.searchTerm = 'juan';  // Búsqueda en minúsculas
    component.applyFilters();
    expect(component.filteredUsers.length).toBe(1);  // Solo debe encontrar 1 usuario
    expect(component.filteredUsers[0].fullname).toBe('Juan Perez');  // Usuario correcto
  });

  // Prueba: filtrado por email
  it('should filter by search term (email)', () => {
    component.searchTerm = 'maria@test';  // Búsqueda parcial de email
    component.applyFilters();
    expect(component.filteredUsers.length).toBe(1);
    expect(component.filteredUsers[0].email).toBe('maria@test.com');
  });

  // Prueba: filtrado por documento
  it('should filter by search term (document)', () => {
    component.searchTerm = '1003';  // Búsqueda por número de documento
    component.applyFilters();
    expect(component.filteredUsers.length).toBe(1);
    expect(component.filteredUsers[0].document).toBe(1003);
  });

  // Prueba: filtrado por estado activo
  it('should filter by status (active)', () => {
    component.statusFilter = 'active';
    component.applyFilters();
    expect(component.filteredUsers.length).toBe(2);  // 2 usuarios activos en los mocks
    expect(component.filteredUsers.every(u => u.active)).toBeTrue();  // Todos deben estar activos
  });

  // Prueba: filtrado por estado inactivo
  it('should filter by status (inactive)', () => {
    component.statusFilter = 'inactive';
    component.applyFilters();
    expect(component.filteredUsers.length).toBe(1);  // 1 usuario inactivo en los mocks
    expect(component.filteredUsers[0].active).toBeFalse();  // Debe estar inactivo
  });

  // Prueba: filtrado por rol
  it('should filter by role', () => {
    component.roleFilter = 'admin';
    component.applyFilters();
    expect(component.filteredUsers.length).toBe(1);
    expect(component.filteredUsers[0].role).toBe('admin');
  });

  // Prueba: combinación de múltiples filtros (AND lógico)
  it('should match combined filters (Search AND Status AND Role)', () => {
    component.searchTerm = 'Carlos';
    component.statusFilter = 'active';
    component.roleFilter = 'lider';
    component.applyFilters();
    expect(component.filteredUsers.length).toBe(1);
    expect(component.filteredUsers[0].username).toBe('carlosr');  // Debe cumplir todos los filtros
  });

  // Prueba: resultado vacío cuando los filtros no coinciden
  it('should return empty if combined filters match nothing', () => {
    component.searchTerm = 'Juan';
    component.statusFilter = 'inactive';  // Juan está activo, no inactivo
    component.applyFilters();
    expect(component.filteredUsers.length).toBe(0);  // No debe encontrar resultados
  });

  // Prueba: reset de filtros a valores por defecto
  it('should reset filters to default', () => {
    // Aplicamos algunos filtros primero
    component.searchTerm = 'xyz';
    component.statusFilter = 'active';
    component.roleFilter = 'admin';
    component.applyFilters();

    // Reseteamos los filtros
    component.resetFilters();

    // Verificamos que todos los filtros volvieron a sus valores por defecto
    expect(component.searchTerm).toBe('');
    expect(component.statusFilter).toBe('all');
    expect(component.roleFilter).toBe('all');
    expect(component.filteredUsers.length).toBe(3);  // Debe mostrar todos los usuarios
  });

  // =================================================
  // 3. PRUEBAS DE MODALES Y ACCIONES
  // =================================================

  // Prueba: apertura de formulario de usuario y recarga al guardar
  it('should open user form and reload on save', fakeAsync(() => {
    // Creamos un modal simulado que resuelve con 'saved'
    const mockModalRef = {
      componentInstance: { user: null },  // Modal en modo creación
      result: Promise.resolve('saved')  // Simula que se guardó exitosamente
    };
    modalServiceSpy.open.and.returnValue(mockModalRef as any);
    spyOn(component, 'loadUsers');  // Espiamos loadUsers para verificar que se llama

    component.openUserForm();  // Abrimos formulario (sin usuario = creación)
    tick();  // Procesamos la promesa asíncrona

    expect(modalServiceSpy.open).toHaveBeenCalled();  // Debe abrir el modal
    expect(component.loadUsers).toHaveBeenCalled();  // Debe recargar los datos después de guardar
  }));

  // Prueba: apertura de formulario en modo edición (con datos de usuario)
  it('should open user form with data (Edit mode)', () => {
    const mockModalRef: any = {
      componentInstance: { user: null },  // Inicialmente sin usuario
      result: new Promise(() => {})  // Promesa pendiente (no la resolvemos)
    };
    modalServiceSpy.open.and.returnValue(mockModalRef as any);

    // Abrimos formulario pasando un usuario existente (modo edición)
    component.openUserForm(mockUsers[0]);

    expect(modalServiceSpy.open).toHaveBeenCalled();
    // Verificamos que se pasaron los datos del usuario al modal
    expect(mockModalRef.componentInstance.user).toEqual(mockUsers[0]);
  });

  // Prueba: manejo cuando el modal es descartado (cerrado sin guardar)
  it('should handle user form modal dismissal without error', fakeAsync(() => {
    const mockModalRef = {
      componentInstance: {},
      result: Promise.reject('dismissed')  // Modal descartado/rechazado
    };
    modalServiceSpy.open.and.returnValue(mockModalRef as any);
    spyOn(component, 'loadUsers');

    component.openUserForm();
    tick();  // Procesamos el rechazo de la promesa

    expect(component.loadUsers).not.toHaveBeenCalled();  // NO debe recargar datos
  }));

  // --- Pruebas de ConfirmDelete ---

  // Prueba: confirmación de eliminación exitosa
  it('should open confirm modal and delete user if confirmed', fakeAsync(() => {
    const mockModalRef = {
      componentInstance: { title: '', message: '', confirmText: '', confirmClass: '' },
      result: Promise.resolve(true)  // Usuario confirma la eliminación
    };
    modalServiceSpy.open.and.returnValue(mockModalRef as any);
    userServiceSpy.deleteUser.and.returnValue(of(undefined));  // Eliminación exitosa
    spyOn(component, 'loadUsers');  // Espiamos la recarga de datos

    component.confirmDelete(mockUsers[0]);  // Intentamos eliminar el primer usuario
    tick();  // Procesamos la promesa de confirmación

    expect(userServiceSpy.deleteUser).toHaveBeenCalledWith('1');  // Debe llamar al servicio con ID correcto
    expect(component.loadUsers).toHaveBeenCalled();  // Debe recargar la lista después de eliminar
  }));

  // [COVERAGE FIX] Cubre el bloque .catch() de confirmDelete (Línea roja en la imagen)
  it('should handle confirm modal dismissal without error (catch block)', fakeAsync(() => {
    // Simulamos que el usuario cierra el modal sin confirmar (promesa rechazada)
    const mockModalRef = {
      componentInstance: {},
      result: Promise.reject('dismissed')  // Modal cerrado/rechazado
    };
    modalServiceSpy.open.and.returnValue(mockModalRef as any);
    
    component.confirmDelete(mockUsers[0]);
    tick(); // Avanza el tiempo para ejecutar el bloque catch
    
    // Verificamos que NO se llamó a eliminar cuando el modal es descartado
    expect(userServiceSpy.deleteUser).not.toHaveBeenCalled();
  }));

  // Prueba: manejo de errores durante la eliminación
  it('should log error if delete fails', fakeAsync(() => {
    const mockModalRef = {
      componentInstance: {},
      result: Promise.resolve(true)  // Usuario confirma
    };
    modalServiceSpy.open.and.returnValue(mockModalRef as any);
    userServiceSpy.deleteUser.and.returnValue(throwError(() => 'Delete error'));  // Simulamos error
    spyOn(console, 'error');  // Espiamos console.error

    component.confirmDelete(mockUsers[0]);
    tick();

    expect(console.error).toHaveBeenCalled();  // Debe registrar el error
  }));

  // =================================================
  // 4. PRUEBAS DE CAMBIO DE ESTADO Y CLICS DE BOTONES
  // =================================================

  // Prueba: cambio exitoso de estado de usuario
  it('should toggle user status successfully', () => {
    const user = { ...mockUsers[0], active: true };  // Usuario activo
    userServiceSpy.updateUser.and.returnValue(of({}));  // Actualización exitosa
    spyOn(component, 'applyFilters');  // Espiamos re-aplicación de filtros

    component.toggleUserStatus(user);  // Cambiamos estado

    // Verificamos que se llamó al servicio para desactivar el usuario
    expect(userServiceSpy.updateUser).toHaveBeenCalledWith('1', { active: false });
    expect(user.active).toBeFalse();  // El estado local debe actualizarse
    expect(component.applyFilters).toHaveBeenCalled();  // Debe re-filtrar la lista
  });

  // Prueba: manejo de errores al cambiar estado
  it('should handle error when toggling status', () => {
    const user = { ...mockUsers[0], active: true };
    userServiceSpy.updateUser.and.returnValue(throwError(() => 'Update fail'));  // Error simulado
    spyOn(console, 'error');

    component.toggleUserStatus(user);

    expect(console.error).toHaveBeenCalled();  // Debe registrar el error
    expect(user.active).toBeTrue();  // El estado NO debe cambiar localmente si hay error
  });

  // Prueba: manejo de clics en botones con prevención de propagación
  it('should handle button clicks with propagation stopping', () => {
    // Creamos un evento simulado con métodos de prevención
    const mockEvent = jasmine.createSpyObj('MouseEvent', ['preventDefault', 'stopPropagation', 'stopImmediatePropagation']);
    
    // Espiamos los métodos que deben llamarse
    spyOn(component, 'openUserForm');
    spyOn(component, 'confirmDelete');
    spyOn(component, 'toggleUserStatus');

    // Probamos el botón de editar
    component.handleButtonClick('edit', mockUsers[0], mockEvent);
    expect(mockEvent.preventDefault).toHaveBeenCalled();  // Debe prevenir comportamiento por defecto
    expect(component.openUserForm).toHaveBeenCalledWith(mockUsers[0]);  // Debe abrir formulario de edición

    // Probamos el botón de eliminar
    component.handleButtonClick('delete', mockUsers[0], mockEvent);
    expect(component.confirmDelete).toHaveBeenCalledWith(mockUsers[0]);  // Debe abrir confirmación

    // Probamos el botón de cambiar estado
    component.handleButtonClick('toggle', mockUsers[0], mockEvent);
    expect(component.toggleUserStatus).toHaveBeenCalledWith(mockUsers[0]);  // Debe cambiar estado
  });
});