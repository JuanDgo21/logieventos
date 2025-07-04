import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaces para tipos anidados (ajustadas a tu modelo)
interface ContractResource {
  resource: string;  // ID del recurso
  quantity: number;
  _id?: string;
}

interface ContractProvider {
  provider: string;  // ID del proveedor
  serviceDescription?: string;
  cost?: number;
  _id?: string;
}

interface ContractPersonnel {
  person: string;  // ID del personal
  role?: string;
  hours?: number;
  _id?: string;
}

// Interface principal del Contrato
export interface Contract {
  _id?: string;
  name: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  startDate: string | Date;
  endDate: string | Date;
  budget?: number;
  status: 'borrador' | 'activo' | 'completado' | 'cancelado';
  terms?: string;
  resources: ContractResource[];
  providers: ContractProvider[];
  personnel: ContractPersonnel[];
  createdBy?: string;  // ID del usuario
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private apiUrl = `${environment.API_URL}/api/contracts`;  // Usa tu misma variable API_URL

  constructor(private http: HttpClient) { }

  // ---- Métodos para Headers y Errores (igual que en ResourcesServices) ----
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Error en ContractService; inténtalo más tarde.'));
  }

  // ---- Métodos CRUD ----
  getContracts(): Observable<Contract[]> {
    console.log('Llamando a:', `${this.apiUrl}/contracts`); // Agrega esto
    return this.http.get<{ success: boolean, data: Contract[] }>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(
        map((res: { success: boolean; data: Contract[] }) => res.data),
        catchError(this.handleError)
      );
  }

  getContract(id: string): Observable<Contract> {
    return this.http.get<Contract>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  createContract(contract: Contract): Observable<Contract> {
    return this.http.post<Contract>(this.apiUrl, contract, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  updateContract(id: string, contract: Contract): Observable<Contract> {
    return this.http.put<Contract>(`${this.apiUrl}/${id}`, contract, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteContract(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  // ---- Métodos Específicos para Contratos ----
  getLastContract(): Observable<Contract> {
    return this.http.get<Contract>(`${this.apiUrl}/last`, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  getCountByStatus(): Observable<{ 
    borrador: number, 
    activo: number, 
    completado: number, 
    cancelado: number 
  }> {
    return this.http.get<{ 
      borrador: number, 
      activo: number, 
      completado: number, 
      cancelado: number 
    }>(`${this.apiUrl}/count-by-status`, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  generateReport(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/report`, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }
}