import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService  {

  public urlBase = environment.API_URL;  // Solo usamos API_URL

  constructor(public http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // Token JWT desde localStorage
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ============ GET ============ 
  getPr(rute: string): Promise<any> { 
    return new Promise((resolve, reject) => {
      this.http.get(this.urlBase + rute, { headers: this.getHeaders() }).subscribe({
        next: (resp) => resolve(resp),
        error: (err) => reject(err)
      });
    });
  }

  getOb(rute: string): Observable<any> {
    return this.http.get(this.urlBase + rute, { headers: this.getHeaders() });
  }

  // ============ POST ============
  postPr(rute: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.post(this.urlBase + rute, data, { headers: this.getHeaders() }).subscribe({
        next: (resp) => resolve(resp),
        error: (err) => reject(err)
      });
    });
  }

  postOb(rute: string, data: any): Observable<any> {
    return this.http.post(this.urlBase + rute, data, { headers: this.getHeaders() });
  }

  // ============ PUT ============
  putPr(rute: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.put(this.urlBase + rute, data, { headers: this.getHeaders() }).subscribe({
        next: (resp) => resolve(resp),
        error: (err) => reject(err)
      });
    });
  }

  putOb(rute: string, data: any): Observable<any> {
    return this.http.put(this.urlBase + rute, data, { headers: this.getHeaders() });
  }

  // ============ DELETE ============
  deletePr(rute: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.delete(this.urlBase + rute, { headers: this.getHeaders() }).subscribe({
        next: (resp) => resolve(resp),
        error: (err) => reject(err)
      });
    });
  }

  deleteOb(rute: string): Observable<any> {
    return this.http.delete(this.urlBase + rute, { headers: this.getHeaders() });
  }

  // ============ PATCH ============
  patchPr(rute: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.patch(this.urlBase + rute, data, { headers: this.getHeaders() }).subscribe({
        next: (resp) => resolve(resp),
        error: (err) => reject(err)
      });
    });
  }

  patchOb(rute: string, data: any): Observable<any> {
    return this.http.patch(this.urlBase + rute, data, { headers: this.getHeaders() });
  }
}