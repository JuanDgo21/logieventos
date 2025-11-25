// Importación de módulos y dependencias necesarias para las pruebas
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

// Bloque principal de pruebas para el componente EventPageComponent
describe('EventPageComponent', () => {
  let component: EventPageComponent;  // Instancia del componente a probar
  let fixture: ComponentFixture<EventPageComponent>;  // Fixture para manipular el componente
  let eventServiceSpy: jasmine.SpyObj<EventService>;  // Mock del servicio de eventos
  let authServiceSpy: jasmine.SpyObj<AuthService>;  // Mock del servicio de autenticación

  // --- Mocks de datos para usar en las pruebas ---
  const mockEventTypes: EventType[] = [
    { _id: 'type1', name: 'Corporativo', active: true } as EventType,
    { _id: 'type2', name: 'Social', active: true } as EventType
  ];

  const mockUsers = [{ _id: 'user1', fullname: 'Juan Perez' }];  // Mock de usuarios
  const mockContracts = [{ _id: 'contract1', name: 'Contrato A' }];  // Mock de contratos

  const mockEvents: Event[] = [
    {
      _id: 'event1',
      name: 'Evento 1',
      description: 'Desc 1',
      location: 'Sala A',
      eventType: { _id: 'type1', name: 'Corporativo' } as any,  // Objeto completo
      contract: { _id: 'contract1', name: 'Contrato A' } as any,  // Objeto completo
      responsable: { _id: 'user1', fullname: 'Juan Perez' } as any,  // Objeto completo
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
      eventType: 'type2',  // Solo ID (string)
      contract: 'contract1',  // Solo ID (string)
      responsable: 'user1',  // Solo ID (string)
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-02-02'),
      status: 'completado',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // BehaviorSubjects para simular flujos de datos en tiempo real (observables)
  let eventsSubject: BehaviorSubject<Event[]>;
  let eventTypesSubject: BehaviorSubject<EventType[]>;
  let usersSubject: BehaviorSubject<any[]>;
  let contractsSubject: BehaviorSubject<any[]>;

  // Configuración que se ejecuta antes de cada prueba
  beforeEach(async () => {
    // Inicializamos los subjects con los datos mock
    eventsSubject = new BehaviorSubject<Event[]>(mockEvents);
    eventTypesSubject = new BehaviorSubject<EventType[]>(mockEventTypes);
    usersSubject = new BehaviorSubject<any[]>(mockUsers);
    contractsSubject = new BehaviorSubject<any[]>(mockContracts);

    // Configurar Spies (mocks) para el servicio de eventos
    eventServiceSpy = jasmine.createSpyObj('EventService', 
      ['createEvent', 'updateEvent', 'deleteEvent', 'searchEvents'],  // Métodos a espiar
      {
        // Conectamos los espías a los subjects para simular observables
        events$: eventsSubject.asObservable(),        // Observable de eventos
        eventTypes$: eventTypesSubject.asObservable(), // Observable de tipos de evento
        users$: usersSubject.asObservable(),          // Observable de usuarios
        contracts$: contractsSubject.asObservable()   // Observable de contratos
      }
    );

    // Configurar spy para el servicio de autenticación
    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole', 'hasAnyRole', 'getUserRole']);

    // Configuración por defecto para Auth (usuario administrador)
    authServiceSpy.hasRole.and.returnValue(true);      // Tiene cualquier rol
    authServiceSpy.hasAnyRole.and.returnValue(true);   // Tiene alguno de los roles
    authServiceSpy.getUserRole.and.returnValue('admin'); // Rol de administrador

    // Configurar el módulo de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [EventPageComponent],  // Componente a probar
      imports: [
        ReactiveFormsModule, // Necesario para [formGroup] (formularios reactivos)
        FormsModule          // <--- ¡CRUCIAL! Para [(ngModel)]="searchTerm" (two-way binding)
      ],
      providers: [
        { provide: EventService, useValue: eventServiceSpy },  // Proveer el mock del servicio de eventos
        { provide: AuthService, useValue: authServiceSpy }     // Proveer el mock del servicio de auth
      ],
      schemas: [NO_ERRORS_SCHEMA] // Ignora errores de componentes hijos no declarados (iconos, etc.)
    }).compileComponents();

    // Crear instancia del componente
    fixture = TestBed.createComponent(EventPageComponent);
    component = fixture.componentInstance;
    
    // Mocks globales para evitar que aparezcan popups durante las pruebas
    spyOn(window, 'alert');        // Evitar alerts reales
    spyOn(window, 'confirm').and.returnValue(true);  // Simular confirmaciones aceptadas
    spyOn(console, 'error');       // Silenciar errores de consola esperados en tests de error

    fixture.detectChanges(); // Dispara ngOnInit (inicialización del componente)
  });

  // Prueba básica: Verificar que el componente se crea correctamente
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- 1. PRUEBAS DE INICIALIZACIÓN Y CARGA DE DATOS ---
  
  // Prueba: Verificar que se cargan los permisos de usuario y datos al inicializar
  it('should load user permissions and data on init', () => {
    // Verificamos que los permisos se cargaron correctamente
    expect(component.canCreate).toBeTrue();    // Puede crear eventos
    expect(component.canEdit).toBeTrue();      // Puede editar eventos
    expect(component.currentUserRole).toBe('admin');  // Rol actual es admin
    
    // Verificamos que los datos se cargaron desde los observables
    expect(component.events.length).toBe(2);        // 2 eventos cargados
    expect(component.eventTypes.length).toBe(2);    // 2 tipos de evento cargados
    expect(component.users.length).toBe(1);         // 1 usuario cargado
    expect(component.isLoading).toBeFalse();        // Loading desactivado después de cargar
  });

  // Prueba: Verificar que usa "usuario" como rol por defecto si no hay rol
  it('should default to "usuario" if role is missing', () => {
    // Configurar el servicio para devolver null (sin rol)
    authServiceSpy.getUserRole.and.returnValue(null);
    // Cargar permisos de usuario
    component.loadUserPermissions();
    // Verificar que se usa "usuario" como valor por defecto
    expect(component.currentUserRole).toBe('usuario');
  });

  // Prueba: Verificar manejo de errores durante la carga de datos
  it('should handle errors during data loading', () => {
    // Simulamos error en el observable de eventos
    // Usamos Object.getOwnPropertyDescriptor para mockear el getter del spy
    const errorSpy = jasmine.createSpyObj('errorSub', ['subscribe']);
    (Object.getOwnPropertyDescriptor(eventServiceSpy, 'events$')?.get as jasmine.Spy).and.returnValue(throwError(() => new Error('API Error')));
    
    // Intentar cargar datos (debería manejar el error)
    component.loadData();
    
    // Verificar que se capturó el error en consola
    expect(console.error).toHaveBeenCalledWith('Error cargando eventos:', jasmine.any(Error));
    // Verificar que el loading se desactiva incluso con error
    expect(component.isLoading).toBeFalse();
  });

  // --- 2. PRUEBAS DE FILTROS ---
  
  // Prueba: Filtrar eventos por término de búsqueda
  it('should filter events by search term', () => {
    // Establecer término de búsqueda
    component.searchTerm = 'Evento 1';
    // Aplicar filtros
    component.applyFilters();
    // Verificar que solo queda 1 evento filtrado
    expect(component.filteredEvents.length).toBe(1);
    // Verificar que es el evento correcto
    expect(component.filteredEvents[0]._id).toBe('event1');
  });

  // Prueba: Filtrar eventos por estado
  it('should filter events by status', () => {
    // Seleccionar estado "completado"
    component.selectedStatus = 'completado';
    // Aplicar filtros
    component.applyFilters();
    // Verificar que solo queda 1 evento filtrado
    expect(component.filteredEvents.length).toBe(1);
    // Verificar que es el evento correcto
    expect(component.filteredEvents[0]._id).toBe('event2');
  });

  // Prueba: Filtrar eventos por categoría
  it('should filter events by category ID', () => {
    // Seleccionar categoría específica
    component.selectedCategory = 'type1';
    // Aplicar filtros
    component.applyFilters();
    // Verificar que solo queda 1 evento filtrado
    expect(component.filteredEvents.length).toBe(1);
    // Verificar que es el evento correcto
    expect(component.filteredEvents[0]._id).toBe('event1');
  });

  // --- 3. PRUEBAS DE MODALES Y FORMULARIOS ---
  
  // Prueba: Abrir modal de creación y resetear formulario
  it('should open create modal and reset form', () => {
    // Abrir modal en modo creación
    component.openModal('create');
    // Verificaciones
    expect(component.showModal).toBeTrue();          // Modal visible
    expect(component.editingEvent).toBeFalse();      // No está en modo edición
    expect(component.eventForm.value.status).toBe('planificado');  // Estado por defecto
  });

  // Prueba: Abrir modal de edición y cargar valores correctamente
  it('should open edit modal and patch values correctly', () => {
    const eventToEdit = mockEvents[0];  // Evento a editar
    // Abrir modal en modo edición con el evento
    component.openModal('edit', eventToEdit);
    
    // Verificaciones
    expect(component.showModal).toBeTrue();          // Modal visible
    expect(component.editingEvent).toBeTrue();       // Está en modo edición
    expect(component.currentEventId).toBe('event1'); // ID del evento guardado
    // Verifica que extrajo los IDs de los objetos anidados
    expect(component.eventForm.value.eventType).toBe('type1');      // ID del tipo de evento
    expect(component.eventForm.value.contract).toBe('contract1');   // ID del contrato
  });

  // Prueba: Manejar errores al cargar datos en el formulario
  it('should handle errors when patching form data', () => {
    // Crear evento con fecha inválida que pueda romper el formateo
    const badEvent = { ...mockEvents[0], startDate: 'invalid-date' } as any;
    // Simular error al intentar cargar datos en el formulario
    spyOn(component.eventForm, 'patchValue').and.throwError('Patch Error');
    
    // Intentar abrir modal de edición (debería manejar el error)
    component.openModal('edit', badEvent);
    
    // Verificar que se capturó el error
    expect(console.error).toHaveBeenCalled();
    // Verificar que se mostró alerta al usuario
    expect(window.alert).toHaveBeenCalled();
  });

  // Prueba: Cerrar modal correctamente
  it('should close modal', () => {
    // Configurar modal abierto
    component.showModal = true;
    // Cerrar modal
    component.closeModal();
    // Verificaciones
    expect(component.showModal).toBeFalse();      // Modal oculto
    expect(component.currentEventId).toBeNull();  // ID limpiado
  });

  // --- 4. PRUEBAS DE GUARDADO (CREACIÓN/ACTUALIZACIÓN) ---
  
  // Prueba: Mostrar alerta si el formulario es inválido al guardar
  it('should alert if form is invalid on save', () => {
    // Hacer el formulario inválido
    component.eventForm.setErrors({ required: true });
    // Intentar guardar
    component.saveEvent();
    // Verificar que se mostró alerta de campos incompletos
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/completa todos los campos/));
    // Verificar que NO se llamó al servicio de creación
    expect(eventServiceSpy.createEvent).not.toHaveBeenCalled();
  });

  // Prueba: Llamar al servicio de creación cuando el formulario es válido
  it('should call createEvent when form is valid', () => {
    // Configurar modo creación
    component.editingEvent = false;
    // Llenar formulario con datos válidos
    component.eventForm.patchValue(mockEvents[0]);
    // Configurar servicio para éxito
    eventServiceSpy.createEvent.and.returnValue(of(mockEvents[0]));

    // Ejecutar guardado
    component.saveEvent();

    // Verificaciones
    expect(eventServiceSpy.createEvent).toHaveBeenCalled();  // Servicio llamado
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/creado correctamente/));  // Mensaje de éxito
    expect(component.showModal).toBeFalse();  // Modal cerrado después de guardar
  });

  // Prueba: Llamar al servicio de actualización cuando está editando
  it('should call updateEvent when editing', () => {
    // Configurar modo edición
    component.editingEvent = true;
    component.currentEventId = 'event1';  // ID del evento a actualizar
    // Llenar formulario con datos
    component.eventForm.patchValue(mockEvents[0]);
    // Configurar servicio para éxito
    eventServiceSpy.updateEvent.and.returnValue(of(mockEvents[0]));

    // Ejecutar guardado
    component.saveEvent();

    // Verificaciones
    expect(eventServiceSpy.updateEvent).toHaveBeenCalledWith('event1', jasmine.any(Object));  // Servicio llamado con ID y datos
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/actualizado correctamente/));  // Mensaje de éxito
  });

  // Prueba: Manejar error en creación
  it('should handle create error', () => {
    // Configurar modo creación
    component.editingEvent = false;
    // Llenar formulario con datos
    component.eventForm.patchValue(mockEvents[0]);
    // Configurar servicio para error
    eventServiceSpy.createEvent.and.returnValue(throwError(() => new Error('API Error')));

    // Ejecutar guardado
    component.saveEvent();
    // Verificar que se mostró alerta de error
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/Error al crear/));
  });

  // Prueba: Manejar error en actualización
  it('should handle update error', () => {
    // Configurar modo edición
    component.editingEvent = true;
    component.currentEventId = 'event1';  // ID del evento a actualizar
    // Llenar formulario con datos
    component.eventForm.patchValue(mockEvents[0]);
    // Configurar servicio para error
    eventServiceSpy.updateEvent.and.returnValue(throwError(() => new Error('API Error')));

    // Ejecutar guardado
    component.saveEvent();
    // Verificar que se mostró alerta de error
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/Error al actualizar/));
  });

  // --- 5. PRUEBAS DE ELIMINACIÓN ---
  
  // Prueba: Eliminar evento después de confirmación
  it('should delete event after confirmation', () => {
    // Configurar servicio para éxito en eliminación
    eventServiceSpy.deleteEvent.and.returnValue(of(void 0));
    // Ejecutar eliminación con confirmación
    component.confirmDelete('event1');
    // Verificaciones
    expect(eventServiceSpy.deleteEvent).toHaveBeenCalledWith('event1');  // Servicio llamado con ID correcto
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/eliminado correctamente/));  // Mensaje de éxito
  });

  // Prueba: NO eliminar si se cancela la confirmación
  it('should NOT delete if confirmation cancelled', () => {
    // Configurar confirmación para devolver false (usuario canceló)
    (window.confirm as jasmine.Spy).and.returnValue(false);
    // Intentar eliminar
    component.confirmDelete('event1');
    // Verificar que NO se llamó al servicio de eliminación
    expect(eventServiceSpy.deleteEvent).not.toHaveBeenCalled();
  });

  // Prueba: Manejar error en eliminación
  it('should handle delete error', () => {
    // Configurar servicio para error en eliminación
    eventServiceSpy.deleteEvent.and.returnValue(throwError(() => new Error('Delete Error')));
    // Ejecutar eliminación
    component.confirmDelete('event1');
    // Verificar que se mostró alerta de error
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/Error al eliminar/));
  });

  // --- 6. PRUEBAS DE FUNCIONES AUXILIARES DE UI ---
  
  // Prueba: Obtener nombre de categoría correctamente en diferentes casos
  it('getCategoryName should return correct names', () => {
    expect(component.getCategoryName({ name: 'Object Name' })).toBe('Object Name');  // Objeto con nombre
    expect(component.getCategoryName('type1')).toBe('Corporativo');  // ID conocido
    expect(component.getCategoryName('unknown')).toBe('Sin categoría');  // ID desconocido
    expect(component.getCategoryName(null)).toBe('Sin categoría');  // Valor nulo
  });

  // Prueba: Obtener nombre de contrato correctamente
  it('getContractName should return correct names', () => {
    expect(component.getContractName({ name: 'C Name' })).toBe('C Name');  // Objeto con nombre
    expect(component.getContractName('contract1')).toBe('Contrato A');  // ID conocido
    expect(component.getContractName('unknown')).toBe('ID: unknown');  // ID desconocido
    expect(component.getContractName(null)).toBe('No asignado');  // Valor nulo
  });

  // Prueba: Obtener nombre de responsable correctamente
  it('getResponsableName should return correct names', () => {
    expect(component.getResponsableName({ fullname: 'R Name' })).toBe('R Name');  // Objeto con nombre
    expect(component.getResponsableName('user1')).toBe('Juan Perez');  // ID conocido
    expect(component.getResponsableName('unknown')).toBe('ID: unknown');  // ID desconocido
    expect(component.getResponsableName(null)).toBe('No asignado');  // Valor nulo
  });

  // Prueba: Obtener etiqueta e ícono de estado correctamente
  it('getStatusLabel and Icon should work', () => {
    // Pruebas de etiquetas de estado
    expect(component.getStatusLabel('planificado')).toBe('Planificado');  // Estado conocido
    expect(component.getStatusLabel('bad')).toBe('Desconocido');  // Estado desconocido
    
    // Pruebas de íconos de estado
    expect(component.getStatusIcon('completado')).toBe('fas fa-check-circle');  // Ícono para completado
    expect(component.getStatusIcon('bad')).toBe('fas fa-question-circle');  // Ícono por defecto
  });

  // Prueba: Formatear fecha para mostrar correctamente
  it('formatDisplayDate should handle dates', () => {
    expect(component.formatDisplayDate('')).toBe('N/A');  // Fecha vacía
    expect(component.formatDisplayDate(new Date())).not.toBe('N/A');  // Fecha válida
  });

  // --- 7. PRUEBAS DE MODAL DE VISTA ---
  
  // Prueba: Abrir y cerrar modal de vista de detalles
  it('should open/close view modal', () => {
    const evt = mockEvents[0];  // Evento a visualizar
    // Abrir modal de vista
    component.viewEventDetails(evt);
    // Verificaciones al abrir
    expect(component.showViewModal).toBeTrue();  // Modal visible
    expect(component.eventToView).toBe(evt);     // Evento guardado para visualizar

    // Cerrar modal de vista
    component.closeViewModal();
    // Verificaciones al cerrar
    expect(component.showViewModal).toBeFalse();  // Modal oculto
    expect(component.eventToView).toBeNull();     // Evento limpiado
  });

  // Prueba: Verificar que solo puede ver si es líder
  it('canOnlyView should verify leader role', () => {
    // Configurar servicio para devolver true para rol 'lider'
    authServiceSpy.hasRole.withArgs('lider').and.returnValue(true);
    // Verificar que puede solo ver (no editar/crear)
    expect(component.canOnlyView()).toBeTrue();
  });
  
  // --- 8. PRUEBAS DE DESTRUCCIÓN ---
  
  // Prueba: Cancelar suscripciones al destruir el componente
  it('should unsubscribe on destroy', () => {
    // Espiar el método unsubscribe de las suscripciones
    const unsubscribeSpy = spyOn((component as any).subscriptions, 'unsubscribe');
    // Ejecutar destrucción del componente
    component.ngOnDestroy();
    // Verificar que se cancelaron las suscripciones
    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  // =========================================================
  // 🎯 BLOQUE FRANCOTIRADOR: COBERTURA DE CASOS EXTREMOS Y RAMAS FALTANTES (CORREGIDO) 🎯
  // =========================================================

  describe('Sniper Tests: Edge Cases & Branch Coverage', () => {

    // 1. CORREGIDO: Cobertura de ternarios en loadData (complete)
    // Solución: Usamos 'of()' para simular un observable que emite Y SE COMPLETA.
    it('should handle mixed eventType formats (Object vs String) in loadData complete block', () => {
      // Preparamos eventos con formatos mixtos de eventType
      const mixedEvents = [
        { ...mockEvents[0], eventType: { _id: 'type1' } as any }, // Objeto completo
        { ...mockEvents[1], eventType: 'type2' as any }           // Solo string (ID)
      ];
      
      // IMPORTANTE: Sobrescribimos la propiedad del spy para devolver 'of()'.
      // 'of' emite el valor y luego dispara 'complete()', lo que activa tu lógica de filtrado.
      const eventsSpy = Object.getOwnPropertyDescriptor(eventServiceSpy, 'events$')?.get as jasmine.Spy;
      eventsSpy.and.returnValue(of(mixedEvents));
      
      // Forzamos la recarga de datos
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

      // Abrir modal de edición con evento complejo
      component.openModal('edit', complexEvent);

      // Verificamos que el formulario extrajo SOLO los IDs (rama del ternario para objetos)
      expect(component.eventForm.value.eventType).toBe('type_obj');    // ID extraído del objeto
      expect(component.eventForm.value.contract).toBe('cont_obj');     // ID extraído del objeto
      expect(component.eventForm.value.responsable).toBe('resp_obj');  // ID extraído del objeto
    });

    // 3. Cobertura de fecha inválida Y nula en formatDateForInput
    it('should return null for invalid dates or null inputs', () => {
      // No necesitamos spyOn(console), ya está en beforeEach
      
      // Caso 1: Fecha string basura (rama Number.isNaN)
      const resultInvalid = (component as any).formatDateForInput('fecha-basura-invalida');
      expect(resultInvalid).toBeNull();  // Debe devolver null para fecha inválida
      expect(console.error).not.toHaveBeenCalled(); // (Es console.warn en tu código, pero no lo espiamos, no importa)

      // Caso 2: Fecha nula/undefined (rama if (!date)) <--- FALTABA ESTE
      const resultNull = (component as any).formatDateForInput(null);
      expect(resultNull).toBeNull();  // Debe devolver null para null
      
      const resultUndefined = (component as any).formatDateForInput(undefined);
      expect(resultUndefined).toBeNull();  // Debe devolver null para undefined
    });

    // 4. Cobertura de extracción de ID y Nulos en Helpers (getContractName, getResponsableName)
    it('should handle Object IDs and Nulls in Name Helpers', () => {
      // --- getContractName ---
      // Caso A: Objeto contrato SIN nombre (fuerza a usar el ID)
      const contractObjOnlyId = { _id: 'c_id_123' }; 
      expect(component.getContractName(contractObjOnlyId)).toBe('ID: c_id_123');  // Usa ID cuando no hay nombre
      
      // Caso B: Input nulo (rama if (!contractData)) <--- FALTABA ESTE
      expect(component.getContractName(null)).toBe('No asignado');      // Null devuelve "No asignado"
      expect(component.getContractName(undefined)).toBe('No asignado'); // Undefined devuelve "No asignado"

      // --- getResponsableName ---
      // Caso A: Objeto responsable SIN fullname (fuerza a usar el ID)
      const respObjOnlyId = { _id: 'r_id_456' };
      expect(component.getResponsableName(respObjOnlyId)).toBe('ID: r_id_456');  // Usa ID cuando no hay nombre

      // Caso B: Input nulo
      expect(component.getResponsableName(null)).toBe('No asignado');  // Null devuelve "No asignado"
    });

    // 5. CORREGIDO: Cobertura de errores en Observables secundarios
    it('should handle errors in secondary data streams', () => {
      // NOTA: Quitamos el spyOn(console, 'error') porque ya existe en el beforeEach
      
      // Simulamos error en eventTypes$ (tipos de evento)
      (Object.getOwnPropertyDescriptor(eventServiceSpy, 'eventTypes$')?.get as jasmine.Spy).and.returnValue(throwError(() => 'Err Types'));
      // Simulamos error en users$ (usuarios)
      (Object.getOwnPropertyDescriptor(eventServiceSpy, 'users$')?.get as jasmine.Spy).and.returnValue(throwError(() => 'Err Users'));
      // Simulamos error en contracts$ (contratos)
      (Object.getOwnPropertyDescriptor(eventServiceSpy, 'contracts$')?.get as jasmine.Spy).and.returnValue(throwError(() => 'Err Contracts'));

      // Cargar datos (debería manejar los errores)
      component.loadData();

      // Verificamos que se capturaron los errores en consola
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
        eventType: 'type_string_123',       // String directo (no objeto)
        contract: 'contract_string_456',    // String directo (no objeto)
        responsable: 'resp_string_789',     // String directo (no objeto)
        startDate: '2025-01-01',
        endDate: '2025-01-02'
      } as any;

      // Al abrir el modal con estos datos, el código evaluará:
      // typeof 'type_string_123' === 'object' -> FALSE
      // Y tomará la rama derecha del ternario (la amarilla) - usa el string directamente.
      component.openModal('edit', eventWithStringIds);

      // Verificamos que el formulario se llenó con esos strings exactos (sin extraer IDs)
      expect(component.eventForm.value.eventType).toBe('type_string_123');    // String usado directamente
      expect(component.eventForm.value.contract).toBe('contract_string_456'); // String usado directamente
      expect(component.eventForm.value.responsable).toBe('resp_string_789');  // String usado directamente
    });

  });
});