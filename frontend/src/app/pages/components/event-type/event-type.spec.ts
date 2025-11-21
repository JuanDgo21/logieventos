import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EventTypeComponent } from './event-type';
import { EventService, PersonnelType } from '../../../core/services/event';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { EventType } from '../../../shared/interfaces/event-type';

describe('EventTypeComponent', () => {
  let component: EventTypeComponent;
  let fixture: ComponentFixture<EventTypeComponent>;
  let eventServiceSpy: jasmine.SpyObj<EventService>;

  // --- Mocks de Datos ---
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

  // --- Subjects para simular flujos reactivos ---
  let eventTypesSubject: BehaviorSubject<EventType[]>;
  let personnelTypesSubject: BehaviorSubject<PersonnelType[]>;

  beforeEach(async () => {
    // Inicializar Subjects
    eventTypesSubject = new BehaviorSubject<EventType[]>(mockEventTypes);
    personnelTypesSubject = new BehaviorSubject<PersonnelType[]>(mockPersonnelTypes);

    // Crear Spy del Servicio
    eventServiceSpy = jasmine.createSpyObj('EventService', [
      'getAllEventTypes',
      'getAllPersonnelTypes',
      'createEventType',
      'updateEventType',
      'deleteEventType'
    ], {
      eventTypes$: eventTypesSubject.asObservable(),
      personnelTypes$: personnelTypesSubject.asObservable()
    });

    // Configurar retornos por defecto (Observables que completan)
    eventServiceSpy.getAllEventTypes.and.returnValue(of(mockEventTypes));
    eventServiceSpy.getAllPersonnelTypes.and.returnValue(of(mockPersonnelTypes));

    await TestBed.configureTestingModule({
      declarations: [EventTypeComponent],
      imports: [
        ReactiveFormsModule, // Para formGroup y formArray
        FormsModule          // Para [(ngModel)] en filtros
      ],
      providers: [
        { provide: EventService, useValue: eventServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EventTypeComponent);
    component = fixture.componentInstance;

    // Mocks globales
    spyOn(window, 'alert');
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(console, 'error');

    fixture.detectChanges(); // Dispara ngOnInit -> loadData
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- 1. Inicialización y Carga ---
  it('should load initial data correctly', () => {
    expect(eventServiceSpy.getAllEventTypes).toHaveBeenCalled();
    expect(eventServiceSpy.getAllPersonnelTypes).toHaveBeenCalled();
    expect(component.eventTypes.length).toBe(2);
    expect(component.personnelTypes.length).toBe(2);
    expect(component.isLoading).toBeFalse();
  });

  it('should handle errors during data loading', () => {
    // Reiniciamos para probar el error en el subscribe del subject
    const errorSubject = new BehaviorSubject<EventType[]>([]);
    (Object.getOwnPropertyDescriptor(eventServiceSpy, 'eventTypes$')?.get as jasmine.Spy).and.returnValue(throwError(() => new Error('API Error')));
    
    component.loadData();
    
    expect(console.error).toHaveBeenCalledWith('Error al cargar los tipos de evento', jasmine.any(Error));
    expect(component.isLoading).toBeFalse();
  });

  // --- 2. Filtros ---
  it('should filter by search term (name)', () => {
    component.searchTerm = 'Boda';
    component.applyFilters();
    expect(component.filteredEventTypes.length).toBe(1);
    expect(component.filteredEventTypes[0].name).toBe('Boda');
  });

  it('should filter by search term (description)', () => {
    component.searchTerm = 'empresarial';
    component.applyFilters();
    expect(component.filteredEventTypes.length).toBe(1);
    expect(component.filteredEventTypes[0].name).toBe('Conferencia Tech');
  });

  it('should filter by category', () => {
    component.selectedCategory = 'corporativo';
    component.applyFilters();
    expect(component.filteredEventTypes.length).toBe(1);
    expect(component.filteredEventTypes[0].category).toBe('corporativo');
  });

  it('should show all when filters match everything', () => {
    component.searchTerm = '';
    component.selectedCategory = 'all';
    component.applyFilters();
    expect(component.filteredEventTypes.length).toBe(2);
  });

  // --- 3. Gestión de FormArray (Recursos y Requerimientos) ---
  it('should add and remove resources', () => {
    // Al iniciar, por defecto hay 0 recursos en el array (initializeForm lo deja vacío)
    // PERO, en openModal('create') se llama a addResource(). Probemos aisladamente.
    component.initializeForm(); // Reinicia form limpio
    expect(component.defaultResources.length).toBe(0);

    component.addResource();
    expect(component.defaultResources.length).toBe(1);

    component.removeResource(0);
    expect(component.defaultResources.length).toBe(0);
  });

  it('should add and remove additional requirements', () => {
    component.initializeForm();
    expect(component.additionalRequirements.length).toBe(0);

    component.addRequirement();
    expect(component.additionalRequirements.length).toBe(1);

    component.removeRequirement(0);
    expect(component.additionalRequirements.length).toBe(0);
  });

  // --- 4. Modales (Apertura y Parcheo) ---
  it('should open modal for CREATE', () => {
    component.openModal('create');
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeFalse();
    expect(component.currentEventTypeId).toBeNull();
    // openModal('create') llama a addResource por defecto
    expect(component.defaultResources.length).toBe(1);
  });

  it('should open modal for EDIT and patch form arrays', () => {
    const typeToEdit = mockEventTypes[0]; // Tiene 1 recurso y 2 requerimientos
    component.openModal('edit', typeToEdit);

    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeTrue();
    expect(component.currentEventTypeId).toBe('1');
    expect(component.eventTypeForm.value.name).toBe('Boda');
    
    // Verificar que se llenaron los FormArrays
    expect(component.defaultResources.length).toBe(1);
    expect(component.defaultResources.at(0).value.description).toBe('Sillas Tiffany');
    
    expect(component.additionalRequirements.length).toBe(2);
    expect(component.additionalRequirements.at(0).value).toBe('Licencia de licor');
  });

  it('should close modal and reset form', () => {
    component.showModal = true;
    component.currentEventTypeId = '123';
    component.closeModal();
    
    expect(component.showModal).toBeFalse();
    expect(component.currentEventTypeId).toBeNull();
    // Al resetear, los formArrays deberían quedar vacíos o en estado inicial
    expect(component.eventTypeForm.value.name).toBeNull(); 
  });

  // --- 5. Guardar (Create/Update) ---
  it('should alert if form is invalid on save', () => {
    component.initializeForm(); // Formulario vacío e inválido
    component.saveEventType();
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/completa todos los campos/));
    expect(eventServiceSpy.createEventType).not.toHaveBeenCalled();
  });

  it('should CREATE a new event type when form is valid', () => {
    component.openModal('create');
    // Llenamos datos válidos
    component.eventTypeForm.patchValue({
      name: 'Nuevo Tipo',
      category: 'social',
      requiredPersonnelType: 'p1',
      estimatedDuration: 5
    });
    // El recurso por defecto necesita datos válidos
    component.defaultResources.at(0).patchValue({
      resourceType: 'otros',
      description: 'Desc',
      defaultQuantity: 1
    });

    eventServiceSpy.createEventType.and.returnValue(of({} as any));

    component.saveEventType();

    expect(eventServiceSpy.createEventType).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/creado correctamente/));
    expect(component.showModal).toBeFalse();
  });

  it('should UPDATE an event type when editing', () => {
    const typeToEdit = mockEventTypes[0];
    component.openModal('edit', typeToEdit);
    // El formulario ya es válido porque se parcheó con datos válidos
    
    eventServiceSpy.updateEventType.and.returnValue(of({} as any));

    component.saveEventType();

    expect(eventServiceSpy.updateEventType).toHaveBeenCalledWith('1', jasmine.any(Object));
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/actualizado correctamente/));
    expect(component.showModal).toBeFalse();
  });

  it('should handle create error', () => {
    component.openModal('create');
    // Llenar form válido
    component.eventTypeForm.patchValue({ name: 'Valid', category: 'social', requiredPersonnelType: 'p1', estimatedDuration: 1 });
    component.defaultResources.at(0).patchValue({ resourceType: 'otros', description: 'D', defaultQuantity: 1 });

    eventServiceSpy.createEventType.and.returnValue(throwError(() => new Error('API Fail')));

    component.saveEventType();
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/Error al crear/));
  });

  it('should handle update error', () => {
    component.openModal('edit', mockEventTypes[0]);
    eventServiceSpy.updateEventType.and.returnValue(throwError(() => new Error('API Fail')));

    component.saveEventType();
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/Error al actualizar/));
  });

  // --- 6. Eliminación ---
  it('should delete event type after confirmation', () => {
    eventServiceSpy.deleteEventType.and.returnValue(of(void 0));
    component.confirmDelete(mockEventTypes[0]);
    
    expect(eventServiceSpy.deleteEventType).toHaveBeenCalledWith('1');
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/eliminado correctamente/));
  });

  it('should NOT delete if confirmation is cancelled', () => {
    (window.confirm as jasmine.Spy).and.returnValue(false);
    component.confirmDelete(mockEventTypes[0]);
    expect(eventServiceSpy.deleteEventType).not.toHaveBeenCalled();
  });

  it('should handle delete error', () => {
    eventServiceSpy.deleteEventType.and.returnValue(throwError(() => new Error('Del Err')));
    component.confirmDelete(mockEventTypes[0]);
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/Error al eliminar/));
  });

  // --- 7. Cambio de Estado (Active/Inactive) ---
  it('should toggle status successfully', () => {
    const item = { ...mockEventTypes[0], active: true }; // Inicia activo
    const updatedItem = { ...item, active: false }; // Esperamos inactivo

    // Simulamos respuesta exitosa del backend
    eventServiceSpy.updateEventType.and.returnValue(of(updatedItem));

    component.onStatusChange(item);

    // Verificamos que se llamó con el estado INVERTIDO
    expect(eventServiceSpy.updateEventType).toHaveBeenCalledWith(
      item._id, 
      jasmine.objectContaining({ active: false })
    );
    
    // Verificamos que se actualizó la lista local
    const localItem = component.eventTypes.find(t => t._id === item._id);
    expect(localItem?.active).toBeFalse();
  });

  it('should handle error when toggling status', () => {
    const item = mockEventTypes[0];
    eventServiceSpy.updateEventType.and.returnValue(throwError(() => new Error('Toggle Err')));

    component.onStatusChange(item);

    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/Error al actualizar el estado/));
  });

  // --- 8. Cobertura de Ramas faltantes (Sniper) ---
  it('should handle missing arrays in openModal (edit mode)', () => {
    // Caso donde el tipo de evento no tiene arrays definidos (undefined)
    const sparseType = { ...mockEventTypes[0], defaultResources: undefined, additionalRequirements: undefined } as any;
    
    component.openModal('edit', sparseType);
    
    expect(component.defaultResources.length).toBe(0);
    expect(component.additionalRequirements.length).toBe(0);
  });

  it('should handle updating item not found in onStatusChange', () => {
    const phantomItem = { ...mockEventTypes[0], _id: '999' }; // ID que no está en la lista local
    eventServiceSpy.updateEventType.and.returnValue(of(phantomItem));

    // No debería explotar
    component.onStatusChange(phantomItem);
    
    // No debió actualizar nada en la lista mock original
    expect(component.eventTypes.length).toBe(2);
  });

  it('should filter partial matches correctly in applyFilters', () => {
    // Caso: descripción undefined
    const noDescType = { ...mockEventTypes[0], description: undefined } as any;
    component.eventTypes = [noDescType];
    
    component.searchTerm = 'algo';
    component.applyFilters();
    
    // No debe explotar al hacer toLowerCase() de undefined
    expect(component.filteredEventTypes.length).toBe(0);
  });

});