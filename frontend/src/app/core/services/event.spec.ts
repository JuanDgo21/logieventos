// Importaciones de Angular y RxJS
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';  // 'of' para observables exitosos, 'throwError' para errores

// Lo que vamos a probar
import { EventService } from './event';
import { ApiService } from './api';

// Constantes y tipos
import { apiRouters } from '../constants/apiRouters';  // Rutas de la API

// Interfaces para eventos y tipos de eventos
import { EventType, NewEventType, UpdateEventType } from '../../shared/interfaces/event-type';
import { Event, NewEvent, UpdateEvent } from '../../shared/interfaces/event';

// Interfaces locales del servicio
import { User, Contract, PersonnelType } from './event';

// Suite de pruebas para el EventService
describe('EventService', () => {
  let service: EventService;  // Instancia del servicio que vamos a probar
  let mockApiService: jasmine.SpyObj<ApiService>;  // Spy del ApiService para simular llamadas HTTP

  // ==========================================
  // DATOS DE PRUEBA (MOCKS)
  // ==========================================
  
  // Mock de usuario para pruebas
  const mockUser: User = { _id: 'user1', fullname: 'Usuario Prueba', username: 'testuser' };
  
  // Mock de contrato para pruebas
  const mockContract: Contract = { _id: 'cont1', name: 'Contrato Prueba' };
  
  // Mock de tipo de personal para pruebas
  const mockPersonnelType: PersonnelType = { _id: 'pt1', name: 'Tipo Personal Prueba' };

  // Mock de tipo de evento con todos los campos necesarios
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
  
  // [COVERAGE FIX] Segundo tipo para probar listas múltiples y actualizaciones selectivas
  const mockEventType2: EventType = {
    ...mockEventType,  // Copia todas las propiedades del primer tipo
    _id: 'type2',      // ID diferente
    name: 'Tipo Intacto'  // Nombre diferente
  };

  // Array con tipos de evento mock
  const mockEventTypeArray: EventType[] = [mockEventType];

  // Mock de evento individual
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
  
  // Array con múltiples eventos mock
  const mockEventArray: Event[] = [
    mockEvent,
    { ...mockEvent, _id: 'evt2', name: 'Evento 2', status: 'en_progreso' }  // Segundo evento con estado diferente
  ];
  
  // Función helper para crear respuestas API exitosas
  const mockApiResponse = (data: any) => ({
    success: true,
    data: data
  });
  
  // Función helper para crear respuestas API con error
  const mockApiErrorResponse = (message: string) => ({
    success: false,
    message: message
  });

  // Configuración que se ejecuta antes de cada prueba
  beforeEach(() => {
    // Creamos un spy object para el ApiService con todos los métodos que usa EventService
    mockApiService = jasmine.createSpyObj('ApiService', ['getOb', 'postOb', 'putOb', 'deleteOb']);

    // Configuramos respuestas por defecto para las llamadas iniciales del constructor
    mockApiService.getOb.withArgs(apiRouters.EVENTS.BASE).and.returnValue(of(mockApiResponse([])));
    mockApiService.getOb.withArgs(apiRouters.TYPES.EVENT.BASE).and.returnValue(of(mockApiResponse([])));
    mockApiService.getOb.withArgs(apiRouters.USERS.BASE).and.returnValue(of(mockApiResponse([])));
    mockApiService.getOb.withArgs(apiRouters.CONTRACTS.BASE).and.returnValue(of(mockApiResponse([])));
    mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(of(mockApiResponse([])));

    // Configuramos el módulo de testing
    TestBed.configureTestingModule({
      providers: [
        EventService,  // El servicio real que vamos a probar
        { provide: ApiService, useValue: mockApiService }  // Inyectamos el mock
      ]
    });

    // Obtenemos la instancia del servicio
    service = TestBed.inject(EventService);
  });

  // PRUEBA BÁSICA: Verificar que el servicio se crea y carga datos iniciales
  it('should be created and call loadInitialData on constructor', () => {
    expect(service).toBeTruthy();  // Verifica que el servicio se instanció
    // Verifica que el constructor hizo 5 llamadas HTTP para cargar datos iniciales
    expect(mockApiService.getOb).toHaveBeenCalledTimes(5);
  });
  
  // ==========================================
  // PRUEBAS DE MANEJO DE RESPUESTAS (BRANCH COVERAGE)
  // ==========================================

  // Grupo de pruebas para el método privado handleArrayResponse
  describe('private#handleArrayResponse (Branch Coverage)', () => {
    // Prueba: respuesta con array (caso normal)
    it('should return array data if data is already an array', () => {
      const response = mockApiResponse(mockEventArray);
      const result = (service as any).handleArrayResponse(response);  // Accedemos al método privado
      expect(result).toEqual(mockEventArray);  // Debe devolver el array tal cual
    });

    // Prueba: respuesta con objeto único (debe convertirse a array)
    it('should wrap single object in an array', () => {
      const response = mockApiResponse(mockEvent);
      const result = (service as any).handleArrayResponse(response);
      expect(result).toEqual([mockEvent]);  // Debe envolver el objeto en un array
    });
    
    // Prueba: respuesta con error explícito
    it('should throw error with message if response.success is false', () => {
      const errorResponse = mockApiErrorResponse('Error explícito');
      expect(() => (service as any).handleArrayResponse(errorResponse))
        .toThrowError('Error explícito');  // Debe lanzar error con el mensaje específico
    });

    // [COVERAGE FIX] Prueba el caso donde message es undefined -> || 'Operación fallida'
    it('should throw default error "Operación fallida" if response.message is missing', () => {
      const errorResponse = { success: false }; // Sin propiedad message
      expect(() => (service as any).handleArrayResponse(errorResponse))
        .toThrowError('Operación fallida');  // Debe usar mensaje por defecto
    });

    // Prueba: respuesta exitosa pero data es null
    it('should throw error if response.data is null', () => {
      const errorResponse = { success: true, data: null };
      expect(() => (service as any).handleArrayResponse(errorResponse))
        .toThrowError('Datos no disponibles');
    });
  });

  // Grupo de pruebas para el método privado handleSingleResponse
  describe('private#handleSingleResponse (Branch Coverage)', () => {
    // Prueba: respuesta con objeto único (caso normal)
    it('should return object data if data is already an object', () => {
      const response = mockApiResponse(mockEvent);
      const result = (service as any).handleSingleResponse(response);
      expect(result).toEqual(mockEvent);  // Debe devolver el objeto tal cual
    });
    
    // Prueba: respuesta con array (debe tomar el primer elemento)
    it('should return first item if response.data is an array', () => {
      const response = mockApiResponse([mockEvent, mockEventArray[1]]);
      const result = (service as any).handleSingleResponse(response);
      expect(result).toEqual(mockEvent);  // Debe devolver el primer elemento del array
    });
    
    // Prueba: respuesta con array vacío
    it('should throw error if response.data is an empty array', () => {
      const response = mockApiResponse([]);
      expect(() => (service as any).handleSingleResponse(response))
        .toThrowError('No se encontraron resultados');
    });

    // [COVERAGE FIX] Prueba el caso donde message es undefined -> || 'Operación fallida'
    it('should throw default error "Operación fallida" if response.message is missing', () => {
      const errorResponse = { success: false }; // Sin propiedad message
      expect(() => (service as any).handleSingleResponse(errorResponse))
        .toThrowError('Operación fallida');  // Debe usar mensaje por defecto
    });

    // Prueba: diferentes tipos de respuestas con error
    it('should throw error if response.success is false (with message) or data is null', () => {
      const errorResponse = mockApiErrorResponse('Operación fallida');
      expect(() => (service as any).handleSingleResponse(errorResponse))
        .toThrowError('Operación fallida');  // Error con mensaje específico
        
      const errorResponseNull = { success: true, data: null };
      expect(() => (service as any).handleSingleResponse(errorResponseNull))
        .toThrowError('Datos no disponibles');  // Error por datos nulos
    });
  });

  // Grupo de pruebas para el método privado handleError
  describe('private#handleError (Branch Coverage)', () => {
    // Prueba: error con mensaje anidado (error.error.message)
    it('should use error.error.message if available', (done) => {
      (service as any).handleError('test', { error: { message: 'Error API' } }).subscribe({
        error: (err: Error) => { 
          expect(err.message).toBe('Error API');  // Debe usar el mensaje anidado
          done();  // Marcamos la prueba async como completada
        }
      });
    });

    // Prueba: error con mensaje directo (error.message)
    it('should use error.message if error.error.message is missing', (done) => {
      (service as any).handleError('test', { message: 'Error Cliente' }).subscribe({
        error: (err: Error) => { 
          expect(err.message).toBe('Error Cliente');  // Debe usar el mensaje directo
          done();
        }
      });
    });

    // Prueba: error sin mensaje (debe usar mensaje por defecto)
    it('should use fallback message if no message is found', (done) => {
      (service as any).handleError('test', {}).subscribe({
        error: (err: Error) => { 
          expect(err.message).toBe('Error desconocido');  // Debe usar mensaje por defecto
          done();
        }
      });
    });
  });

  // ==========================================
  // OPERACIONES CRUD PARA EVENTOS
  // ==========================================

  describe('Event CRUD', () => {
    // Prueba: obtener todos los eventos exitosamente
    it('getAllEvents() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.EVENTS.BASE).and.returnValue(of(mockApiResponse(mockEventArray)));
      service.getAllEvents().subscribe(events => {
        expect(events).toEqual(mockEventArray);  // Verifica los eventos recibidos
        done();
      });
    });
    
    // Prueba: manejo de errores al obtener eventos
    it('getAllEvents() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.EVENTS.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllEvents().subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error');  // Verifica el mensaje de error
          done();
        }
      });
    });

    // Prueba: obtener un evento específico por ID
    it('getEventById() should fetch one event', (done) => {
      mockApiService.getOb.withArgs(apiRouters.EVENTS.BY_ID('evt1')).and.returnValue(of(mockApiResponse(mockEvent)));
      service.getEventById('evt1').subscribe(event => {
        expect(event).toEqual(mockEvent);  // Verifica el evento específico
        done();
      });
    });
    
    // Prueba: manejo de errores al obtener evento por ID
    it('getEventById() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.EVENTS.BY_ID('evt1')).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getEventById('evt1').subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error');
          done();
        }
      });
    });

    // Prueba: crear nuevo evento
    it('createEvent() should post and update subject', (done) => {
      // Preparamos datos para crear (sin propiedades de sistema)
      const newEvent: NewEvent = { ...mockEvent, name: 'Nuevo' };
      delete (newEvent as any)._id; delete (newEvent as any).createdAt; delete (newEvent as any).updatedAt;
      
      const createdEvent: Event = { ...newEvent, _id: 'evtNew', createdAt: new Date(), updatedAt: new Date() };
      mockApiService.postOb.and.returnValue(of(mockApiResponse(createdEvent)));
      
      service.createEvent(newEvent).subscribe(event => {
        expect(event).toEqual(createdEvent);  // Verifica el evento creado
        expect(service['eventsSubject'].value).toEqual([createdEvent]);  // Verifica que se actualizó el Subject
        done();
      });
    });
    
    // Prueba: manejo de errores al crear evento
    it('createEvent() should handle errors', (done) => {
      mockApiService.postOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      const newEventMock: NewEvent = { ...mockEvent, name: 'Test' };
      delete (newEventMock as any)._id; delete (newEventMock as any).createdAt; delete (newEventMock as any).updatedAt;
      service.createEvent(newEventMock).subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error');
          done();
        }
      });
    });

    // [COVERAGE FIX] Actualización con lista para verificar .map
    it('updateEvent() should put and update specific item in subject', (done) => {
      // Precargamos dos eventos en el Subject
      const event1 = { ...mockEvent, _id: 'evt1', name: 'Original' };
      const event2 = { ...mockEvent, _id: 'evt2', name: 'Otro' };
      service['eventsSubject'].next([event1, event2]);

      const updatePayload: UpdateEvent = { _id: 'evt1', name: 'Actualizado' };
      const updatedEvent: Event = { ...event1, ...updatePayload };
      
      mockApiService.putOb.and.returnValue(of(mockApiResponse(updatedEvent)));
      
      service.updateEvent('evt1', updatePayload).subscribe(event => {
        expect(event).toEqual(updatedEvent);  // Verifica el evento actualizado
        const currentList = service['eventsSubject'].value;
        // Verifica que el evento 1 se actualizó
        expect(currentList.find(e => e._id === 'evt1')?.name).toBe('Actualizado');
        // Verifica que el evento 2 NO cambió
        expect(currentList.find(e => e._id === 'evt2')?.name).toBe('Otro');
        done();
      });
    });
    
    // Prueba: manejo de errores al actualizar evento
    it('updateEvent() should handle errors', (done) => {
      mockApiService.putOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.updateEvent('evt1', mockEvent as UpdateEvent).subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error');
          done();
        }
      });
    });

    // Prueba: eliminar evento
    it('deleteEvent() should delete and update subject', (done) => {
      service['eventsSubject'].next(mockEventArray);  // Precargamos eventos
      mockApiService.deleteOb.and.returnValue(of(mockApiResponse({}))); 
      
      service.deleteEvent('evt1').subscribe(() => {
        // Verifica que se eliminó un evento
        expect(service['eventsSubject'].value.length).toBe(1);
        // Verifica que quedó el evento correcto
        expect(service['eventsSubject'].value[0]._id).toBe('evt2');
        done();
      });
    });

    // Prueba: manejo de errores al eliminar evento
    it('deleteEvent() should handle errors', (done) => {
      mockApiService.deleteOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.deleteEvent('evt1').subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error');
          done();
        }
      });
    });
  });

  // ==========================================
  // OPERACIONES ESPECÍFICAS PARA EVENTOS
  // ==========================================

  describe('Local Event Filters', () => {
    // Prueba: filtrar eventos por estado
    it('getEventsByStatus() should filter by status', (done) => {
      service['eventsSubject'].next(mockEventArray);  // Precargamos eventos
      service.getEventsByStatus('en_progreso').subscribe(events => {
        expect(events.length).toBe(1);  // Solo debe encontrar 1 evento en progreso
        done();
      });
    });

    // Prueba: filtrar eventos por rango de fechas
    it('getEventsByDateRange() should filter by date', (done) => {
      const eventsWithDates: Event[] = [
        { ...mockEvent, _id: 'e1', startDate: new Date('2025-01-05'), endDate: new Date('2025-01-06') },
        { ...mockEvent, _id: 'e2', startDate: new Date('2025-01-10'), endDate: new Date('2025-01-11') }
      ];
      service['eventsSubject'].next(eventsWithDates);
      
      // Filtramos eventos entre el 1 y 7 de enero
      service.getEventsByDateRange(new Date('2025-01-01'), new Date('2025-01-07')).subscribe(events => {
        expect(events.length).toBe(1);  // Solo el evento del 5-6 de enero debe coincidir
        done();
      });
    });

    // Prueba: actualizar solo el estado de un evento
    it('updateEventStatus() should call updateEvent with partial payload', (done) => {
      const partialPayload = { status: 'completado' };  // Solo el campo a actualizar
      const updatedEvent: Event = { ...mockEvent, status: 'completado' };
      const spy = spyOn(service, 'updateEvent').and.returnValue(of(updatedEvent));  // Espiamos updateEvent
      
      service.updateEventStatus('evt1', 'completado').subscribe(event => {
        expect(event.status).toBe('completado');  // Verifica el nuevo estado
        expect(spy).toHaveBeenCalledWith('evt1', partialPayload as UpdateEvent);  // Verifica llamada con payload parcial
        done();
      });
    });

    // Grupo de pruebas para búsqueda de eventos
    describe('searchEvents() (Branch Coverage)', () => {
      const eventsToSearch: Event[] = [
        { ...mockEvent, _id: 'e1', name: 'Boda', description: 'Fiesta', location: 'Jardín' },
        { ...mockEvent, _id: 'e2', name: 'Reunión', description: 'Junta', location: 'Oficina' },
        { ...mockEvent, _id: 'e3', name: 'Congreso Boda', description: 'Ponencia', location: 'Auditorio Boda' },
        { ...mockEvent, _id: 'e4', name: 'NullTest', description: '', location: '' },  // Para probar propiedades vacías
      ];
      
      // Precargamos eventos antes de cada prueba
      beforeEach(() => { service['eventsSubject'].next(eventsToSearch); });
      
      // Prueba: búsqueda por nombre
      it('should find by name', (done) => { 
        service.searchEvents('Boda').subscribe(events => { 
          expect(events.length).toBe(2);  // 'Boda' y 'Congreso Boda'
          done(); 
        }); 
      });
      
      // Prueba: búsqueda por descripción
      it('should find by description', (done) => { 
        service.searchEvents('Junta').subscribe(events => { 
          expect(events.length).toBe(1);  // Solo 'Reunión' tiene 'Junta' en descripción
          done(); 
        }); 
      });
      
      // Prueba: búsqueda por ubicación
      it('should find by location', (done) => { 
        service.searchEvents('Oficina').subscribe(events => { 
          expect(events.length).toBe(1);  // Solo 'Reunión' tiene 'Oficina' en ubicación
          done(); 
        }); 
      });
      
      // Prueba: búsqueda sin resultados
      it('should return empty if no match', (done) => { 
        service.searchEvents('Zebra').subscribe(events => { 
          expect(events.length).toBe(0);  // No hay eventos con 'Zebra'
          done(); 
        }); 
      });
      
      // Prueba: manejo de propiedades string vacías
      it('should handle empty string properties (optional chaining)', (done) => { 
        service.searchEvents('NullTest').subscribe(events => { 
          expect(events.length).toBe(1);  // Debe encontrar por nombre aunque otras propiedades estén vacías
          done(); 
        }); 
      });
    });
  });
  
  // ==========================================
  // OPERACIONES CRUD PARA TIPOS DE EVENTOS
  // ==========================================

  describe('EventType CRUD', () => {
    // Prueba: obtener todos los tipos de evento
    it('getAllEventTypes() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.EVENT.BASE).and.returnValue(of(mockApiResponse(mockEventTypeArray)));
      service.getAllEventTypes().subscribe(types => {
        expect(types).toEqual(mockEventTypeArray);  // Verifica los tipos recibidos
        done();
      });
    });

    // Prueba: manejo de errores al obtener tipos de evento
    it('getAllEventTypes() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.EVENT.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllEventTypes().subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error');
          done();
        }
      });
    });
    
    // Prueba: obtener tipo de evento por ID
    it('getEventTypeById() should fetch one event type', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.EVENT.BY_ID('type1')).and.returnValue(of(mockApiResponse(mockEventType)));
      service.getEventTypeById('type1').subscribe(type => {
        expect(type).toEqual(mockEventType);  // Verifica el tipo específico
        done();
      });
    });
    
    // Prueba: manejo de errores al obtener tipo por ID
    it('getEventTypeById() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.EVENT.BY_ID('type1')).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getEventTypeById('type1').subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error');
          done();
        }
      });
    });

    // Prueba: crear nuevo tipo de evento
    it('createEventType() should post and update subject', (done) => {
      const newEventType: NewEventType = { ...mockEventType, name: 'Nuevo Tipo' };
      delete (newEventType as any)._id; delete (newEventType as any).createdAt; delete (newEventType as any).updatedAt;
      
      const createdEventType: EventType = { ...newEventType, _id: 'typeNew', createdAt: new Date(), updatedAt: new Date() };
      
      mockApiService.postOb.and.returnValue(of(mockApiResponse(createdEventType)));
      
      service.createEventType(newEventType).subscribe(type => {
        expect(type).toEqual(createdEventType);  // Verifica el tipo creado
        expect(service['eventTypesSubject'].value).toEqual([createdEventType]);  // Verifica actualización del Subject
        done();
      });
    });
    
    // Prueba: manejo de errores al crear tipo
    it('createEventType() should handle errors', (done) => {
      mockApiService.postOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      const newEventTypeMock: NewEventType = { ...mockEventType, name: 'Test' };
      delete (newEventTypeMock as any)._id; delete (newEventTypeMock as any).createdAt; delete (newEventTypeMock as any).updatedAt;
      service.createEventType(newEventTypeMock).subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error');
          done();
        }
      });
    });

    // [COVERAGE FIX] Actualización con lista múltiple para cubrir la rama 'else' del map
    it('updateEventType() should update specific item and leave others unchanged', (done) => {
      // Precargamos DOS elementos en el Subject
      const initialList = [mockEventType, mockEventType2];
      service['eventTypesSubject'].next(initialList);

      const updatePayload: UpdateEventType = { _id: 'type1', name: 'Tipo Modificado' };
      const updatedEventType: EventType = { ...mockEventType, name: 'Tipo Modificado' };
      
      mockApiService.putOb.and.returnValue(of(mockApiResponse(updatedEventType)));
      
      service.updateEventType('type1', updatePayload).subscribe(type => {
        expect(type).toEqual(updatedEventType);  // Verifica el tipo actualizado
        
        const currentList = service['eventTypesSubject'].value;
        // Verifica cambio en el item objetivo
        expect(currentList.find(i => i._id === 'type1')?.name).toBe('Tipo Modificado');
        // Verifica que el otro item NO cambió (cubre el else : item)
        const item2 = currentList.find(i => i._id === 'type2');
        expect(item2).toEqual(mockEventType2);  // Debe permanecer igual
        done();
      });
    });
    
    // Prueba: manejo de errores al actualizar tipo
    it('updateEventType() should handle errors', (done) => {
      mockApiService.putOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.updateEventType('type1', mockEventType as UpdateEventType).subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error');
          done();
        }
      });
    });

    // Prueba: eliminar tipo de evento
    it('deleteEventType() should delete and update subject', (done) => {
      service['eventTypesSubject'].next(mockEventTypeArray);  // Precargamos tipos
      mockApiService.deleteOb.and.returnValue(of(mockApiResponse({})));
      
      service.deleteEventType('type1').subscribe(() => {
        expect(service['eventTypesSubject'].value.length).toBe(0);  // Debe quedar vacío
        done();
      });
    });

    // Prueba: manejo de errores al eliminar tipo
    it('deleteEventType() should handle errors', (done) => {
      mockApiService.deleteOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.deleteEventType('type1').subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error');
          done();
        }
      });
    });
  });

  // ==========================================
  // OPERACIONES ESPECÍFICAS PARA TIPOS DE EVENTOS
  // ==========================================

  describe('Local EventType Filters', () => {
    // Prueba: filtrar tipos activos
    it('getActiveEventTypes() should filter by active=true', (done) => {
      const types: EventType[] = [
        { ...mockEventType, _id: 't1', active: true },
        { ...mockEventType, _id: 't2', active: false },  // Tipo inactivo
      ];
      service['eventTypesSubject'].next(types);
      
      service.getActiveEventTypes().subscribe(activeTypes => {
        expect(activeTypes.length).toBe(1);  // Solo debe encontrar tipos activos
        done();
      });
    });
    
    // Prueba: filtrar tipos por categoría
    it('getEventTypesByCategory() should filter by category', (done) => {
      const types: EventType[] = [
        { ...mockEventType, _id: 't1', category: 'social' },
        { ...mockEventType, _id: 't2', category: 'corporativo' },
      ];
      service['eventTypesSubject'].next(types);
      
      service.getEventTypesByCategory('social').subscribe(socialTypes => {
        expect(socialTypes.length).toBe(1);  // Solo tipos de categoría 'social'
        done();
      });
    });

    // Prueba: actualizar solo el estado de un tipo
    it('updateEventTypeStatus() should call updateEventType with partial payload', (done) => {
      const partialPayload = { active: false };  // Solo el campo a actualizar
      const updatedType: EventType = { ...mockEventType, active: false };
      const spy = spyOn(service, 'updateEventType').and.returnValue(of(updatedType));  // Espiamos updateEventType
      
      service.updateEventTypeStatus('type1', false).subscribe(() => {
        expect(spy).toHaveBeenCalledWith('type1', partialPayload as UpdateEventType);  // Verifica llamada con payload parcial
        done();
      });
    });
    
    // Grupo de pruebas para búsqueda de tipos de evento
    describe('searchEventTypes() (Branch Coverage)', () => {
      const typesToSearch: EventType[] = [
        { ...mockEventType, _id: 't1', name: 'Boda', description: 'Fiesta' },
        { ...mockEventType, _id: 't2', name: 'Reunión', description: 'Junta' },
        { ...mockEventType, _id: 't3', name: 'Congreso Boda', description: undefined },  // Para probar undefined
      ];
      
      // Precargamos tipos antes de cada prueba
      beforeEach(() => { service['eventTypesSubject'].next(typesToSearch); });
      
      // Prueba: búsqueda por nombre
      it('should find by name', (done) => { 
        service.searchEventTypes('Boda').subscribe(types => { 
          expect(types.length).toBe(2);  // 'Boda' y 'Congreso Boda'
          done(); 
        }); 
      });
      
      // Prueba: búsqueda por descripción
      it('should find by description', (done) => { 
        service.searchEventTypes('Junta').subscribe(types => { 
          expect(types.length).toBe(1);  // Solo 'Reunión' tiene 'Junta' en descripción
          done(); 
        }); 
      });
      
      // Prueba: búsqueda sin resultados
      it('should return empty if no match', (done) => { 
        service.searchEventTypes('Zebra').subscribe(types => { 
          expect(types.length).toBe(0);  // No hay tipos con 'Zebra'
          done(); 
        }); 
      });
      
      // Prueba: manejo de propiedades undefined
      it('should handle undefined description (optional chaining)', (done) => { 
        service.searchEventTypes('Congreso').subscribe(types => { 
          expect(types.length).toBe(1);  // Debe encontrar por nombre aunque descripción sea undefined
          done(); 
        }); 
      });
    });
  });
  
  // ==========================================
  // MÉTODOS DE REFRESCO Y GETTERS
  // ==========================================

  describe('Refresh Methods', () => {
    // Prueba: refrescar lista de eventos
    it('refreshEvents() should call getAllEvents', () => {
      mockApiService.getOb.withArgs(apiRouters.EVENTS.BASE).and.returnValue(of(mockApiResponse(mockEventArray)));
      service.refreshEvents();  // Llamamos al método de refresco
      expect(service['eventsSubject'].value).toEqual(mockEventArray);  // Verifica que se actualizó el Subject
    });

    // Prueba: refrescar lista de tipos de evento
    it('refreshEventTypes() should call getAllEventTypes', () => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.EVENT.BASE).and.returnValue(of(mockApiResponse(mockEventTypeArray)));
      service.refreshEventTypes();  // Llamamos al método de refresco
      expect(service['eventTypesSubject'].value).toEqual(mockEventTypeArray);  // Verifica que se actualizó el Subject
    });
  });
  
  // Grupo de pruebas para obtener datos relacionados
  describe('Data Getters (Users, Contracts, PersonnelTypes)', () => {
    // Prueba: obtener todos los usuarios
    it('getAllUsers() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.USERS.BASE).and.returnValue(of(mockApiResponse([mockUser])));
      service.getAllUsers().subscribe(users => { 
        expect(users).toEqual([mockUser]);  // Verifica los usuarios recibidos
        done(); 
      });
    });
    
    // Prueba: manejo de errores al obtener usuarios
    it('getAllUsers() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.USERS.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllUsers().subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error');
          done();
        }
      });
    });

    // Prueba: obtener todos los contratos
    it('getAllContracts() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.CONTRACTS.BASE).and.returnValue(of(mockApiResponse([mockContract])));
      service.getAllContracts().subscribe(contracts => { 
        expect(contracts).toEqual([mockContract]);  // Verifica los contratos recibidos
        done(); 
      });
    });

    // Prueba: manejo de errores al obtener contratos
    it('getAllContracts() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.CONTRACTS.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllContracts().subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error');
          done();
        }
      });
    });
    
    // Prueba: obtener todos los tipos de personal
    it('getAllPersonnelTypes() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(of(mockApiResponse([mockPersonnelType])));
      service.getAllPersonnelTypes().subscribe(types => { 
        expect(types).toEqual([mockPersonnelType]);  // Verifica los tipos de personal recibidos
        done(); 
      });
    });
    
    // Prueba: manejo de errores al obtener tipos de personal
    it('getAllPersonnelTypes() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllPersonnelTypes().subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error');
          done();
        }
      });
    });
  });
});