// Importación de módulos y dependencias necesarias para las pruebas
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';

// Importación del componente que vamos a probar
import { InventoryPageComponent } from './inventory-page';
// Importación del servicio que necesita el componente
import { SidebarStateService } from '../../../core/services/sidebar-state';

// --- CLASE MOCK PARA SIMULAR EL SERVICIO SidebarStateService ---
// Creamos una clase mock (simulada) que reemplazará al servicio real durante las pruebas
// Esto nos permite controlar exactamente cómo se comporta el servicio sin depender de su implementación real
class MockSidebarStateService {
  isCollapsed = false;  // Propiedad que simula el estado del sidebar (no colapsado por defecto)
}

// --- BLOQUE PRINCIPAL DE PRUEBAS PARA InventoryPageComponent ---
describe('InventoryPageComponent', () => {
  let component: InventoryPageComponent;        // Instancia del componente que vamos a probar
  let fixture: ComponentFixture<InventoryPageComponent>;  // Fixture que nos permite manipular el componente y su entorno de testing
  let router: Router;                          // Instancia del Router para probar navegación

  // --- CONFIGURACIÓN ANTES DE CADA PRUEBA ---
  beforeEach(async () => {
    // Configurar el módulo de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [InventoryPageComponent],  // Declarar el componente que estamos probando
      imports: [
        // Importar RouterTestingModule para simular el sistema de rutas de Angular
        // withRoutes([]) configura rutas vacías ya que solo nos interesa probar la navegación
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        // Proveer el servicio mock en lugar del servicio real
        // Esto hace que cuando el componente pida SidebarStateService, reciba nuestro MockSidebarStateService
        { provide: SidebarStateService, useClass: MockSidebarStateService }
      ],
      // Schemas especiales para evitar errores con elementos desconocidos en el template:
      schemas: [
        CUSTOM_ELEMENTS_SCHEMA,  // Ignora elementos HTML personalizados (web components)
        NO_ERRORS_SCHEMA         // Ignora cualquier elemento no reconocido en el template
      ]
    }).compileComponents();  // Compilar el componente y su template

    // Crear una instancia del componente dentro del fixture de testing
    fixture = TestBed.createComponent(InventoryPageComponent);
    component = fixture.componentInstance;  // Obtener la instancia real del componente
    
    // Obtener la instancia del Router del módulo de testing
    router = TestBed.inject(Router);
    
    // Nota: No usamos fixture.detectChanges() aquí intencionalmente
    // Esto evita problemas con elementos del template que podrían no estar disponibles en el entorno de testing
  });

  // --- PRUEBA 1: CREACIÓN BÁSICA DEL COMPONENTE ---
  it('should create', () => {
    // Esta es la prueba más básica: verificar que el componente se instancia correctamente
    // Si esta prueba falla, significa que hay problemas graves en la configuración del componente
    expect(component).toBeTruthy();
  });

  // --- PRUEBA 2: ESTADO INICIAL DE hoverState ---
  it('should initialize with empty hoverState', () => {
    // Verificar que la propiedad hoverState se inicializa correctamente
    // Un string vacío indica que ningún elemento está en estado hover al comenzar
    expect(component.hoverState).toBe('');
  });

  // --- PRUEBA 3: NAVEGACIÓN ENTRE RUTAS ---
  it('should navigate to inventory path', () => {
    // Espiar el método 'navigate' del Router para verificar que se llama correctamente
    const navigateSpy = spyOn(router, 'navigate');
    
    // Ejecutar el método que debería causar la navegación
    component.navigateTo('products');
    
    // Verificar que el método navigate fue llamado con la ruta correcta
    // ['/inventory/products'] significa que navega a la ruta absoluta /inventory/products
    expect(navigateSpy).toHaveBeenCalledWith(['/inventory/products']);
  });

  // --- PRUEBA 4: ACTUALIZACIÓN DEL ESTADO HOVER ---
  it('should update hoverState on toggleHover', () => {
    // Ejecutar el método que cambia el estado hover
    component.toggleHover('test-card');
    
    // Verificar que la propiedad hoverState se actualizó correctamente
    // 'test-card' indica que el elemento con identificador 'test-card' está en estado hover
    expect(component.hoverState).toBe('test-card');
  });

  // --- PRUEBA 5: VERIFICACIÓN DE DEPENDENCIAS INYECTADAS ---
  it('should have dependencies injected', () => {
    // Verificar que el Router fue inyectado correctamente en el componente
    // Usamos ['router'] para acceder a la propiedad privada del componente
    expect(component['router']).toBeTruthy();
    
    // Verificar que el SidebarStateService fue inyectado correctamente
    // sidebarState es una propiedad pública del componente
    expect(component.sidebarState).toBeTruthy();
  });
});