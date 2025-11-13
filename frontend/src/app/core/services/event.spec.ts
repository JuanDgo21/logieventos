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
describe('EventService', () => {
  let service: EventService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  // --- DATOS DE PRUEBA (MOCKS) CORREGIDOS ---
  
  const mockUser: User = { _id: 'user1', fullname: 'Usuario Prueba', username: 'testuser' };
  const mockContract: Contract = { _id: 'cont1', name: 'Contrato Prueba' };
  const mockPersonnelType: PersonnelType = { _id: 'pt1', name: 'Tipo Personal Prueba' };

  const mockEventType: EventType = {
    _id: 'type1',
    name: 'Tipo de Evento Prueba',
    active: true,
    category: 'corporativo',
    defaultResources: [],
    requiredPersonnelType: 'pt1',
    estimatedDuration: 120,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const mockEventTypeArray: EventType[] = [mockEventType];

  const mockEvent: Event = {
    _id: 'evt1',
    name: 'Evento de Prueba',
    description: 'Descripción',
    startDate: new Date('2025-01-01T10:00:00Z'),
    endDate: new Date('2025-01-01T12:00:00Z'),
    status: 'planificado',
    location: 'Salón A',
    eventType: 'type1',
    contract: 'cont1',
    responsable: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const mockEventArray: Event[] = [
    mockEvent,
    { ...mockEvent, _id: 'evt2', name: 'Evento 2', status: 'en_progreso' }
  ];
  
  // Helper para simular respuestas de API (éxito)
  const mockApiResponse = (data: any) => ({
    success: true,
    data: data
  });
  
  // Helper para simular respuestas de API (error)
  const mockApiErrorResponse = (message: string) => ({
    success: false,
    message: message
  });

  // --- CONFIGURACIÓN ANTES DE CADA PRUEBA (beforeEach) ---
  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getOb', 'postOb', 'putOb', 'deleteOb']);

    // Mockeamos las 5 llamadas del constructor
    mockApiService.getOb.withArgs(apiRouters.EVENTS.BASE).and.returnValue(of(mockApiResponse([])));
    mockApiService.getOb.withArgs(apiRouters.TYPES.EVENT.BASE).and.returnValue(of(mockApiResponse([])));
    mockApiService.getOb.withArgs(apiRouters.USERS.BASE).and.returnValue(of(mockApiResponse([])));
    mockApiService.getOb.withArgs(apiRouters.CONTRACTS.BASE).and.returnValue(of(mockApiResponse([])));
    mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(of(mockApiResponse([])));

    TestBed.configureTestingModule({
      providers: [
        EventService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(EventService);
  });

  // --- INICIO DE LOS CASOS DE PRUEBA ---

  it('should be created and call loadInitialData on constructor', () => {
    expect(service).toBeTruthy();
    expect(mockApiService.getOb).toHaveBeenCalledTimes(5);
  });
  
  // ============ PRUEBAS DE COBERTURA DE RAMAS (BRANCHES) ============

  describe('private#handleArrayResponse (Branch Coverage)', () => {
    it('should return array data if data is already an array', () => {
      const response = mockApiResponse(mockEventArray);
      const result = (service as any).handleArrayResponse(response);
      expect(result).toEqual(mockEventArray);
    });

    it('should wrap single object in an array', () => {
      const response = mockApiResponse(mockEvent);
      const result = (service as any).handleArrayResponse(response);
      expect(result).toEqual([mockEvent]);
    });
    
    it('should throw error if response.success is false', () => {
      const errorResponse = mockApiErrorResponse('Operación fallida');
      expect(() => (service as any).handleArrayResponse(errorResponse))
        .toThrowError('Operación fallida');
    });

    it('should throw error if response.data is null', () => {
      const errorResponse = { success: true, data: null };
      expect(() => (service as any).handleArrayResponse(errorResponse))
        .toThrowError('Datos no disponibles');
    });
  });

  describe('private#handleSingleResponse (Branch Coverage)', () => {
    it('should return object data if data is already an object', () => {
      const response = mockApiResponse(mockEvent);
      const result = (service as any).handleSingleResponse(response);
      expect(result).toEqual(mockEvent);
    });
    
    it('should return first item if response.data is an array', () => {
      const response = mockApiResponse([mockEvent, mockEventArray[1]]);
      const result = (service as any).handleSingleResponse(response);
      expect(result).toEqual(mockEvent);
    });
    
    it('should throw error if response.data is an empty array', () => {
      const response = mockApiResponse([]);
      expect(() => (service as any).handleSingleResponse(response))
        .toThrowError('No se encontraron resultados');
    });

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
    it('should use error.error.message if available', (done) => {
      (service as any).handleError('test', { error: { message: 'Error API' } }).subscribe({
        error: (err: Error) => { expect(err.message).toBe('Error API'); done(); }
      });
    });

    it('should use error.message if error.error.message is missing', (done) => {
      (service as any).handleError('test', { message: 'Error Cliente' }).subscribe({
        error: (err: Error) => { expect(err.message).toBe('Error Cliente'); done(); }
      });
    });

    it('should use fallback message if no message is found', (done) => {
      (service as any).handleError('test', {}).subscribe({
        error: (err: Error) => { expect(err.message).toBe('Error desconocido'); done(); }
      });
    });
  });

  // ============ OPERACIONES CRUD PARA EVENTOS ============

  describe('Event CRUD', () => {
    it('getAllEvents() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.EVENTS.BASE).and.returnValue(of(mockApiResponse(mockEventArray)));
      service.getAllEvents().subscribe(events => {
        expect(events).toEqual(mockEventArray);
        done();
      });
    });
    
    it('getAllEvents() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.EVENTS.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllEvents().subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    it('getEventById() should fetch one event', (done) => {
      mockApiService.getOb.withArgs(apiRouters.EVENTS.BY_ID('evt1')).and.returnValue(of(mockApiResponse(mockEvent)));
      service.getEventById('evt1').subscribe(event => {
        expect(event).toEqual(mockEvent);
        done();
      });
    });
    
    it('getEventById() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.EVENTS.BY_ID('evt1')).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getEventById('evt1').subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    it('createEvent() should post and update subject', (done) => {
      const newEvent: NewEvent = { ...mockEvent, name: 'Nuevo' };
      delete (newEvent as any)._id; delete (newEvent as any).createdAt; delete (newEvent as any).updatedAt;
      const createdEvent: Event = { ...newEvent, _id: 'evtNew', createdAt: new Date(), updatedAt: new Date() };
      mockApiService.postOb.and.returnValue(of(mockApiResponse(createdEvent)));
      service.createEvent(newEvent).subscribe(event => {
        expect(event).toEqual(createdEvent);
        expect(service['eventsSubject'].value).toEqual([createdEvent]); 
        done();
      });
    });
    
    it('createEvent() should handle errors', (done) => {
      mockApiService.postOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      const newEventMock: NewEvent = { ...mockEvent, name: 'Test' };
      delete (newEventMock as any)._id; delete (newEventMock as any).createdAt; delete (newEventMock as any).updatedAt;
      service.createEvent(newEventMock).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    it('updateEvent() should put and update subject', (done) => {
      service['eventsSubject'].next(mockEventArray); 
      const updatePayload: UpdateEvent = { _id: 'evt1', name: 'Actualizado' };
      const updatedEvent: Event = { ...mockEvent, ...updatePayload };
      mockApiService.putOb.and.returnValue(of(mockApiResponse(updatedEvent)));
      service.updateEvent('evt1', updatePayload).subscribe(event => {
        expect(event).toEqual(updatedEvent);
        expect(service['eventsSubject'].value[0].name).toBe('Actualizado');
        done();
      });
    });
    
    it('updateEvent() should handle errors', (done) => {
      mockApiService.putOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.updateEvent('evt1', mockEvent as UpdateEvent).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    it('deleteEvent() should delete and update subject', (done) => {
      service['eventsSubject'].next(mockEventArray);
      mockApiService.deleteOb.and.returnValue(of(mockApiResponse({}))); 
      service.deleteEvent('evt1').subscribe(() => {
        expect(service['eventsSubject'].value.length).toBe(1);
        expect(service['eventsSubject'].value[0]._id).toBe('evt2');
        done();
      });
    });

    it('deleteEvent() should handle errors', (done) => {
      mockApiService.deleteOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.deleteEvent('evt1').subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });
  });

  // ============ OPERACIONES ESPECÍFICAS PARA EVENTOS ============

  describe('Local Event Filters', () => {
    it('getEventsByStatus() should filter by status', (done) => {
      service['eventsSubject'].next(mockEventArray);
      service.getEventsByStatus('en_progreso').subscribe(events => {
        expect(events.length).toBe(1);
        done();
      });
    });

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

    it('updateEventStatus() should call updateEvent with partial payload', (done) => {
      const partialPayload = { status: 'completado' };
      const updatedEvent: Event = { ...mockEvent, status: 'completado' };
      const spy = spyOn(service, 'updateEvent').and.returnValue(of(updatedEvent));
      service.updateEventStatus('evt1', 'completado').subscribe(event => {
        expect(event.status).toBe('completado');
        expect(spy).toHaveBeenCalledWith('evt1', partialPayload as UpdateEvent);
        done();
      });
    });

    describe('searchEvents() (Branch Coverage)', () => {
      const eventsToSearch: Event[] = [
        { ...mockEvent, _id: 'e1', name: 'Boda', description: 'Fiesta', location: 'Jardín' },
        { ...mockEvent, _id: 'e2', name: 'Reunión', description: 'Junta', location: 'Oficina' },
        { ...mockEvent, _id: 'e3', name: 'Congreso', description: 'Ponencia', location: 'Auditorio Boda' },
        { ...mockEvent, _id: 'e4', name: 'NullTest', description: '', location: '' },
      ];
      beforeEach(() => { service['eventsSubject'].next(eventsToSearch); });
      it('should find by name', (done) => { service.searchEvents('Boda').subscribe(events => { expect(events.length).toBe(2); done(); }); });
      it('should find by description', (done) => { service.searchEvents('Junta').subscribe(events => { expect(events.length).toBe(1); done(); }); });
      it('should find by location', (done) => { service.searchEvents('Oficina').subscribe(events => { expect(events.length).toBe(1); done(); }); });
      it('should return empty if no match', (done) => { service.searchEvents('Zebra').subscribe(events => { expect(events.length).toBe(0); done(); }); });
      it('should handle empty string properties (optional chaining)', (done) => { service.searchEvents('NullTest').subscribe(events => { expect(events.length).toBe(1); done(); }); });
    });
  });
  
  // ============ OPERACIONES CRUD PARA TIPOS DE EVENTOS ============

  describe('EventType CRUD', () => {

    it('getAllEventTypes() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.EVENT.BASE).and.returnValue(of(mockApiResponse(mockEventTypeArray)));
      service.getAllEventTypes().subscribe(types => {
        expect(types).toEqual(mockEventTypeArray);
        done();
      });
    });

    it('getAllEventTypes() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.EVENT.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllEventTypes().subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });
    
    it('getEventTypeById() should fetch one event type', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.EVENT.BY_ID('type1')).and.returnValue(of(mockApiResponse(mockEventType)));
      service.getEventTypeById('type1').subscribe(type => {
        expect(type).toEqual(mockEventType);
        done();
      });
    });
    
    it('getEventTypeById() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.EVENT.BY_ID('type1')).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getEventTypeById('type1').subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // =======================================================
    // PRUEBA AÑADIDA (Función Faltante 1/3)
    // =======================================================
    it('createEventType() should post and update subject', (done) => {
      const newEventType: NewEventType = { ...mockEventType, name: 'Nuevo Tipo' };
      delete (newEventType as any)._id; delete (newEventType as any).createdAt; delete (newEventType as any).updatedAt;
      const createdEventType: EventType = { ...newEventType, _id: 'typeNew', createdAt: new Date(), updatedAt: new Date() };
      
      mockApiService.postOb.and.returnValue(of(mockApiResponse(createdEventType)));
      
      service.createEventType(newEventType).subscribe(type => {
        expect(type).toEqual(createdEventType);
        expect(service['eventTypesSubject'].value).toEqual([createdEventType]); // Estaba vacío por el mock del constructor
        done();
      });
    });
    
    it('createEventType() should handle errors', (done) => {
      mockApiService.postOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      const newEventTypeMock: NewEventType = { ...mockEventType, name: 'Test' };
      delete (newEventTypeMock as any)._id; delete (newEventTypeMock as any).createdAt; delete (newEventTypeMock as any).updatedAt;
      service.createEventType(newEventTypeMock).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // =======================================================
    // PRUEBA AÑADIDA (Función Faltante 2/3)
    // =======================================================
    it('updateEventType() should put and update subject', (done) => {
      service['eventTypesSubject'].next(mockEventTypeArray); // Sembramos 1
      const updatePayload: UpdateEventType = { _id: 'type1', name: 'Tipo Actualizado' };
      const updatedEventType: EventType = { ...mockEventType, ...updatePayload };
      
      mockApiService.putOb.and.returnValue(of(mockApiResponse(updatedEventType)));
      
      service.updateEventType('type1', updatePayload).subscribe(type => {
        expect(type).toEqual(updatedEventType);
        expect(service['eventTypesSubject'].value[0].name).toBe('Tipo Actualizado');
        done();
      });
    });
    
    it('updateEventType() should handle errors', (done) => {
      mockApiService.putOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.updateEventType('type1', mockEventType as UpdateEventType).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // =======================================================
    // PRUEBA AÑADIDA (Función Faltante 3/3)
    // =======================================================
    it('deleteEventType() should delete and update subject', (done) => {
      service['eventTypesSubject'].next(mockEventTypeArray); // Sembramos 1
      mockApiService.deleteOb.and.returnValue(of(mockApiResponse({})));
      
      service.deleteEventType('type1').subscribe(() => {
        expect(service['eventTypesSubject'].value.length).toBe(0); // Debe estar vacío
        done();
      });
    });

    it('deleteEventType() should handle errors', (done) => {
      mockApiService.deleteOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.deleteEventType('type1').subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });
  });

  // ============ OPERACIONES ESPECÍFICAS PARA TIPOS DE EVENTOS ============

  describe('Local EventType Filters', () => {
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

    it('updateEventTypeStatus() should call updateEventType with partial payload', (done) => {
      const partialPayload = { active: false };
      const updatedType: EventType = { ...mockEventType, active: false };
      const spy = spyOn(service, 'updateEventType').and.returnValue(of(updatedType));
      service.updateEventTypeStatus('type1', false).subscribe(() => {
        expect(spy).toHaveBeenCalledWith('type1', partialPayload as UpdateEventType);
        done();
      });
    });
    
    // =======================================================
    // PRUEBAS AÑADIDAS (Cubren las últimas 4 Ramas)
    // =======================================================
    describe('searchEventTypes() (Branch Coverage)', () => {
      const typesToSearch: EventType[] = [
        { ...mockEventType, _id: 't1', name: 'Boda', description: 'Fiesta' },
        { ...mockEventType, _id: 't2', name: 'Reunión', description: 'Junta' },
        { ...mockEventType, _id: 't3', name: 'Congreso Boda', description: undefined }, // Prueba de optional chaining
      ];
      beforeEach(() => { service['eventTypesSubject'].next(typesToSearch); });
      it('should find by name', (done) => { service.searchEventTypes('Boda').subscribe(types => { expect(types.length).toBe(2); done(); }); });
      it('should find by description', (done) => { service.searchEventTypes('Junta').subscribe(types => { expect(types.length).toBe(1); done(); }); });
      it('should return empty if no match', (done) => { service.searchEventTypes('Zebra').subscribe(types => { expect(types.length).toBe(0); done(); }); });
      it('should handle undefined description (optional chaining)', (done) => { service.searchEventTypes('Congreso').subscribe(types => { expect(types.length).toBe(1); done(); }); });
    });
  });
  
  // ============ MÉTODOS DE REFRESCO ============

  describe('Refresh Methods', () => {
    it('refreshEvents() should call getAllEvents', () => {
      mockApiService.getOb.withArgs(apiRouters.EVENTS.BASE).and.returnValue(of(mockApiResponse(mockEventArray)));
      service.refreshEvents();
      expect(service['eventsSubject'].value).toEqual(mockEventArray);
    });

    it('refreshEventTypes() should call getAllEventTypes', () => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.EVENT.BASE).and.returnValue(of(mockApiResponse(mockEventTypeArray)));
      service.refreshEventTypes();
      expect(service['eventTypesSubject'].value).toEqual(mockEventTypeArray);
    });
  });
  
  // ============ PRUEBAS DE DATOS (USERS, CONTRACTS, ETC) ============

  describe('Data Getters (Users, Contracts, PersonnelTypes)', () => {
    it('getAllUsers() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.USERS.BASE).and.returnValue(of(mockApiResponse([mockUser])));
      service.getAllUsers().subscribe(users => { expect(users).toEqual([mockUser]); done(); });
    });
    
    it('getAllUsers() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.USERS.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllUsers().subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    it('getAllContracts() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.CONTRACTS.BASE).and.returnValue(of(mockApiResponse([mockContract])));
      service.getAllContracts().subscribe(contracts => { expect(contracts).toEqual([mockContract]); done(); });
    });

    it('getAllContracts() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.CONTRACTS.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllContracts().subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });
    
    it('getAllPersonnelTypes() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(of(mockApiResponse([mockPersonnelType])));
      service.getAllPersonnelTypes().subscribe(types => { expect(types).toEqual([mockPersonnelType]); done(); });
    });
    
    it('getAllPersonnelTypes() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllPersonnelTypes().subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });
  });
});