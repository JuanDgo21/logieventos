// Importamos las herramientas necesarias para testing en Angular
import { ComponentFixture, TestBed } from '@angular/core/testing';
// Importamos el componente que vamos a probar - el sidebar o panel lateral
import { SidebarComponent } from './sidebar';
// Importamos los servicios que el componente necesita para funcionar
import { LayoutService } from '../../../core/services/layout';  // Servicio para manejar el diseño/layout
import { AuthService } from '../../../core/services/auth';      // Servicio de autenticación
import { Router } from '@angular/router';                      // Router para navegación
// Importamos utilidades de RxJS para crear observables de prueba
import { BehaviorSubject, of } from 'rxjs';  // BehaviorSubject para streams de datos, 'of' para observables simples
// Esquema para ignorar elementos desconocidos en el template
import { NO_ERRORS_SCHEMA } from '@angular/core';

// La función 'describe' agrupa todas las pruebas relacionadas con el SidebarComponent
// Esto crea un bloque organizado de pruebas que aparece agrupado en los reportes
describe('SidebarComponent', () => {
  // Variables que usaremos en todas las pruebas:
  let component: SidebarComponent;  // Instancia del componente que vamos a probar
  let fixture: ComponentFixture<SidebarComponent>;  // Contenedor del componente para testing

  // 1. Declaramos los Spies (Mocks) con tipado fuerte - objetos que simulan servicios reales
  // Los spies nos permiten "espiar" qué métodos se llaman y con qué parámetros
  let layoutServiceSpy: jasmine.SpyObj<LayoutService>;  // Spy para el servicio de layout
  let authServiceSpy: jasmine.SpyObj<AuthService>;      // Spy para el servicio de autenticación
  let routerSpy: jasmine.SpyObj<Router>;                // Spy para el router de Angular

  // 2. Subject para controlar el estado del sidebar desde el test
  // BehaviorSubject es un tipo de Observable que mantiene el último valor emitido
  // Es como una "variable reactiva" que notifica a todos los suscriptos cuando cambia
  let sidebarCollapsedSubject: BehaviorSubject<boolean>;

  // 'beforeEach' se ejecuta ANTES de cada prueba individual
  // Esto garantiza que cada prueba comience con un entorno limpio y configurado
  beforeEach(async () => {
    // Inicializamos el Subject con valor inicial 'false' (sidebar expandido)
    // false = sidebar visible/expandido, true = sidebar colapsado/oculto
    sidebarCollapsedSubject = new BehaviorSubject<boolean>(false);

    // 3. Creamos los mocks (objetos simulados) de los servicios
    // Mock de LayoutService: necesita sidebarCollapsed$ (propiedad) y métodos
    const layoutSpy = jasmine.createSpyObj('LayoutService', 
      ['getModulesForRole', 'setActiveModule'],  // Métodos que el componente usa
      {
        // Definimos propiedades observables que el componente usa
        // Convertimos el BehaviorSubject a Observable para que el componente pueda suscribirse
        sidebarCollapsed$: sidebarCollapsedSubject.asObservable()  // Observable del estado del sidebar
      }
    );

    // Mock de AuthService - solo necesita el método decodeToken para obtener el rol del usuario
    const authSpy = jasmine.createSpyObj('AuthService', ['decodeToken']);

    // Mock de Router - para simular navegación entre páginas
    const rSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Configuramos el módulo de testing de Angular
    // TestBed es el entorno principal de testing de Angular
    await TestBed.configureTestingModule({
      // Como standalone es false, va en declarations (no en imports)
      // Los componentes pueden ser standalone (independientes) o declarados en módulos
      declarations: [ SidebarComponent ], 
      providers: [
        // Inyectamos los mocks en lugar de los servicios reales
        // Esto aísla el componente para que las pruebas no dependan de implementaciones reales
        { provide: LayoutService, useValue: layoutSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: rSpy }
      ],
      // NO_ERRORS_SCHEMA ignora elementos HTML desconocidos (como router-link o iconos)
      // Esto evita errores cuando el template contiene elementos que Angular no reconoce
      // en el entorno de testing, como por ejemplo:
      // - Directivas de routerLink
      // - Componentes de librerías externas
      // - Elementos personalizados
      // Permite que el test se centre solo en la lógica del TypeScript, no en el HTML
      schemas: [NO_ERRORS_SCHEMA] 
    })
    .compileComponents();  // Compila el componente y su template HTML

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
    // Podemos decidir en cada prueba cuándo ejecutar la inicialización del componente
  });

  // PRUEBA BÁSICA: Verifica que el componente se crea exitosamente
  // Esta es la prueba más fundamental - si falla, hay problemas graves de configuración
  it('should create', () => {
    // Configuración básica para que pase la creación
    // Simulamos un token válido con rol de admin
    authServiceSpy.decodeToken.and.returnValue({ 
      role: 'admin',     // Rol del usuario
      id: '1',           // ID único del usuario
      email: 'test',     // Email del usuario
      exp: 0             // Fecha de expiración del token
    } as any);
    layoutServiceSpy.getModulesForRole.and.returnValue([]);  // Módulos vacíos - no hay menús para cargar
    
    fixture.detectChanges(); // Dispara ngOnInit - ejecuta la inicialización del componente
    expect(component).toBeTruthy();  // Verifica que el componente se creó correctamente y no es null/undefined
  });

  // GRUPO DE PRUEBAS PARA LA LÓGICA DE INICIALIZACIÓN (ngOnInit)
  // Estas pruebas verifican qué pasa cuando el componente se inicializa por primera vez
  describe('ngOnInit logic', () => {
    
    // Prueba: Carga exitosa de módulos cuando el usuario tiene un rol válido
    it('should load modules and initialize expandedMenus when user has a role', () => {
      // Esta prueba verifica el flujo normal cuando el usuario está autenticado y tiene un rol
      
      // A. PREPARACIÓN (Arrange) - Configuramos los datos de prueba
      const mockRole = 'admin';  // Rol simulado del usuario
      const mockModules = [
        { name: 'Dashboard', path: '/dashboard' },  // Módulo simple sin hijos
        { name: 'Personal', path: '/personal', children: [] } // Módulo con hijos (para menús expandibles)
      ];

      // Configuramos los espías para devolver los datos mock
      authServiceSpy.decodeToken.and.returnValue({ role: mockRole } as any);
      layoutServiceSpy.getModulesForRole.and.returnValue(mockModules);

      // B. EJECUCIÓN (Act) - Ejecutamos el código que queremos probar
      fixture.detectChanges(); // Esto ejecuta ngOnInit - la inicialización del componente

      // C. VERIFICACIÓN (Assert) - Verificamos que todo funcionó como esperábamos
      expect(authServiceSpy.decodeToken).toHaveBeenCalled();  // Se llamó a decodeToken para obtener el rol
      expect(layoutServiceSpy.getModulesForRole).toHaveBeenCalledWith(mockRole);  // Se llamó con el rol correcto
      expect(component.modules).toEqual(mockModules);  // Los módulos se cargaron correctamente en el componente
      
      // Verifica que se inicializó el estado de los menús expandibles
      // Los menús con hijos deben empezar colapsados (false) por defecto
      expect(component.expandedMenus['Personal']).toBeFalse();
    });

    // Prueba: Redirección al login cuando no hay rol en el token
    it('should redirect to login if no role is found in token', () => {
      // Esta prueba verifica el comportamiento de seguridad cuando el token no tiene rol
      // Esto puede pasar si el token es inválido, está expirado, o el usuario no está autenticado
      
      // A. Arrange: Simulamos que decodeToken devuelve null (token inválido o sin rol)
      authServiceSpy.decodeToken.and.returnValue(null);

      // B. Act: Ejecutamos la inicialización del componente
      fixture.detectChanges(); // ngOnInit detecta falta de rol y debe redirigir

      // C. Assert: Verificamos el comportamiento esperado de seguridad
      expect(component.modules).toEqual([]); // No debe cargar módulos sin rol - por seguridad
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);  // Debe redirigir al login para autenticarse
    });
  });

  // GRUPO DE PRUEBAS PARA INTERACCIONES CON EL SIDEBAR
  // Estas pruebas verifican cómo responde el componente a las interacciones del usuario
  describe('Sidebar interaction', () => {
    // Configuración previa común para estos tests
    // beforeEach dentro de describe se ejecuta antes de cada prueba en este grupo
    beforeEach(() => {
      // Configuración común: usuario admin con módulos básicos
      // Esto simula un usuario autenticado con permisos de administrador
      authServiceSpy.decodeToken.and.returnValue({ role: 'admin' } as any);
      layoutServiceSpy.getModulesForRole.and.returnValue([
        { name: 'Padre', children: [] }  // Módulo simple para pruebas de interacción
      ]);
      fixture.detectChanges(); // Inicializa el componente correctamente (ejecuta ngOnInit)
    });

    // Prueba: Reactividad a cambios en el estado del sidebar
    it('should update "collapsed" property when layoutService emits changes', () => {
      // Verifica que el componente reacciona a cambios en el estado del sidebar
      // Esto es importante para la sincronización entre componentes
      
      // Estado inicial (false - sidebar expandido/visible)
      expect(component.collapsed).toBeFalse();

      // Emitimos true desde el servicio (simulamos que el usuario colapsa el sidebar)
      sidebarCollapsedSubject.next(true);
      
      // El componente debe actualizar su propiedad 'collapsed' automáticamente
      // Esto demuestra que el componente está suscrito correctamente al observable
      expect(component.collapsed).toBeTrue();  // Ahora debería estar colapsado
    });

    // Prueba: Alternar (toggle) menús desplegables
    it('toggleSubMenu should flip the expanded state of a module', () => {
      // Verifica que toggleSubMenu alterna el estado de expansión de un menú desplegable
      // Esto es lo que pasa cuando haces clic en un menú que tiene submenús
      const moduleMock = { name: 'Padre' };  // Módulo simulado para probar
      
      // Estado inicial es false (definido en ngOnInit) - menú colapsado
      expect(component.expandedMenus['Padre']).toBeFalse();

      // Primera llamada: debe cambiar a true - expande el menú (muestra los submenús)
      component.toggleSubMenu(moduleMock);
      expect(component.expandedMenus['Padre']).toBeTrue();

      // Segunda llamada: debe volver a false - colapsa el menú (oculta los submenús)
      component.toggleSubMenu(moduleMock);
      expect(component.expandedMenus['Padre']).toBeFalse();
    });

    // Prueba: Verificar estado de expansión de un menú
    it('isExpanded should return the correct state', () => {
      // Verifica que isExpanded devuelve el estado correcto de un menú
      // Este método es usado en el template para aplicar clases CSS condicionales
      const moduleMock = { name: 'Padre' };
      component.expandedMenus['Padre'] = true; // Forzamos estado expandido manualmente

      const result = component.isExpanded(moduleMock);
      expect(result).toBeTrue();  // Debe devolver true porque el menú está expandido
    });

    // Prueba: Establecer módulo activo
    it('setActiveModule should call layoutService', () => {
      // Verifica que setActiveModule notifica al servicio de layout sobre el módulo activo
      // Esto es importante para mantener la sincronización en la aplicación
      const moduleName = 'Dashboard';
      component.setActiveModule(moduleName);

      // Debe llamar al servicio con el nombre del módulo activo
      // El servicio de layout puede usar esta información para:
      // - Resaltar el módulo activo en la interfaz
      // - Cargar contenido específico del módulo
      // - Mantener el estado de navegación
      expect(layoutServiceSpy.setActiveModule).toHaveBeenCalledWith(moduleName);
    });
  });
});