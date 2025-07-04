import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaces para tipos anidados (ajustadas con populate)
interface ContractResource {
  resource: {
    _id: string;
    name?: string;
    description?: string;
  };
  quantity: number;
  _id?: string;
}

interface ContractProvider {
  provider: {
    _id: string;
    name?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
  };
  serviceDescription?: string;
  cost?: number;
  _id?: string;
}

interface ContractPersonnel {
  person: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
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
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private apiUrl = `${environment.API_URL}/api/contracts`;

  constructor(private http: HttpClient) {}

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

  // CRUD
  getContracts(): Observable<Contract[]> {
    return this.http.get<{ success: boolean, data: Contract[] }>(this.apiUrl, {
      headers: this.getHeaders()
    }).pipe(
      map((res) => res.data),
      catchError(this.handleError)
    );
  }

  getContract(id: string): Observable<Contract> {
    return this.http.get<Contract>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  createContract(contract: Contract): Observable<Contract> {
    return this.http.post<Contract>(this.apiUrl, contract, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateContract(id: string, contract: Contract): Observable<Contract> {
    return this.http.put<Contract>(`${this.apiUrl}/${id}`, contract, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteContract(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getLastContract(): Observable<Contract> {
    return this.http.get<Contract>(`${this.apiUrl}/last`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getCountByStatus(): Observable<{
    borrador: number,
    activo: number,
    completado: number,
    cancelado: number
  }> {
    return this.http.get<{ success: boolean, data: any }>(`${this.apiUrl}/count-by-status`, {
      headers: this.getHeaders()
  }).pipe(
    map(res => ({
      borrador: res.data.borrador || 0,
      activo: res.data.activo || 0,
      completado: res.data.completado || 0,
      cancelado: res.data.cancelado || 0
    })),
    catchError(this.handleError)
  );
}


  getStatusCounts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/count-by-status`);
  }

  getContractsPaginated(page: number = 1, limit: number = 10) {
    return this.http.get<{ data: Contract[], total: number, page: number, pages: number }>(
      `/api/contracts?page=${page}&limit=${limit}`
    );
  }


  generateReport(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/report`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }
}
