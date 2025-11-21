import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EventPageComponent } from './event-page';
import { EventService } from '../../../core/services/event';
import { AuthService } from '../../../../app/core/services/auth';
// IMPORTANTE: Necesitamos AMBOS módulos porque usas formularios reactivos Y ngModel (searchTerm)
import { ReactiveFormsModule, FormsModule } from '@angular/forms'; 
import { of, throwError, BehaviorSubject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Event } from '../../../shared/interfaces/event';
import { EventType } from '../../../shared/interfaces/event-type';

describe('EventPageComponent', () => {
  let component: EventPageComponent;
  let fixture: ComponentFixture<EventPageComponent>;
  let eventServiceSpy: jasmine.SpyObj<EventService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  // --- Mocks de datos ---
  const mockEventTypes: EventType[] = [
    { _id: 'type1', name: 'Corporativo', active: true } as EventType,
    { _id: 'type2', name: 'Social', active: true } as EventType
  ];

  const mockUsers = [{ _id: 'user1', fullname: 'Juan Perez' }];
  const mockContracts = [{ _id: 'contract1', name: 'Contrato A' }];

  const mockEvents: Event[] = [
    {
      _id: 'event1',
      name: 'Evento 1',
      description: 'Desc 1',
      location: 'Sala A',
      eventType: { _id: 'type1', name: 'Corporativo' } as any,
      contract: { _id: 'contract1', name: 'Contrato A' } as any,
      responsable: { _id: 'user1', fullname: 'Juan Perez' } as any,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-02'),
      status: 'planificado',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'event2',
      name: 'Evento 2',
      description: 'Desc 2',
      location: 'Sala B',
      eventType: 'type2',
      contract: 'contract1',
      responsable: 'user1',
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-02-02'),
      status: 'completado',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // BehaviorSubjects para simular flujos de datos vivos
  let eventsSubject: BehaviorSubject<Event[]>;
  let eventTypesSubject: BehaviorSubject<EventType[]>;
  let usersSubject: BehaviorSubject<any[]>;
  let contractsSubject: BehaviorSubject<any[]>;

  beforeEach(async () => {
    // Inicializamos los subjects con datos
    eventsSubject = new BehaviorSubject<Event[]>(mockEvents);
    eventTypesSubject = new BehaviorSubject<EventType[]>(mockEventTypes);
    usersSubject = new BehaviorSubject<any[]>(mockUsers);
    contractsSubject = new BehaviorSubject<any[]>(mockContracts);

    // Configurar Spies
    eventServiceSpy = jasmine.createSpyObj('EventService', 
      ['createEvent', 'updateEvent', 'deleteEvent', 'searchEvents'], 
      {
        // Conectamos los spies a los subjects
        events$: eventsSubject.asObservable(),
        eventTypes$: eventTypesSubject.asObservable(),
        users$: usersSubject.asObservable(),
        contracts$: contractsSubject.asObservable()
      }
    );

    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole', 'hasAnyRole', 'getUserRole']);

    // Configuración Auth por defecto (Admin)
    authServiceSpy.hasRole.and.returnValue(true);
    authServiceSpy.hasAnyRole.and.returnValue(true);
    authServiceSpy.getUserRole.and.returnValue('admin');

    await TestBed.configureTestingModule({
      declarations: [EventPageComponent],
      imports: [
        ReactiveFormsModule, // Para [formGroup]
        FormsModule          // <--- ¡CRUCIAL! Para [(ngModel)]="searchTerm"
      ],
      providers: [
        { provide: EventService, useValue: eventServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA] // Ignora errores de componentes hijos (iconos, etc.)
    }).compileComponents();

    fixture = TestBed.createComponent(EventPageComponent);
    component = fixture.componentInstance;
    
    // Mocks globales para evitar popups
    spyOn(window, 'alert'); 
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(console, 'error'); // Silenciar errores de consola esperados en tests de error

    fixture.detectChanges(); // Dispara ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- 1. Inicialización y Carga ---
  it('should load user permissions and data on init', () => {
    // Verificamos permisos
    expect(component.canCreate).toBeTrue();
    expect(component.canEdit).toBeTrue();
    expect(component.currentUserRole).toBe('admin');
    
    // Verificamos datos cargados desde los subjects
    expect(component.events.length).toBe(2);
    expect(component.eventTypes.length).toBe(2);
    expect(component.users.length).toBe(1);
    expect(component.isLoading).toBeFalse();
  });

  it('should default to "usuario" if role is missing', () => {
    authServiceSpy.getUserRole.and.returnValue(null);
    component.loadUserPermissions();
    expect(component.currentUserRole).toBe('usuario');
  });

  it('should handle errors during data loading', () => {
    // Simulamos error en el observable de eventos
    // Usamos Object.getOwnPropertyDescriptor para mockear el getter del spy
    const errorSpy = jasmine.createSpyObj('errorSub', ['subscribe']);
    (Object.getOwnPropertyDescriptor(eventServiceSpy, 'events$')?.get as jasmine.Spy).and.returnValue(throwError(() => new Error('API Error')));
    
    component.loadData();
    
    expect(console.error).toHaveBeenCalledWith('Error cargando eventos:', jasmine.any(Error));
    expect(component.isLoading).toBeFalse();
  });

  // --- 2. Filtros ---
  it('should filter events by search term', () => {
    component.searchTerm = 'Evento 1';
    component.applyFilters();
    expect(component.filteredEvents.length).toBe(1);
    expect(component.filteredEvents[0]._id).toBe('event1');
  });

  it('should filter events by status', () => {
    component.selectedStatus = 'completado';
    component.applyFilters();
    expect(component.filteredEvents.length).toBe(1);
    expect(component.filteredEvents[0]._id).toBe('event2');
  });

  it('should filter events by category ID', () => {
    component.selectedCategory = 'type1';
    component.applyFilters();
    expect(component.filteredEvents.length).toBe(1);
    expect(component.filteredEvents[0]._id).toBe('event1');
  });

  // --- 3. Modales y Formularios ---
  it('should open create modal and reset form', () => {
    component.openModal('create');
    expect(component.showModal).toBeTrue();
    expect(component.editingEvent).toBeFalse();
    expect(component.eventForm.value.status).toBe('planificado');
  });

  it('should open edit modal and patch values correctly', () => {
    const eventToEdit = mockEvents[0];
    component.openModal('edit', eventToEdit);
    
    expect(component.showModal).toBeTrue();
    expect(component.editingEvent).toBeTrue();
    expect(component.currentEventId).toBe('event1');
    // Verifica que extrajo los IDs de los objetos
    expect(component.eventForm.value.eventType).toBe('type1');
    expect(component.eventForm.value.contract).toBe('contract1');
  });

  it('should handle errors when patching form data', () => {
    // Pasamos un dato inválido que rompa el patch o formatting
    const badEvent = { ...mockEvents[0], startDate: 'invalid-date' } as any;
    spyOn(component.eventForm, 'patchValue').and.throwError('Patch Error');
    
    component.openModal('edit', badEvent);
    
    expect(console.error).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalled();
  });

  it('should close modal', () => {
    component.showModal = true;
    component.closeModal();
    expect(component.showModal).toBeFalse();
    expect(component.currentEventId).toBeNull();
  });

  // --- 4. Guardar (Create/Update) ---
  it('should alert if form is invalid on save', () => {
    component.eventForm.setErrors({ required: true });
    component.saveEvent();
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/completa todos los campos/));
    expect(eventServiceSpy.createEvent).not.toHaveBeenCalled();
  });

  it('should call createEvent when form is valid', () => {
    component.editingEvent = false;
    component.eventForm.patchValue(mockEvents[0]);
    eventServiceSpy.createEvent.and.returnValue(of(mockEvents[0]));

    component.saveEvent();

    expect(eventServiceSpy.createEvent).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/creado correctamente/));
    expect(component.showModal).toBeFalse();
  });

  it('should call updateEvent when editing', () => {
    component.editingEvent = true;
    component.currentEventId = 'event1';
    component.eventForm.patchValue(mockEvents[0]);
    eventServiceSpy.updateEvent.and.returnValue(of(mockEvents[0]));

    component.saveEvent();

    expect(eventServiceSpy.updateEvent).toHaveBeenCalledWith('event1', jasmine.any(Object));
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/actualizado correctamente/));
  });

  it('should handle create error', () => {
    component.editingEvent = false;
    component.eventForm.patchValue(mockEvents[0]);
    eventServiceSpy.createEvent.and.returnValue(throwError(() => new Error('API Error')));

    component.saveEvent();
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/Error al crear/));
  });

  it('should handle update error', () => {
    component.editingEvent = true;
    component.currentEventId = 'event1';
    component.eventForm.patchValue(mockEvents[0]);
    eventServiceSpy.updateEvent.and.returnValue(throwError(() => new Error('API Error')));

    component.saveEvent();
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/Error al actualizar/));
  });

  // --- 5. Eliminación ---
  it('should delete event after confirmation', () => {
    eventServiceSpy.deleteEvent.and.returnValue(of(void 0));
    component.confirmDelete('event1');
    expect(eventServiceSpy.deleteEvent).toHaveBeenCalledWith('event1');
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/eliminado correctamente/));
  });

  it('should NOT delete if confirmation cancelled', () => {
    (window.confirm as jasmine.Spy).and.returnValue(false);
    component.confirmDelete('event1');
    expect(eventServiceSpy.deleteEvent).not.toHaveBeenCalled();
  });

  it('should handle delete error', () => {
    eventServiceSpy.deleteEvent.and.returnValue(throwError(() => new Error('Delete Error')));
    component.confirmDelete('event1');
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/Error al eliminar/));
  });

  // --- 6. Helpers de UI ---
  it('getCategoryName should return correct names', () => {
    expect(component.getCategoryName({ name: 'Object Name' })).toBe('Object Name');
    expect(component.getCategoryName('type1')).toBe('Corporativo');
    expect(component.getCategoryName('unknown')).toBe('Sin categoría');
    expect(component.getCategoryName(null)).toBe('Sin categoría');
  });

  it('getContractName should return correct names', () => {
    expect(component.getContractName({ name: 'C Name' })).toBe('C Name');
    expect(component.getContractName('contract1')).toBe('Contrato A');
    expect(component.getContractName('unknown')).toBe('ID: unknown');
    expect(component.getContractName(null)).toBe('No asignado');
  });

  it('getResponsableName should return correct names', () => {
    expect(component.getResponsableName({ fullname: 'R Name' })).toBe('R Name');
    expect(component.getResponsableName('user1')).toBe('Juan Perez');
    expect(component.getResponsableName('unknown')).toBe('ID: unknown');
    expect(component.getResponsableName(null)).toBe('No asignado');
  });

  it('getStatusLabel and Icon should work', () => {
    expect(component.getStatusLabel('planificado')).toBe('Planificado');
    expect(component.getStatusLabel('bad')).toBe('Desconocido');
    
    expect(component.getStatusIcon('completado')).toBe('fas fa-check-circle');
    expect(component.getStatusIcon('bad')).toBe('fas fa-question-circle');
  });

  it('formatDisplayDate should handle dates', () => {
    expect(component.formatDisplayDate('')).toBe('N/A');
    expect(component.formatDisplayDate(new Date())).not.toBe('N/A');
  });

  // --- 7. View Modal ---
  it('should open/close view modal', () => {
    const evt = mockEvents[0];
    component.viewEventDetails(evt);
    expect(component.showViewModal).toBeTrue();
    expect(component.eventToView).toBe(evt);

    component.closeViewModal();
    expect(component.showViewModal).toBeFalse();
    expect(component.eventToView).toBeNull();
  });

  it('canOnlyView should verify leader role', () => {
    authServiceSpy.hasRole.withArgs('lider').and.returnValue(true);
    expect(component.canOnlyView()).toBeTrue();
  });
  
  // --- 8. Destruction ---
  it('should unsubscribe on destroy', () => {
    // Espiamos el método unsubscribe de la suscripción
    const unsubscribeSpy = spyOn((component as any).subscriptions, 'unsubscribe');
    component.ngOnDestroy();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  // =========================================================
  // 🎯 SNIPER BLOCK 2.0: COBERTURA DE RAMAS FALTANTES (CORREGIDO) 🎯
  // =========================================================

  describe('Sniper Tests: Edge Cases & Branch Coverage', () => {

    // 1. CORREGIDO: Cobertura de ternarios en loadData (complete)
    // Solución: Usamos 'of()' para simular un observable que emite Y SE COMPLETA.
    it('should handle mixed eventType formats (Object vs String) in loadData complete block', () => {
      // Preparamos eventos mixtos
      const mixedEvents = [
        { ...mockEvents[0], eventType: { _id: 'type1' } as any }, // Objeto
        { ...mockEvents[1], eventType: 'type2' as any }           // String
      ];
      
      // IMPORTANTE: Sobrescribimos la propiedad del spy para devolver 'of()'.
      // 'of' emite el valor y luego dispara 'complete()', lo que activa tu lógica de filtrado.
      const eventsSpy = Object.getOwnPropertyDescriptor(eventServiceSpy, 'events$')?.get as jasmine.Spy;
      eventsSpy.and.returnValue(of(mixedEvents));
      
      // Forzamos la recarga
      component.loadData();
      
      // Ahora availableEventTypes debería tener datos porque el complete() se ejecutó
      expect(component.availableEventTypes.length).toBeGreaterThan(0);
    });

    // 2. Cobertura de ternarios en openModal (patchValue)
    it('should handle full objects in openModal patchValue (Object logic)', () => {
      const complexEvent = {
        ...mockEvents[0],
        _id: 'complex1',
        eventType: { _id: 'type_obj', name: 'T' }, // Objeto completo
        contract: { _id: 'cont_obj', name: 'C' },  // Objeto completo
        responsable: { _id: 'resp_obj', fullname: 'R' } // Objeto completo
      } as any;

      component.openModal('edit', complexEvent);

      // Verificamos que el formulario extrajo SOLO los IDs (rama amarilla del ternario)
      expect(component.eventForm.value.eventType).toBe('type_obj');
      expect(component.eventForm.value.contract).toBe('cont_obj');
      expect(component.eventForm.value.responsable).toBe('resp_obj');
    });

    // 3. Cobertura de fecha inválida Y nula en formatDateForInput
    it('should return null for invalid dates or null inputs', () => {
      // No necesitamos spyOn(console), ya está en beforeEach
      
      // Caso 1: Fecha string basura (rama Number.isNaN)
      const resultInvalid = (component as any).formatDateForInput('fecha-basura-invalida');
      expect(resultInvalid).toBeNull();
      expect(console.error).not.toHaveBeenCalled(); // (Es console.warn en tu código, pero no lo espiamos, no importa)

      // Caso 2: Fecha nula/undefined (rama if (!date)) <--- FALTABA ESTE
      const resultNull = (component as any).formatDateForInput(null);
      expect(resultNull).toBeNull();
      
      const resultUndefined = (component as any).formatDateForInput(undefined);
      expect(resultUndefined).toBeNull();
    });

    // 4. Cobertura de extracción de ID y Nulos en Helpers (getContractName, getResponsableName)
    it('should handle Object IDs and Nulls in Name Helpers', () => {
      // --- getContractName ---
      // Caso A: Objeto contrato SIN nombre (fuerza a usar el ID)
      const contractObjOnlyId = { _id: 'c_id_123' }; 
      expect(component.getContractName(contractObjOnlyId)).toBe('ID: c_id_123');
      
      // Caso B: Input nulo (rama if (!contractData)) <--- FALTABA ESTE
      expect(component.getContractName(null)).toBe('No asignado');
      expect(component.getContractName(undefined)).toBe('No asignado');

      // --- getResponsableName ---
      // Caso A: Objeto responsable SIN fullname (fuerza a usar el ID)
      const respObjOnlyId = { _id: 'r_id_456' };
      expect(component.getResponsableName(respObjOnlyId)).toBe('ID: r_id_456');

      // Caso B: Input nulo
      expect(component.getResponsableName(null)).toBe('No asignado');
    });

    // 5. CORREGIDO: Cobertura de errores en Observables secundarios
    it('should handle errors in secondary data streams', () => {
      // NOTA: Quitamos el spyOn(console, 'error') porque ya existe en el beforeEach
      
      // Simulamos error en eventTypes$
      (Object.getOwnPropertyDescriptor(eventServiceSpy, 'eventTypes$')?.get as jasmine.Spy).and.returnValue(throwError(() => 'Err Types'));
      // Simulamos error en users$
      (Object.getOwnPropertyDescriptor(eventServiceSpy, 'users$')?.get as jasmine.Spy).and.returnValue(throwError(() => 'Err Users'));
      // Simulamos error en contracts$
      (Object.getOwnPropertyDescriptor(eventServiceSpy, 'contracts$')?.get as jasmine.Spy).and.returnValue(throwError(() => 'Err Contracts'));

      component.loadData();

      // Verificamos que se llamaron los console.error
      expect(console.error).toHaveBeenCalledWith('Error cargando tipos de eventos:', 'Err Types');
      expect(console.error).toHaveBeenCalledWith('Error cargando usuarios:', 'Err Users');
      expect(console.error).toHaveBeenCalledWith('Error cargando contratos:', 'Err Contracts');
    });

    // 6. COBERTURA FINAL: Strings directos en openModal (Lado derecho de los ternarios)
    it('should handle direct String IDs in openModal patchValue', () => {
      // Preparamos un evento donde las relaciones son solo IDs (strings), no objetos
      const eventWithStringIds = {
        ...mockEvents[0],
        _id: 'event_str_ids',
        eventType: 'type_string_123',       // String directo
        contract: 'contract_string_456',    // String directo
        responsable: 'resp_string_789',     // String directo
        startDate: '2025-01-01',
        endDate: '2025-01-02'
      } as any;

      // Al abrir el modal con estos datos, el código evaluará:
      // typeof 'type_string_123' === 'object' -> FALSE
      // Y tomará la rama derecha del ternario (la amarilla).
      component.openModal('edit', eventWithStringIds);

      // Verificamos que el formulario se llenó con esos strings exactos
      expect(component.eventForm.value.eventType).toBe('type_string_123');
      expect(component.eventForm.value.contract).toBe('contract_string_456');
      expect(component.eventForm.value.responsable).toBe('resp_string_789');
    });

  });
});