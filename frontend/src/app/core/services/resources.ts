import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

interface Resource {
  id?: number;
  name: string;
  description: string;
  quantity: number;
  status: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ResourcesServices {
  private apiUrl = `${environment.API_URL}`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.apiUrl}/api/resources`, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  getResource(id: string): Observable<Resource> {
    return this.http.get<Resource>(`${this.apiUrl}/api/resources/${id}`, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  createResource(resource: Resource): Observable<Resource> {
    return this.http.post<Resource>(`${this.apiUrl}/api/resources`, resource, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  updateResource(id: string, resource: Resource): Observable<Resource> {
    return this.http.put<Resource>(`${this.apiUrl}/api/resources/${id}`, resource, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteResource(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/resources/${id}`, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}
