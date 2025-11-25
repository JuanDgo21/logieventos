// Importación de módulos y dependencias necesarias para las pruebas
import { ComponentFixture, TestBed } from '@angular/core/testing';
// Importación del servicio NgbActiveModal de ng-bootstrap para manejar modales
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'; // Import necesario
// Importación del componente que vamos a probar
import { ConfirmModalComponent } from './confirm-modal';

// Bloque principal de pruebas para el componente ConfirmModalComponent
describe('ConfirmModalComponent', () => {
  // Variables que usaremos en todas las pruebas:
  let component: ConfirmModalComponent;           // Instancia del componente que vamos a probar
  let fixture: ComponentFixture<ConfirmModalComponent>;  // Fixture para manipular el componente en el entorno de testing
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;   // Spy (mock) para simular el comportamiento del modal

  // --- CONFIGURACIÓN ANTES DE CADA PRUEBA ---
  beforeEach(async () => {
    // 1. Creamos un mock (spy) de NgbActiveModal con los métodos que usa el componente
    // Un spy es un objeto simulado que puede "espiar" qué métodos se llaman y con qué parámetros
    // 'close' y 'dismiss' son los métodos que el componente utiliza para cerrar el modal
    activeModalSpy = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);

    // Configurar el módulo de testing de Angular con todas las dependencias necesarias
    await TestBed.configureTestingModule({
      // 2. Al ser standalone: false, el componente va en declarations
      // Esto significa que el componente no es standalone y debe declararse en un módulo
      declarations: [ConfirmModalComponent],
      // 3. Proveemos el mock en lugar del servicio real
      // Esto permite que el componente funcione sin necesidad del servicio real de ng-bootstrap
      providers: [
        { provide: NgbActiveModal, useValue: activeModalSpy }
      ]
    })
    .compileComponents();  // Compilar el componente y su template HTML

    // Crear la instancia del componente dentro del entorno de testing
    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;  // Obtener la instancia real del componente
    
    // Detectar cambios iniciales - esto activa el ciclo de detección de cambios de Angular
    // y permite que el componente se renderice y se inicialicen todas las propiedades
    fixture.detectChanges();
  });

  // --- PRUEBA BÁSICA: CREACIÓN DEL COMPONENTE ---
  // Esta es la prueba más fundamental - verifica que el componente se puede instanciar correctamente
  it('should create', () => {
    // Si el componente se crea sin errores y es "truthy" (no es null, undefined, false, 0, etc.),
    // entonces la prueba pasa. Si falla, indica problemas graves en la configuración del componente.
    expect(component).toBeTruthy();
  });

  // --- PRUEBA: VALORES POR DEFECTO DE LAS PROPIEDADES DE ENTRADA (@Input) ---
  // Esta prueba verifica que las propiedades del componente tienen los valores por defecto correctos
  it('should match default input values', () => {
    // Validamos que los @Input tengan sus valores por defecto:
    
    // Título por defecto del modal de confirmación
    expect(component.title).toBe('Confirmar acción');
    
    // Mensaje por defecto que se muestra al usuario
    expect(component.message).toBe('¿Estás seguro de que deseas realizar esta acción?');
    
    // Texto por defecto del botón de confirmación
    expect(component.confirmText).toBe('Confirmar');
    
    // Texto por defecto del botón de cancelación
    expect(component.cancelText).toBe('Cancelar');
    
    // Clase CSS por defecto para el botón de confirmación (estilo visual)
    expect(component.confirmClass).toBe('btn-primary');
    
    // Indica si se muestra el botón de cerrar (X) en la esquina superior derecha
    expect(component.showCloseButton).toBeTrue();
  });

  // --- PRUEBA: CONFIRMACIÓN DEL MODAL ---
  // Esta prueba verifica que cuando el usuario confirma la acción, el modal se cierra correctamente
  it('should call activeModal.close(true) when confirm() is called', () => {
    // Simulamos que el usuario hace clic en el botón "Confirmar"
    // Esto ejecuta el método confirm() del componente
    component.confirm();

    // Verificamos que se haya llamado al método close del servicio NgbActiveModal
    // con el argumento 'true', que indica que el usuario confirmó la acción
    // El valor 'true' se pasa al componente que abrió este modal para que sepa que debe proceder
    expect(activeModalSpy.close).toHaveBeenCalledWith(true);
  });

  // --- PRUEBA: CANCELACIÓN DEL MODAL ---
  // Esta prueba verifica que cuando el usuario cancela la acción, el modal se descarta correctamente
  it('should call activeModal.dismiss() when dismiss() is called', () => {
    // Simulamos que el usuario hace clic en el botón "Cancelar" o en la X de cerrar
    // Esto ejecuta el método dismiss() del componente
    component.dismiss();

    // Verificamos que se haya llamado al método dismiss del servicio NgbActiveModal
    // dismiss() cierra el modal sin pasar ningún valor, indicando que el usuario canceló la acción
    // El componente que abrió este modal sabrá que no debe proceder con la acción
    expect(activeModalSpy.dismiss).toHaveBeenCalled();
  });
});