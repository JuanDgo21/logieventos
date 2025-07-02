import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiRouters } from '../../core/constants/apiRouters';
import { jwtDecode } from 'jwt-decode';
import { ApiService } from './api';

interface DecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

interface UserData {
  email: string;
  username?: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private apiService: ApiService) { }

  // Método para registro de usuarios con rol dinámico
  register(username: string, email: string, password: string, role: string): Observable<any> {
    // Validar que el rol sea uno de los permitidos
    const allowedRoles = ['admin', 'coordinador', 'lider'];
    if (!allowedRoles.includes(role)) {
      throw new Error('Rol no válido. Los roles permitidos son: admin, coordinador, lider');
    }

    return this.apiService.postObservable(apiRouters.AUTH.SIGNUP, {
      username,
      email,
      password,
      role // Usamos el rol proporcionado
    }).pipe(
      tap((response: any) => {
        if (response?.token) {
          this.saveUserData(response);
        }
      })
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.apiService.postObservable(apiRouters.AUTH.SIGNIN, {
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

  // Resto de los métodos permanecen igual...
  private saveUserData(authResult: any): void {
    const decodedToken: DecodedToken = jwtDecode(authResult.token);
    
    localStorage.setItem('token', authResult.token);
    localStorage.setItem('user', JSON.stringify({
      email: authResult.user?.email || decodedToken.id,
      username: authResult.user?.username,
      roles: [decodedToken.role]
    }));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const decoded: DecodedToken = jwtDecode(token);
      return Date.now() < decoded.exp * 1000;
    } catch {
      return false;
    }
  }

  getCurrentUserEmail(): string | null {
    const user = this.getUserData();
    return user?.email || null;
  }

  getCurrentUsername(): string | null {
    const user = this.getUserData();
    return user?.username || null;
  }

  getUserRoles(): string[] {
    const user = this.getUserData();
    return user?.roles || [];
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getUserData(): UserData | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getPrimaryRole(): string | null {
    const roles = this.getUserRoles();
    return roles.length > 0 ? roles[0] : null;
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return this.getUserRoles().some(userRole => roles.includes(userRole));
  }
}