import { TestBed } from '@angular/core/testing';
import { LayoutService } from './layout';

describe('LayoutService', () => {
  let service: LayoutService;
  let resizeCallback: () => void;
  
  // CORRECCIÓN: Variable para guardar el espía de innerWidth
  let innerWidthSpy: jasmine.Spy;

  const setupTestBed = (mockWidth: number) => {
    // CORRECCIÓN: Guardamos el espía en nuestra variable
    innerWidthSpy = spyOnProperty(window, 'innerWidth', 'get').and.returnValue(mockWidth);

    spyOn(window, 'addEventListener').and.callFake((event: string, callback: any) => {
      if (event === 'resize') {
        resizeCallback = callback as () => void;
      }
    });

    TestBed.configureTestingModule({
      providers: [LayoutService]
    });
    
    service = TestBed.inject(LayoutService);
  };

  // --- Pruebas de Inicialización (Constructor) ---
  describe('Constructor and Initialization', () => {
    // NOTA: Estas pruebas deben ejecutarse por separado, por eso llaman
    // a setupTestBed() adentro y no en un beforeEach.
    
    it('should initialize in DESKTOP mode (width > 992)', () => {
      setupTestBed(1200);
      expect(service).toBeTruthy();
      expect(service['mobileView'].value).toBeFalse();
      expect(service['sidebarCollapsed'].value).toBeFalse();
      expect(window.addEventListener).toHaveBeenCalledWith('resize', jasmine.any(Function));
    });

    it('should initialize in MOBILE mode (width < 992)', () => {
      setupTestBed(800); 
      expect(service).toBeTruthy();
      expect(service['mobileView'].value).toBeTrue();
      expect(service['sidebarCollapsed'].value).toBeTrue();
      expect(window.addEventListener).toHaveBeenCalledWith('resize', jasmine.any(Function));
    });
  });

  // --- Pruebas de Métodos Públicos ---
  describe('Public Methods', () => {
    beforeEach(() => {
      // Este beforeEach se aplica solo a este describe
      setupTestBed(1200);
    });

    it('toggleSidebar() should toggle sidebarCollapsed', () => {
      expect(service['sidebarCollapsed'].value).toBeFalse();
      service.toggleSidebar();
      expect(service['sidebarCollapsed'].value).toBeTrue();
      service.toggleSidebar();
      expect(service['sidebarCollapsed'].value).toBeFalse();
    });

    describe('setActiveModule(module)', () => {
      it('should set active module (in desktop mode)', () => {
        service['sidebarCollapsed'].next(false);
        service.setActiveModule('events');
        expect(service['activeModule'].value).toBe('events');
        expect(service['sidebarCollapsed'].value).toBeFalse();
      });

      it('should set active module AND collapse sidebar (in mobile mode)', () => {
        service['mobileView'].next(true);
        service['sidebarCollapsed'].next(false);
        service.setActiveModule('events');
        expect(service['activeModule'].value).toBe('events');
        expect(service['sidebarCollapsed'].value).toBeTrue(); 
      });
    });
  });

  // --- Pruebas de Lógica Privada (Disparada por Eventos) ---
  describe('private#checkViewport (on window resize)', () => {
    beforeEach(() => {
      // Este beforeEach crea el espía para estas dos pruebas
      setupTestBed(1200);
    });

    it('should switch to MOBILE view on resize', () => {
      expect(service['mobileView'].value).toBeFalse();
      expect(service['sidebarCollapsed'].value).toBeFalse();

      // CORRECCIÓN: Reconfiguramos el espía existente
      innerWidthSpy.and.returnValue(800);
      
      resizeCallback(); 
      
      expect(service['mobileView'].value).toBeTrue();
      expect(service['sidebarCollapsed'].value).toBeTrue();
    });

    it('should switch back to DESKTOP view on resize', () => {
      // 1. Forzamos el estado a móvil primero
      // CORRECCIÓN: Reconfiguramos el espía existente
      innerWidthSpy.and.returnValue(800);
      resizeCallback();
      expect(service['mobileView'].value).toBeTrue();
      expect(service['sidebarCollapsed'].value).toBeTrue();

      // 2. Simulamos que la ventana se agranda
      // CORRECCIÓN: Reconfiguramos el espía existente
      innerWidthSpy.and.returnValue(1200);
      resizeCallback();

      expect(service['mobileView'].value).toBeFalse();
      expect(service['sidebarCollapsed'].value).toBeTrue(); 
    });
  });

  // --- Pruebas de getModulesForRole (Función Pura) ---
  describe('getModulesForRole(role)', () => {
    beforeEach(() => {
      // Este beforeEach crea el espía para este describe
      setupTestBed(1200);
    });

    it('should return correct modules for "admin"', () => {
      const modules = service.getModulesForRole('admin');
      expect(modules.length).toBe(7);
      expect(modules[0].name).toBe('Dashboard');
      expect(modules[2].children?.length).toBe(3);
    });

    it('should return correct modules for "coordinador"', () => {
      const modules = service.getModulesForRole('coordinador');
      expect(modules.length).toBe(5);
      expect(modules[1].name).toBe('Eventos');
      expect(modules[2].children?.length).toBe(2);
    });

    it('should return correct modules for "lider"', () => {
      const modules = service.getModulesForRole('lider');
      expect(modules.length).toBe(4);
      expect(modules[2].name).toBe('Asistencia');
    });

    it('should return empty array for an invalid role', () => {
      const modules = service.getModulesForRole('visitante');
      expect(modules).toEqual([]);
    });
  });
});