import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { ApiService } from './api';
import { apiRouters } from '../../core/constants/apiRouters';
import { DecodedToken } from '../../shared/interfaces/auth';
import { User } from '../../shared/interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private authState = new BehaviorSubject<boolean>(this.hasValidToken());

  constructor(private apiService: ApiService) {}

  // =========================================================
  // 🔐 REGISTRO Y LOGIN
  // =========================================================

  register(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Observable<any> {
    const validRoles = ['admin', 'coordinador', 'lider'];
    if (!validRoles.includes(userData.role)) {
      return throwError(() => new Error('Rol no válido'));
    }

    return this.apiService.postOb(apiRouters.AUTH.SIGNUP, userData).pipe(
      tap((response) => this.handleAuthSuccess(response)),
      catchError((error) => this.handleError('Error al registrar', error))
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.apiService.postOb(apiRouters.AUTH.SIGNIN, { email, password }).pipe(
      tap((response) => {
        if (response.user && !response.user.active) {
          throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
        }
        this.handleAuthSuccess(response);
      }),
      catchError((error) => this.handleError('Error al iniciar sesión', error))
    );
  }

  private handleAuthSuccess(response: any): void {
    if (response?.token) {
      try {
        jwtDecode<DecodedToken>(response.token); // valida el token
        localStorage.setItem(this.TOKEN_KEY, response.token);
        this.authState.next(true);
      } catch {
        this.authState.next(false);
      }
    } else {
      this.authState.next(false);
    }
  }

  // =========================================================
  // 🔎 ESTADO DE AUTENTICACIÓN
  // =========================================================

  get authStatus$(): Observable<boolean> {
    return this.authState.asObservable();
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return Date.now() < decoded.exp * 1000;
    } catch {
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.authState.next(false);
  }

  // =========================================================
  // 🧠 TOKEN Y DECODE
  // =========================================================

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return Date.now() < decoded.exp * 1000;
    } catch {
      return false;
    }
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  }

  decodeToken(token?: string): DecodedToken | null {
    const tokenToDecode = token || this.getToken();
    if (!tokenToDecode) return null;
    try {
      return jwtDecode<DecodedToken>(tokenToDecode);
    } catch {
      return null;
    }
  }

  // =========================================================
  // 👤 DATOS DEL USUARIO
  // =========================================================

  getUserRole(): string | null {
    return this.decodeToken()?.role || null;
  }

  getUserId(): string | null {
    return this.decodeToken()?.id || null;
  }

  getCurrentUserData(): { id: string; email: string; role: string } | null {
    const decoded = this.decodeToken();
    return decoded ? { id: decoded.id, email: decoded.email, role: decoded.role } : null;
  }

  // =========================================================
  // 🛡️ ROLES Y PERMISOS
  // =========================================================

  hasRole(role: string): boolean {
    return this.getUserRole() === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const role = this.getUserRole();
    return role ? roles.includes(role) : false;
  }

  // =========================================================
  // 🔁 REFRESCO DE TOKEN
  // =========================================================

  shouldRefreshToken(minutesBefore = 5): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const now = Date.now() / 1000;
      const threshold = decoded.exp - minutesBefore * 60;
      return now >= threshold;
    } catch {
      return false;
    }
  }

  refreshToken(): Observable<any> {
    return this.apiService.postOb(apiRouters.AUTH.REFRESH_TOKEN, {}).pipe(
      tap((response) => this.handleAuthSuccess(response)),
      catchError((error) => this.handleError('Error al refrescar token', error))
    );
  }

  // =========================================================
  // 🧩 PERFIL DEL USUARIO
  // =========================================================

  getUserProfile(): Observable<User> {
    const userId = this.getUserId();
    if (!userId) {
      return throwError(() => new Error('No se pudo obtener el ID del usuario'));
    }
    return this.apiService.getOb(apiRouters.USERS.BY_ID(userId)).pipe(
      catchError((error) => this.handleError('Error obteniendo perfil', error))
    );
  }

  updateUserProfile(userData: Partial<User>): Observable<User> {
    const userId = this.getUserId();
    if (!userId) {
      return throwError(() => new Error('No se pudo obtener el ID del usuario'));
    }
    return this.apiService.putOb(apiRouters.USERS.BY_ID(userId), userData).pipe(
      catchError((error) => this.handleError('Error actualizando perfil', error))
    );
  }

  // =========================================================
  // 🔐 CONTRASEÑAS
  // =========================================================

  forgotPassword(email: string): Observable<any> {
    return this.apiService.postOb(apiRouters.AUTH.FORGOT_PASSWORD, { email }).pipe(
      catchError((error) => this.handlePasswordError(error, 'recuperación'))
    );
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.apiService.postOb(apiRouters.AUTH.RESET_PASSWORD, { token, newPassword }).pipe(
      catchError((error) => this.handlePasswordError(error, 'actualización'))
    );
  }

  private handlePasswordError(error: any, context: string): Observable<never> {
    let message = `Error en la ${context}`;
    if (error.error?.message) message = error.error.message;
    else if (error.status === 404) message = 'Usuario no encontrado';
    else if (error.status === 400) message = 'Token inválido o expirado';
    return throwError(() => new Error(message));
  }

  // =========================================================
  // ⚠️ MANEJO DE ERRORES
  // =========================================================

  private handleError(context: string, error: any): Observable<never> {
    this.authState.next(false);
    return throwError(() => error?.error?.message || `${context}. Intenta nuevamente.`);
  }
}
