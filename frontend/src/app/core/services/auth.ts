import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiRouters } from '../../core/constants/apiRouters';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${environment.API_URL}${apiRouters.AUTH.SIGNIN}`, {
      email,
      password
    }).pipe(
      tap((response: any) => {
        if (response?.token) {
          this.saveUserData(response);
        }
      })
    );
  }

  private saveUserData(authResult: any): void {
    localStorage.setItem('token', authResult.token);
    localStorage.setItem('user', JSON.stringify({
      email: authResult.email,
      roles: authResult.roles
    }));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getCurrentUserEmail(): string | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).email : null;
  }

  getUserRoles(): string[] {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).roles : [];
  }
}