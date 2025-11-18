// Importaciones de Angular y RxJS
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

// Lo que vamos a probar
import { EventService } from './event'; // Importa desde event.ts
import { ApiService } from './api';

// Constantes y tipos que necesitamos
import { apiRouters } from '../constants/apiRouters';

// Interfaces (usando las rutas que me diste)
import { EventType, NewEventType, UpdateEventType, DefaultResource } from '../../shared/interfaces/event-type';
import { Event, NewEvent, UpdateEvent } from '../../shared/interfaces/event';

// Interfaces locales del servicio (User, Contract, PersonnelType)
import { User, Contract, PersonnelType } from './event';

// --- INICIO DEL BLOQUE DE PRUEBAS ---
// Suite de pruebas para el EventService
describe('EventService', () => {
  let service: EventService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  // ==========================================
  // DATOS DE PRUEBA (MOCKS) CORREGIDOS
  // ==========================================
  
  // Mock de Usuario: simula un usuario del sistema
  const mockUser: User = { _id: 'user1', fullname: 'Usuario Prueba', username: 'testuser' };
  
  // Mock de Contrato: simula un contrato asociado a eventos
  const mockContract: Contract = { _id: 'cont1', name: 'Contrato Prueba' };
  
  // Mock de Tipo de Personal: simula categorías de personal (ej: chef, mesero, etc.)
  const mockPersonnelType: PersonnelType = { _id: 'pt1', name: 'Tipo Personal Prueba' };

  // Mock de Tipo de Evento: define categorías de eventos (ej: boda, conferencia, etc.)
  const mockEventType: EventType = {
    _id: 'type1',
    name: 'Tipo de Evento Prueba',
    active: true,
    category: 'corporativo',
    defaultResources: [], // recursos por defecto para este tipo de evento
    requiredPersonnelType: 'pt1', // tipo de personal requerido
    estimatedDuration: 120, // duración estimada en minutos
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Array de tipos de evento para pruebas que necesitan múltiples elementos
  const mockEventTypeArray: EventType[] = [mockEventType];

  // Mock de Evento: representa un evento real en el sistema
  const mockEvent: Event = {
    _id: 'evt1',
    name: 'Evento de Prueba',
    description: 'Descripción',
    startDate: new Date('2025-01-01T10:00:00Z'),
    endDate: new Date('2025-01-01T12:00:00Z'),
    status: 'planificado',
    location: 'Salón A',
    eventType: 'type1', // referencia al tipo de evento
    contract: 'cont1',  // referencia al contrato
    responsable: 'user1', // usuario responsable
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Array de eventos para pruebas que necesitan múltiples eventos
  const mockEventArray: Event[] = [
    mockEvent,
    { ...mockEvent, _id: 'evt2', name: 'Evento 2', status: 'en_progreso' }
  ];
  
  // Helper para simular respuestas exitosas de API
  const mockApiResponse = (data: any) => ({
    success: true,
    data: data
  });
  
  // Helper para simular respuestas de error de API
  const mockApiErrorResponse = (message: string) => ({
    success: false,
    message: message
  });

  // ==========================================
  // CONFIGURACIÓN ANTES DE CADA PRUEBA (beforeEach)
  // ==========================================
  beforeEach(() => {
    // Creamos un spy del ApiService con los métodos que vamos a usar
    mockApiService = jasmine.createSpyObj('ApiService', ['getOb', 'postOb', 'putOb', 'deleteOb']);

    // Mockeamos las 5 llamadas del constructor del EventService
    // Estas llamadas se ejecutan automáticamente cuando se crea el servicio
    mockApiService.getOb.withArgs(apiRouters.EVENTS.BASE).and.returnValue(of(mockApiResponse([])));
    mockApiService.getOb.withArgs(apiRouters.TYPES.EVENT.BASE).and.returnValue(of(mockApiResponse([])));
    mockApiService.getOb.withArgs(apiRouters.USERS.BASE).and.returnValue(of(mockApiResponse([])));
    mockApiService.getOb.withArgs(apiRouters.CONTRACTS.BASE).and.returnValue(of(mockApiResponse([])));
    mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(of(mockApiResponse([])));

    // Configuramos el módulo de testing
    TestBed.configureTestingModule({
      providers: [
        EventService,
        { provide: ApiService, useValue: mockApiService } // Usamos el mock en lugar del servicio real
      ]
    });

    // Obtenemos la instancia del servicio
    service = TestBed.inject(EventService);
  });

  // ==========================================
  // PRUEBAS BÁSICAS DE CREACIÓN
  // ==========================================

  // Prueba que verifica que el servicio se crea correctamente
  // y que el constructor hace las 5 llamadas iniciales para cargar datos
  it('should be created and call loadInitialData on constructor', () => {
    expect(service).toBeTruthy();
    // Verificamos que se hicieron las 5 llamadas HTTP iniciales
    expect(mockApiService.getOb).toHaveBeenCalledTimes(5);
  });
  
  // ==========================================
  // PRUEBAS DE MANEJO DE RESPUESTAS (BRANCH COVERAGE)
  // ==========================================

  describe('private#handleArrayResponse (Branch Coverage)', () => {
    // Prueba: respuesta con array de datos (caso normal)
    it('should return array data if data is already an array', () => {
      const response = mockApiResponse(mockEventArray);
      const result = (service as any).handleArrayResponse(response);
      expect(result).toEqual(mockEventArray);
    });

    // Prueba: respuesta con objeto único (debe convertirse a array)
    it('should wrap single object in an array', () => {
      const response = mockApiResponse(mockEvent);
      const result = (service as any).handleArrayResponse(response);
      expect(result).toEqual([mockEvent]);
    });
    
    // Prueba: respuesta con error del servidor
    it('should throw error if response.success is false', () => {
      const errorResponse = mockApiErrorResponse('Operación fallida');
      expect(() => (service as any).handleArrayResponse(errorResponse))
        .toThrowError('Operación fallida');
    });

    // Prueba: respuesta exitosa pero sin datos
    it('should throw error if response.data is null', () => {
      const errorResponse = { success: true, data: null };
      expect(() => (service as any).handleArrayResponse(errorResponse))
        .toThrowError('Datos no disponibles');
    });
  });

  describe('private#handleSingleResponse (Branch Coverage)', () => {
    // Prueba: respuesta con objeto único (caso normal)
    it('should return object data if data is already an object', () => {
      const response = mockApiResponse(mockEvent);
      const result = (service as any).handleSingleResponse(response);
      expect(result).toEqual(mockEvent);
    });
    
    // Prueba: respuesta con array (toma el primer elemento)
    it('should return first item if response.data is an array', () => {
      const response = mockApiResponse([mockEvent, mockEventArray[1]]);
      const result = (service as any).handleSingleResponse(response);
      expect(result).toEqual(mockEvent);
    });
    
    // Prueba: array vacío (no hay resultados)
    it('should throw error if response.data is an empty array', () => {
      const response = mockApiResponse([]);
      expect(() => (service as any).handleSingleResponse(response))
        .toThrowError('No se encontraron resultados');
    });

    // Prueba: diferentes tipos de errores
    it('should throw error if response.success is false or data is null', () => {
      const errorResponse = mockApiErrorResponse('Operación fallida');
      expect(() => (service as any).handleSingleResponse(errorResponse))
        .toThrowError('Operación fallida');
        
      const errorResponseNull = { success: true, data: null };
      expect(() => (service as any).handleSingleResponse(errorResponseNull))
        .toThrowError('Datos no disponibles');
    });
  });

  describe('private#handleError (Branch Coverage)', () => {
    // Prueba: error con mensaje específico del API
    it('should use error.error.message if available', (done) => {
      (service as any).handleError('test', { error: { message: 'Error API' } }).subscribe({
        error: (err: Error) => { expect(err.message).toBe('Error API'); done(); }
      });
    });

    // Prueba: error con mensaje general
    it('should use error.message if error.error.message is missing', (done) => {
      (service as any).handleError('test', { message: 'Error Cliente' }).subscribe({
        error: (err: Error) => { expect(err.message).toBe('Error Cliente'); done(); }
      });
    });

    // Prueba: error sin mensaje específico (usa mensaje por defecto)
    it('should use fallback message if no message is found', (done) => {
      (service as any).handleError('test', {}).subscribe({
        error: (err: Error) => { expect(err.message).toBe('Error desconocido'); done(); }
      });
    });
  });

  // ==========================================
  // OPERACIONES CRUD PARA EVENTOS
  // ==========================================

  describe('Event CRUD', () => {
    // Prueba: Obtener todos los eventos exitosamente
    it('getAllEvents() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.EVENTS.BASE).and.returnValue(of(mockApiResponse(mockEventArray)));
      service.getAllEvents().subscribe(events => {
        expect(events).toEqual(mockEventArray);
        done();
      });
    });
    
    // Prueba: Manejo de errores al obtener eventos
    it('getAllEvents() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.EVENTS.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllEvents().subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // Prueba: Obtener un evento específico por ID
    it('getEventById() should fetch one event', (done) => {
      mockApiService.getOb.withArgs(apiRouters.EVENTS.BY_ID('evt1')).and.returnValue(of(mockApiResponse(mockEvent)));
      service.getEventById('evt1').subscribe(event => {
        expect(event).toEqual(mockEvent);
        done();
      });
    });
    
    // Prueba: Manejo de errores al obtener evento por ID
    it('getEventById() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.EVENTS.BY_ID('evt1')).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getEventById('evt1').subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // Prueba: Crear un nuevo evento
    it('createEvent() should post and update subject', (done) => {
      const newEvent: NewEvent = { ...mockEvent, name: 'Nuevo' };
      // Eliminamos propiedades que se generan automáticamente en el backend
      delete (newEvent as any)._id; delete (newEvent as any).createdAt; delete (newEvent as any).updatedAt;
      
      const createdEvent: Event = { ...newEvent, _id: 'evtNew', createdAt: new Date(), updatedAt: new Date() };
      mockApiService.postOb.and.returnValue(of(mockApiResponse(createdEvent)));
      
      service.createEvent(newEvent).subscribe(event => {
        expect(event).toEqual(createdEvent);
        // Verificamos que se actualizó el subject interno
        expect(service['eventsSubject'].value).toEqual([createdEvent]); 
        done();
      });
    });
    
    // Prueba: Manejo de errores al crear evento
    it('createEvent() should handle errors', (done) => {
      mockApiService.postOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      const newEventMock: NewEvent = { ...mockEvent, name: 'Test' };
      delete (newEventMock as any)._id; delete (newEventMock as any).createdAt; delete (newEventMock as any).updatedAt;
      service.createEvent(newEventMock).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // Prueba: Actualizar un evento existente
    it('updateEvent() should put and update subject', (done) => {
      // Pre-cargamos datos en el subject
      service['eventsSubject'].next(mockEventArray); 
      const updatePayload: UpdateEvent = { _id: 'evt1', name: 'Actualizado' };
      const updatedEvent: Event = { ...mockEvent, ...updatePayload };
      
      mockApiService.putOb.and.returnValue(of(mockApiResponse(updatedEvent)));
      
      service.updateEvent('evt1', updatePayload).subscribe(event => {
        expect(event).toEqual(updatedEvent);
        // Verificamos que se actualizó el evento en el subject
        expect(service['eventsSubject'].value[0].name).toBe('Actualizado');
        done();
      });
    });
    
    // Prueba: Manejo de errores al actualizar evento
    it('updateEvent() should handle errors', (done) => {
      mockApiService.putOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.updateEvent('evt1', mockEvent as UpdateEvent).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // Prueba: Eliminar un evento
    it('deleteEvent() should delete and update subject', (done) => {
      // Pre-cargamos datos en el subject
      service['eventsSubject'].next(mockEventArray);
      mockApiService.deleteOb.and.returnValue(of(mockApiResponse({}))); 
      
      service.deleteEvent('evt1').subscribe(() => {
        // Verificamos que se eliminó el evento del subject
        expect(service['eventsSubject'].value.length).toBe(1);
        expect(service['eventsSubject'].value[0]._id).toBe('evt2');
        done();
      });
    });

    // Prueba: Manejo de errores al eliminar evento
    it('deleteEvent() should handle errors', (done) => {
      mockApiService.deleteOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.deleteEvent('evt1').subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });
  });

  // ==========================================
  // OPERACIONES ESPECÍFICAS PARA EVENTOS
  // ==========================================

  describe('Local Event Filters', () => {
    // Prueba: Filtrar eventos por estado
    it('getEventsByStatus() should filter by status', (done) => {
      service['eventsSubject'].next(mockEventArray);
      service.getEventsByStatus('en_progreso').subscribe(events => {
        expect(events.length).toBe(1);
        done();
      });
    });

    // Prueba: Filtrar eventos por rango de fechas
    it('getEventsByDateRange() should filter by date', (done) => {
      const eventsWithDates: Event[] = [
        { ...mockEvent, _id: 'e1', startDate: new Date('2025-01-05'), endDate: new Date('2025-01-06') },
        { ...mockEvent, _id: 'e2', startDate: new Date('2025-01-10'), endDate: new Date('2025-01-11') }
      ];
      service['eventsSubject'].next(eventsWithDates);
      
      service.getEventsByDateRange(new Date('2025-01-01'), new Date('2025-01-07')).subscribe(events => {
        expect(events.length).toBe(1);
        done();
      });
    });

    // Prueba: Actualizar solo el estado de un evento
    it('updateEventStatus() should call updateEvent with partial payload', (done) => {
      const partialPayload = { status: 'completado' };
      const updatedEvent: Event = { ...mockEvent, status: 'completado' };
      const spy = spyOn(service, 'updateEvent').and.returnValue(of(updatedEvent));
      
      service.updateEventStatus('evt1', 'completado').subscribe(event => {
        expect(event.status).toBe('completado');
        // Verificamos que se llamó a updateEvent con el payload correcto
        expect(spy).toHaveBeenCalledWith('evt1', partialPayload as UpdateEvent);
        done();
      });
    });

    // Pruebas de búsqueda de eventos
    describe('searchEvents() (Branch Coverage)', () => {
      const eventsToSearch: Event[] = [
        { ...mockEvent, _id: 'e1', name: 'Boda', description: 'Fiesta', location: 'Jardín' },
        { ...mockEvent, _id: 'e2', name: 'Reunión', description: 'Junta', location: 'Oficina' },
        { ...mockEvent, _id: 'e3', name: 'Congreso', description: 'Ponencia', location: 'Auditorio Boda' },
        { ...mockEvent, _id: 'e4', name: 'NullTest', description: '', location: '' }, // Prueba con campos vacíos
      ];
      
      beforeEach(() => { service['eventsSubject'].next(eventsToSearch); });
      
      it('should find by name', (done) => { 
        service.searchEvents('Boda').subscribe(events => { 
          expect(events.length).toBe(2); // Encuentra "Boda" y "Congreso Boda"
          done(); 
        }); 
      });
      
      it('should find by description', (done) => { 
        service.searchEvents('Junta').subscribe(events => { 
          expect(events.length).toBe(1); 
          done(); 
        }); 
      });
      
      it('should find by location', (done) => { 
        service.searchEvents('Oficina').subscribe(events => { 
          expect(events.length).toBe(1); 
          done(); 
        }); 
      });
      
      it('should return empty if no match', (done) => { 
        service.searchEvents('Zebra').subscribe(events => { 
          expect(events.length).toBe(0); 
          done(); 
        }); 
      });
      
      it('should handle empty string properties (optional chaining)', (done) => { 
        service.searchEvents('NullTest').subscribe(events => { 
          expect(events.length).toBe(1); 
          done(); 
        }); 
      });
    });
  });
  
  // ==========================================
  // OPERACIONES CRUD PARA TIPOS DE EVENTOS
  // ==========================================

  describe('EventType CRUD', () => {
    // Prueba: Obtener todos los tipos de evento
    it('getAllEventTypes() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.EVENT.BASE).and.returnValue(of(mockApiResponse(mockEventTypeArray)));
      service.getAllEventTypes().subscribe(types => {
        expect(types).toEqual(mockEventTypeArray);
        done();
      });
    });

    // Prueba: Manejo de errores al obtener tipos de evento
    it('getAllEventTypes() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.EVENT.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllEventTypes().subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });
    
    // Prueba: Obtener un tipo de evento específico por ID
    it('getEventTypeById() should fetch one event type', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.EVENT.BY_ID('type1')).and.returnValue(of(mockApiResponse(mockEventType)));
      service.getEventTypeById('type1').subscribe(type => {
        expect(type).toEqual(mockEventType);
        done();
      });
    });
    
    // Prueba: Manejo de errores al obtener tipo de evento por ID
    it('getEventTypeById() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.EVENT.BY_ID('type1')).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getEventTypeById('type1').subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // =======================================================
    // PRUEBA AÑADIDA (Función Faltante 1/3): CREAR TIPO DE EVENTO
    // =======================================================
    it('createEventType() should post and update subject', (done) => {
      const newEventType: NewEventType = { ...mockEventType, name: 'Nuevo Tipo' };
      // Eliminamos propiedades generadas automáticamente
      delete (newEventType as any)._id; delete (newEventType as any).createdAt; delete (newEventType as any).updatedAt;
      
      const createdEventType: EventType = { ...newEventType, _id: 'typeNew', createdAt: new Date(), updatedAt: new Date() };
      
      mockApiService.postOb.and.returnValue(of(mockApiResponse(createdEventType)));
      
      service.createEventType(newEventType).subscribe(type => {
        expect(type).toEqual(createdEventType);
        // Verificamos que se actualizó el subject
        expect(service['eventTypesSubject'].value).toEqual([createdEventType]);
        done();
      });
    });
    
    // Prueba: Manejo de errores al crear tipo de evento
    it('createEventType() should handle errors', (done) => {
      mockApiService.postOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      const newEventTypeMock: NewEventType = { ...mockEventType, name: 'Test' };
      delete (newEventTypeMock as any)._id; delete (newEventTypeMock as any).createdAt; delete (newEventTypeMock as any).updatedAt;
      service.createEventType(newEventTypeMock).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // =======================================================
    // PRUEBA AÑADIDA (Función Faltante 2/3): ACTUALIZAR TIPO DE EVENTO
    // =======================================================
    it('updateEventType() should put and update subject', (done) => {
      // Pre-cargamos datos en el subject
      service['eventTypesSubject'].next(mockEventTypeArray);
      const updatePayload: UpdateEventType = { _id: 'type1', name: 'Tipo Actualizado' };
      const updatedEventType: EventType = { ...mockEventType, ...updatePayload };
      
      mockApiService.putOb.and.returnValue(of(mockApiResponse(updatedEventType)));
      
      service.updateEventType('type1', updatePayload).subscribe(type => {
        expect(type).toEqual(updatedEventType);
        // Verificamos que se actualizó el subject
        expect(service['eventTypesSubject'].value[0].name).toBe('Tipo Actualizado');
        done();
      });
    });
    
    // Prueba: Manejo de errores al actualizar tipo de evento
    it('updateEventType() should handle errors', (done) => {
      mockApiService.putOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.updateEventType('type1', mockEventType as UpdateEventType).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // =======================================================
    // PRUEBA AÑADIDA (Función Faltante 3/3): ELIMINAR TIPO DE EVENTO
    // =======================================================
    it('deleteEventType() should delete and update subject', (done) => {
      // Pre-cargamos datos en el subject
      service['eventTypesSubject'].next(mockEventTypeArray);
      mockApiService.deleteOb.and.returnValue(of(mockApiResponse({})));
      
      service.deleteEventType('type1').subscribe(() => {
        // Verificamos que se eliminó del subject
        expect(service['eventTypesSubject'].value.length).toBe(0);
        done();
      });
    });

    // Prueba: Manejo de errores al eliminar tipo de evento
    it('deleteEventType() should handle errors', (done) => {
      mockApiService.deleteOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.deleteEventType('type1').subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });
  });

  // ==========================================
  // OPERACIONES ESPECÍFICAS PARA TIPOS DE EVENTOS
  // ==========================================

  describe('Local EventType Filters', () => {
    // Prueba: Filtrar tipos de evento activos
    it('getActiveEventTypes() should filter by active=true', (done) => {
      const types: EventType[] = [
        { ...mockEventType, _id: 't1', active: true },
        { ...mockEventType, _id: 't2', active: false },
      ];
      service['eventTypesSubject'].next(types);
      
      service.getActiveEventTypes().subscribe(activeTypes => {
        expect(activeTypes.length).toBe(1);
        done();
      });
    });
    
    // Prueba: Filtrar tipos de evento por categoría
    it('getEventTypesByCategory() should filter by category', (done) => {
      const types: EventType[] = [
        { ...mockEventType, _id: 't1', category: 'social' },
        { ...mockEventType, _id: 't2', category: 'corporativo' },
      ];
      service['eventTypesSubject'].next(types);
      
      service.getEventTypesByCategory('social').subscribe(socialTypes => {
        expect(socialTypes.length).toBe(1);
        done();
      });
    });

    // Prueba: Actualizar solo el estado activo de un tipo de evento
    it('updateEventTypeStatus() should call updateEventType with partial payload', (done) => {
      const partialPayload = { active: false };
      const updatedType: EventType = { ...mockEventType, active: false };
      const spy = spyOn(service, 'updateEventType').and.returnValue(of(updatedType));
      
      service.updateEventTypeStatus('type1', false).subscribe(() => {
        // Verificamos que se llamó con el payload correcto
        expect(spy).toHaveBeenCalledWith('type1', partialPayload as UpdateEventType);
        done();
      });
    });
    
    // =======================================================
    // PRUEBAS AÑADIDAS (Cubren las últimas 4 Ramas): BÚSQUEDA
    // =======================================================
    describe('searchEventTypes() (Branch Coverage)', () => {
      const typesToSearch: EventType[] = [
        { ...mockEventType, _id: 't1', name: 'Boda', description: 'Fiesta' },
        { ...mockEventType, _id: 't2', name: 'Reunión', description: 'Junta' },
        { ...mockEventType, _id: 't3', name: 'Congreso Boda', description: undefined }, // Prueba de optional chaining
      ];
      
      beforeEach(() => { service['eventTypesSubject'].next(typesToSearch); });
      
      it('should find by name', (done) => { 
        service.searchEventTypes('Boda').subscribe(types => { 
          expect(types.length).toBe(2); // Encuentra "Boda" y "Congreso Boda"
          done(); 
        }); 
      });
      
      it('should find by description', (done) => { 
        service.searchEventTypes('Junta').subscribe(types => { 
          expect(types.length).toBe(1); 
          done(); 
        }); 
      });
      
      it('should return empty if no match', (done) => { 
        service.searchEventTypes('Zebra').subscribe(types => { 
          expect(types.length).toBe(0); 
          done(); 
        }); 
      });
      
      it('should handle undefined description (optional chaining)', (done) => { 
        service.searchEventTypes('Congreso').subscribe(types => { 
          expect(types.length).toBe(1); 
          done(); 
        }); 
      });
    });
  });
  
  // ==========================================
  // MÉTODOS DE REFRESCO
  // ==========================================

  describe('Refresh Methods', () => {
    // Prueba: Refrescar lista de eventos
    it('refreshEvents() should call getAllEvents', () => {
      mockApiService.getOb.withArgs(apiRouters.EVENTS.BASE).and.returnValue(of(mockApiResponse(mockEventArray)));
      service.refreshEvents();
      // Verificamos que se actualizó el subject
      expect(service['eventsSubject'].value).toEqual(mockEventArray);
    });

    // Prueba: Refrescar lista de tipos de evento
    it('refreshEventTypes() should call getAllEventTypes', () => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.EVENT.BASE).and.returnValue(of(mockApiResponse(mockEventTypeArray)));
      service.refreshEventTypes();
      // Verificamos que se actualizó el subject
      expect(service['eventTypesSubject'].value).toEqual(mockEventTypeArray);
    });
  });
  
  // ==========================================
  // PRUEBAS DE DATOS (USERS, CONTRACTS, ETC)
  // ==========================================

  describe('Data Getters (Users, Contracts, PersonnelTypes)', () => {
    // Prueba: Obtener todos los usuarios
    it('getAllUsers() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.USERS.BASE).and.returnValue(of(mockApiResponse([mockUser])));
      service.getAllUsers().subscribe(users => { 
        expect(users).toEqual([mockUser]); 
        done(); 
      });
    });
    
    // Prueba: Manejo de errores al obtener usuarios
    it('getAllUsers() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.USERS.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllUsers().subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // Prueba: Obtener todos los contratos
    it('getAllContracts() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.CONTRACTS.BASE).and.returnValue(of(mockApiResponse([mockContract])));
      service.getAllContracts().subscribe(contracts => { 
        expect(contracts).toEqual([mockContract]); 
        done(); 
      });
    });

    // Prueba: Manejo de errores al obtener contratos
    it('getAllContracts() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.CONTRACTS.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllContracts().subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });
    
    // Prueba: Obtener todos los tipos de personal
    it('getAllPersonnelTypes() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(of(mockApiResponse([mockPersonnelType])));
      service.getAllPersonnelTypes().subscribe(types => { 
        expect(types).toEqual([mockPersonnelType]); 
        done(); 
      });
    });
    
    // Prueba: Manejo de errores al obtener tipos de personal
    it('getAllPersonnelTypes() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllPersonnelTypes().subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });
  });
});