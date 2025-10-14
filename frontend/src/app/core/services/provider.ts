import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { apiRouters } from '../../core/constants/apiRouters';
import { ApiService } from './api';

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
  // constructor(private apiService: ApiService) { }

  // // Obtener todos los proveedores
  // getProviders(): Observable<any> {
  //   return this.apiService.getObservable(apiRouters.PROVIDERS.BASE).pipe(
  //     catchError(error => this.handleError('Error al obtener proveedores', error))
  //   );
  // }

  // // Obtener proveedor por ID
  // getProviderById(id: string): Observable<any> {
  //   return this.apiService.getObservable(apiRouters.PROVIDERS.BY_ID(id)).pipe(
  //     catchError(error => this.handleError(`Error al obtener proveedor con ID ${id}`, error))
  //   );
  // }

  // // Crear nuevo proveedor
  // createProvider(providerData: any): Observable<any> {
  //   return this.apiService.postObservable(apiRouters.PROVIDERS.BASE, providerData).pipe(
  //     catchError(error => this.handleError('Error al crear proveedor', error))
  //   );
  // }

  // // Actualizar proveedor
  // updateProvider(id: string, providerData: any): Observable<any> {
  //   return this.apiService.putObservable(apiRouters.PROVIDERS.BY_ID(id), providerData).pipe(
  //     catchError(error => this.handleError(`Error al actualizar proveedor con ID ${id}`, error))
  //   );
  // }

  // // Eliminar proveedor
  // deleteProvider(id: string): Observable<any> {
  //   return this.apiService.deleteObservable(apiRouters.PROVIDERS.BY_ID(id)).pipe(
  //     catchError(error => this.handleError(`Error al eliminar proveedor con ID ${id}`, error))
  //   );
  // }

  // // Subir documento para un proveedor
  // uploadDocument(providerId: string, file: File): Observable<any> {
  //   const formData = new FormData();
  //   formData.append('file', file);
    
  //   return this.apiService.postObservable(`${apiRouters.PROVIDERS.BASE}/${providerId}/documents`, formData).pipe(
  //     catchError(error => this.handleError('Error al subir documento', error))
  //   );
  // }

  // // Manejo centralizado de errores
  // private handleError(message: string, error: any) {
  //   console.error(message, error);
  //   return throwError(() => ({
  //     message: message,
  //     details: error.error?.message || error.message
  //   }));
  // }
}