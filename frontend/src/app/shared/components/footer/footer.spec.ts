// Importamos las herramientas necesarias para testing en Angular
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer';
import { NO_ERRORS_SCHEMA } from '@angular/core';

// La función 'describe' agrupa todas las pruebas relacionadas con el FooterComponent
describe('FooterComponent', () => {
  // Declaramos las variables que usaremos en las pruebas
  let component: FooterComponent;  // Instancia del componente Footer que vamos a probar
  let fixture: ComponentFixture<FooterComponent>;  // Contenedor del componente para testing

  // 'beforeEach' se ejecuta ANTES de cada prueba individual (it)
  // 'async' se usa porque compileComponents() retorna una promesa
  beforeEach(async () => {
    // Configuramos el módulo de testing de Angular
    await TestBed.configureTestingModule({
      // CORRECCIÓN: Al ser standalone: false, se debe declarar, no importar.
      // En Angular, los componentes pueden ser standalone (autónomos) o declarados en módulos
      // Este componente no es standalone, por eso lo declaramos en 'declarations'
      declarations: [FooterComponent],
      // Usamos NO_ERRORS_SCHEMA para ignorar elementos de Router o iconos en el HTML
      // Esto evita errores cuando el template contiene elementos que Angular no reconoce
      // como directivas de RouterLink, componentes personalizados, etc.
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();  // Compila el componente y su template HTML

    // Creamos una instancia del componente dentro del fixture
    // TestBed.createComponent() crea el componente y su entorno de testing
    fixture = TestBed.createComponent(FooterComponent);
    
    // Obtenemos la instancia real del componente desde el fixture
    // componentInstance nos da acceso a las propiedades y métodos del componente
    component = fixture.componentInstance;
    
    // Forzamos la detección de cambios de Angular
    // Esto ejecuta el ciclo de detección de cambios (similar a cuando la app corre normalmente)
    // También dispara el hook ngOnInit si está definido
    fixture.detectChanges();
  });

  // PRUEBA BÁSICA: Verifica que el componente se crea exitosamente
  it('should create', () => {
    // 'expect' es una afirmación - verifica que una condición sea verdadera
    // 'toBeTruthy()' verifica que el componente existe y no es null, undefined, false, 0, etc.
    // Esta es la prueba más básica: que el componente puede ser instanciado sin errores
    expect(component).toBeTruthy();
  });

  // PRUEBA DE PROPIEDAD: Verifica que el año actual se calcula correctamente
  it('should have the correct current year', () => {
    // Obtenemos el año actual usando JavaScript nativo
    // Esto nos sirve como valor de referencia para comparar
    const expectedYear = new Date().getFullYear();
    
    // Verificamos que la propiedad 'currentYear' del componente sea igual al año actual
    // Esta prueba asegura que el footer siempre muestre el año correcto
    expect(component.currentYear).toBe(expectedYear);
  });

  // PRUEBA DE PROPIEDAD: Verifica que la versión es la correcta
  it('should have the correct version', () => {
    // Verificamos que la propiedad 'version' del componente tenga el valor esperado '1.0.0'
    // Esta es una prueba de un valor fijo/hardcodeado en el componente
    // Asegura que la versión mostrada en el footer sea la correcta
    expect(component.version).toBe('1.0.0');
  });
});