// Importación de módulos y dependencias necesarias para las pruebas
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';

// Importación del componente que vamos a probar
import { ProvidersPageComponent } from './providers';
// Importación del servicio que el componente necesita
import { SidebarStateService } from '../../../core/services/sidebar-state';

// --- CLASE MOCK PARA SIMULAR EL SERVICIO SidebarStateService ---
// Creamos una clase simulada (mock) que reemplazará al servicio real durante las pruebas
// Esto nos permite aislar el componente y probarlo sin depender de implementaciones reales de servicios
class MockSidebarStateService {
  // Implementación mock vacía - solo necesitamos que exista la clase
  // En pruebas reales, aquí podríamos agregar métodos y propiedades simuladas
}

// --- BLOQUE PRINCIPAL DE PRUEBAS PARA ProvidersPageComponent ---
describe('ProvidersPageComponent', () => {
  // Variables que usaremos en las pruebas:
  let component: ProvidersPageComponent;        // Instancia del componente a probar
  let fixture: ComponentFixture<ProvidersPageComponent>;  // Fixture para manipular el componente en testing
  let router: Router;                          // Instancia del Router para probar navegación
  let sidebarStateService: SidebarStateService; // Instancia del servicio mock

  // --- CONFIGURACIÓN INICIAL ANTES DE CADA PRUEBA ---
  beforeEach(async () => {
    // Configurar el módulo de testing de Angular con todas las dependencias necesarias
    await TestBed.configureTestingModule({
      declarations: [ProvidersPageComponent],  // El componente que estamos probando
      imports: [
        // RouterTestingModule simula el sistema de rutas de Angular
        // withRoutes([]) configura rutas vacías para las pruebas
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        // Proveemos el servicio mock en lugar del servicio real
        // Esto permite que el componente funcione sin necesidad del servicio real
        { provide: SidebarStateService, useClass: MockSidebarStateService }
      ],
      // Schemas especiales para evitar errores con elementos del template:
      schemas: [
        CUSTOM_ELEMENTS_SCHEMA,  // Ignora elementos HTML personalizados (web components)
        NO_ERRORS_SCHEMA         // Ignora cualquier elemento Angular no reconocido en el template
      ]
    }).compileComponents();  // Compila el componente y su template HTML

    // Crear la instancia del componente dentro del entorno de testing
    fixture = TestBed.createComponent(ProvidersPageComponent);
    component = fixture.componentInstance;  // Obtenemos la instancia real del componente
    
    // Obtenemos las instancias inyectadas de los servicios
    router = TestBed.inject(Router);  // Router para probar navegación
    sidebarStateService = TestBed.inject(SidebarStateService);  // Servicio mock del sidebar
    
    // NOTA IMPORTANTE: No llamamos a fixture.detectChanges() intencionalmente
    // Esto evita problemas con elementos del template que podrían no estar disponibles
    // en el entorno de testing o que causarían errores
  });

  // --- PRUEBA BÁSICA: CREACIÓN DEL COMPONENTE ---
  // Esta es la prueba más fundamental - verifica que el componente se puede crear correctamente
  it('should create', () => {
    // Si el componente se crea sin errores, esta prueba pasa
    // Si falla, indica problemas graves en la configuración del componente
    expect(component).toBeTruthy();
  });

  // --- PRUEBA: VALORES INICIALES POR DEFECTO ---
  // Verifica que las propiedades del componente se inicialicen con los valores correctos
  it('should initialize with default values', () => {
    // Comprobamos que hoverState empiece como string vacío
    // Esto significa que inicialmente ningún elemento tiene estado "hover"
    expect(component.hoverState).toBe('');
  });

  // --- GRUPO DE PRUEBAS PARA EL MÉTODO navigateTo ---
  // Describe agrupa pruebas relacionadas para mejor organización
  describe('navigateTo', () => {
    
    // Prueba: Navegación a una ruta específica
    it('should navigate to the correct path', () => {
      // Espiamos el método 'navigate' del Router para verificar que se llama correctamente
      const navigateSpy = spyOn(router, 'navigate');
      
      // Ejecutamos el método del componente que debería disparar la navegación
      component.navigateTo('test');
      
      // Verificamos que el Router fue llamado con la ruta correcta
      // ['/providers/test'] significa que navega a la ruta absoluta /providers/test
      expect(navigateSpy).toHaveBeenCalledWith(['/providers/test']);
    });

    // Prueba: Navegación a diferentes rutas
    // Esta prueba verifica que el método funciona con distintos parámetros
    it('should navigate to different paths correctly', () => {
      const navigateSpy = spyOn(router, 'navigate');
      
      // Probamos con un parámetro diferente
      component.navigateTo('another');
      
      // Verificamos que la ruta se construye correctamente con el nuevo parámetro
      expect(navigateSpy).toHaveBeenCalledWith(['/providers/another']);
    });

    // Prueba: Manejo de ruta vacía
    // Esta prueba verifica el comportamiento con casos límite (edge cases)
    it('should handle empty path', () => {
      const navigateSpy = spyOn(router, 'navigate');
      
      // Probamos con string vacío para ver cómo se comporta
      component.navigateTo('');
      
      // Verificamos que la navegación funciona incluso con path vacío
      expect(navigateSpy).toHaveBeenCalledWith(['/providers/']);
    });
  });

  // --- GRUPO DE PRUEBAS PARA EL MÉTODO toggleHover ---
  // Estas pruebas verifican el comportamiento del efecto hover en la interfaz
  describe('toggleHover', () => {
    
    // Prueba: Establecer estado hover básico
    it('should set hoverState to the provided card name', () => {
      const testCard = 'test-card';  // Nombre simulado de una tarjeta
      
      // Ejecutamos el método que cambia el estado hover
      component.toggleHover(testCard);
      
      // Verificamos que el estado se actualizó correctamente
      expect(component.hoverState).toBe(testCard);
    });

    // Prueba: Múltiples cambios de estado hover
    // Verifica que el método puede manejar cambios consecutivos correctamente
    it('should update hoverState when called multiple times', () => {
      const firstCard = 'first-card';   // Primer estado hover
      const secondCard = 'second-card'; // Segundo estado hover
      
      // Primer cambio de estado
      component.toggleHover(firstCard);
      expect(component.hoverState).toBe(firstCard);
      
      // Segundo cambio de estado - debería reemplazar al anterior
      component.toggleHover(secondCard);
      expect(component.hoverState).toBe(secondCard);
    });

    // Prueba: Manejo de string vacío
    // Verifica el comportamiento con valores límite
    it('should handle empty string', () => {
      // Ejecutamos con string vacío
      component.toggleHover('');
      
      // El estado debería quedar como string vacío
      expect(component.hoverState).toBe('');
    });
  });

  // --- GRUPO DE PRUEBAS PARA LA INYECCIÓN DE DEPENDENCIAS ---
  // Estas pruebas verifican que el componente recibe correctamente sus dependencias
  describe('Dependency injection', () => {
    
    // Prueba: Verificar que el Router fue inyectado
    it('should have Router injected', () => {
      // Accedemos a la propiedad privada 'router' del componente
      // Usamos ['router'] porque es una propiedad privada (no accesible directamente)
      expect(component['router']).toBeTruthy();  // Debería existir y no ser null/undefined
    });

    // Prueba: Verificar que el SidebarStateService fue inyectado correctamente
    it('should have SidebarStateService injected', () => {
      // Verificamos que la propiedad pública sidebarState existe
      expect(component.sidebarState).toBeTruthy();
      
      // Verificamos que es exactamente la misma instancia que obtuvimos del TestBed
      // Esto confirma que la inyección de dependencias funcionó correctamente
      expect(component.sidebarState).toBe(sidebarStateService);
    });
  });
});