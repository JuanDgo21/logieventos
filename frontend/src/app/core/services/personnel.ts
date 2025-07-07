import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, tap, throwError } from 'rxjs';
import { ApiService } from './api';
import { NewPersonnelType, PersonnelType, PersonnelTypeApiResponse, UpdatePersonnelType } from '../../shared/interfaces/personnel-type';
import { apiRouters } from '../constants/apiRouters';
import { NewPersonnel, Personnel, PersonnelApiResponse, UpdatePersonnel } from '../../shared/interfaces/personnel';

@Injectable({
  providedIn: 'root'
})
export class PersonnelService {
  public personnelListSubject = new BehaviorSubject<Personnel[]>([]);
  public personnelList$ = this.personnelListSubject.asObservable();

  public personnelTypesSubject = new BehaviorSubject<PersonnelType[]>([]);
  public personnelTypes$ = this.personnelTypesSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadInitialData();
    console.log('PersonnelService constructor llamado');
  }

  private loadInitialData(): void {
    this.getAllPersonnel().subscribe();
    this.getAllPersonnelTypes().subscribe();
  }

  // ============ OPERACIONES DE PERSONAL ============
  getAllPersonnel(): Observable<Personnel[]> {
    return this.apiService.getOb(apiRouters.PERSONNEL.BASE).pipe(
      map((response: any) => this.handleArrayResponse<Personnel>(response as PersonnelApiResponse)),
      tap(personnel => this.personnelListSubject.next(personnel)),
      catchError(error => this.handleError('Error obteniendo personal', error))
    );
  }

  getPersonnelById(id: string): Observable<Personnel> {
    return this.apiService.getOb(apiRouters.PERSONNEL.BY_ID(id)).pipe(
      map((response: any) => this.handleSingleResponse<Personnel>(response as PersonnelApiResponse)),
      catchError(error => this.handleError(`Error obteniendo personal ${id}`, error))
    );
  }

  createPersonnel(personnelData: NewPersonnel): Observable<Personnel> {
    return this.apiService.postOb(apiRouters.PERSONNEL.BASE, personnelData).pipe(
      map((response: any) => this.handleSingleResponse<Personnel>(response as PersonnelApiResponse)),
      tap(newPersonnel => {
        const currentList = this.personnelListSubject.value;
        this.personnelListSubject.next([...currentList, newPersonnel]);
      }),
      catchError(error => this.handleError('Error creando personal', error))
    );
  }

  updatePersonnel(id: string, personnelData: UpdatePersonnel): Observable<Personnel> {
    return this.apiService.putOb(apiRouters.PERSONNEL.BY_ID(id), personnelData).pipe(
      map((response: any) => this.handleSingleResponse<Personnel>(response as PersonnelApiResponse)),
      tap(updatedPersonnel => {
        const currentList = this.personnelListSubject.value;
        const updatedList = currentList.map(item => 
          item._id === id ? updatedPersonnel : item
        );
        this.personnelListSubject.next(updatedList);
      }),
      catchError(error => this.handleError(`Error actualizando personal ${id}`, error))
    );
  }

  deletePersonnel(id: string): Observable<void> {
    return this.apiService.deleteOb(apiRouters.PERSONNEL.BY_ID(id)).pipe(
      tap(() => {
        const currentList = this.personnelListSubject.value;
        const updatedList = currentList.filter(item => item._id !== id);
        this.personnelListSubject.next(updatedList);
      }),
      catchError(error => this.handleError(`Error eliminando personal ${id}`, error))
    );
  }

  // ============ OPERACIONES DE TIPOS DE PERSONAL ============
  getAllPersonnelTypes(): Observable<PersonnelType[]> {
    return this.apiService.getOb(apiRouters.TYPES.PERSONNEL.BASE).pipe(
      map((response: any) => this.handleArrayResponse<PersonnelType>(response as PersonnelTypeApiResponse)),
      tap(types => this.personnelTypesSubject.next(types)),
      catchError(error => this.handleError('Error obteniendo tipos de personal', error))
    );
  }

  getPersonnelTypeById(id: string): Observable<PersonnelType> {
    return this.apiService.getOb(apiRouters.TYPES.PERSONNEL.BY_ID(id)).pipe(
      map((response: any) => this.handleSingleResponse<PersonnelType>(response as PersonnelTypeApiResponse)),
      catchError(error => this.handleError(`Error obteniendo tipo de personal ${id}`, error))
    );
  }

  createPersonnelType(typeData: NewPersonnelType): Observable<PersonnelType> {
    return this.apiService.postOb(apiRouters.TYPES.PERSONNEL.BASE, typeData).pipe(
      map((response: any) => this.handleSingleResponse<PersonnelType>(response as PersonnelTypeApiResponse)),
      tap(newType => {
        const currentList = this.personnelTypesSubject.value;
        this.personnelTypesSubject.next([...currentList, newType]);
      }),
      catchError(error => this.handleError('Error creando tipo de personal', error))
    );
  }

  updatePersonnelType(id: string, typeData: UpdatePersonnelType): Observable<PersonnelType> {
    return this.apiService.putOb(apiRouters.TYPES.PERSONNEL.BY_ID(id), typeData).pipe(
      map((response: any) => this.handleSingleResponse<PersonnelType>(response as PersonnelTypeApiResponse)),
      tap(updatedType => {
        const currentList = this.personnelTypesSubject.value;
        const updatedList = currentList.map(item => 
          item._id === id ? updatedType : item
        );
        this.personnelTypesSubject.next(updatedList);
      }),
      catchError(error => this.handleError(`Error actualizando tipo de personal ${id}`, error))
    );
  }

  deletePersonnelType(id: string): Observable<void> {
    return this.apiService.deleteOb(apiRouters.TYPES.PERSONNEL.BY_ID(id)).pipe(
      tap(() => {
        const currentList = this.personnelTypesSubject.value;
        const updatedList = currentList.filter(item => item._id !== id);
        this.personnelTypesSubject.next(updatedList);
      }),
      catchError(error => this.handleError(`Error eliminando tipo de personal ${id}`, error))
    );
  }

  // ============ MÉTODOS UTILITARIOS ============
  private handleArrayResponse<T>(response: PersonnelApiResponse | PersonnelTypeApiResponse): T[] {
    if (!response.success) {
      throw new Error(response.message || 'Operación fallida');
    }

    if (!response.data) {
      throw new Error('Datos no disponibles');
    }

    return Array.isArray(response.data) ? response.data as T[] : [response.data as T];
  }

  private handleSingleResponse<T>(response: PersonnelApiResponse | PersonnelTypeApiResponse): T {
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

  private handleError(context: string, error: any): Observable<never> {
    console.error(`[PersonnelService] ${context}`, error);
    const errorMessage = error.error?.message || error.message || 'Error desconocido';
    return throwError(() => new Error(errorMessage));
  }

  // ============ MÉTODOS ADICIONALES ============
  getPersonnelByType(typeId: string): Observable<Personnel[]> {
    return this.personnelList$.pipe(
      map(personnelList => personnelList.filter(p => p.personnelType === typeId))
    );
  }

  searchPersonnel(query: string): Observable<Personnel[]> {
    return this.apiService.getOb(`${apiRouters.PERSONNEL.BASE}/search?q=${query}`).pipe(
      map((response: any) => this.handleArrayResponse<Personnel>(response as PersonnelApiResponse)),
      catchError(error => this.handleError('Error buscando personal', error))
    );
  }

  searchPersonnelTypes(query: string): Observable<PersonnelType[]> {
    return this.apiService.getOb(`${apiRouters.TYPES.PERSONNEL.BASE}/search?q=${query}`).pipe(
      map((response: any) => this.handleArrayResponse<PersonnelType>(response as PersonnelTypeApiResponse)),
      catchError(error => this.handleError('Error buscando tipos de personal', error))
    );
  }
}