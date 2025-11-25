// Importamos las herramientas necesarias para testing en Angular
import { ComponentFixture, TestBed } from '@angular/core/testing';
// Importamos el componente que vamos a probar
import { FooterComponent } from './footer';
// Importamos el esquema que nos permite ignorar elementos desconocidos en el template
import { NO_ERRORS_SCHEMA } from '@angular/core';

// La función 'describe' agrupa todas las pruebas relacionadas con el FooterComponent
// Esto crea un bloque de pruebas organizado que aparece agrupado en los reportes de testing
describe('FooterComponent', () => {
  // Declaramos las variables que usaremos en las pruebas
  let component: FooterComponent;  // Instancia del componente Footer que vamos a probar
  let fixture: ComponentFixture<FooterComponent>;  // Contenedor del componente para testing

  // 'beforeEach' se ejecuta ANTES de cada prueba individual (it)
  // Esto garantiza que cada prueba comience con una instancia fresca y limpia del componente
  // 'async' se usa porque compileComponents() retorna una promesa
  beforeEach(async () => {
    // Configuramos el módulo de testing de Angular
    // TestBed es la herramienta principal de Angular para configurar el entorno de testing
    await TestBed.configureTestingModule({
      // CORRECCIÓN: Al ser standalone: false, se debe declarar, no importar.
      // En Angular, los componentes pueden ser standalone (autónomos) o declarados en módulos
      // Este componente no es standalone, por eso lo declaramos en 'declarations'
      // Esto le dice a Angular: "Este componente existe y quiero probarlo"
      declarations: [FooterComponent],
      
      // Usamos NO_ERRORS_SCHEMA para ignorar elementos de Router o iconos en el HTML
      // Esto evita errores cuando el template contiene elementos que Angular no reconoce
      // en el entorno de testing, como por ejemplo:
      // - Directivas de RouterLink (routerLink)
      // - Componentes personalizados que no están declarados
      // - Elementos de librerías externas
      // Es como decirle a Angular: "Ignora cualquier cosa que no entiendas en el HTML"
      schemas: [NO_ERRORS_SCHEMA]
    })
    // compileComponents() compila el componente y su template HTML
    // Esto es necesario porque los componentes Angular tienen templates separados
    // que necesitan ser compilados antes de poder usarlos en las pruebas
    .compileComponents();

    // Creamos una instancia del componente dentro del fixture
    // TestBed.createComponent() crea el componente y su entorno de testing
    // El fixture es como un "contenedor" que envuelve al componente y nos da
    // herramientas para interactuar con él durante las pruebas
    fixture = TestBed.createComponent(FooterComponent);
    
    // Obtenemos la instancia real del componente desde el fixture
    // componentInstance nos da acceso a las propiedades y métodos del componente
    // A través de 'component' podemos:
    // - Acceder a sus propiedades (como currentYear y version)
    // - Llamar a sus métodos
    // - Verificar su estado interno
    component = fixture.componentInstance;
    
    // Forzamos la detección de cambios de Angular
    // Esto ejecuta el ciclo de detección de cambios (similar a cuando la app corre normalmente)
    // También dispara el hook ngOnInit si está definido en el componente
    // En resumen: hace que Angular "procese" el componente por primera vez
    fixture.detectChanges();
  });

  // PRUEBA BÁSICA: Verifica que el componente se crea exitosamente
  // 'it' define una prueba individual - cada 'it' es una prueba separada
  it('should create', () => {
    // 'expect' es una afirmación - verifica que una condición sea verdadera
    // 'toBeTruthy()' verifica que el componente existe y no es null, undefined, false, 0, etc.
    // Esta es la prueba más básica: que el componente puede ser instanciado sin errores
    // Si esta prueba falla, significa que hay problemas graves en la configuración del componente
    expect(component).toBeTruthy();
  });

  // PRUEBA DE PROPIEDAD: Verifica que el año actual se calcula correctamente
  it('should have the correct current year', () => {
    // Obtenemos el año actual usando JavaScript nativo
    // new Date().getFullYear() devuelve el año actual (ej: 2024)
    // Esto nos sirve como valor de referencia para comparar con lo que calcula el componente
    const expectedYear = new Date().getFullYear();
    
    // Verificamos que la propiedad 'currentYear' del componente sea igual al año actual
    // Esta prueba asegura que:
    // 1. El footer siempre muestre el año correcto
    // 2. No haya errores en el cálculo de la fecha
    // 3. El componente se actualice correctamente cada año
    expect(component.currentYear).toBe(expectedYear);
  });

  // PRUEBA DE PROPIEDAD: Verifica que la versión es la correcta
  it('should have the correct version', () => {
    // Verificamos que la propiedad 'version' del componente tenga el valor esperado '1.0.0'
    // Esta es una prueba de un valor fijo/hardcodeado en el componente
    // Asegura que:
    // 1. La versión mostrada en el footer sea la correcta
    // 2. Si alguien cambia la versión en el componente, la prueba fallará
    // 3. Los usuarios vean la información de versión correcta
    expect(component.version).toBe('1.0.0');
  });
});