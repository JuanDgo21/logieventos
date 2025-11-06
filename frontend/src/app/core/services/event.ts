// event.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, tap, throwError } from 'rxjs';
import { ApiService } from './api';
import { apiRouters } from '../constants/apiRouters';

// CORREGIR: Importar desde la ubicación correcta
import { Event, EventApiResponse, NewEvent, UpdateEvent } from '../../shared/interfaces/event';
import { EventType, EventTypeApiResponse, NewEventType, UpdateEventType } from '../../shared/interfaces/event-type';

// --- NUEVO: Interfaces para los datos que necesitamos en el formulario ---
export interface User {
  _id: string;
  fullname: string;
  username: string;
}

export interface Contract {
  _id: string;
  name: string;
}

export interface PersonnelType {
  _id: string;
  name: string;
  description?: string;
}

// --- NUEVO: Interfaces para las respuestas de la API de User y Contract ---
export interface UserApiResponse {
  success: boolean;
  data: User | User[];
  message?: string;
}

export interface ContractApiResponse {
  success: boolean;
  data: Contract | Contract[];
  message?: string;
}

export interface PersonnelTypeApiResponse {
  success: boolean;
  data: PersonnelType | PersonnelType[];
  message?: string;
}


@Injectable({
  providedIn: 'root'
})
export class EventService {
  // Subjects para eventos y tipos de eventos
  private readonly eventsSubject = new BehaviorSubject<Event[]>([]);
  public events$ = this.eventsSubject.asObservable();

  private readonly eventTypesSubject = new BehaviorSubject<EventType[]>([]);
  public eventTypes$ = this.eventTypesSubject.asObservable();

  // --- NUEVO: Subjects para usuarios y contratos ---
  private readonly usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  private readonly contractsSubject = new BehaviorSubject<Contract[]>([]);
  public contracts$ = this.contractsSubject.asObservable();

  private readonly personnelTypesSubject = new BehaviorSubject<PersonnelType[]>([]);
  public personnelTypes$ = this.personnelTypesSubject.asObservable();


  constructor(private readonly apiService: ApiService) {
    this.loadInitialData();
  }

  // ============ CARGA INICIAL DE DATOS ============
  /**
   * Carga los datos iniciales al iniciar el servicio
   * Esto asegura que tengamos datos disponibles desde el inicio
   */
  private loadInitialData(): void {
    this.getAllEvents().subscribe();
    this.getAllEventTypes().subscribe();
    // --- NUEVO: Cargar usuarios y contratos ---
    this.getAllUsers().subscribe();
    this.getAllContracts().subscribe();
    this.getAllPersonnelTypes().subscribe();
  }

  // ============ MÉTODOS UTILITARIOS ============
  /**
   * Maneja respuestas de la API que contienen arrays de datos
   * @param response Respuesta de la API
   * @returns Array de datos tipado
   */
  private handleArrayResponse<T>(response: EventApiResponse | EventTypeApiResponse | UserApiResponse | ContractApiResponse): T[] {
    if (!response.success) {
      throw new Error(response.message || 'Operación fallida');
    }

    if (!response.data) {
      throw new Error('Datos no disponibles');
    }

    return Array.isArray(response.data) ? response.data as T[] : [response.data as T];
  }

  /**
   * Maneja respuestas de la API que contienen un solo objeto
   * @param response Respuesta de la API
   * @returns Objeto tipado
   */
  private handleSingleResponse<T>(response: EventApiResponse | EventTypeApiResponse | UserApiResponse | ContractApiResponse): T {
    if (!response.success) {
      throw new Error(response.message || 'Operación fallida');
    }

    if (!response.data) {
      throw new Error('Datos no disponibles');
    }

    if (Array.isArray(response.data)) {
      if (response.data.length === 0) {
        throw new Error('No se encontraron resultados');
      }
      return response.data[0] as T;
    }

    return response.data as T;
  }

  /**
   * Maneja errores de manera consistente
   * @param context Contexto del error
   * @param error Objeto de error
   * @returns Observable que emite el error
   */
  private handleError(context: string, error: any): Observable<never> {
    console.error(`[EventService] ${context}`, error);
    const errorMessage = error.error?.message || error.message || 'Error desconocido';
    return throwError(() => new Error(errorMessage));
  }

  // ============ OPERACIONES CRUD PARA EVENTOS ============
  /**
   * Obtiene todos los eventos desde la API
   * @returns Observable con array de eventos
   */
  getAllEvents(): Observable<Event[]> {
    return this.apiService.getOb(apiRouters.EVENTS.BASE).pipe(
      map((response: any) => this.handleArrayResponse<Event>(response as EventApiResponse)),
      tap(events => this.eventsSubject.next(events)),
      catchError(error => this.handleError('Error obteniendo eventos', error))
    );
  }

  /**
   * Obtiene un evento específico por ID
   * @param id ID del evento
   * @returns Observable con el evento
   */
  getEventById(id: string): Observable<Event> {
    return this.apiService.getOb(apiRouters.EVENTS.BY_ID(id)).pipe(
      map((response: any) => this.handleSingleResponse<Event>(response as EventApiResponse)),
      catchError(error => this.handleError(`Error obteniendo evento ${id}`, error))
    );
  }

  /**
   * Crea un nuevo evento
   * @param eventData Datos del nuevo evento
   * @returns Observable con el evento creado
   */
  createEvent(eventData: NewEvent): Observable<Event> {
    return this.apiService.postOb(apiRouters.EVENTS.BASE, eventData).pipe(
      map((response: any) => this.handleSingleResponse<Event>(response as EventApiResponse)),
      tap(newEvent => {
        const currentList = this.eventsSubject.value;
        this.eventsSubject.next([...currentList, newEvent]);
      }),
      catchError(error => this.handleError('Error creando evento', error))
    );
  }

  /**
   * Actualiza un evento existente
   * @param id ID del evento a actualizar
   * @param eventData Datos actualizados
   * @returns Observable con el evento actualizado
   */
  updateEvent(id: string, eventData: UpdateEvent): Observable<Event> {
    return this.apiService.putOb(apiRouters.EVENTS.BY_ID(id), eventData).pipe(
      map((response: any) => this.handleSingleResponse<Event>(response as EventApiResponse)),
      tap(updatedEvent => {
        const currentList = this.eventsSubject.value;
        const updatedList = currentList.map(item => 
          item._id === id ? updatedEvent : item
        );
        this.eventsSubject.next(updatedList);
      }),
      catchError(error => this.handleError(`Error actualizando evento ${id}`, error))
    );
  }

  /**
   * Elimina un evento
   * @param id ID del evento a eliminar
   * @returns Observable vacío
   */
  deleteEvent(id: string): Observable<void> {
    return this.apiService.deleteOb(apiRouters.EVENTS.BY_ID(id)).pipe(
      tap(() => {
        const currentList = this.eventsSubject.value;
        const updatedList = currentList.filter(item => item._id !== id);
        this.eventsSubject.next(updatedList);
      }),
      catchError(error => this.handleError(`Error eliminando evento ${id}`, error))
    );
  }

  // ============ OPERACIONES ESPECÍFICAS PARA EVENTOS ============
  /**
   * Filtra eventos por estado
   * @param status Estado a filtrar
   * @returns Observable con eventos filtrados
   */
  getEventsByStatus(status: string): Observable<Event[]> {
    return this.events$.pipe(
      map(events => events.filter(event => event.status === status))
    );
  }

  /**
   * Filtra eventos por rango de fechas
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   * @returns Observable con eventos filtrados
   */
  getEventsByDateRange(startDate: Date, endDate: Date): Observable<Event[]> {
    return this.events$.pipe(
      map(events => events.filter(event => 
        new Date(event.startDate) >= startDate && 
        new Date(event.endDate) <= endDate
      ))
    );
  }

  /**
   * Actualiza solo el estado de un evento
   * @param id ID del evento
   * @param newStatus Nuevo estado
   * @returns Observable con el evento actualizado
   */
  updateEventStatus(id: string, newStatus: string): Observable<Event> {
    return this.updateEvent(id, { status: newStatus } as UpdateEvent);
  }

  /**
   * Busca eventos por texto
   * @param query Texto de búsqueda
   * @returns Observable con eventos que coinciden
   */
  searchEvents(query: string): Observable<Event[]> {
    return this.events$.pipe(
      map(events => events.filter(event => 
        event.name?.toLowerCase().includes(query.toLowerCase()) ||
        event.description?.toLowerCase().includes(query.toLowerCase()) ||
        event.location?.toLowerCase().includes(query.toLowerCase())
      ))
    );
  }
  
  // --- NUEVO: Métodos para obtener Usuarios y Contratos ---

  /**
   * Obtiene todos los usuarios desde la API
   */
  getAllUsers(): Observable<User[]> {
    // Asegúrate de que esta ruta exista en tus apiRouters
    return this.apiService.getOb(apiRouters.USERS.BASE).pipe(
      map((response: any) => this.handleArrayResponse<User>(response as UserApiResponse)),
      tap(users => this.usersSubject.next(users)),
      catchError(error => this.handleError('Error obteniendo usuarios', error))
    );
  }

  /**
   * Obtiene todos los contratos desde la API
   */
  getAllContracts(): Observable<Contract[]> {
    // Asegúrate de que esta ruta exista en tus apiRouters
    return this.apiService.getOb(apiRouters.CONTRACTS.BASE).pipe(
      map((response: any) => this.handleArrayResponse<Contract>(response as ContractApiResponse)),
      tap(contracts => this.contractsSubject.next(contracts)),
      catchError(error => this.handleError('Error obteniendo contratos', error))
    );
  }

  // ============ OPERACIONES CRUD PARA TIPOS DE EVENTOS ============
  /**
   * Obtiene todos los tipos de eventos
   * @returns Observable con array de tipos de eventos
   */
  getAllEventTypes(): Observable<EventType[]> {
    return this.apiService.getOb(apiRouters.TYPES.EVENT.BASE).pipe(
      map((response: any) => this.handleArrayResponse<EventType>(response as EventTypeApiResponse)),
      tap(eventTypes => this.eventTypesSubject.next(eventTypes)),
      catchError(error => this.handleError('Error obteniendo tipos de eventos', error))
    );
  }

  /**
   * Obtiene un tipo de evento específico por ID
   * @param id ID del tipo de evento
   * @returns Observable con el tipo de evento
   */
  getEventTypeById(id: string): Observable<EventType> {
    return this.apiService.getOb(apiRouters.TYPES.EVENT.BY_ID(id)).pipe(
      map((response: any) => this.handleSingleResponse<EventType>(response as EventTypeApiResponse)),
      catchError(error => this.handleError(`Error obteniendo tipo de evento ${id}`, error))
    );
  }

  /**
   * Crea un nuevo tipo de evento
   * @param eventTypeData Datos del nuevo tipo
   * @returns Observable con el tipo creado
   */
  createEventType(eventTypeData: NewEventType): Observable<EventType> {
    return this.apiService.postOb(apiRouters.TYPES.EVENT.BASE, eventTypeData).pipe(
      map((response: any) => this.handleSingleResponse<EventType>(response as EventTypeApiResponse)),
      tap(newEventType => {
        const currentList = this.eventTypesSubject.value;
        this.eventTypesSubject.next([...currentList, newEventType]);
      }),
      catchError(error => this.handleError('Error creando tipo de evento', error))
    );
  }

  /**
   * Actualiza un tipo de evento existente
   * @param id ID del tipo a actualizar
   * @param eventTypeData Datos actualizados
   * @returns Observable con el tipo actualizado
   */
  updateEventType(id: string, eventTypeData: UpdateEventType): Observable<EventType> {
    return this.apiService.putOb(apiRouters.TYPES.EVENT.BY_ID(id), eventTypeData).pipe(
      map((response: any) => this.handleSingleResponse<EventType>(response as EventTypeApiResponse)),
      tap(updatedEventType => {
        const currentList = this.eventTypesSubject.value;
        const updatedList = currentList.map(item => 
          item._id === id ? updatedEventType : item
        );
        this.eventTypesSubject.next(updatedList);
      }),
      catchError(error => this.handleError(`Error actualizando tipo de evento ${id}`, error))
    );
  }

  /**
   * Elimina un tipo de evento
   * @param id ID del tipo a eliminar
   * @returns Observable vacío
   */
  deleteEventType(id: string): Observable<void> {
    return this.apiService.deleteOb(apiRouters.TYPES.EVENT.BY_ID(id)).pipe(
      tap(() => {
        const currentList = this.eventTypesSubject.value;
        const updatedList = currentList.filter(item => item._id !== id);
        this.eventTypesSubject.next(updatedList);
      }),
      catchError(error => this.handleError(`Error eliminando tipo de evento ${id}`, error))
    );
  }

  // ============ OPERACIONES ESPECÍFICAS PARA TIPOS DE EVENTOS ============
  /**
   * Obtiene solo los tipos de eventos activos
   * @returns Observable con tipos activos
   */
  getActiveEventTypes(): Observable<EventType[]> {
    return this.eventTypes$.pipe(
      map(eventTypes => eventTypes.filter(eventType => eventType.active))
    );
  }

  getAllPersonnelTypes(): Observable<PersonnelType[]> {
    // Asegúrate de que esta ruta exista en tus apiRouters
    return this.apiService.getOb(apiRouters.TYPES.PERSONNEL.BASE).pipe(
      map((response: any) => this.handleArrayResponse<PersonnelType>(response as PersonnelTypeApiResponse)),
      tap(personnelTypes => this.personnelTypesSubject.next(personnelTypes)),
      catchError(error => this.handleError('Error obteniendo tipos de personal', error))
    );
  }

  /**
   * Filtra tipos de eventos por categoría
   * @param category Categoría a filtrar
   * @returns Observable con tipos filtrados
   */
  getEventTypesByCategory(category: string): Observable<EventType[]> {
    return this.eventTypes$.pipe(
      map(eventTypes => eventTypes.filter(eventType => eventType.category === category))
    );
  }

  /**
   * Actualiza el estado activo/inactivo de un tipo de evento
   * @param id ID del tipo
   * @param active Nuevo estado
   * @returns Observable con el tipo actualizado
   */
  updateEventTypeStatus(id: string, active: boolean): Observable<EventType> {
    return this.updateEventType(id, { active } as UpdateEventType);
  }

  /**
   * Busca tipos de eventos por texto
   * @param query Texto de búsqueda
   * @returns Observable con tipos que coinciden
   */
  searchEventTypes(query: string): Observable<EventType[]> {
    return this.eventTypes$.pipe(
      map(eventTypes => eventTypes.filter(eventType => 
        eventType.name?.toLowerCase().includes(query.toLowerCase()) ||
        eventType.description?.toLowerCase().includes(query.toLowerCase())
      ))
    );
  }

  // ============ MÉTODOS DE REFRESCO ============
  /**
   * Actualiza la lista de eventos desde la API
   */
  refreshEvents(): void {
    this.getAllEvents().subscribe();
  }

  /**
   * Actualiza la lista de tipos de eventos desde la API
   */
  refreshEventTypes(): void {
    this.getAllEventTypes().subscribe();
  }
}