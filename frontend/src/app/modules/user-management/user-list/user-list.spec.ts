import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms'; // <--- CRUCIAL: Necesario para [(ngModel)]
import { UserListComponent } from './user-list';
import { UserService } from '../../../core/services/user';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';
import { User } from '../../../shared/interfaces/user';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let modalServiceSpy: jasmine.SpyObj<NgbModal>;

  // Mock Data robusta para probar filtros
  const mockUsers: User[] = [
    { _id: '1', fullname: 'Juan Perez', email: 'juan@test.com', username: 'juanp', document: 1001, role: 'admin', active: true },
    { _id: '2', fullname: 'Maria Gomez', email: 'maria@test.com', username: 'mariag', document: 1002, role: 'coordinador', active: false },
    { _id: '3', fullname: 'Carlos Ruiz', email: 'carlos@test.com', username: 'carlosr', document: 1003, role: 'lider', active: true }
  ];

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['getAllUsers', 'deleteUser', 'updateUser']);
    modalServiceSpy = jasmine.createSpyObj('NgbModal', ['open']);

    // Configuración por defecto exitosa
    userServiceSpy.getAllUsers.and.returnValue(of(mockUsers));

    await TestBed.configureTestingModule({
      declarations: [UserListComponent],
      imports: [
        FormsModule // <--- SOLUCIÓN AL ERROR NG0303
      ],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: NgbModal, useValue: modalServiceSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    
    // Primera detección de cambios dispara ngOnInit -> loadUsers
    fixture.detectChanges();
  });

  // =================================================
  // 1. INICIALIZACIÓN Y CARGA (LoadUsers)
  // =================================================

  it('should create and load users correctly', () => {
    expect(component).toBeTruthy();
    expect(component.users.length).toBe(3);
    expect(component.filteredUsers.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('should handle response with {data: ...} structure', () => {
    userServiceSpy.getAllUsers.and.returnValue(of({ data: mockUsers } as any));
    component.loadUsers();
    expect(component.users.length).toBe(3);
  });

  it('should handle empty/null response gracefully', () => {
    userServiceSpy.getAllUsers.and.returnValue(of({ data: null } as any));
    component.loadUsers();
    expect(component.users).toEqual([]);
  });

  it('should handle error during loadUsers', () => {
    spyOn(console, 'error'); // Evitar ruido en consola
    userServiceSpy.getAllUsers.and.returnValue(throwError(() => new Error('Load failed')));
    
    component.loadUsers();
    
    expect(component.loading).toBeFalse();
    expect(component.users).toEqual([]);
    expect(component.filteredUsers).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  // =================================================
  // 2. FILTROS (ApplyFilters) - COBERTURA CRÍTICA
  // =================================================

  it('should handle case where users is not an array (Safety check)', () => {
    spyOn(console, 'error');
    component.users = null as any; // Forzamos condición inválida
    
    component.applyFilters();
    
    expect(component.filteredUsers).toEqual([]);
    expect(console.error).toHaveBeenCalledWith('Users is not an array:', null);
  });

  it('should filter by search term (fullname case insensitive)', () => {
    component.searchTerm = 'juan';
    component.applyFilters();
    expect(component.filteredUsers.length).toBe(1);
    expect(component.filteredUsers[0].fullname).toBe('Juan Perez');
  });

  it('should filter by search term (email)', () => {
    component.searchTerm = 'maria@test';
    component.applyFilters();
    expect(component.filteredUsers.length).toBe(1);
    expect(component.filteredUsers[0].email).toBe('maria@test.com');
  });

  it('should filter by search term (document)', () => {
    component.searchTerm = '1003';
    component.applyFilters();
    expect(component.filteredUsers.length).toBe(1);
    expect(component.filteredUsers[0].document).toBe(1003);
  });

  it('should filter by status (active)', () => {
    component.statusFilter = 'active';
    component.applyFilters();
    // Juan(active), Maria(inactive), Carlos(active) -> Deben quedar 2
    expect(component.filteredUsers.length).toBe(2);
    expect(component.filteredUsers.every(u => u.active)).toBeTrue();
  });

  it('should filter by status (inactive)', () => {
    component.statusFilter = 'inactive';
    component.applyFilters();
    // Solo Maria
    expect(component.filteredUsers.length).toBe(1);
    expect(component.filteredUsers[0].active).toBeFalse();
  });

  it('should filter by role', () => {
    component.roleFilter = 'admin';
    component.applyFilters();
    expect(component.filteredUsers.length).toBe(1);
    expect(component.filteredUsers[0].role).toBe('admin');
  });

  it('should match combined filters (Search AND Status AND Role)', () => {
    // Buscamos a Carlos: 'carlos' + active + lider
    component.searchTerm = 'Carlos';
    component.statusFilter = 'active';
    component.roleFilter = 'lider';
    
    component.applyFilters();
    
    expect(component.filteredUsers.length).toBe(1);
    expect(component.filteredUsers[0].username).toBe('carlosr');
  });

  it('should return empty if combined filters match nothing', () => {
    component.searchTerm = 'Juan';
    component.statusFilter = 'inactive'; // Juan es active
    
    component.applyFilters();
    
    expect(component.filteredUsers.length).toBe(0);
  });

  it('should reset filters to default', () => {
    // Ensuciamos filtros
    component.searchTerm = 'xyz';
    component.statusFilter = 'active';
    component.roleFilter = 'admin';
    component.applyFilters(); // Quedaría vacío

    component.resetFilters();

    expect(component.searchTerm).toBe('');
    expect(component.statusFilter).toBe('all');
    expect(component.roleFilter).toBe('all');
    expect(component.filteredUsers.length).toBe(3); // Todos vuelven
  });

  // =================================================
  // 3. MODALES Y ACCIONES
  // =================================================

  // Test para OpenUserForm (Create)
  it('should open user form and reload on save', fakeAsync(() => {
    const mockModalRef = {
      componentInstance: { user: null },
      result: Promise.resolve('saved') // Simulamos cierre exitoso
    };
    modalServiceSpy.open.and.returnValue(mockModalRef as any);
    spyOn(component, 'loadUsers');

    component.openUserForm(); // Modo crear
    tick(); // Resolver promesa

    expect(modalServiceSpy.open).toHaveBeenCalled();
    expect(component.loadUsers).toHaveBeenCalled();
  }));

  // Test para OpenUserForm (Edit)
  it('should open user form with data (Edit mode)', () => {
    const mockModalRef: any = {
      componentInstance: { user: null },
      result: new Promise(() => {}) // Promesa pendiente (no nos importa el resultado aquí)
    };
    modalServiceSpy.open.and.returnValue(mockModalRef as any);

    component.openUserForm(mockUsers[0]);

    expect(modalServiceSpy.open).toHaveBeenCalled();
    expect(mockModalRef.componentInstance.user).toEqual(mockUsers[0]);
  });

  // Test para Modal Dismissed (Catch block)
  it('should handle modal dismissal without error', fakeAsync(() => {
    const mockModalRef = {
      componentInstance: {},
      result: Promise.reject('dismissed') // Simulamos click afuera o escape
    };
    modalServiceSpy.open.and.returnValue(mockModalRef as any);
    spyOn(component, 'loadUsers');

    component.openUserForm();
    tick(); // Ejecuta el catch

    expect(component.loadUsers).not.toHaveBeenCalled();
    // Si el test no falla aquí, significa que el .catch(() => {}) funcionó
  }));

  // Test para ConfirmDelete (Success)
  it('should open confirm modal and delete user if confirmed', fakeAsync(() => {
    const mockModalRef = {
      componentInstance: { title: '', message: '', confirmText: '', confirmClass: '' },
      result: Promise.resolve(true)
    };
    modalServiceSpy.open.and.returnValue(mockModalRef as any);
    userServiceSpy.deleteUser.and.returnValue(of(undefined));
    spyOn(component, 'loadUsers');

    component.confirmDelete(mockUsers[0]);
    tick();

    expect(userServiceSpy.deleteUser).toHaveBeenCalledWith('1');
    expect(component.loadUsers).toHaveBeenCalled();
  }));

  // Test para Delete Error
  it('should log error if delete fails', fakeAsync(() => {
    const mockModalRef = {
      componentInstance: {},
      result: Promise.resolve(true)
    };
    modalServiceSpy.open.and.returnValue(mockModalRef as any);
    userServiceSpy.deleteUser.and.returnValue(throwError(() => 'Delete error'));
    spyOn(console, 'error');

    component.confirmDelete(mockUsers[0]);
    tick();

    expect(console.error).toHaveBeenCalled();
  }));

  // =================================================
  // 4. TOGGLE STATUS & BUTTON CLICKS
  // =================================================

  it('should toggle user status successfully', () => {
    const user = { ...mockUsers[0], active: true };
    userServiceSpy.updateUser.and.returnValue(of({}));
    spyOn(component, 'applyFilters'); // Se llama al final del éxito

    component.toggleUserStatus(user);

    expect(userServiceSpy.updateUser).toHaveBeenCalledWith('1', { active: false });
    expect(user.active).toBeFalse(); // Debe actualizarse localmente
    expect(component.applyFilters).toHaveBeenCalled();
  });

  it('should handle error when toggling status', () => {
    const user = { ...mockUsers[0], active: true };
    userServiceSpy.updateUser.and.returnValue(throwError(() => 'Update fail'));
    spyOn(console, 'error');

    component.toggleUserStatus(user);

    expect(console.error).toHaveBeenCalled();
    expect(user.active).toBeTrue(); // No debería cambiar si falló (según implementación actual)
  });

  it('should handle button clicks with propagation stopping', () => {
    const mockEvent = jasmine.createSpyObj('MouseEvent', ['preventDefault', 'stopPropagation', 'stopImmediatePropagation']);
    
    spyOn(component, 'openUserForm');
    spyOn(component, 'confirmDelete');
    spyOn(component, 'toggleUserStatus');

    // Action: Edit
    component.handleButtonClick('edit', mockUsers[0], mockEvent);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.openUserForm).toHaveBeenCalledWith(mockUsers[0]);

    // Action: Delete
    component.handleButtonClick('delete', mockUsers[0], mockEvent);
    expect(component.confirmDelete).toHaveBeenCalledWith(mockUsers[0]);

    // Action: Toggle
    component.handleButtonClick('toggle', mockUsers[0], mockEvent);
    expect(component.toggleUserStatus).toHaveBeenCalledWith(mockUsers[0]);
  });
});