// Importamos las herramientas necesarias para testing en Angular
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard';
import { AuthService } from '../../../core/services/auth';
import { LayoutService } from '../../../core/services/layout';
import { NO_ERRORS_SCHEMA } from '@angular/core';

// La función 'describe' agrupa un conjunto de pruebas relacionadas con el DashboardComponent
describe('DashboardComponent', () => {
  let component: DashboardComponent;        // Instancia del componente que vamos a probar
  let fixture: ComponentFixture<DashboardComponent>;  // Contenedor del componente que permite interactuar con él en pruebas
  
  // Spies (espías) - Objetos que nos permiten simular servicios y verificar cómo se llaman
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let layoutServiceSpy: jasmine.SpyObj<LayoutService>;

  // 'beforeEach' se ejecuta ANTES de cada prueba individual (it)
  beforeEach(async () => {
    // Creamos objetos espía para los servicios usando Jasmine
    const authSpy = jasmine.createSpyObj('AuthService', ['hasAnyRole', 'decodeToken']);
    const layoutSpy = jasmine.createSpyObj('LayoutService', ['setActiveModule']);

    // Configuramos el módulo de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],  // Declaramos el componente a probar
      providers: [
        // Proporcionamos los servicios simulados en lugar de los reales
        { provide: AuthService, useValue: authSpy },
        { provide: LayoutService, useValue: layoutSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]  // Ignora elementos HTML y atributos desconocidos (evita errores de plantilla)
    })
    .compileComponents();  // Compila el componente y su plantilla

    // Obtenemos las instancias de los servicios simulados del TestBed
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    layoutServiceSpy = TestBed.inject(LayoutService) as jasmine.SpyObj<LayoutService>;

    // Configuramos comportamientos por defecto para los métodos de los servicios simulados
    authServiceSpy.decodeToken.and.returnValue({ username: 'TestUser', role: 'admin', id: '123', email: 'test@test.com', exp: 0, iat: 0 });
    authServiceSpy.hasAnyRole.and.returnValue(true);

    // SOLUCIÓN AL ERROR NG0100:
    // Mockeamos Math.random para que siempre devuelva 0.
    // Esto hace que getDailyMessage() siempre devuelva el primer elemento del array,
    // evitando que el valor cambie entre ciclos de detección de cambios de Angular.
    spyOn(Math, 'random').and.returnValue(0);

    // Creamos una instancia del componente dentro del fixture
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;  // Obtenemos la instancia real del componente
    fixture.detectChanges();  // Forzamos la detección de cambios (ngOnInit se ejecuta aquí)
  });

  // PRUEBA BÁSICA: Verifica que el componente se crea exitosamente
  it('should create', () => {
    expect(component).toBeTruthy();  // Comprueba que el componente existe y no es null/undefined
  });

  // PRUEBA DE INICIALIZACIÓN: Verifica que al iniciar se establece el módulo activo
  it('should set active module to "dashboard" on init', () => {
    // Verifica que el servicio layoutService fue llamado con el parámetro correcto
    expect(layoutServiceSpy.setActiveModule).toHaveBeenCalledWith('dashboard');
  });

  // GRUPO DE PRUEBAS PARA EL MÉTODO getGradient
  describe('getGradient', () => {
    // Prueba que verifica que devuelve el gradiente correcto para tipos conocidos
    it('should return specific gradient for known types', () => {
      // Prueba una rama positiva del objeto (cuando el tipo existe)
      const gradient = component.getGradient('contracts');
      expect(gradient).toContain('#8E2DE2');  // Verifica que el string del gradiente contiene el color esperado
    });

    // Prueba que verifica que devuelve un gradiente por defecto para tipos desconocidos
    it('should return default gradient (activeEvents) for unknown types', () => {
      // COBERTURA DE RAMA (Branch Coverage):
      // Esto cubre el "|| gradients.activeEvents" - cuando el tipo no existe en el objeto
      const defaultGradient = 'linear-gradient(135deg, #6a11cb, #2575fc)';
      expect(component.getGradient('tipo-desconocido')).toBe(defaultGradient);
    });
  });

  // GRUPO DE PRUEBAS PARA LAS ACCIONES RÁPIDAS FILTRADAS
  describe('filteredQuickActions', () => {
    // Prueba que verifica que se muestran acciones que NO requieren roles específicos
    it('should show actions that do not require roles', () => {
      // Filtra una acción que no tenga roles definidos en dashboard.ts
      const actions = component.filteredQuickActions();
      const dailyAgendaAction = actions.find(a => a.action === 'dailyAgenda');
      expect(dailyAgendaAction).toBeDefined();  // Verifica que la acción existe en el resultado
    });

    // Prueba que verifica que se muestran acciones RESTRINGIDAS cuando el usuario TIENE el rol
    it('should show restricted actions if user has the role', () => {
      // Configuramos el espía para simular que el usuario tiene el rol requerido
      authServiceSpy.hasAnyRole.and.returnValue(true);
      
      const actions = component.filteredQuickActions();
      const newEventAction = actions.find(a => a.action === 'newEvent');
      
      // Verificamos que se llamó al servicio de autenticación y que la acción está presente
      expect(authServiceSpy.hasAnyRole).toHaveBeenCalled();
      expect(newEventAction).toBeDefined();
    });

    // Prueba que verifica que se OCULTAN acciones RESTRINGIDAS cuando el usuario NO tiene el rol
    it('should hide restricted actions if user lacks the role', () => {
      // Configuramos el espía para simular que el usuario NO tiene el rol requerido
      authServiceSpy.hasAnyRole.and.returnValue(false);
      
      const actions = component.filteredQuickActions();
      const newEventAction = actions.find(a => a.action === 'newEvent');
      
      // Verificamos que la acción restringida no está en el resultado
      expect(newEventAction).toBeUndefined();
    });
  });

  // GRUPO DE PRUEBAS PARA LOS MÉTODOS DE INFORMACIÓN DEL USUARIO
  describe('User Info Methods', () => {
    // Prueba que verifica que getCurrentUsername devuelve el nombre de usuario del token
    it('getCurrentUsername should return username from token', () => {
      // Configuramos el espía para devolver un token con datos específicos
      authServiceSpy.decodeToken.and.returnValue({ 
        username: 'JuanPerez', 
        role: 'admin', 
        id: '1', 
        email: 'j@test.com', 
        exp: 0, 
        iat: 0 
      });
      expect(component.getCurrentUsername()).toBe('JuanPerez');
    });

    // Prueba que verifica el comportamiento cuando el token es null
    it('getCurrentUsername should return "Usuario" if token is null', () => {
      // COBERTURA DE RAMA: Cubre "|| 'Usuario'" cuando decodeToken devuelve null
      authServiceSpy.decodeToken.and.returnValue(null);
      expect(component.getCurrentUsername()).toBe('Usuario');
    });

    // Prueba que verifica el comportamiento cuando el token existe pero no tiene username
    it('getCurrentUsername should return "Usuario" if token exists but has no username', () => {
      // COBERTURA DE RAMA: Cubre el caso donde el objeto existe pero la propiedad es undefined
      authServiceSpy.decodeToken.and.returnValue({} as any);  // Token vacío
      expect(component.getCurrentUsername()).toBe('Usuario');
    });

    // Prueba que verifica que getPrimaryRole devuelve el rol del token
    it('getPrimaryRole should return role from token', () => {
      authServiceSpy.decodeToken.and.returnValue({ 
        username: 'Admin', 
        role: 'coordinador', 
        id: '1', 
        email: 'a@test.com', 
        exp: 0, 
        iat: 0 
      });
      expect(component.getPrimaryRole()).toBe('coordinador');
    });

    // Prueba que verifica que getPrimaryRole devuelve "guest" cuando el token es null
    it('getPrimaryRole should return "guest" if token is null', () => {
      authServiceSpy.decodeToken.and.returnValue(null);
      expect(component.getPrimaryRole()).toBe('guest');
    });
  });
  
  // GRUPO DE PRUEBAS PARA EL MENSAJE DIARIO
  describe('getDailyMessage', () => {
    // Prueba que verifica que siempre devuelve el primer mensaje (por el mock de Math.random)
    it('should return the first message because Math.random is mocked to 0', () => {
        const message = component.getDailyMessage();
        // Al haber forzado Math.random() -> 0, siempre debe retornar el índice 0
        expect(message).toBe("¡Hoy es un gran día para organizar eventos!");
    });
  });
});