import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiRouters } from '../../core/constants/apiRouters';

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  private apiUrl = `${environment.API_URL}`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getResources(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/resources`, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  getResource(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/resources/${id}`, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  createResource(resource: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/resources`, resource, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  updateResource(id: string, resource: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/resources/${id}`, resource, { headers: this.getHeaders() })
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