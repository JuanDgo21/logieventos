import { TestBed } from '@angular/core/testing';
import { LayoutService } from './layout';

// Suite de pruebas para el LayoutService
// Este servicio maneja el diseño responsive de la aplicación (sidebar, módulos, etc.)
describe('LayoutService', () => {
  let service: LayoutService;
  let resizeCallback: () => void; // Callback para simular eventos de redimensionamiento
  
  // CORRECCIÓN: Variable para guardar el espía de innerWidth
  // Esto nos permite modificar el ancho de ventana durante las pruebas
  let innerWidthSpy: jasmine.Spy;

  // Función helper para configurar el entorno de testing
  // Recibe un ancho de ventana mock para simular diferentes tamaños de pantalla
  const setupTestBed = (mockWidth: number) => {
    // CORRECCIÓN: Guardamos el espía en nuestra variable para poder modificarlo después
    // Espiamos la propiedad innerWidth de window y forzamos un valor específico
    innerWidthSpy = spyOnProperty(window, 'innerWidth', 'get').and.returnValue(mockWidth);

    // Espiamos addEventListener para capturar el callback de redimensionamiento
    // Esto nos permite simular manualmente el evento de cambiar tamaño de ventana
    spyOn(window, 'addEventListener').and.callFake((event: string, callback: any) => {
      if (event === 'resize') {
        resizeCallback = callback as () => void; // Guardamos el callback para usarlo en las pruebas
      }
    });

    // Configuramos el módulo de testing de Angular
    TestBed.configureTestingModule({
      providers: [LayoutService] // Proveemos el servicio que vamos a probar
    });
    
    // Obtenemos la instancia del servicio
    service = TestBed.inject(LayoutService);
  };

  // ==========================================
  // PRUEBAS DE INICIALIZACIÓN (CONSTRUCTOR)
  // ==========================================
  describe('Constructor and Initialization', () => {
    // NOTA: Estas pruebas deben ejecutarse por separado, por eso llaman
    // a setupTestBed() adentro y no en un beforeEach.
    // Esto es porque cada prueba necesita un ancho de ventana diferente desde el inicio.
    
    // Prueba: El servicio debe inicializarse en modo ESCRITORIO cuando el ancho > 992px
    it('should initialize in DESKTOP mode (width > 992)', () => {
      setupTestBed(1200); // Configuramos un ancho grande (escritorio)
      expect(service).toBeTruthy(); // Verificamos que el servicio se creó
      
      // En modo escritorio:
      expect(service['mobileView'].value).toBeFalse(); // No debe estar en vista móvil
      expect(service['sidebarCollapsed'].value).toBeFalse(); // Sidebar debe estar expandido
      
      // Verificamos que se configuró el listener para eventos de redimensionamiento
      expect(window.addEventListener).toHaveBeenCalledWith('resize', jasmine.any(Function));
    });

    // Prueba: El servicio debe inicializarse en modo MÓVIL cuando el ancho < 992px
    it('should initialize in MOBILE mode (width < 992)', () => {
      setupTestBed(800); // Configuramos un ancho pequeño (móvil)
      expect(service).toBeTruthy(); // Verificamos que el servicio se creó
      
      // En modo móvil:
      expect(service['mobileView'].value).toBeTrue(); // Debe estar en vista móvil
      expect(service['sidebarCollapsed'].value).toBeTrue(); // Sidebar debe estar colapsado
      
      // Verificamos que se configuró el listener para eventos de redimensionamiento
      expect(window.addEventListener).toHaveBeenCalledWith('resize', jasmine.any(Function));
    });
  });

  // ==========================================
  // PRUEBAS DE MÉTODOS PÚBLICOS
  // ==========================================
  describe('Public Methods', () => {
    // Configuración común para todas las pruebas de métodos públicos
    beforeEach(() => {
      // Este beforeEach se aplica solo a este describe
      // Inicializamos en modo escritorio (1200px) para estas pruebas
      setupTestBed(1200);
    });

    // Prueba: toggleSidebar() debe alternar el estado del sidebar
    it('toggleSidebar() should toggle sidebarCollapsed', () => {
      // Estado inicial: sidebar expandido (false)
      expect(service['sidebarCollapsed'].value).toBeFalse();
      
      // Primera llamada: debe colapsar el sidebar
      service.toggleSidebar();
      expect(service['sidebarCollapsed'].value).toBeTrue();
      
      // Segunda llamada: debe expandir el sidebar nuevamente
      service.toggleSidebar();
      expect(service['sidebarCollapsed'].value).toBeFalse();
    });

    // Pruebas para setActiveModule - maneja la selección de módulos
    describe('setActiveModule(module)', () => {
      // Prueba: En modo escritorio, solo cambia el módulo activo
      it('should set active module (in desktop mode)', () => {
        // Configuramos estado inicial: escritorio con sidebar expandido
        service['sidebarCollapsed'].next(false);
        
        // Cambiamos al módulo 'events'
        service.setActiveModule('events');
        
        // Verificaciones:
        expect(service['activeModule'].value).toBe('events'); // Módulo cambió
        expect(service['sidebarCollapsed'].value).toBeFalse(); // Sidebar sigue expandido
      });

      // Prueba: En modo móvil, cambia el módulo Y colapsa el sidebar
      it('should set active module AND collapse sidebar (in mobile mode)', () => {
        // Configuramos estado inicial: modo móvil con sidebar expandido
        service['mobileView'].next(true);
        service['sidebarCollapsed'].next(false);
        
        // Cambiamos al módulo 'events'
        service.setActiveModule('events');
        
        // Verificaciones:
        expect(service['activeModule'].value).toBe('events'); // Módulo cambió
        expect(service['sidebarCollapsed'].value).toBeTrue(); // Sidebar se colapsó automáticamente
      });
    });
  });

  // ==========================================
  // PRUEBAS DE LÓGICA PRIVADA (DISPARADA POR EVENTOS)
  // ==========================================
  describe('private#checkViewport (on window resize)', () => {
    // Configuración común para pruebas de redimensionamiento
    beforeEach(() => {
      // Este beforeEach crea el espía para estas dos pruebas
      // Inicializamos en modo escritorio (1200px)
      setupTestBed(1200);
    });

    // Prueba: Cambio de escritorio a móvil cuando la ventana se hace pequeña
    it('should switch to MOBILE view on resize', () => {
      // Estado inicial: modo escritorio
      expect(service['mobileView'].value).toBeFalse();
      expect(service['sidebarCollapsed'].value).toBeFalse();

      // CORRECCIÓN: Reconfiguramos el espía existente para simular ventana pequeña
      innerWidthSpy.and.returnValue(800); // 800px (menor que 992px = móvil)
      
      // Simulamos el evento de redimensionamiento llamando al callback guardado
      resizeCallback(); 
      
      // Verificaciones después del redimensionamiento:
      expect(service['mobileView'].value).toBeTrue(); // Ahora está en modo móvil
      expect(service['sidebarCollapsed'].value).toBeTrue(); // Sidebar se colapsó automáticamente
    });

    // Prueba: Cambio de móvil a escritorio cuando la ventana se agranda
    it('should switch back to DESKTOP view on resize', () => {
      // 1. Forzamos el estado a móvil primero
      // CORRECCIÓN: Reconfiguramos el espía existente
      innerWidthSpy.and.returnValue(800); // 800px = móvil
      resizeCallback(); // Disparamos el evento de redimensionamiento
      
      // Verificamos que estamos en modo móvil
      expect(service['mobileView'].value).toBeTrue();
      expect(service['sidebarCollapsed'].value).toBeTrue();

      // 2. Simulamos que la ventana se agranda (vuelve a escritorio)
      // CORRECCIÓN: Reconfiguramos el espía existente
      innerWidthSpy.and.returnValue(1200); // 1200px = escritorio
      resizeCallback(); // Disparamos el evento de redimensionamiento

      // Verificaciones después del redimensionamiento:
      expect(service['mobileView'].value).toBeFalse(); // Volvió a modo escritorio
      expect(service['sidebarCollapsed'].value).toBeTrue(); // Sidebar permanece colapsado
      // NOTA: El sidebar no se expande automáticamente al volver a escritorio
    });
  });

  // ==========================================
  // PRUEBAS DE getModulesForRole (FUNCIÓN PURA)
  // ==========================================
  describe('getModulesForRole(role)', () => {
    // Configuración común para pruebas de módulos por rol
    beforeEach(() => {
      // Este beforeEach crea el espía para este describe
      setupTestBed(1200);
    });

    // Prueba: Módulos disponibles para el rol "admin" (máximo acceso)
    it('should return correct modules for "admin"', () => {
      const modules = service.getModulesForRole('admin');
      
      // Admin tiene acceso a todos los módulos
      expect(modules.length).toBe(7); // 7 módulos principales
      expect(modules[0].name).toBe('Dashboard'); // Primer módulo
      expect(modules[2].children?.length).toBe(3); // Tercer módulo tiene 3 sub-módulos
    });

    // Prueba: Módulos disponibles para el rol "coordinador" (acceso medio)
    it('should return correct modules for "coordinador"', () => {
      const modules = service.getModulesForRole('coordinador');
      
      // Coordinador tiene acceso limitado
      expect(modules.length).toBe(5); // 5 módulos principales
      expect(modules[1].name).toBe('Eventos'); // Segundo módulo
      expect(modules[2].children?.length).toBe(2); // Tercer módulo tiene 2 sub-módulos
    });

    // Prueba: Módulos disponibles para el rol "lider" (acceso mínimo)
    it('should return correct modules for "lider"', () => {
      const modules = service.getModulesForRole('lider');
      
      // Líder tiene acceso muy limitado
      expect(modules.length).toBe(4); // 4 módulos principales
      expect(modules[2].name).toBe('Asistencia'); // Tercer módulo
    });

    // Prueba: Rol inválido o no reconocido
    it('should return empty array for an invalid role', () => {
      const modules = service.getModulesForRole('visitante'); // Rol que no existe
      expect(modules).toEqual([]); // Debe devolver array vacío
    });
  });
});