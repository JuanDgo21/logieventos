import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

// Componente que vamos a probar
import { PersonnelTypeListComponent } from './personnel-type-list';

// Servicios que el componente utiliza
import { PersonnelService } from '../../../core/services/personnel';

// Interfaces y componentes relacionados
import { PersonnelType } from '../../../shared/interfaces/personnel-type';
import { PersonnelTypeFormComponent } from '../personnel-type-form/personnel-type-form';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal';

// Bloque principal de pruebas para el componente PersonnelTypeListComponent
describe('PersonnelTypeListComponent', () => {
  // Variables fundamentales para las pruebas
  let component: PersonnelTypeListComponent; // Instancia del componente a probar
  let fixture: ComponentFixture<PersonnelTypeListComponent>; // Entorno de prueba del componente

  // Objetos simulados (mocks) que nos permiten controlar y verificar el comportamiento de los servicios
  let mockPersonnelService: any; // Servicio para gestionar tipos de personal
  let mockModalService: jasmine.SpyObj<NgbModal>; // Servicio para abrir modales
  
  // BehaviorSubject para controlar el stream de datos de tipos de personal
  // BehaviorSubject es un tipo especial de Observable que mantiene el último valor emitido
  let typesSubject: BehaviorSubject<PersonnelType[]>;

  // Datos de prueba simulados - representan tipos de personal
  const mockTypes: PersonnelType[] = [
    {
      _id: '1',
      name: 'Administrativo',
      description: 'Personal de oficina',
      isActive: true, // Tipo activo
      createdBy: 'admin',
      createdAt: '2024-01-01',
      updatedAt_: '2024-01-01'
    },
    {
      _id: '2',
      name: 'Operativo',
      description: 'Personal de campo',
      isActive: false, // Tipo inactivo
      createdBy: 'admin',
      createdAt: '2024-01-01',
      updatedAt_: '2024-01-01'
    }
  ];

  // Configuración que se ejecuta antes de cada prueba individual
  beforeEach(async () => {
    // 1. Configurar Mock del Service de Personal
    // Inicializamos el BehaviorSubject con array vacío - simula estado inicial sin datos
    typesSubject = new BehaviorSubject<PersonnelType[]>([]);
    
    // Crear objeto simulado (spy) para el servicio de personal
    mockPersonnelService = jasmine.createSpyObj('PersonnelService', [
      'getAllPersonnelTypes', // Método para obtener todos los tipos
      'updatePersonnelType',  // Método para actualizar un tipo
      'deletePersonnelType'   // Método para eliminar un tipo
    ]);
    
    // Conectamos el observable público del servicio al Subject que controlamos
    // Esto nos permite simular emisiones de datos desde el servicio
    mockPersonnelService.personnelTypes$ = typesSubject.asObservable();
    // Configurar respuesta por defecto exitosa para la carga inicial de tipos
    mockPersonnelService.getAllPersonnelTypes.and.returnValue(of(mockTypes));

    // 2. Configurar Mock del Servicio de Modal
    mockModalService = jasmine.createSpyObj('NgbModal', ['open']);

    // Configurar el módulo de testing de Angular con todas las dependencias necesarias
    await TestBed.configureTestingModule({
      declarations: [PersonnelTypeListComponent], // Componente bajo prueba
      imports: [FormsModule], // Módulo necesario para formularios en el template
      schemas: [CUSTOM_ELEMENTS_SCHEMA], // Ignorar elementos HTML personalizados no reconocidos
      providers: [
        // Proporcionar los servicios simulados en lugar de los reales
        { provide: PersonnelService, useValue: mockPersonnelService },
        { provide: NgbModal, useValue: mockModalService }
      ]
    })
    .compileComponents(); // Compilar el componente y su template

    // Crear el componente dentro del entorno de prueba
    fixture = TestBed.createComponent(PersonnelTypeListComponent);
    component = fixture.componentInstance;
    // NOTA: No ejecutamos fixture.detectChanges() aquí para controlar cuándo se dispara ngOnInit()
  });

  // =================================================
  // PRUEBAS DE INICIALIZACIÓN Y CARGA DE DATOS
  // =================================================

  // Prueba: el componente debe crearse y cargar datos al inicializarse
  it('should create and load data on init', () => {
    // Ejecutamos detección de cambios que dispara ngOnInit() y la carga inicial de datos
    fixture.detectChanges(); 

    // Verificar que el componente se creó exitosamente
    expect(component).toBeTruthy();
    // Verificar que se llamó al método para cargar todos los tipos de personal
    expect(mockPersonnelService.getAllPersonnelTypes).toHaveBeenCalled();
    
    // CORRECCIÓN IMPORTANTE SOBRE EL COMPORTAMIENTO DE isLoading:
    // Debido a que el BehaviorSubject emite síncronamente en el test,
    // isLoading pasa a true al inicio y luego inmediatamente a false cuando llegan los datos.
    // Por eso verificamos el estado final (false) en lugar del intermedio (true).
    
    // Simular emisión de datos desde el servicio mediante el BehaviorSubject
    typesSubject.next(mockTypes);
    
    // Verificar que los tipos se cargaron correctamente en el componente
    expect(component.personnelTypes).toEqual(mockTypes);
    // Verificar que el indicador de carga se desactivó después de cargar los datos
    expect(component.isLoading).toBeFalse();
  });

  // Prueba: manejo de error cuando falla la carga de datos
  it('should handle error when loading data fails', () => {
    // Configurar el servicio para devolver un error al cargar tipos
    mockPersonnelService.getAllPersonnelTypes.and.returnValue(throwError(() => new Error('API Error')));
    
    // Ejecutar detección de cambios (dispara ngOnInit que intentará cargar datos)
    fixture.detectChanges();

    // Verificar que se muestra el mensaje de error correcto
    expect(component.alertMessage).toContain('Error al cargar las categorías');
    // Verificar que el tipo de alerta es 'danger' (error)
    expect(component.alertType).toBe('danger');
  });

  // =================================================
  // PRUEBAS DE LÓGICA DE FILTRADO
  // =================================================
  describe('Filtering Logic', () => {
    // Configuración que se ejecuta antes de cada prueba en este bloque
    beforeEach(() => {
      fixture.detectChanges(); // Disparar ngOnInit y carga inicial
      typesSubject.next(mockTypes); // Emitir datos de prueba al componente
    });

    // Prueba: filtrar por término de búsqueda (case insensitive)
    it('should filter by search term (case insensitive)', () => {
      // Establecer término de búsqueda (en minúsculas)
      component.searchTerm = 'admin';
      // Aplicar filtros
      component.filterData();
      
      // Verificar que solo se encontró 1 tipo que coincide
      expect(component.filteredTypes.length).toBe(1);
      // Verificar que es el tipo correcto (nombre en mayúsculas)
      expect(component.filteredTypes[0].name).toBe('Administrativo');
    });

    // Prueba: filtrar por estado "active"
    it('should filter by status "active"', () => {
      // Establecer filtro de estado como activo
      component.statusFilter = 'active';
      // Aplicar filtros
      component.filterData();
      
      // Verificar que solo se encontró 1 tipo activo
      expect(component.filteredTypes.length).toBe(1);
      // Verificar que el tipo encontrado está activo
      expect(component.filteredTypes[0].isActive).toBeTrue();
    });

    // Prueba: filtrar por estado "inactive"
    it('should filter by status "inactive"', () => {
      // Establecer filtro de estado como inactivo
      component.statusFilter = 'inactive';
      // Aplicar filtros
      component.filterData();
      
      // Verificar que solo se encontró 1 tipo inactivo
      expect(component.filteredTypes.length).toBe(1);
      // Verificar que el tipo encontrado está inactivo
      expect(component.filteredTypes[0].isActive).toBeFalse();
    });

    // Prueba: combinar filtros de búsqueda y estado
    it('should combine search and status filters', () => {
      // Configurar filtros que no deberían coincidir con ningún tipo
      component.searchTerm = 'Admin'; // Busca "Administrativo" 
      component.statusFilter = 'inactive'; // Pero "Administrativo" está activo
      component.filterData();
      
      // Verificar que no se encontraron tipos que cumplan ambas condiciones
      expect(component.filteredTypes.length).toBe(0);
    });

    // Prueba: reinicio de filtros debe restaurar la lista completa
    it('should reset filters correctly', () => {
      // Establecer filtros con valores específicos
      component.searchTerm = 'algo';
      component.statusFilter = 'inactive';
      // Aplicar filtros (dejaría solo tipos inactivos que contengan "algo")
      component.filterData();
      
      // Ejecutar reinicio de filtros
      component.resetFilters();

      // Verificar que los filtros volvieron a sus valores por defecto
      expect(component.searchTerm).toBe('');
      expect(component.statusFilter).toBe('all');
      // Verificar que se muestran todos los tipos nuevamente
      expect(component.filteredTypes.length).toBe(2);
    });
  });

  // =================================================
  // PRUEBAS DE FORMULARIO MODAL (ABRIR/GUARDAR)
  // =================================================
  describe('openTypeForm', () => {
    let mockModalRef: any;

    // Configuración que se ejecuta antes de cada prueba en este bloque
    beforeEach(() => {
      // Simular referencia de modal con comportamiento por defecto exitoso
      mockModalRef = {
        componentInstance: {}, // Instancia del componente del modal
        result: Promise.resolve('saved') // Comportamiento por defecto: guardado exitoso
      };
      // Configurar el servicio de modales para devolver nuestro modal simulado
      mockModalService.open.and.returnValue(mockModalRef);
      // Inicializar el componente
      fixture.detectChanges();
    });

    // Prueba: abrir modal para crear nuevo tipo
    it('should open modal for creating new type', fakeAsync(() => {
      // Abrir formulario en modo creación (sin pasar tipo existente)
      component.openTypeForm();

      // Verificar que se abrió el modal correcto con la configuración adecuada
      expect(mockModalService.open).toHaveBeenCalledWith(PersonnelTypeFormComponent, jasmine.any(Object));
      // Verificar que no se pasó tipo existente (modo creación)
      expect(mockModalRef.componentInstance.type).toBeNull();

      // Avanzar el tiempo para resolver la promesa del modal
      tick();

      // Verificar que se muestra mensaje de éxito para creación
      expect(component.alertMessage).toBe('Categoría creada');
      expect(component.alertType).toBe('success');
      // Verificar que se recargaron los datos (2 veces: inicial + después de guardar)
      expect(mockPersonnelService.getAllPersonnelTypes).toHaveBeenCalledTimes(2);
    }));

    // Prueba: abrir modal para editar tipo existente
    it('should open modal for editing existing type', fakeAsync(() => {
      // Seleccionar tipo a editar
      const typeToEdit = mockTypes[0];
      // Abrir formulario en modo edición (pasando tipo existente)
      component.openTypeForm(typeToEdit);

      // Verificar que se pasaron los datos correctos al modal
      expect(mockModalRef.componentInstance.type).toEqual(typeToEdit);

      // Avanzar el tiempo para resolver la promesa
      tick();

      // Verificar que se muestra mensaje de éxito para actualización
      expect(component.alertMessage).toBe('Categoría actualizada');
    }));

    // Prueba: no hacer nada si el modal es cancelado
    it('should do nothing if modal is dismissed', fakeAsync(() => {
      // Configurar el modal para rechazar (simular cancelación)
      mockModalRef.result = Promise.reject('dismissed');
      
      // Abrir formulario
      component.openTypeForm();
      // Avanzar el tiempo para ejecutar el bloque catch
      tick();

      // Verificar que NO se recargaron los datos (solo la carga inicial)
      expect(mockPersonnelService.getAllPersonnelTypes).toHaveBeenCalledTimes(1);
    }));
  });

  // =================================================
  // PRUEBAS DE CAMBIO DE ESTADO (ACTIVAR/DESACTIVAR)
  // =================================================
  describe('toggleStatus', () => {
    // Configuración que se ejecuta antes de cada prueba en este bloque
    beforeEach(() => {
      fixture.detectChanges(); // Inicializar el componente
    });

    // Prueba: cambiar estado exitosamente (Activo -> Inactivo)
    it('should toggle status successfully (Active -> Inactive)', () => {
      const type = mockTypes[0]; // Tipo activo
      // Configurar servicio para actualizar exitosamente
      mockPersonnelService.updatePersonnelType.and.returnValue(of(type));

      // Ejecutar cambio de estado
      component.toggleStatus(type);

      // Verificar que se llamó al servicio con los parámetros correctos
      expect(mockPersonnelService.updatePersonnelType).toHaveBeenCalledWith(
        type._id,
        jasmine.objectContaining({ isActive: false }) // De activo a inactivo
      );
      // Verificar que se muestra mensaje de advertencia para desactivación
      expect(component.alertMessage).toContain('desactivada');
      expect(component.alertType).toBe('warning');
    });

    // Prueba: mostrar mensaje de éxito al activar (Inactivo -> Activo)
    it('should show success message when activating (Inactive -> Active)', () => {
      const type = mockTypes[1]; // Tipo inactivo
      // Configurar servicio para actualizar exitosamente
      mockPersonnelService.updatePersonnelType.and.returnValue(of(type));

      // Ejecutar cambio de estado
      component.toggleStatus(type);

      // Verificar que se muestra mensaje de éxito para activación
      expect(component.alertMessage).toContain('activada');
      expect(component.alertType).toBe('success');
    });

    // Prueba: manejo de error al cambiar estado
    it('should handle error on toggle status', () => {
      const type = mockTypes[0];
      // Configurar servicio para devolver error
      mockPersonnelService.updatePersonnelType.and.returnValue(throwError(() => new Error('Error')));

      // Ejecutar cambio de estado (que fallará)
      component.toggleStatus(type);

      // Verificar que se muestra mensaje de error
      expect(component.alertMessage).toBe('Error al cambiar estado');
      expect(component.alertType).toBe('danger');
    });
  });

  // =================================================
  // PRUEBAS DE OPERACIONES DE ELIMINACIÓN
  // =================================================
  describe('confirmDelete', () => {
    let mockModalRef: any;

    // Configuración que se ejecuta antes de cada prueba en este bloque
    beforeEach(() => {
      // Simular modal de confirmación
      mockModalRef = {
        componentInstance: {},
        result: Promise.resolve(true) // Comportamiento por defecto: usuario confirma
      };
      mockModalService.open.and.returnValue(mockModalRef);
      fixture.detectChanges(); // Inicializar el componente
    });

    // Prueba: abrir modal de confirmación y eliminar si se confirma
    it('should open confirm modal and delete if confirmed', fakeAsync(() => {
      // Configurar servicio para eliminar exitosamente
      mockPersonnelService.deletePersonnelType.and.returnValue(of(void 0));

      // Ejecutar confirmación de eliminación
      component.confirmDelete('123');
      
      // Verificar que se abrió el modal de confirmación
      expect(mockModalService.open).toHaveBeenCalledWith(ConfirmModalComponent);
      
      // Avanzar el tiempo para resolver la promesa
      tick();

      // Verificar que se llamó al servicio de eliminación con el ID correcto
      expect(mockPersonnelService.deletePersonnelType).toHaveBeenCalledWith('123');
      // Verificar que se muestra mensaje de éxito
      expect(component.alertMessage).toBe('Categoría eliminada');
      expect(component.alertType).toBe('success');
    }));

    // Prueba: NO eliminar si el usuario cancela la confirmación
    it('should not delete if user cancels (resolves false)', fakeAsync(() => {
      // Configurar modal para resolver con false (usuario cancela)
      mockModalRef.result = Promise.resolve(false);
      
      // Ejecutar confirmación de eliminación
      component.confirmDelete('123');
      // Avanzar el tiempo
      tick();

      // Verificar que NO se llamó al servicio de eliminación
      expect(mockPersonnelService.deletePersonnelType).not.toHaveBeenCalled();
    }));

    // NUEVO TEST: Cubre el caso donde el modal es descartado (rechazado)
    it('should handle modal dismissal (rejection) in confirmDelete', fakeAsync(() => {
      // Configurar modal para rechazar (simular que se cierra sin confirmar)
      mockModalRef.result = Promise.reject('dismissed');
      
      // Ejecutar confirmación de eliminación
      component.confirmDelete('123');
      // Avanzar el tiempo para ejecutar el bloque catch
      tick();

      // Verificar que NO se llamó al servicio de eliminación
      expect(mockPersonnelService.deletePersonnelType).not.toHaveBeenCalled();
    }));

    // Prueba: manejo de error durante la eliminación
    it('should handle error during deletion', fakeAsync(() => {
      // Configurar servicio para devolver error al eliminar
      mockPersonnelService.deletePersonnelType.and.returnValue(throwError(() => new Error('Error')));
      
      // Ejecutar eliminación (que fallará)
      component.confirmDelete('123');
      // Avanzar el tiempo
      tick();

      // Verificar que se muestra mensaje de error
      expect(component.alertMessage).toBe('Error al eliminar');
      expect(component.alertType).toBe('danger');
    }));
  });

  // =================================================
  // PRUEBAS DE TIMEOUT DE ALERTAS
  // =================================================

  // Prueba: el mensaje de alerta debe limpiarse después de 5 segundos
  it('should clear alert after 5 seconds', fakeAsync(() => {
    // Inicializar el componente
    fixture.detectChanges();
    
    // Mostrar alerta de prueba usando el método interno showAlert
    (component as any).showAlert('Test', 'success');
    // Verificar que el mensaje se estableció correctamente
    expect(component.alertMessage).toBe('Test');

    // Avanzar el tiempo 5 segundos (simula que pasó el tiempo de timeout)
    tick(5000);

    // Verificar que el mensaje se limpió automáticamente
    expect(component.alertMessage).toBe('');
  }));
});