// Importamos las herramientas necesarias para testing en Angular
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar';
import { AuthService } from '../../../core/services/auth';
import { UserService } from '../../../core/services/user';
import { LayoutService } from '../../../core/services/layout';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';  // 'of' para observables exitosos, 'throwError' para observables con error
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { User } from '../../interfaces/user';
import { DecodedToken } from '../../interfaces/auth';

// La función 'describe' agrupa todas las pruebas relacionadas con el NavbarComponent
describe('NavbarComponent', () => {
  let component: NavbarComponent;  // Instancia del componente que vamos a probar
  let fixture: ComponentFixture<NavbarComponent>;  // Contenedor del componente para testing

  // Spies (Espías) - Objetos que simulan servicios reales
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let layoutServiceSpy: jasmine.SpyObj<LayoutService>;
  let routerSpy: jasmine.SpyObj<Router>;

  // Mock Data - Datos falsos que usaremos en las pruebas
  const mockDecodedToken: DecodedToken = {
    id: '123',
    username: 'TokenUser',
    email: 'test@domain.com',
    role: 'admin',
    iat: 1000,  // Fecha de emisión (issued at)
    exp: 2000   // Fecha de expiración (expiration)
  };

  const mockUser: User = {
    _id: '123',
    document: 123456,
    fullname: 'Juan Perez',
    username: 'juanp',
    email: 'test@domain.com',
    role: 'admin',
    active: true
  };

  // 'beforeEach' se ejecuta ANTES de cada prueba individual
  beforeEach(async () => {
    // CORRECCIÓN PRINCIPAL: Agregamos 'hasRole' al spy porque el HTML lo usa en *ngIf
    const authSpy = jasmine.createSpyObj('AuthService', ['decodeToken', 'logout', 'hasRole']);
    const userSpy = jasmine.createSpyObj('UserService', ['getUserById']);
    
    // Mock completo de LayoutService para evitar errores en el template
    // El template usa estas propiedades observables, por eso las mockeamos
    const layoutSpy = jasmine.createSpyObj('LayoutService', ['toggleSidebar', 'setActiveModule', 'getModulesForRole']);
    (layoutSpy as any).sidebarCollapsed$ = of(false);  // Observable que emite 'false'
    (layoutSpy as any).activeModule$ = of('dashboard');  // Observable que emite 'dashboard'
    (layoutSpy as any).mobileView$ = of(false);  // Observable que emite 'false'

    const rSpy = jasmine.createSpyObj('Router', ['navigate']);  // Spy para el router

    // Configuramos el módulo de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [NavbarComponent],  // Componente a probar
      providers: [
        // Proporcionamos los servicios simulados
        { provide: AuthService, useValue: authSpy },
        { provide: UserService, useValue: userSpy },
        { provide: LayoutService, useValue: layoutSpy },
        { provide: Router, useValue: rSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]  // Ignora elementos HTML desconocidos
    }).compileComponents();

    // Obtenemos las instancias de los servicios simulados del TestBed
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    userServiceSpy = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    layoutServiceSpy = TestBed.inject(LayoutService) as jasmine.SpyObj<LayoutService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Configuración por defecto para los métodos de los servicios
    authServiceSpy.decodeToken.and.returnValue(mockDecodedToken);
    authServiceSpy.hasRole.and.returnValue(true); // Evita que el HTML explote al evaluar *ngIf="authService.hasRole(...)"
    userServiceSpy.getUserById.and.returnValue(of(mockUser));

    // Creamos una instancia del componente dentro del fixture
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;  // Obtenemos la instancia real del componente
    // NOTA: No llamamos fixture.detectChanges() aquí para poder controlar cuándo se ejecuta ngOnInit
  });

  // PRUEBA BÁSICA: Verifica que el componente se crea exitosamente
  it('should create', () => {
    fixture.detectChanges();  // Ejecuta ngOnInit
    expect(component).toBeTruthy();  // Comprueba que el componente existe
  });

  // GRUPO DE PRUEBAS PARA LA INICIALIZACIÓN Y CARGA DE DATOS DEL USUARIO
  describe('ngOnInit & loadUserData', () => {
    it('should load user data successfully when token has ID', () => {
      // Configuramos los espías para devolver datos válidos
      authServiceSpy.decodeToken.and.returnValue(mockDecodedToken);
      userServiceSpy.getUserById.and.returnValue(of(mockUser));

      fixture.detectChanges(); // Dispara ngOnInit

      // Verificamos que se llamó a los servicios correctos con los parámetros correctos
      expect(authServiceSpy.decodeToken).toHaveBeenCalled();
      expect(userServiceSpy.getUserById).toHaveBeenCalledWith('123');  // ID del mockDecodedToken
      expect(component.currentUser).toEqual(mockUser);  // Verifica que el usuario se cargó correctamente
    });

    it('should handle error when loading user data fails', () => {
      // Verifica el manejo de errores cuando el servicio de usuario falla
      spyOn(console, 'error');  // Espiamos console.error para verificar que se llama
      authServiceSpy.decodeToken.and.returnValue(mockDecodedToken);
      userServiceSpy.getUserById.and.returnValue(throwError(() => new Error('API Error')));

      fixture.detectChanges();  // Ejecuta ngOnInit

      expect(component.currentUser).toBeNull();  // El usuario debe ser null cuando hay error
      expect(console.error).toHaveBeenCalled();  // Debe registrar el error
    });

    it('should warn and not call userService if token has no ID', () => {
      // Verifica el comportamiento cuando el token no tiene ID
      spyOn(console, 'warn');
      // Token sin ID - forzamos el tipo con 'as any' para simular este caso
      const noIdToken = { ...mockDecodedToken, id: null } as any;
      authServiceSpy.decodeToken.and.returnValue(noIdToken);

      fixture.detectChanges();

      expect(console.warn).toHaveBeenCalledWith('[Navbar] No se encontró ID en token');
      expect(userServiceSpy.getUserById).not.toHaveBeenCalled();  // No debe llamar al servicio sin ID
    });

    it('should handle null decoded token', () => {
      // Verifica el comportamiento cuando el token decodificado es null
      authServiceSpy.decodeToken.and.returnValue(null);
      
      fixture.detectChanges();

      expect(component.decodedToken).toBeNull();  // El token debe ser null
      expect(userServiceSpy.getUserById).not.toHaveBeenCalled();  // No debe llamar al servicio
    });
  });

  // GRUPO DE PRUEBAS PARA EL GETTER displayName (LÓGICA DE PRIORIDAD)
  describe('displayName Getter (Priority Logic)', () => {
    beforeEach(() => {
      fixture.detectChanges();  // Ejecuta ngOnInit antes de cada prueba
    });

    it('should return currentUser.fullname if available', () => {
      // PRIORIDAD 1: Nombre completo del usuario actual
      component.currentUser = { ...mockUser, fullname: 'Full Name', username: 'user.name' };
      expect(component.displayName).toBe('Full Name');
    });

    it('should return currentUser.username if fullname is missing', () => {
      // PRIORIDAD 2: Username si no hay nombre completo
      component.currentUser = { ...mockUser, fullname: '', username: 'user.name' };
      expect(component.displayName).toBe('user.name');
    });

    it('should return decodedToken.username if currentUser is null', () => {
      // PRIORIDAD 3: Username del token si no hay usuario actual
      component.currentUser = null;
      component.decodedToken = { ...mockDecodedToken, username: 'TokenUser' };
      expect(component.displayName).toBe('TokenUser');
    });

    it('should return email part if decodedToken.username is missing', () => {
      // PRIORIDAD 4: Parte del email (antes del @) si no hay username en el token
      component.currentUser = null;
      component.decodedToken = { ...mockDecodedToken, username: undefined, email: 'mail@test.com' } as any;
      expect(component.displayName).toBe('mail');  // Toma la parte antes del @
    });

    it('should return "Usuario" if everything is missing', () => {
      // PRIORIDAD 5: Valor por defecto cuando no hay ningún dato disponible
      component.currentUser = null;
      component.decodedToken = null;
      expect(component.displayName).toBe('Usuario');  // Valor por defecto
    });
  });

  // GRUPO DE PRUEBAS PARA EL GETTER userRole
  describe('userRole Getter', () => {
    beforeEach(() => fixture.detectChanges());  // Ejecuta ngOnInit

    it('should return role from decoded token', () => {
      // Verifica que devuelve el rol del token decodificado
      component.decodedToken = { ...mockDecodedToken, role: 'coordinador' };
      expect(component.userRole).toBe('coordinador');
    });

    it('should return "Invitado" if decodedToken is null', () => {
      // Verifica que devuelve "Invitado" cuando no hay token
      component.decodedToken = null;
      expect(component.userRole).toBe('Invitado');  // Valor por defecto
    });
  });

  // GRUPO DE PRUEBAS PARA INTERACCIONES DEL USUARIO
  describe('Interactions', () => {
    beforeEach(() => fixture.detectChanges());  // Ejecuta ngOnInit

    it('toggleMenu should toggle isMenuOpen property', () => {
      // Verifica que toggleMenu alterna el estado del menú
      component.isMenuOpen = false;
      component.toggleMenu();
      expect(component.isMenuOpen).toBeTrue();  // Debe cambiar de false a true
      
      component.toggleMenu();
      expect(component.isMenuOpen).toBeFalse();  // Debe cambiar de true a false
    });

    it('logout should call auth service and navigate', () => {
      // Verifica que logout llama al servicio de autenticación y navega
      component.logout();
      expect(authServiceSpy.logout).toHaveBeenCalled();  // Debe llamar a logout del servicio
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);  // Debe navegar al login
    });
  });
});