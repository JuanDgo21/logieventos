// Importación de módulos y dependencias necesarias para las pruebas
import { ComponentFixture, TestBed } from '@angular/core/testing';
// Importación del componente a probar y su interfaz de datos
import { AlertModalComponent, AlertData } from './alert-modal';
// Importación de dependencias de Angular Material Dialog necesarias para el componente
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

// Bloque principal de pruebas para el componente AlertModalComponent
describe('AlertModalComponent', () => {
  // Variables que usaremos en todas las pruebas:
  let component: AlertModalComponent;           // Instancia del componente que vamos a probar
  let fixture: ComponentFixture<AlertModalComponent>;  // Fixture para manipular el componente en el entorno de testing
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AlertModalComponent>>;  // Spy (mock) para simular el comportamiento del diálogo

  // --- DATOS DE PRUEBA MOCK (SIMULADOS) ---
  // Creamos datos de prueba que simulan los datos que recibiría el componente en una situación real
  const mockData: AlertData = {
    title: 'Título de Prueba',      // Título simulado para la alerta
    message: 'Mensaje de Prueba',   // Mensaje simulado para la alerta
    type: 'create',                 // Tipo de alerta: create, update, delete, auth, etc.
    showReload: true,               // Indica si debe mostrar opción de recargar
    userRole: 'admin'               // Rol del usuario para personalizar la alerta
  };

  // --- CONFIGURACIÓN ANTES DE CADA PRUEBA ---
  beforeEach(async () => {
    // Crear un Spy (objeto simulado) para MatDialogRef con el método 'close'
    // Un Spy nos permite observar si se llaman los métodos y con qué parámetros
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    // Configurar el módulo de testing de Angular con todas las dependencias necesarias
    await TestBed.configureTestingModule({
      imports: [AlertModalComponent],  // Importar el componente (puede ser standalone)
      providers: [
        // Proveer el mock de MatDialogRef en lugar del servicio real
        // Esto permite controlar el comportamiento del diálogo en las pruebas
        { provide: MatDialogRef, useValue: dialogRefSpy },
        
        // Proveer los datos mock que el componente espera recibir a través de MAT_DIALOG_DATA
        // MAT_DIALOG_DATA es el token de inyección que Angular Material usa para pasar datos al diálogo
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    }).compileComponents();  // Compilar el componente y su template

    // Crear la instancia del componente dentro del entorno de testing
    fixture = TestBed.createComponent(AlertModalComponent);
    component = fixture.componentInstance;  // Obtener la instancia real del componente
    
    // Detectar cambios iniciales - esto activa el ciclo de detección de cambios de Angular
    // y permite que el componente se renderice con los datos proporcionados
    fixture.detectChanges();
  });

  // --- PRUEBA BÁSICA: CREACIÓN DEL COMPONENTE ---
  // Esta es la prueba más fundamental - verifica que el componente se puede instanciar correctamente
  it('should create', () => {
    // Si el componente se crea sin errores y es "truthy" (no es null, undefined, false, 0, etc.),
    // entonces la prueba pasa. Si falla, indica problemas graves en la configuración del componente.
    expect(component).toBeTruthy();
  });

  // --- PRUEBA: COLORES DE FONDO SEGÚN EL TIPO DE ALERTA ---
  // Esta prueba verifica que el componente asigna los colores de fondo correctos según el tipo de alerta
  it('should return correct background colors', () => {
    // Definimos un array de casos de prueba con diferentes tipos de alerta y los colores esperados
    const cases: { type: any, expected: string }[] = [
      { type: 'create', expected: 'bg-orange-500' },   // Creación: color naranja
      { type: 'update', expected: 'bg-blue-500' },     // Actualización: color azul
      { type: 'delete', expected: 'bg-red-500' },      // Eliminación: color rojo
      { type: 'auth', expected: 'bg-purple-500' },     // Autenticación: color morado
      { type: 'unknown', expected: 'bg-gray-500' }     // Tipo desconocido: color gris (por defecto)
    ];

    // Iteramos sobre cada caso de prueba
    cases.forEach(c => {
      // Para cada caso, actualizamos los datos del componente con el tipo específico
      component.data = { ...mockData, type: c.type };
      
      // Verificamos que la propiedad bgColor devuelva el color esperado
      // bgColor es probablemente un getter que calcula el color basado en data.type
      expect(component.bgColor).toBe(c.expected);
    });
  });

  // --- PRUEBA: CIERRE DEL DIÁLOGO ---
  // Esta prueba verifica que el método close() funciona correctamente
  it('should close the dialog', () => {
    // Ejecutamos el método close() del componente
    // En un escenario real, esto se llamaría cuando el usuario hace clic en un botón de cerrar
    component.close();
    
    // Verificamos que el método close() del diálogo (dialogRefSpy) fue llamado
    // Esto asegura que el componente está comunicándose correctamente con el servicio de diálogo
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });
});