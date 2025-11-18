// Importamos las herramientas necesarias para testing en Angular
import { TestBed } from '@angular/core/testing';
// Importamos el servicio que vamos a probar
import { SidebarStateService } from './sidebar-state';

// Suite de pruebas para el SidebarStateService
// Este servicio maneja el estado de apertura/cierre del sidebar (panel lateral)
describe('SidebarStateService', () => {
  let service: SidebarStateService; // Instancia del servicio que vamos a probar

  // Configuración que se ejecuta ANTES de cada prueba individual
  beforeEach(() => {
    // Configuramos el módulo de testing de Angular
    TestBed.configureTestingModule({
      providers: [SidebarStateService] // Proveemos el servicio que vamos a probar
    });

    // Obtenemos la instancia del servicio desde el TestBed
    // TestBed.inject() es la forma moderna de obtener servicios en Angular
    service = TestBed.inject(SidebarStateService);
  });

  // ==========================================
  // PRUEBA BÁSICA DE CREACIÓN DEL SERVICIO
  // ==========================================
  it('should be created', () => {
    // Verificamos que el servicio se haya creado correctamente
    // toBeTruthy() significa que la instancia existe y no es null, undefined, false, 0, etc.
    expect(service).toBeTruthy();
  });

  // ==========================================
  // PRUEBA DEL VALOR POR DEFECTO (INICIAL)
  // ==========================================
  it('should have isOpen = true by default', () => {
    // Verificamos el estado inicial del sidebar
    // Por defecto, el sidebar debería estar abierto (isOpen = true)
    // Esto es importante porque define el comportamiento inicial de la aplicación
    expect(service.isOpen).toBeTrue();
  });

  // ==========================================
  // PRUEBA DE LA FUNCIÓN TOGGLE (ALTERNAR)
  // ==========================================
  it('should toggle isOpen value', () => {
    // Guardamos el estado inicial para poder compararlo después
    const initialState = service.isOpen;
    
    // Ejecutamos la función toggle() que estamos probando
    // toggle() debería cambiar el estado (de true a false, o de false a true)
    service.toggle();

    // Verificamos que el estado haya cambiado al valor opuesto del inicial
    // Si initialState era true, ahora debería ser false, y viceversa
    expect(service.isOpen).toBe(!initialState);
  });

  // ==========================================
  // PRUEBA DE TOGGLE MÚLTIPLE (CICLO COMPLETO)
  // ==========================================
  it('should toggle back to initial value after two toggles', () => {
    // Guardamos el estado inicial para referencia futura
    const initialState = service.isOpen;

    // Ejecutamos toggle() dos veces consecutivas
    service.toggle(); // Primer toggle - cambia al estado opuesto
    service.toggle(); // Segundo toggle - debería volver al estado original

    // Verificamos que después de dos toggles, volvemos al estado inicial
    // Esto prueba que toggle() es una función que alterna entre dos estados
    // y que es reversible
    expect(service.isOpen).toBe(initialState);
  });
});