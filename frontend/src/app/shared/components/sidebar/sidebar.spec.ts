// Importamos las herramientas necesarias para testing en Angular
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar';
import { LayoutService } from '../../../core/services/layout';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';  // BehaviorSubject para streams de datos, 'of' para observables simples
import { NO_ERRORS_SCHEMA } from '@angular/core';

// La función 'describe' agrupa todas las pruebas relacionadas con el SidebarComponent
describe('SidebarComponent', () => {
  let component: SidebarComponent;  // Instancia del componente que vamos a probar
  let fixture: ComponentFixture<SidebarComponent>;  // Contenedor del componente para testing

  // 1. Declaramos los Spies (Mocks) con tipado fuerte - objetos que simulan servicios reales
  let layoutServiceSpy: jasmine.SpyObj<LayoutService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  // 2. Subject para controlar el estado del sidebar desde el test
  // BehaviorSubject es un tipo de Observable que mantiene el último valor emitido
  let sidebarCollapsedSubject: BehaviorSubject<boolean>;

  // 'beforeEach' se ejecuta ANTES de cada prueba individual
  beforeEach(async () => {
    // Inicializamos el Subject con valor inicial 'false' (sidebar expandido)
    sidebarCollapsedSubject = new BehaviorSubject<boolean>(false);

    // 3. Creamos los mocks (objetos simulados) de los servicios
    // Mock de LayoutService: necesita sidebarCollapsed$ (propiedad) y métodos
    const layoutSpy = jasmine.createSpyObj('LayoutService', ['getModulesForRole', 'setActiveModule'], {
      // Definimos propiedades observables que el componente usa
      sidebarCollapsed$: sidebarCollapsedSubject.asObservable()  // Convertimos Subject a Observable
    });

    // Mock de AuthService - solo necesita el método decodeToken
    const authSpy = jasmine.createSpyObj('AuthService', ['decodeToken']);

    // Mock de Router - para simular navegación
    const rSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Configuramos el módulo de testing de Angular
    await TestBed.configureTestingModule({
      // Como standalone es false, va en declarations (no en imports)
      declarations: [ SidebarComponent ], 
      providers: [
        // Inyectamos los mocks en lugar de los servicios reales
        { provide: LayoutService, useValue: layoutSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: rSpy }
      ],
      // NO_ERRORS_SCHEMA ignora elementos HTML desconocidos (como router-link o iconos)
      // Esto evita errores cuando el template contiene elementos que Angular no reconoce
      // Permite que el test se centre solo en la lógica del TypeScript, no en el HTML
      schemas: [NO_ERRORS_SCHEMA] 
    })
    .compileComponents();  // Compila el componente y su template

    // Recuperamos las instancias inyectadas para poder usarlas en los tests
    // TestBed.inject() obtiene los servicios que configuramos en los providers
    layoutServiceSpy = TestBed.inject(LayoutService) as jasmine.SpyObj<LayoutService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Creamos una instancia del componente dentro del fixture
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;  // Obtenemos la instancia real del componente
    
    // NOTA: No llamamos a fixture.detectChanges() aquí globalmente
    // Porque queremos configurar el comportamiento del mock (token válido o inválido)
    // antes de que corra ngOnInit. Esto nos da más control sobre las pruebas.
  });

  // PRUEBA BÁSICA: Verifica que el componente se crea exitosamente
  it('should create', () => {
    // Configuración básica para que pase la creación
    // Simulamos un token válido con rol de admin
    authServiceSpy.decodeToken.and.returnValue({ role: 'admin', id: '1', email: 'test', exp: 0 } as any);
    layoutServiceSpy.getModulesForRole.and.returnValue([]);  // Módulos vacíos
    
    fixture.detectChanges(); // Dispara ngOnInit - ejecuta la inicialización del componente
    expect(component).toBeTruthy();  // Verifica que el componente se creó correctamente
  });

  // GRUPO DE PRUEBAS PARA LA LÓGICA DE INICIALIZACIÓN (ngOnInit)
  describe('ngOnInit logic', () => {
    it('should load modules and initialize expandedMenus when user has a role', () => {
      // Esta prueba verifica el flujo normal cuando el usuario tiene un rol válido
      
      // A. PREPARACIÓN (Arrange) - Configuramos los datos de prueba
      const mockRole = 'admin';
      const mockModules = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Personal', path: '/personal', children: [] } // Módulo con hijos (para menús expandibles)
      ];

      // Configuramos los espías para devolver los datos mock
      authServiceSpy.decodeToken.and.returnValue({ role: mockRole } as any);
      layoutServiceSpy.getModulesForRole.and.returnValue(mockModules);

      // B. EJECUCIÓN (Act) - Ejecutamos el código que queremos probar
      fixture.detectChanges(); // Esto ejecuta ngOnInit

      // C. VERIFICACIÓN (Assert) - Verificamos que todo funcionó como esperábamos
      expect(authServiceSpy.decodeToken).toHaveBeenCalled();  // Se llamó a decodeToken
      expect(layoutServiceSpy.getModulesForRole).toHaveBeenCalledWith(mockRole);  // Se llamó con el rol correcto
      expect(component.modules).toEqual(mockModules);  // Los módulos se cargaron correctamente
      
      // Verifica que se inicializó el estado de los menús expandibles
      // Los menús con hijos deben empezar colapsados (false)
      expect(component.expandedMenus['Personal']).toBeFalse();
    });

    it('should redirect to login if no role is found in token', () => {
      // Esta prueba verifica el comportamiento cuando el token no tiene rol (usuario no autenticado)
      
      // A. Arrange: Simulamos que decodeToken devuelve null (token inválido o sin rol)
      authServiceSpy.decodeToken.and.returnValue(null);

      // B. Act: Ejecutamos la inicialización
      fixture.detectChanges(); // ngOnInit detecta falta de rol

      // C. Assert: Verificamos el comportamiento esperado
      expect(component.modules).toEqual([]); // No debe cargar módulos sin rol
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);  // Debe redirigir al login
    });
  });

  // GRUPO DE PRUEBAS PARA INTERACCIONES CON EL SIDEBAR
  describe('Sidebar interaction', () => {
    // Configuración previa común para estos tests
    // beforeEach dentro de describe se ejecuta antes de cada prueba en este grupo
    beforeEach(() => {
      // Configuración común: usuario admin con módulos básicos
      authServiceSpy.decodeToken.and.returnValue({ role: 'admin' } as any);
      layoutServiceSpy.getModulesForRole.and.returnValue([
        { name: 'Padre', children: [] }  // Módulo simple para pruebas
      ]);
      fixture.detectChanges(); // Inicializa el componente correctamente (ejecuta ngOnInit)
    });

    it('should update "collapsed" property when layoutService emits changes', () => {
      // Verifica que el componente reacciona a cambios en el estado del sidebar
      
      // Estado inicial (false - sidebar expandido)
      expect(component.collapsed).toBeFalse();

      // Emitimos true desde el servicio (simulamos que el sidebar se colapsa)
      sidebarCollapsedSubject.next(true);
      
      // El componente debe actualizar su propiedad 'collapsed'
      expect(component.collapsed).toBeTrue();
    });

    it('toggleSubMenu should flip the expanded state of a module', () => {
      // Verifica que toggleSubMenu alterna el estado de expansión de un menú
      const moduleMock = { name: 'Padre' };
      
      // Estado inicial es false (definido en ngOnInit) - menú colapsado
      expect(component.expandedMenus['Padre']).toBeFalse();

      // Primera llamada: debe cambiar a true - expande el menú
      component.toggleSubMenu(moduleMock);
      expect(component.expandedMenus['Padre']).toBeTrue();

      // Segunda llamada: debe volver a false - colapsa el menú
      component.toggleSubMenu(moduleMock);
      expect(component.expandedMenus['Padre']).toBeFalse();
    });

    it('isExpanded should return the correct state', () => {
      // Verifica que isExpanded devuelve el estado correcto de un menú
      const moduleMock = { name: 'Padre' };
      component.expandedMenus['Padre'] = true; // Forzamos estado expandido

      const result = component.isExpanded(moduleMock);
      expect(result).toBeTrue();  // Debe devolver true
    });

    it('setActiveModule should call layoutService', () => {
      // Verifica que setActiveModule notifica al servicio de layout
      const moduleName = 'Dashboard';
      component.setActiveModule(moduleName);

      // Debe llamar al servicio con el nombre del módulo activo
      expect(layoutServiceSpy.setActiveModule).toHaveBeenCalledWith(moduleName);
    });
  });
});