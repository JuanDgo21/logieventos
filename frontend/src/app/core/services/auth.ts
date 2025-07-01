import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiRouters } from '../../core/constants/apiRouters';
// import jwt_decode from 'jwt-decode';

interface DecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

interface UserData {
  email: string;
  roles: string[];
}

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
    // Decodificar el token para obtener los datos del usuario
    const decodedToken: DecodedToken = jwt_decode(authResult.token);
    
    // Guardar en localStorage
    localStorage.setItem('token', authResult.token);
    localStorage.setItem('user', JSON.stringify({
      email: authResult.user?.email || decodedToken.id, // Usar email de user o id como fallback
      roles: [decodedToken.role] // El rol viene en el token decodificado
    }));
  }

  logout(): void {
    // Limpiar localStorage al cerrar sesión
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    // Verificar si existe token y no está expirado
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const decoded: DecodedToken = jwt_decode(token);
      return Date.now() < decoded.exp * 1000;
    } catch {
      return false;
    }
  }

  getCurrentUserEmail(): string | null {
    const user = this.getUserData();
    return user?.email || null;
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

  // Método adicional para obtener el rol primario (útil cuando solo hay un rol)
  getPrimaryRole(): string | null {
    const roles = this.getUserRoles();
    return roles.length > 0 ? roles[0] : null;
  }

  // Método para verificar si el usuario tiene un rol específico
  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  // Método para verificar si el usuario tiene alguno de los roles especificados
  hasAnyRole(roles: string[]): boolean {
    return this.getUserRoles().some(userRole => roles.includes(userRole));
  }
}