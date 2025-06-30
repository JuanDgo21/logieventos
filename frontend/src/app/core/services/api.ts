import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService  {

  private baseUrl: string;

  constructor(private http: HttpClient) {
    this.baseUrl = environment.API_URL;
  }

  // Métodos GET
  getPromise(endpoint: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
      });
      this.http.get(this.baseUrl + endpoint, { headers }).subscribe({
        next: (resp) => resolve(resp),
        error: (err) => reject(err)
      });
    });
  }

  getObservable(endpoint: string): Observable<any> {
    return this.http.get(this.baseUrl + endpoint);
  }

  // Métodos POST
  postPromise(endpoint: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.post(this.baseUrl + endpoint, data).subscribe({
        next: (resp) => resolve(resp),
        error: (err) => reject(err)
      });
    });
  }

  postObservable(endpoint: string, data: any): Observable<any> {
    return this.http.post(this.baseUrl + endpoint, data);
  }

  // Métodos PUT
  putPromise(endpoint: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.put(this.baseUrl + endpoint, data).subscribe({
        next: (resp) => resolve(resp),
        error: (err) => reject(err)
      });
    });
  }

  putObservable(endpoint: string, data: any): Observable<any> {
    return this.http.put(this.baseUrl + endpoint, data);
  }

  // Métodos DELETE
  deletePromise(endpoint: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.delete(this.baseUrl + endpoint).subscribe({
        next: (resp) => resolve(resp),
        error: (err) => reject(err)
      });
    });
  }

  deleteObservable(endpoint: string): Observable<any> {
    return this.http.delete(this.baseUrl + endpoint);
  }
}
