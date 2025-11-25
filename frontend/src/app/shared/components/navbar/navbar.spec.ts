// Importamos las herramientas necesarias para testing en Angular
import { ComponentFixture, TestBed } from '@angular/core/testing';
// Importamos el componente que vamos a probar - la barra de navegación
import { NavbarComponent } from './navbar';
// Importamos los servicios que el componente necesita para funcionar
import { AuthService } from '../../../core/services/auth';      // Servicio de autenticación
import { UserService } from '../../../core/services/user';      // Servicio de usuarios
import { LayoutService } from '../../../core/services/layout';  // Servicio de diseño/layout
import { Router } from '@angular/router';                      // Router para navegación
// Importamos utilidades de RxJS para crear observables de prueba
import { of, throwError } from 'rxjs';  // 'of' para observables exitosos, 'throwError' para observables con error
// Esquema para ignorar elementos desconocidos en el template
import { NO_ERRORS_SCHEMA } from '@angular/core';
// Interfaces que definen la estructura de datos que usaremos
import { User } from '../../interfaces/user';
import { DecodedToken } from '../../interfaces/auth';

// La función 'describe' agrupa todas las pruebas relacionadas con el NavbarComponent
// Esto crea un bloque organizado de pruebas que aparece agrupado en los reportes
describe('NavbarComponent', () => {
  // Variables que usaremos en todas las pruebas:
  let component: NavbarComponent;  // Instancia del componente que vamos a probar
  let fixture: ComponentFixture<NavbarComponent>;  // Contenedor del componente para testing

  // Spies (Espías) - Objetos que simulan servicios reales
  // Los spies nos permiten "espiar" qué métodos se llaman y con qué parámetros
  let authServiceSpy: jasmine.SpyObj<AuthService>;    // Spy para el servicio de autenticación
  let userServiceSpy: jasmine.SpyObj<UserService>;    // Spy para el servicio de usuarios
  let layoutServiceSpy: jasmine.SpyObj<LayoutService>; // Spy para el servicio de layout
  let routerSpy: jasmine.SpyObj<Router>;              // Spy para el router de Angular

  // Mock Data - Datos falsos que usaremos en las pruebas
  // Estos datos simulan lo que recibiría el componente en una aplicación real
  const mockDecodedToken: DecodedToken = {
    id: '123',                    // ID único del usuario
    username: 'TokenUser',        // Nombre de usuario del token
    email: 'test@domain.com',     // Email del usuario
    role: 'admin',                // Rol del usuario (admin, coordinador, etc.)
    iat: 1000,                   // Fecha de emisión (issued at) - timestamp
    exp: 2000                    // Fecha de expiración (expiration) - timestamp
  };

  const mockUser: User = {
    _id: '123',                   // ID del usuario en la base de datos
    document: 123456,             // Número de documento
    fullname: 'Juan Perez',       // Nombre completo del usuario
    username: 'juanp',            // Nombre de usuario para login
    email: 'test@domain.com',     // Email del usuario
    role: 'admin',                // Rol del usuario
    active: true                  // Indica si el usuario está activo
  };

  // 'beforeEach' se ejecuta ANTES de cada prueba individual
  // Esto garantiza que cada prueba comience con un entorno limpio y configurado
  beforeEach(async () => {
    // CORRECCIÓN PRINCIPAL: Agregamos 'hasRole' al spy porque el HTML lo usa en *ngIf
    // Creamos spies para cada servicio con los métodos que el componente utiliza
    const authSpy = jasmine.createSpyObj('AuthService', ['decodeToken', 'logout', 'hasRole']);
    const userSpy = jasmine.createSpyObj('UserService', ['getUserById']);
    
    // Mock completo de LayoutService para evitar errores en el template
    // El template usa estas propiedades observables, por eso las mockeamos
    // Los componentes en el template están suscritos a estos observables
    const layoutSpy = jasmine.createSpyObj('LayoutService', ['toggleSidebar', 'setActiveModule', 'getModulesForRole']);
    (layoutSpy as any).sidebarCollapsed$ = of(false);  // Observable que emite 'false' - sidebar expandido
    (layoutSpy as any).activeModule$ = of('dashboard');  // Observable que emite 'dashboard' - módulo activo
    (layoutSpy as any).mobileView$ = of(false);  // Observable que emite 'false' - no en vista móvil

    const rSpy = jasmine.createSpyObj('Router', ['navigate']);  // Spy para el router - solo nos interesa el método navigate

    // Configuramos el módulo de testing de Angular
    // TestBed es el entorno principal de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [NavbarComponent],  // Componente a probar - declarado porque no es standalone
      providers: [
        // Proporcionamos los servicios simulados en lugar de los reales
        // Esto aísla el componente para que las pruebas no dependan de implementaciones reales
        { provide: AuthService, useValue: authSpy },
        { provide: UserService, useValue: userSpy },
        { provide: LayoutService, useValue: layoutSpy },
        { provide: Router, useValue: rSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]  // Ignora elementos HTML desconocidos en el template
      // Esto evita errores cuando el template tiene directivas de router, componentes de librerías, etc.
    }).compileComponents();  // Compila el componente y su template HTML

    // Obtenemos las instancias de los servicios simulados del TestBed
    // TestBed.inject() nos da acceso a las instancias que configuramos en los providers
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    userServiceSpy = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    layoutServiceSpy = TestBed.inject(LayoutService) as jasmine.SpyObj<LayoutService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Configuración por defecto para los métodos de los servicios
    // Establecemos qué deben devolver los métodos cuando el componente los llame
    authServiceSpy.decodeToken.and.returnValue(mockDecodedToken);  // Siempre devuelve nuestro token mock
    authServiceSpy.hasRole.and.returnValue(true); // Evita que el HTML explote al evaluar *ngIf="authService.hasRole(...)"
    userServiceSpy.getUserById.and.returnValue(of(mockUser));  // Devuelve un observable exitoso con el usuario mock

    // Creamos una instancia del componente dentro del fixture
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;  // Obtenemos la instancia real del componente
    
    // NOTA: No llamamos fixture.detectChanges() aquí para poder controlar cuándo se ejecuta ngOnInit
    // Esto nos permite probar el comportamiento del componente antes y después de la inicialización
  });

  // PRUEBA BÁSICA: Verifica que el componente se crea exitosamente
  // Esta es la prueba más fundamental - si falla, hay problemas graves de configuración
  it('should create', () => {
    fixture.detectChanges();  // Ejecuta ngOnInit y el ciclo de detección de cambios
    expect(component).toBeTruthy();  // Comprueba que el componente existe y no es null/undefined
  });

  // GRUPO DE PRUEBAS PARA LA INICIALIZACIÓN Y CARGA DE DATOS DEL USUARIO
  // Estas pruebas verifican qué pasa cuando el componente se inicializa (ngOnInit)
  describe('ngOnInit & loadUserData', () => {
    
    // Prueba: Carga exitosa de datos del usuario cuando el token tiene ID
    it('should load user data successfully when token has ID', () => {
      // Configuramos los espías para devolver datos válidos
      authServiceSpy.decodeToken.and.returnValue(mockDecodedToken);
      userServiceSpy.getUserById.and.returnValue(of(mockUser));

      fixture.detectChanges(); // Dispara ngOnInit - inicia el componente

      // Verificamos que se llamó a los servicios correctos con los parámetros correctos
      expect(authServiceSpy.decodeToken).toHaveBeenCalled();  // Debe decodificar el token
      expect(userServiceSpy.getUserById).toHaveBeenCalledWith('123');  // Debe buscar usuario con ID del token
      expect(component.currentUser).toEqual(mockUser);  // Verifica que el usuario se cargó correctamente en el componente
    });

    // Prueba: Manejo de errores cuando falla la carga de datos del usuario
    it('should handle error when loading user data fails', () => {
      // Verifica el manejo de errores cuando el servicio de usuario falla
      spyOn(console, 'error');  // Espiamos console.error para verificar que se llama al ocurrir error
      authServiceSpy.decodeToken.and.returnValue(mockDecodedToken);
      // Simulamos un error en el servicio de usuario usando throwError
      userServiceSpy.getUserById.and.returnValue(throwError(() => new Error('API Error')));

      fixture.detectChanges();  // Ejecuta ngOnInit - debería manejar el error

      expect(component.currentUser).toBeNull();  // El usuario debe ser null cuando hay error
      expect(console.error).toHaveBeenCalled();  // Debe registrar el error en consola
    });

    // Prueba: Comportamiento cuando el token no tiene ID
    it('should warn and not call userService if token has no ID', () => {
      // Verifica el comportamiento cuando el token no tiene ID (caso edge)
      spyOn(console, 'warn');  // Espiamos console.warn
      // Token sin ID - forzamos el tipo con 'as any' para simular este caso anómalo
      const noIdToken = { ...mockDecodedToken, id: null } as any;
      authServiceSpy.decodeToken.and.returnValue(noIdToken);

      fixture.detectChanges();  // Inicializa el componente

      expect(console.warn).toHaveBeenCalledWith('[Navbar] No se encontró ID en token');
      expect(userServiceSpy.getUserById).not.toHaveBeenCalled();  // No debe llamar al servicio sin ID
    });

    // Prueba: Comportamiento cuando el token decodificado es null
    it('should handle null decoded token', () => {
      // Verifica el comportamiento cuando el token decodificado es null (usuario no autenticado)
      authServiceSpy.decodeToken.and.returnValue(null);  // Token inválido o vacío
      
      fixture.detectChanges();  // Inicializa el componente

      expect(component.decodedToken).toBeNull();  // El token debe ser null en el componente
      expect(userServiceSpy.getUserById).not.toHaveBeenCalled();  // No debe llamar al servicio sin token
    });
  });

  // GRUPO DE PRUEBAS PARA EL GETTER displayName (LÓGICA DE PRIORIDAD)
  // Estas pruebas verifican la lógica compleja que decide qué nombre mostrar al usuario
  describe('displayName Getter (Priority Logic)', () => {
    beforeEach(() => {
      fixture.detectChanges();  // Ejecuta ngOnInit antes de cada prueba en este grupo
    });

    // Prueba: PRIORIDAD 1 - Nombre completo del usuario actual
    it('should return currentUser.fullname if available', () => {
      // El nombre completo tiene la máxima prioridad
      component.currentUser = { ...mockUser, fullname: 'Full Name', username: 'user.name' };
      expect(component.displayName).toBe('Full Name');  // Debe usar el nombre completo
    });

    // Prueba: PRIORIDAD 2 - Username si no hay nombre completo
    it('should return currentUser.username if fullname is missing', () => {
      // Si no hay nombre completo, usa el username
      component.currentUser = { ...mockUser, fullname: '', username: 'user.name' };
      expect(component.displayName).toBe('user.name');  // Debe usar el username
    });

    // Prueba: PRIORIDAD 3 - Username del token si no hay usuario actual
    it('should return decodedToken.username if currentUser is null', () => {
      // Si no hay usuario cargado, usa el username del token
      component.currentUser = null;  // Usuario no cargado
      component.decodedToken = { ...mockDecodedToken, username: 'TokenUser' };
      expect(component.displayName).toBe('TokenUser');  // Debe usar el username del token
    });

    // Prueba: PRIORIDAD 4 - Parte del email si no hay username en el token
    it('should return email part if decodedToken.username is missing', () => {
      // Si no hay username en el token, usa la parte del email antes del @
      component.currentUser = null;
      component.decodedToken = { ...mockDecodedToken, username: undefined, email: 'mail@test.com' } as any;
      expect(component.displayName).toBe('mail');  // Toma la parte antes del @
    });

    // Prueba: PRIORIDAD 5 - Valor por defecto cuando no hay ningún dato disponible
    it('should return "Usuario" if everything is missing', () => {
      // Caso extremo: no hay ningún dato disponible
      component.currentUser = null;
      component.decodedToken = null;
      expect(component.displayName).toBe('Usuario');  // Valor por defecto
    });
  });

  // GRUPO DE PRUEBAS PARA EL GETTER userRole
  // Estas pruebas verifican cómo se determina y muestra el rol del usuario
  describe('userRole Getter', () => {
    beforeEach(() => fixture.detectChanges());  // Ejecuta ngOnInit antes de cada prueba

    // Prueba: Devuelve el rol del token decodificado
    it('should return role from decoded token', () => {
      // Verifica que devuelve el rol del token decodificado
      component.decodedToken = { ...mockDecodedToken, role: 'coordinador' };
      expect(component.userRole).toBe('coordinador');  // Debe mostrar el rol correcto
    });

    // Prueba: Valor por defecto cuando no hay token
    it('should return "Invitado" if decodedToken is null', () => {
      // Verifica que devuelve "Invitado" cuando no hay token (usuario no autenticado)
      component.decodedToken = null;
      expect(component.userRole).toBe('Invitado');  // Valor por defecto para usuarios no autenticados
    });
  });

  // GRUPO DE PRUEBAS PARA INTERACCIONES DEL USUARIO
  // Estas pruebas verifican las acciones que el usuario puede realizar en el navbar
  describe('Interactions', () => {
    beforeEach(() => fixture.detectChanges());  // Ejecuta ngOnInit antes de cada prueba

    // Prueba: Alternar (toggle) el menú desplegable
    it('toggleMenu should toggle isMenuOpen property', () => {
      // Verifica que toggleMenu alterna el estado del menú entre abierto y cerrado
      component.isMenuOpen = false;  // Menú inicialmente cerrado
      component.toggleMenu();
      expect(component.isMenuOpen).toBeTrue();  // Debe cambiar de false a true - menú abierto
      
      component.toggleMenu();
      expect(component.isMenuOpen).toBeFalse();  // Debe cambiar de true a false - menú cerrado
    });

    // Prueba: Cerrar sesión del usuario
    it('logout should call auth service and navigate', () => {
      // Verifica que logout llama al servicio de autenticación y navega al login
      component.logout();
      expect(authServiceSpy.logout).toHaveBeenCalled();  // Debe llamar a logout del servicio de auth
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);  // Debe navegar a la página de login
    });
  });
});