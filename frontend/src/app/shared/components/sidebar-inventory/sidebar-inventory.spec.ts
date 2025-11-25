// Importamos las herramientas necesarias para testing en Angular
import { ComponentFixture, TestBed } from '@angular/core/testing';
// Importamos el Router para probar la navegación entre páginas
import { Router } from '@angular/router';
// Importamos el componente que vamos a probar - el sidebar del inventario
import { SidebarInventoryComponent } from './sidebar-inventory';
// Importamos el servicio que maneja el estado del sidebar
import { SidebarStateService } from '../../../core/services/sidebar-state';

// La función 'describe' agrupa todas las pruebas relacionadas con el SidebarInventoryComponent
// Esto crea un bloque organizado de pruebas que aparece agrupado en los reportes
describe('SidebarInventoryComponent', () => {
  // Variables que usaremos en todas las pruebas:
  let component: SidebarInventoryComponent;  // Instancia del componente que vamos a probar
  let fixture: ComponentFixture<SidebarInventoryComponent>;  // Contenedor del componente para testing
  
  // Spies y Mocks - Objetos que simulan servicios reales
  let routerSpy: jasmine.SpyObj<Router>;  // Spy para el Router - nos permite verificar navegación
  let mockSidebarState: { isOpen: boolean };  // Mock simple para el servicio de estado del sidebar

  // 'beforeEach' se ejecuta ANTES de cada prueba individual
  // Esto garantiza que cada prueba comience con un entorno limpio y configurado
  beforeEach(async () => {
    // 1. Mock del Router: Solo nos interesa saber si se llamó a navigate
    // Creamos un spy (objeto simulado) que puede "espiar" las llamadas al método navigate
    // Esto nos permite verificar que el componente intenta navegar sin realmente navegar
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // 2. Mock del SidebarState: Un objeto simple es suficiente aquí
    // Inicializamos en false para verificar que el constructor del componente lo cambie a true
    // Esto nos permite probar que el componente modifica el estado correctamente
    mockSidebarState = { isOpen: false };

    // Configuramos el módulo de testing de Angular
    // TestBed es el entorno principal de testing de Angular
    await TestBed.configureTestingModule({
      // Componente NO standalone va en declarations
      // Los componentes pueden ser standalone (independientes) o declarados en módulos
      // Este componente no es standalone, por eso lo declaramos en 'declarations'
      declarations: [SidebarInventoryComponent],
      // Proveemos los mocks en lugar de los servicios reales
      // Esto aísla el componente para que las pruebas no dependan de implementaciones reales
      providers: [
        { provide: Router, useValue: routerSpy },  // Usamos el spy del Router
        { provide: SidebarStateService, useValue: mockSidebarState }  // Usamos nuestro objeto mock simple
      ]
    })
    .compileComponents();  // Compila el componente y su template HTML

    // Creamos una instancia del componente dentro del fixture
    fixture = TestBed.createComponent(SidebarInventoryComponent);
    component = fixture.componentInstance;  // Obtenemos la instancia real del componente
    
    // detectChanges dispara el ciclo de vida de Angular, incluyendo la ejecución del constructor 
    // (aunque el constructor técnico de JavaScript se ejecuta al hacer createComponent)
    // fixture.detectChanges() también activa la detección de cambios y puede ejecutar ngOnInit si existe
    fixture.detectChanges();
  });

  // PRUEBA BÁSICA: Verifica que el componente se crea exitosamente
  // Esta es la prueba más fundamental - si falla, hay problemas graves de configuración
  it('should create', () => {
    // 'expect' es una afirmación - verifica que una condición sea verdadera
    // 'toBeTruthy()' verifica que el componente existe y no es null, undefined, false, 0, etc.
    // Esta prueba asegura que el componente se puede instanciar sin errores
    expect(component).toBeTruthy();
  });

  // PRUEBA: VERIFICACIÓN DEL ESTADO INICIAL DEL SIDEBAR
  // Esta prueba verifica que el componente inicializa correctamente el estado del sidebar
  it('should set sidebarState.isOpen to true on initialization', () => {
    // El constructor del componente tiene la línea:
    // this.sidebarState.isOpen = true;
    // Esto significa que cuando el componente se crea, automáticamente abre el sidebar
    
    // Verificamos que nuestro mock haya sido modificado por el constructor del componente
    // Si el componente funciona correctamente, debería haber cambiado isOpen de false a true
    expect(mockSidebarState.isOpen).toBeTrue();
    
    // ¿Por qué es importante esta prueba?
    // - Garantiza que el sidebar se muestre abierto al cargar el inventario
    // - Verifica que el componente se comunica correctamente con el servicio de estado
    // - Asegura la experiencia de usuario consistente
  });

  // PRUEBA: NAVEGACIÓN ENTRO RUTAS DEL INVENTARIO
  // Esta prueba verifica que el componente puede navegar correctamente entre diferentes secciones
  it('should navigate to the correct route when navigateTo is called', () => {
    // Definimos los datos de prueba:
    const testRoute = 'dashboard';  // Ruta de destino que queremos probar
    const expectedUrl = ['/dashboard'];  // URL esperada que el Router debería recibir

    // Ejecutamos el método del componente que debería disparar la navegación
    // En una aplicación real, esto se llamaría cuando el usuario hace clic en un enlace del sidebar
    component.navigateTo(testRoute);

    // Verificamos que el router haya sido llamado con los argumentos correctos
    // Nota: El componente agrega una barra '/' al inicio: `/${route}`
    // Por eso 'dashboard' se convierte en '/dashboard'
    expect(routerSpy.navigate).toHaveBeenCalledWith(expectedUrl);
    
    // ¿Por qué es importante esta prueba?
    // - Asegura que la navegación funcione correctamente
    // - Verifica que las rutas se construyan adecuadamente
    // - Previene errores de navegación que frustrarían al usuario
  });
});