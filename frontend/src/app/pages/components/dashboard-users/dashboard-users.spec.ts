// Importamos las herramientas necesarias para testing en Angular
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardUsersComponent } from './dashboard-users';
import { AuthService } from '../../../core/services/auth';
import { UserService } from '../../../core/services/user';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';  // 'of' crea observables que emiten valores, 'throwError' crea observables que emiten errores
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { User } from '../../../shared/interfaces/user';

// La función 'describe' agrupa todas las pruebas relacionadas con el DashboardUsersComponent
describe('DashboardUsersComponent', () => {
  let component: DashboardUsersComponent;  // Instancia del componente que vamos a probar
  let fixture: ComponentFixture<DashboardUsersComponent>;  // Contenedor del componente para testing

  // Spies (Espías) - Objetos que simulan servicios reales y nos permiten controlar sus respuestas
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let modalServiceSpy: jasmine.SpyObj<NgbModal>;

  // Datos de prueba (Mock Data) - Usuarios falsos que usaremos en las pruebas
  const mockUsers: User[] = [
    { _id: '1', document: 123, fullname: 'Admin User', username: 'admin', email: 'admin@test.com', role: 'admin', active: true, createdAt: new Date('2023-01-01') },
    { _id: '2', document: 456, fullname: 'Coord User', username: 'coord', email: 'coord@test.com', role: 'coordinador', active: true, createdAt: new Date('2023-02-01') },
    { _id: '3', document: 789, fullname: 'Leader User', username: 'leader', email: 'leader@test.com', role: 'lider', active: false, createdAt: new Date('2023-03-01') }
  ];

  // 'beforeEach' se ejecuta ANTES de cada prueba individual
  beforeEach(async () => {
    // Creamos objetos espía para los servicios usando Jasmine
    const authSpy = jasmine.createSpyObj('AuthService', ['getUserRole']);
    const userSpy = jasmine.createSpyObj('UserService', ['getAllUsers']);
    const modalSpy = jasmine.createSpyObj('NgbModal', ['open']);

    // Configuramos el módulo de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [DashboardUsersComponent],  // Declaramos el componente a probar
      providers: [
        // Proporcionamos los servicios simulados en lugar de los reales
        { provide: AuthService, useValue: authSpy },
        { provide: UserService, useValue: userSpy },
        { provide: NgbModal, useValue: modalSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]  // Ignora elementos HTML y atributos desconocidos
    }).compileComponents();

    // Obtenemos las instancias de los servicios simulados del TestBed
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    userServiceSpy = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    modalServiceSpy = TestBed.inject(NgbModal) as jasmine.SpyObj<NgbModal>;

    // Configuración por defecto para los métodos de los servicios
    authServiceSpy.getUserRole.and.returnValue('admin');  // Simula que el usuario es admin
    userServiceSpy.getAllUsers.and.returnValue(of(mockUsers));  // Simula que getUserAllUsers devuelve los usuarios mock

    // Creamos una instancia del componente dentro del fixture
    fixture = TestBed.createComponent(DashboardUsersComponent);
    component = fixture.componentInstance;  // Obtenemos la instancia real del componente
    fixture.detectChanges();  // Forzamos la detección de cambios (ngOnInit se ejecuta aquí)
  });

  // PRUEBA BÁSICA: Verifica que el componente se crea exitosamente
  it('should create', () => {
    expect(component).toBeTruthy();  // Comprueba que el componente existe
  });

  // GRUPO DE PRUEBAS PARA EL MÉTODO ngOnInit (Inicialización del componente)
  describe('ngOnInit', () => {
    it('should set userRole correctly when auth service returns a role', () => {
      // Verifica que el rol del usuario se estableció correctamente desde el servicio
      expect(component.userRole).toBe('admin');
    });

    it('should default userRole to empty string if auth service returns null', () => {
      // COBERTURA: Cubre la rama "|| ''" en ngOnInit - cuando el servicio devuelve null
      authServiceSpy.getUserRole.and.returnValue(null);
      component.ngOnInit();  // Llamamos manualmente para actualizar el valor
      expect(component.userRole).toBe('');  // Verifica que usa el valor por defecto
    });
  });

  // GRUPO DE PRUEBAS PARA EL MÉTODO loadData (Carga de datos)
  describe('loadData', () => {
    it('should load users correctly when response is an array', () => {
      // Verifica que los datos se cargan correctamente cuando la respuesta es un array directo
      expect(component.stats.totalUsers).toBe(3);  // 3 usuarios en mockUsers
      expect(component.stats.activeUsers).toBe(2);  // 2 usuarios activos en mockUsers
      expect(component.loading).toBeFalse();  // Verifica que el loading se desactiva
    });

    it('should load users correctly when response is an object with data property', () => {
      // COBERTURA: Cubre la parte "? response : response.data" - cuando la respuesta es un objeto con propiedad data
      userServiceSpy.getAllUsers.and.returnValue(of({ data: mockUsers } as any));
      component.loadData();  // Llamamos manualmente el método
      expect(component.stats.totalUsers).toBe(3);
      expect(component.loading).toBeFalse();
    });

    it('should default to empty array if response object has no data property', () => {
      // COBERTURA: Cubre la rama "|| []" final en loadData - cuando la respuesta no tiene data
      userServiceSpy.getAllUsers.and.returnValue(of( {} as any)); 
      component.loadData();
      expect(component.stats.totalUsers).toBe(0);  // Verifica que usa array vacío por defecto
    });

    it('should handle error when loading users', () => {
      // Verifica el manejo de errores cuando el servicio falla
      spyOn(console, 'error');  // Espiamos console.error para verificar que se llama
      userServiceSpy.getAllUsers.and.returnValue(throwError(() => new Error('Network error')));
      component.loadData();
      expect(component.loading).toBeFalse();  // El loading debe desactivarse incluso en error
      expect(console.error).toHaveBeenCalled();  // Verifica que se registró el error
    });
  });

  // GRUPO DE PRUEBAS PARA EL MÉTODO processUserData (Procesamiento de datos de usuarios)
  describe('processUserData', () => {
    it('should calculate role distribution correctly', () => {
      // Verifica que calcula correctamente la distribución de roles
      component.processUserData(mockUsers);
      // [1 admin, 1 coordinador, 1 lider] -> [1, 1, 1]
      expect(component.roleDistribution.data).toEqual([1, 1, 1]);
    });

    it('should calculate active percentage correctly', () => {
      // Verifica que calcula correctamente el porcentaje de usuarios activos
      component.processUserData(mockUsers);
      // 2 activos de 3 usuarios = 66.66% -> redondeado a 67
      expect(component.stats.activePercentage).toBe(67);
    });

    it('should handle empty user list (division by zero check)', () => {
      // Verifica que maneja correctamente una lista vacía (evita división por cero)
      component.processUserData([]);
      expect(component.stats.activePercentage).toBe(0);  // 0% cuando no hay usuarios
      expect(component.stats.totalUsers).toBe(0);  // 0 usuarios totales
    });

    it('should sort recent users by date descending', () => {
      // Verifica que ordena los usuarios por fecha de creación (más reciente primero)
      component.processUserData(mockUsers);
      expect(component.recentUsers[0]._id).toBe('3');  // Marzo (más reciente)
      expect(component.recentUsers[2]._id).toBe('1');  // Enero (más antiguo)
    });

    it('should handle sorting when createdAt is missing', () => {
        // COBERTURA: Este test cubre las ramas ": 0" dentro de la función sort.
        // Creamos usuarios con fechas faltantes para probar el manejo de casos edge
        const usersMix = [
            { _id: 'A', createdAt: undefined, role: 'lider', active: true } as unknown as User,
            { _id: 'B', createdAt: new Date('2025-01-01'), role: 'lider', active: true } as User,
            { _id: 'C', createdAt: null, role: 'lider', active: true } as unknown as User
        ];

        component.processUserData(usersMix);
        
        // El usuario con fecha ('B') debe quedar primero. Los sin fecha van al final
        expect(component.recentUsers[0]._id).toBe('B');
        expect(component.stats.totalUsers).toBe(3);  // Verifica que procesó todos los usuarios
    });

    it('should handle non-array input defensively', () => {
      // Verifica que maneja correctamente entradas inválidas (programación defensiva)
      spyOn(console, 'error');
      component.processUserData(null as any);  // Forzamos un valor nulo
      expect(console.error).toHaveBeenCalled();  // Debe registrar el error
      expect(component.stats.totalUsers).toBe(0);  // Debe resetear a 0
    });
  });

  // GRUPO DE PRUEBAS PARA EL MÉTODO calculatePercentage (Cálculo de porcentajes)
  describe('calculatePercentage', () => {
    it('should return correct percentage', () => {
      // Verifica cálculo normal de porcentaje
      component.roleDistribution.total = 100;
      expect(component.calculatePercentage(50)).toBe(50);  // 50 es el 50% de 100
    });

    it('should return 0 if total is 0', () => {
      // Verifica que evita división por cero
      component.roleDistribution.total = 0;
      expect(component.calculatePercentage(50)).toBe(0);  // Cuando total es 0, porcentaje es 0
    });
  });

  // GRUPO DE PRUEBAS PARA EL MÉTODO openUserForm (Apertura de modal de usuario)
  describe('openUserForm', () => {
    it('should open modal and reload data on "saved" result', () => {
      // Verifica que recarga datos cuando el modal se cierra con "saved"
      const mockModalRef = { result: Promise.resolve('saved') };
      modalServiceSpy.open.and.returnValue(mockModalRef as any);
      spyOn(component, 'loadData');  // Espiamos loadData para verificar que se llama

      component.openUserForm();

      // Esperamos a que se resuelva la promesa del modal
      fixture.whenStable().then(() => {
        expect(component.loadData).toHaveBeenCalled();  // Debe recargar datos
      });
    });

    it('should open modal and NOT reload data on dismissed result', () => {
      // Verifica que NO recarga datos cuando el modal se descarta
      const mockModalRef = { result: Promise.resolve('dismissed') };
      modalServiceSpy.open.and.returnValue(mockModalRef as any);
      spyOn(component, 'loadData');

      component.openUserForm();

      fixture.whenStable().then(() => {
        expect(component.loadData).not.toHaveBeenCalled();  // No debe recargar datos
      });
    });

    it('should handle modal rejection', () => {
      // Verifica el manejo cuando el modal es rechazado (error)
      const mockModalRef = { result: Promise.reject('closed') };
      modalServiceSpy.open.and.returnValue(mockModalRef as any);
      spyOn(component, 'loadData');

      component.openUserForm();

      fixture.whenStable().then(() => {
        expect(component.loadData).not.toHaveBeenCalled();  // No debe recargar datos
      });
    });
  });

  // GRUPO DE PRUEBAS PARA HELPERS DE UI (Utilidades de interfaz de usuario)
  describe('UI Helpers', () => {
    it('openRoleManager should log to console', () => {
      // Verifica que openRoleManager registra en consola (método placeholder)
      spyOn(console, 'log');
      component.openRoleManager();
      expect(console.log).toHaveBeenCalled();
    });

    it('viewReports should log to console', () => {
      // Verifica que viewReports registra en consola (método placeholder)
      spyOn(console, 'log');
      component.viewReports();
      expect(console.log).toHaveBeenCalled();
    });

    // SUBGRUPO: Pruebas para formatDate (formateo de fechas)
    describe('formatDate', () => {
      it('should format valid date string', () => {
        // Verifica que formatea correctamente una fecha válida
        const date = '2023-01-01T00:00:00';
        expect(component.formatDate(date)).not.toBe('N/A');  // No debe devolver "N/A"
      });

      it('should return N/A for null/undefined', () => {
        // Verifica que maneja valores nulos/undefined
        expect(component.formatDate(undefined)).toBe('N/A');
      });

      it('should return N/A for invalid date string', () => {
        // Verifica que maneja strings de fecha inválidos
        expect(component.formatDate('invalid-date')).toBe('N/A');
      });

      it('should handle exceptions in date formatting', () => {
        // Verifica que maneja excepciones durante el formateo
        spyOn(console, 'error');
        const badDate = { toString: () => { throw new Error('Error'); } };
        expect(component.formatDate(badDate as any)).toBe('N/A');  // Debe devolver "N/A"
      });
    });

    // SUBGRUPO: Pruebas para cubrir todos los casos de switch statements
    describe('Switch cases coverage', () => {
      // Estas pruebas aseguran que todas las ramas de los métodos con switch/case sean probadas
      
      it('getGradient should handle all cases', () => {
        // Prueba todos los casos posibles de getGradient
        expect(component.getGradient('activeUsers')).toBeTruthy();
        expect(component.getGradient('activePercentage')).toBeTruthy();
        expect(component.getGradient('totalUsers')).toBeTruthy();
        expect(component.getGradient('addUser')).toBeTruthy();
        expect(component.getGradient('manageRoles')).toBeTruthy();
        expect(component.getGradient('viewReports')).toBeTruthy();
        expect(component.getGradient('unknown')).toBeTruthy();  // Caso por defecto
      });

      it('getUserRoleColor should handle all roles', () => {
        // Prueba todos los casos posibles de getUserRoleColor
        expect(component.getUserRoleColor('admin')).toBeTruthy();
        expect(component.getUserRoleColor('coordinador')).toBeTruthy();
        expect(component.getUserRoleColor('lider')).toBeTruthy();
        expect(component.getUserRoleColor('unknown')).toBeTruthy();  // Caso por defecto
      });

      it('getUserRoleIcon should handle all roles', () => {
        // Prueba todos los casos posibles de getUserRoleIcon
        expect(component.getUserRoleIcon('admin')).toBeTruthy();
        expect(component.getUserRoleIcon('coordinador')).toBeTruthy();
        expect(component.getUserRoleIcon('lider')).toBeTruthy();
        expect(component.getUserRoleIcon('unknown')).toBeTruthy();  // Caso por defecto
      });

      it('getUserRoleBadge should handle all roles', () => {
        // Prueba todos los casos posibles de getUserRoleBadge
        expect(component.getUserRoleBadge('admin')).toBeTruthy();
        expect(component.getUserRoleBadge('coordinador')).toBeTruthy();
        expect(component.getUserRoleBadge('lider')).toBeTruthy();
        expect(component.getUserRoleBadge('unknown')).toBeTruthy();  // Caso por defecto
      });

      it('getRoleColor should handle all role names', () => {
        // Prueba todos los casos posibles de getRoleColor
        expect(component.getRoleColor('Administradores')).toBeTruthy();
        expect(component.getRoleColor('Coordinadores')).toBeTruthy();
        expect(component.getRoleColor('Líderes')).toBeTruthy();
        expect(component.getRoleColor('unknown')).toBeTruthy();  // Caso por defecto
      });
    });
  });
});