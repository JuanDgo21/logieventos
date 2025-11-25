// Importación de módulos y dependencias necesarias para las pruebas
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EventTypeComponent } from './event-type';
import { EventService, PersonnelType } from '../../../core/services/event';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { EventType } from '../../../shared/interfaces/event-type';

// Bloque principal de pruebas para el componente EventTypeComponent
describe('EventTypeComponent', () => {
  let component: EventTypeComponent;  // Instancia del componente a probar
  let fixture: ComponentFixture<EventTypeComponent>;  // Fixture para manipular el componente
  let eventServiceSpy: jasmine.SpyObj<EventService>;  // Mock del servicio de eventos

  // --- Mocks de Datos para usar en las pruebas ---
  const mockEventTypes: EventType[] = [
    {
      _id: '1',
      name: 'Boda',
      description: 'Evento matrimonial',
      defaultResources: [
        { resourceType: 'mobiliario', description: 'Sillas Tiffany', defaultQuantity: 100 }
      ],
      requiredPersonnelType: 'p1',
      estimatedDuration: 6,
      category: 'social',
      additionalRequirements: ['Licencia de licor', 'Permiso de ruido'],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '2',
      name: 'Conferencia Tech',
      description: 'Evento empresarial',
      defaultResources: [],
      requiredPersonnelType: 'p2',
      estimatedDuration: 8,
      category: 'corporativo',
      additionalRequirements: [],
      active: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockPersonnelTypes: PersonnelType[] = [
    { _id: 'p1', name: 'Mesero' },
    { _id: 'p2', name: 'Técnico de Sonido' }
  ];

  // --- Subjects para simular flujos reactivos de datos ---
  let eventTypesSubject: BehaviorSubject<EventType[]>;
  let personnelTypesSubject: BehaviorSubject<PersonnelType[]>;

  // Configuración que se ejecuta antes de cada prueba
  beforeEach(async () => {
    // Inicializar Subjects con los datos mock
    eventTypesSubject = new BehaviorSubject<EventType[]>(mockEventTypes);
    personnelTypesSubject = new BehaviorSubject<PersonnelType[]>(mockPersonnelTypes);

    // Crear Spy (mock) del Servicio de Eventos con métodos específicos
    eventServiceSpy = jasmine.createSpyObj('EventService', [
      'getAllEventTypes',
      'getAllPersonnelTypes',
      'createEventType',
      'updateEventType',
      'deleteEventType'
    ], {
      // Conectar los observables a los subjects para simular flujos de datos en tiempo real
      eventTypes$: eventTypesSubject.asObservable(),
      personnelTypes$: personnelTypesSubject.asObservable()
    });

    // Configurar retornos por defecto para los métodos del servicio
    eventServiceSpy.getAllEventTypes.and.returnValue(of(mockEventTypes));
    eventServiceSpy.getAllPersonnelTypes.and.returnValue(of(mockPersonnelTypes));

    // Configurar el módulo de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [EventTypeComponent],  // Componente a probar
      imports: [
        ReactiveFormsModule, // Necesario para formGroup y formArray (formularios reactivos)
        FormsModule          // Necesario para [(ngModel)] en filtros (two-way binding)
      ],
      providers: [
        { provide: EventService, useValue: eventServiceSpy }  // Proveer el mock del servicio
      ],
      schemas: [NO_ERRORS_SCHEMA]  // Ignorar errores de componentes hijos no declarados
    }).compileComponents();

    // Crear instancia del componente
    fixture = TestBed.createComponent(EventTypeComponent);
    component = fixture.componentInstance;

    // Mocks globales para evitar popups y ruido en consola durante las pruebas
    spyOn(window, 'alert');        // Evitar alerts reales
    spyOn(window, 'confirm').and.returnValue(true);  // Simular confirmaciones aceptadas
    spyOn(console, 'error');       // Silenciar errores de consola esperados

    fixture.detectChanges(); // Dispara ngOnInit -> loadData (inicialización del componente)
  });

  // Prueba básica: Verificar que el componente se crea correctamente
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- 1. PRUEBAS DE INICIALIZACIÓN Y CARGA DE DATOS ---

  // Prueba: Verificar que se cargan los datos iniciales correctamente
  it('should load initial data correctly', () => {
    // Verificar que se llamaron los métodos del servicio para cargar datos
    expect(eventServiceSpy.getAllEventTypes).toHaveBeenCalled();
    expect(eventServiceSpy.getAllPersonnelTypes).toHaveBeenCalled();
    
    // Verificar que los datos se cargaron correctamente en el componente
    expect(component.eventTypes.length).toBe(2);        // 2 tipos de evento cargados
    expect(component.personnelTypes.length).toBe(2);    // 2 tipos de personal cargados
    expect(component.isLoading).toBeFalse();            // Loading desactivado después de cargar
  });

  // Prueba: Manejar errores durante la carga de datos
  it('should handle errors during data loading', () => {
    // Configurar un subject que emita error para simular fallo en la API
    const errorSubject = new BehaviorSubject<EventType[]>([]);
    (Object.getOwnPropertyDescriptor(eventServiceSpy, 'eventTypes$')?.get as jasmine.Spy).and.returnValue(throwError(() => new Error('API Error')));
    
    // Ejecutar carga de datos (debería manejar el error)
    component.loadData();
    
    // Verificar que se capturó el error en consola
    expect(console.error).toHaveBeenCalledWith('Error al cargar los tipos de evento', jasmine.any(Error));
    // Verificar que el loading se desactiva incluso con error
    expect(component.isLoading).toBeFalse();
  });

  // --- 2. PRUEBAS DE FILTROS ---

  // Prueba: Filtrar por término de búsqueda en el nombre
  it('should filter by search term (name)', () => {
    // Establecer término de búsqueda que coincide con un nombre
    component.searchTerm = 'Boda';
    // Aplicar filtros
    component.applyFilters();
    // Verificar que solo queda 1 tipo de evento filtrado
    expect(component.filteredEventTypes.length).toBe(1);
    // Verificar que es el tipo de evento correcto
    expect(component.filteredEventTypes[0].name).toBe('Boda');
  });

  // Prueba: Filtrar por término de búsqueda en la descripción
  it('should filter by search term (description)', () => {
    // Establecer término de búsqueda que coincide con una descripción
    component.searchTerm = 'empresarial';
    // Aplicar filtros
    component.applyFilters();
    // Verificar que solo queda 1 tipo de evento filtrado
    expect(component.filteredEventTypes.length).toBe(1);
    // Verificar que es el tipo de evento correcto
    expect(component.filteredEventTypes[0].name).toBe('Conferencia Tech');
  });

  // Prueba: Filtrar por categoría
  it('should filter by category', () => {
    // Seleccionar categoría específica
    component.selectedCategory = 'corporativo';
    // Aplicar filtros
    component.applyFilters();
    // Verificar que solo queda 1 tipo de evento filtrado
    expect(component.filteredEventTypes.length).toBe(1);
    // Verificar que tiene la categoría correcta
    expect(component.filteredEventTypes[0].category).toBe('corporativo');
  });

  // Prueba: Mostrar todos los elementos cuando los filtros coinciden con todo
  it('should show all when filters match everything', () => {
    // Configurar filtros que no excluyen ningún elemento
    component.searchTerm = '';           // Término de búsqueda vacío
    component.selectedCategory = 'all';  // Categoría "todas"
    // Aplicar filtros
    component.applyFilters();
    // Verificar que se muestran todos los tipos de evento
    expect(component.filteredEventTypes.length).toBe(2);
  });

  // --- 3. PRUEBAS DE GESTIÓN DE FormArray (RECURSOS Y REQUERIMIENTOS) ---

  // Prueba: Agregar y eliminar recursos del formulario
  it('should add and remove resources', () => {
    // Al iniciar, el formulario está vacío (0 recursos)
    component.initializeForm(); // Reinicia el formulario limpio
    expect(component.defaultResources.length).toBe(0); // Verificar que está vacío

    // Agregar un recurso al formulario
    component.addResource();
    expect(component.defaultResources.length).toBe(1); // Ahora tiene 1 recurso

    // Eliminar el recurso agregado
    component.removeResource(0);
    expect(component.defaultResources.length).toBe(0); // Vuelve a estar vacío
  });

  // Prueba: Agregar y eliminar requerimientos adicionales del formulario
  it('should add and remove additional requirements', () => {
    // Inicializar formulario limpio
    component.initializeForm();
    expect(component.additionalRequirements.length).toBe(0); // Sin requerimientos

    // Agregar un requerimiento
    component.addRequirement();
    expect(component.additionalRequirements.length).toBe(1); // Ahora tiene 1 requerimiento

    // Eliminar el requerimiento
    component.removeRequirement(0);
    expect(component.additionalRequirements.length).toBe(0); // Vuelve a estar vacío
  });

  // --- 4. PRUEBAS DE MODALES (APERTURA Y CIERRE) ---

  // Prueba: Abrir modal para CREAR nuevo tipo de evento
  it('should open modal for CREATE', () => {
    // Abrir modal en modo creación
    component.openModal('create');
    
    // Verificaciones del estado del modal
    expect(component.showModal).toBeTrue();          // Modal visible
    expect(component.isEditing).toBeFalse();         // No está en modo edición
    expect(component.currentEventTypeId).toBeNull(); // No hay ID (es creación)
    
    // openModal('create') llama a addResource por defecto, así que debe tener 1 recurso
    expect(component.defaultResources.length).toBe(1);
  });

  // Prueba: Abrir modal para EDITAR y cargar datos existentes
  it('should open modal for EDIT and patch form arrays', () => {
    // Seleccionar tipo de evento a editar (tiene 1 recurso y 2 requerimientos)
    const typeToEdit = mockEventTypes[0];
    // Abrir modal en modo edición
    component.openModal('edit', typeToEdit);

    // Verificaciones del estado del modal
    expect(component.showModal).toBeTrue();          // Modal visible
    expect(component.isEditing).toBeTrue();          // Está en modo edición
    expect(component.currentEventTypeId).toBe('1');  // ID del tipo de evento guardado
    expect(component.eventTypeForm.value.name).toBe('Boda'); // Nombre cargado correctamente
    
    // Verificar que se llenaron los FormArrays con los datos existentes
    expect(component.defaultResources.length).toBe(1); // 1 recurso cargado
    expect(component.defaultResources.at(0).value.description).toBe('Sillas Tiffany'); // Descripción correcta
    
    expect(component.additionalRequirements.length).toBe(2); // 2 requerimientos cargados
    expect(component.additionalRequirements.at(0).value).toBe('Licencia de licor'); // Primer requerimiento correcto
  });

  // Prueba: Cerrar modal y resetear formulario
  it('should close modal and reset form', () => {
    // Configurar modal abierto con datos
    component.showModal = true;
    component.currentEventTypeId = '123';
    
    // Cerrar modal
    component.closeModal();
    
    // Verificaciones después de cerrar
    expect(component.showModal).toBeFalse();         // Modal oculto
    expect(component.currentEventTypeId).toBeNull(); // ID limpiado
    
    // Al resetear, el formulario debería estar en estado inicial/limpio
    expect(component.eventTypeForm.value.name).toBeNull(); 
  });

  // --- 5. PRUEBAS DE GUARDADO (CREACIÓN Y ACTUALIZACIÓN) ---

  // Prueba: Mostrar alerta si el formulario es inválido al guardar
  it('should alert if form is invalid on save', () => {
    // Inicializar formulario vacío (inválido)
    component.initializeForm();
    // Intentar guardar formulario inválido
    component.saveEventType();
    
    // Verificar que se mostró alerta de campos incompletos
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/completa todos los campos/));
    // Verificar que NO se llamó al servicio de creación
    expect(eventServiceSpy.createEventType).not.toHaveBeenCalled();
  });

  // Prueba: CREAR nuevo tipo de evento cuando el formulario es válido
  it('should CREATE a new event type when form is valid', () => {
    // Abrir modal de creación
    component.openModal('create');
    
    // Llenar formulario con datos válidos
    component.eventTypeForm.patchValue({
      name: 'Nuevo Tipo',
      category: 'social',
      requiredPersonnelType: 'p1',
      estimatedDuration: 5
    });
    
    // Llenar datos válidos para el recurso por defecto
    component.defaultResources.at(0).patchValue({
      resourceType: 'otros',
      description: 'Desc',
      defaultQuantity: 1
    });

    // Configurar servicio para éxito en creación
    eventServiceSpy.createEventType.and.returnValue(of({} as any));

    // Ejecutar guardado
    component.saveEventType();

    // Verificaciones después de guardar
    expect(eventServiceSpy.createEventType).toHaveBeenCalled(); // Servicio llamado
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/creado correctamente/)); // Mensaje de éxito
    expect(component.showModal).toBeFalse(); // Modal cerrado después de guardar
  });

  // Prueba: ACTUALIZAR tipo de evento existente cuando está editando
  it('should UPDATE an event type when editing', () => {
    // Seleccionar tipo de evento a editar
    const typeToEdit = mockEventTypes[0];
    // Abrir modal de edición (el formulario se llena automáticamente con datos válidos)
    component.openModal('edit', typeToEdit);
    
    // Configurar servicio para éxito en actualización
    eventServiceSpy.updateEventType.and.returnValue(of({} as any));

    // Ejecutar guardado
    component.saveEventType();

    // Verificaciones después de guardar
    expect(eventServiceSpy.updateEventType).toHaveBeenCalledWith('1', jasmine.any(Object)); // Servicio llamado con ID y datos
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/actualizado correctamente/)); // Mensaje de éxito
    expect(component.showModal).toBeFalse(); // Modal cerrado después de guardar
  });

  // Prueba: Manejar error en creación
  it('should handle create error', () => {
    // Abrir modal de creación
    component.openModal('create');
    
    // Llenar formulario con datos válidos
    component.eventTypeForm.patchValue({ name: 'Valid', category: 'social', requiredPersonnelType: 'p1', estimatedDuration: 1 });
    component.defaultResources.at(0).patchValue({ resourceType: 'otros', description: 'D', defaultQuantity: 1 });

    // Configurar servicio para error en creación
    eventServiceSpy.createEventType.and.returnValue(throwError(() => new Error('API Fail')));

    // Ejecutar guardado (debería manejar el error)
    component.saveEventType();
    
    // Verificar que se mostró alerta de error
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/Error al crear/));
  });

  // Prueba: Manejar error en actualización
  it('should handle update error', () => {
    // Abrir modal de edición con datos existentes
    component.openModal('edit', mockEventTypes[0]);
    
    // Configurar servicio para error en actualización
    eventServiceSpy.updateEventType.and.returnValue(throwError(() => new Error('API Fail')));

    // Ejecutar guardado (debería manejar el error)
    component.saveEventType();
    
    // Verificar que se mostró alerta de error
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/Error al actualizar/));
  });

  // --- 6. PRUEBAS DE ELIMINACIÓN ---

  // Prueba: Eliminar tipo de evento después de confirmación
  it('should delete event type after confirmation', () => {
    // Configurar servicio para éxito en eliminación
    eventServiceSpy.deleteEventType.and.returnValue(of(void 0));
    
    // Ejecutar eliminación con confirmación
    component.confirmDelete(mockEventTypes[0]);
    
    // Verificaciones después de eliminar
    expect(eventServiceSpy.deleteEventType).toHaveBeenCalledWith('1'); // Servicio llamado con ID correcto
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/eliminado correctamente/)); // Mensaje de éxito
  });

  // Prueba: NO eliminar si se cancela la confirmación
  it('should NOT delete if confirmation is cancelled', () => {
    // Configurar confirmación para devolver false (usuario canceló)
    (window.confirm as jasmine.Spy).and.returnValue(false);
    
    // Intentar eliminar (no debería proceder)
    component.confirmDelete(mockEventTypes[0]);
    
    // Verificar que NO se llamó al servicio de eliminación
    expect(eventServiceSpy.deleteEventType).not.toHaveBeenCalled();
  });

  // Prueba: Manejar error en eliminación
  it('should handle delete error', () => {
    // Configurar servicio para error en eliminación
    eventServiceSpy.deleteEventType.and.returnValue(throwError(() => new Error('Del Err')));
    
    // Ejecutar eliminación (debería manejar el error)
    component.confirmDelete(mockEventTypes[0]);
    
    // Verificar que se mostró alerta de error
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/Error al eliminar/));
  });

  // --- 7. PRUEBAS DE CAMBIO DE ESTADO (ACTIVO/INACTIVO) ---

  // Prueba: Cambiar estado exitosamente (toggle)
  it('should toggle status successfully', () => {
    // Crear item que inicia como activo
    const item = { ...mockEventTypes[0], active: true };
    // Item esperado después del cambio (inactivo)
    const updatedItem = { ...item, active: false };

    // Configurar servicio para éxito en actualización
    eventServiceSpy.updateEventType.and.returnValue(of(updatedItem));

    // Ejecutar cambio de estado
    component.onStatusChange(item);

    // Verificar que se llamó al servicio con el estado INVERTIDO
    expect(eventServiceSpy.updateEventType).toHaveBeenCalledWith(
      item._id, 
      jasmine.objectContaining({ active: false }) // Estado cambiado a false
    );
    
    // Verificar que se actualizó el item en la lista local del componente
    const localItem = component.eventTypes.find(t => t._id === item._id);
    expect(localItem?.active).toBeFalse(); // Ahora está inactivo
  });

  // Prueba: Manejar error al cambiar estado
  it('should handle error when toggling status', () => {
    // Seleccionar item para cambiar estado
    const item = mockEventTypes[0];
    
    // Configurar servicio para error en actualización
    eventServiceSpy.updateEventType.and.returnValue(throwError(() => new Error('Toggle Err')));

    // Ejecutar cambio de estado (debería manejar el error)
    component.onStatusChange(item);

    // Verificar que se mostró alerta de error
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/Error al actualizar el estado/));
  });

  // --- 8. PRUEBAS DE COBERTURA DE RAMAS FALTANTES (CASOS ESPECIALES) ---

  // Prueba: Manejar arrays undefined al abrir modal de edición
  it('should handle missing arrays in openModal (edit mode)', () => {
    // Crear tipo de evento "incompleto" donde los arrays son undefined
    const sparseType = { ...mockEventTypes[0], defaultResources: undefined, additionalRequirements: undefined } as any;
    
    // Abrir modal de edición con datos incompletos (no debería generar error)
    component.openModal('edit', sparseType);
    
    // Verificar que se manejaron los arrays undefined correctamente
    expect(component.defaultResources.length).toBe(0); // Array de recursos vacío
    expect(component.additionalRequirements.length).toBe(0); // Array de requerimientos vacío
  });

  // Prueba: Manejar item no encontrado al cambiar estado
  it('should handle updating item not found in onStatusChange', () => {
    // Crear item "fantasma" con ID que no existe en la lista local
    const phantomItem = { ...mockEventTypes[0], _id: '999' };
    
    // Configurar servicio para éxito (aunque el item no existe localmente)
    eventServiceSpy.updateEventType.and.returnValue(of(phantomItem));

    // Ejecutar cambio de estado (no debería generar error aunque el item no esté en la lista)
    component.onStatusChange(phantomItem);
    
    // Verificar que no se modificó la lista original de tipos de evento
    expect(component.eventTypes.length).toBe(2); // Lista original intacta
  });

  // Prueba: Filtrar correctamente cuando hay descripciones undefined
  it('should filter partial matches correctly in applyFilters', () => {
    // Crear tipo de evento sin descripción (undefined)
    const noDescType = { ...mockEventTypes[0], description: undefined } as any;
    // Reemplazar la lista con este tipo incompleto
    component.eventTypes = [noDescType];
    
    // Establecer término de búsqueda
    component.searchTerm = 'algo';
    // Aplicar filtros (no debería generar error al hacer toLowerCase() de undefined)
    component.applyFilters();
    
    // Verificar que no se encontraron coincidencias (descripción undefined no coincide)
    expect(component.filteredEventTypes.length).toBe(0);
  });
});