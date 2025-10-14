import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaces anidadas
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

// Contrato principal
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
  private resourceUrl = `${environment.API_URL}/api/resources`;
  private providerUrl = `${environment.API_URL}/api/providers`;
  private personnelUrl = `${environment.API_URL}/api/personnel`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found in localStorage');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(error: any) {
    console.error('ContractService error:', error);
    if (error.error) {
      console.error('Error details:', error.error);
    }
    return throwError(() => new Error(error.error?.message || 'Error en ContractService; inténtalo más tarde.'));
  }

  // Métodos CRUD
  getContracts(): Observable<Contract[]> {
    return this.http.get<{ success: boolean, data: Contract[] }>(this.apiUrl, {
      headers: this.getHeaders()
    }).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  getContract(id: string): Observable<Contract> {
    return this.http.get<Contract>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  searchContractsByName(name: string): Observable<Contract[]> {
    return this.http.get<{ success: boolean, data: Contract[] }>(
      `${this.apiUrl}/search?name=${encodeURIComponent(name)}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  createContract(contract: Contract): Observable<Contract> {
    console.log('Token:', localStorage.getItem('token'));
    return this.http.post<Contract>(this.apiUrl, contract, {
      headers: this.getHeaders()
    }).pipe(
      catchError((err) => {
        console.error('ContractService error:', err);
        return throwError(() => err);
      })
    );
  }

  updateContract(id: string, contract: Contract): Observable<Contract> {
  return this.http.put<{ success: boolean, message: string, data: Contract }>(
    `${this.apiUrl}/${id}`, 
    contract, 
    { headers: this.getHeaders() }
  ).pipe(
    map(res => res.data), // <- EXTRAER SOLO EL CONTRACTO
    catchError(this.handleError)
  );
}


  deleteContract(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  getLastContract(): Observable<Contract> {
    return this.http.get<Contract>(`${this.apiUrl}/last`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
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

  getContractsPaginated(page: number = 1, limit: number = 2) {
    return this.http.get<{ data: Contract[], total: number, page: number, pages: number }>(
      `${this.apiUrl}?page=${page}&limit=${limit}`,
      {
        headers: this.getHeaders()
      }
    ).pipe(catchError(this.handleError));
  }

  generateReport(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/report`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  // 🔽 Nuevos métodos para recursos, personal y proveedores

  getResourcesByStatus(status: string = 'disponible'): Observable<any[]> {
    return this.http.get<{ success: boolean; data: any[] }>(
      `${this.resourceUrl}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => res.data.filter(resource => resource.status === status)),
      catchError(this.handleError)
    );
  }

  getProvidersByStatus(status: string = 'activo'): Observable<any[]> {
    return this.http.get<{ success: boolean; data: any[] }>(
      `${this.providerUrl}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => res.data.filter(provider => provider.status === status)),
      catchError(this.handleError)
    );
  }


  getPersonnelByStatus(status: string = 'disponible'): Observable<any[]> {
    return this.http.get<{ success: boolean; data: any[] }>(
      `${this.personnelUrl}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => res.data.filter(person => person.status === status)),
      catchError(this.handleError)
    );
  }
}

