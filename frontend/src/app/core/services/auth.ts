import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiRouters } from '../../core/constants/apiRouters';
import { jwtDecode } from 'jwt-decode';
import { ApiService } from './api';
import { DecodedToken } from '../../shared/interfaces/auth';
import { User } from '../../shared/interfaces/user';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private apiService: ApiService) {
    console.log('AuthService constructor llamado');
  }

  // ============ MÉTODOS DE AUTENTICACIÓN ============
  register(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Observable<any> {
    // Validación de roles permitidos
    const validRoles = ['admin', 'coordinador', 'lider'];
    if (!validRoles.includes(userData.role)) {
      return throwError(() => new Error('Rol no válido'));
    }

    return this.apiService.postOb(apiRouters.AUTH.SIGNUP, userData).pipe(
      tap((response) => {
        this.handleAuthResponse(response);
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  login(email: string, password: string): Observable<any> {
    console.log('login llamado con:', { email, password });
    return this.apiService.postOb(apiRouters.AUTH.SIGNIN, { email, password }).pipe(
      tap((response) => {
        console.log('login respuesta recibida:', response);
        
        // Verificación adicional del estado activo
        if (response.user && !response.user.active) {
          console.log('Usuario inactivo detectado:', response.user.email);
          throw new Error('USER_INACTIVE');
        }
        
        this.handleAuthResponse(response);
      }),
      catchError(error => {
        console.log('login error ocurrido:', error);
        
        // Manejo específico para usuarios inactivos
        if (error.message === 'USER_INACTIVE') {
          const inactiveError = new Error('Tu cuenta está desactivada. Contacta al administrador.');
          return throwError(() => inactiveError);
        }
        
        return this.handleError('Error en login:', error);
      })
    );
  }

  private handleAuthResponse(response: any): void {
    console.log('handleAuthResponse llamado con:', response);
    if (response?.token) {
      console.log('token encontrado en respuesta');
      const decodedToken: DecodedToken = jwtDecode(response.token);
      console.log('token decodificado:', decodedToken);
      
      localStorage.setItem('token', response.token);
      console.log('token almacenado en localStorage');
    } else {
      console.log('no se encontró token en la respuesta');
    }
  }

  // ============ MÉTODOS DE CONTRASEÑA ============
  forgotPassword(email: string): Observable<any> {
    console.log('forgotPassword llamado con:', { email });
    return this.apiService.postOb(apiRouters.AUTH.FORGOT_PASSWORD, { email }).pipe(
      catchError(error => {
        console.log('forgotPassword error ocurrido:', error);
        return this.handlePasswordError(error, 'recuperación');
      })
    );
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    console.log('resetPassword llamado con:', { token, newPassword });
    return this.apiService.postOb(apiRouters.AUTH.RESET_PASSWORD, { token, newPassword }).pipe(
      catchError(error => {
        console.log('resetPassword error ocurrido:', error);
        return this.handlePasswordError(error, 'actualización');
      })
    );
  }

  private handlePasswordError(error: any, context: string): Observable<never> {
    console.log('handlePasswordError llamado con:', { error, context });
    let errorMessage = `Error al procesar la ${context}`;
    
    if (error.error?.message) {
      errorMessage = error.error.message;
      console.log('mensaje de error del objeto error:', error.error.message);
    } else if (error.status === 404) {
      errorMessage = context === 'recuperación' ? 'No se encontró el usuario' : 'Usuario no encontrado';
      console.log('error 404 detectado');
    } else if (error.status === 400) {
      errorMessage = 'Token inválido o expirado';
      console.log('error 400 detectado');
    }

    console.error(`[AuthService] Error en ${context}:`, error);
    return throwError(() => new Error(errorMessage));
  }

  // ============ VERIFICACIONES DE AUTENTICACIÓN ============
  isLoggedIn(): boolean {
    console.log('isLoggedIn llamado');
    const token = this.getToken();
    console.log('token:', token);
    if (!token) {
      console.log('no se encontró token, retornando false');
      return false;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      console.log('token decodificado:', decoded);
      const isLoggedIn = Date.now() < decoded.exp * 1000;
      console.log('isLoggedIn:', isLoggedIn);
      return isLoggedIn;
    } catch (error) {
      console.error('Error decodificando token:', error);
      return false;
    }
  }

  isTokenExpired(): boolean {
    console.log('isTokenExpired llamado');
    const token = this.getToken();
    console.log('token:', token);
    if (!token) {
      console.log('no se encontró token, retornando true');
      return true;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      console.log('token decodificado:', decoded);
      const isExpired = Date.now() >= decoded.exp * 1000;
      console.log('isTokenExpired:', isExpired);
      return isExpired;
    } catch (error) {
      console.error('Error decodificando token:', error);
      return true;
    }
  }

  // ============ MÉTODOS UTILITARIOS ============
  getToken(): string | null {
    console.log('getToken llamado');
    const token = localStorage.getItem('token');
    console.log('token de localStorage:', token);
    return token;
  }

  logout(): void {
    console.log('logout llamado');
    localStorage.removeItem('token');
    console.log('token removido de localStorage');
  }

  private handleError(context: string, error: any): Observable<never> {
    console.log('handleError llamado con:', { context, error });
    console.error(`[AuthService] ${context}`, error);
    return throwError(() => error);
  }

  /**
   * Decodifica el token JWT y devuelve su contenido
   */
  decodeToken(token?: string): DecodedToken | null {
    console.log('decodeToken llamado');
    
    // Si no se proporciona token, usar el almacenado
    const tokenToDecode = token || this.getToken();
    console.log('token a decodificar:', tokenToDecode);
    
    if (!tokenToDecode) {
      console.log('no se encontró token, retornando null');
      return null;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(tokenToDecode);
      console.log('token decodificado:', decoded);
      return decoded;
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roles: string[]): boolean {
    console.log('hasAnyRole llamado con roles:', roles);
    
    const decodedToken = this.decodeToken();
    if (!decodedToken) {
      console.log('no se pudo decodificar el token, retornando false');
      return false;
    }

    // Verificar si el rol del usuario está en la lista de roles permitidos
    const hasRole = roles.includes(decodedToken.role);
    console.log('el usuario tiene alguno de los roles requeridos:', hasRole);
    
    return hasRole;

  }

  /**
   * Verifica si el usuario tiene un rol específico (más específico que hasAnyRole)
   */
  hasRole(requiredRole: string): boolean {
    console.log(`hasRole llamado para verificar rol: ${requiredRole}`);
    const userRole = this.getUserRole();
    const hasRole = userRole === requiredRole;
    console.log(`Usuario tiene rol ${requiredRole}: ${hasRole}`);
    return hasRole;
  }

  /**
   * Obtiene el rol del usuario actual desde el token
   */
  getUserRole(): string | null {
    console.log('getUserRole llamado');
    const decoded = this.decodeToken();
    if (!decoded) {
      console.log('Token no válido o no existe');
      return null;
    }
    console.log(`Rol obtenido: ${decoded.role}`);
    return decoded.role;
  }

  /**
   * Obtiene el ID del usuario actual desde el token
   */
  getUserId(): string | null {
    console.log('getUserId llamado');
    const decoded = this.decodeToken();
    if (!decoded) {
      console.log('Token no válido o no existe');
      return null;
    }
    console.log(`ID obtenido: ${decoded.id}`);
    return decoded.id;
  }

  /**
   * Verifica si el token está activo y cerca de expirar (útil para refrescar token)
   */
  shouldRefreshToken(minutesBefore = 5): boolean {
    console.log(`shouldRefreshToken llamado (${minutesBefore} minutos antes)`);
    const token = this.getToken();
    if (!token) {
      console.log('No hay token, no se puede refrescar');
      return false;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const now = Date.now() / 1000; // Convertir a segundos
      const expirationThreshold = decoded.exp - (minutesBefore * 60);
      const shouldRefresh = now >= expirationThreshold;
      
      console.log(`Token expira en: ${new Date(decoded.exp * 1000)}`);
      console.log(`Debería refrescar: ${shouldRefresh}`);
      
      return shouldRefresh;
    } catch (error) {
      console.error('Error decodificando token:', error);
      return false;
    }
  }

  /**
   * Intenta refrescar el token de autenticación
   */
  refreshToken(): Observable<any> {
    console.log('refreshToken llamado');
    // Nota: Necesitarías implementar el endpoint /auth/refresh-token en tu backend
    return this.apiService.postOb('/api/auth/refresh-token', {}).pipe(
      tap((response) => {
        console.log('Token refrescado correctamente');
        this.handleAuthResponse(response);
      }),
      catchError(error => {
        console.log('Error refrescando token:', error);
        return this.handleError('Error al refrescar token:', error);
      })
    );
  }

  /**
   * Obtiene los datos básicos del usuario actual desde el token
   */
  getCurrentUserData(): { id: string, email: string, role: string } | null {
    console.log('getCurrentUserData llamado');
    const decoded = this.decodeToken();
    if (!decoded) {
      console.log('No se pudo obtener datos del usuario');
      return null;
    }
    
    const userData = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    
    console.log('Datos del usuario actual:', userData);
    return userData;
  }

  // ============ MÉTODOS PARA UserService ============
  // (Estos serían parte de un UserService separado)

  /**
   * Obtiene los datos completos del usuario actual desde la API
   */
  getUserProfile(): Observable<User> {
    console.log('getUserProfile llamado');
    const userId = this.getUserId();
    if (!userId) {
      return throwError(() => new Error('No se pudo obtener el ID del usuario'));
    }
    
    return this.apiService.getOb(apiRouters.USERS.BY_ID(userId)).pipe(
      catchError(error => {
        console.log('Error obteniendo perfil:', error);
        return this.handleError('Error obteniendo perfil:', error);
      })
    );
  }

  /**
   * Actualiza los datos del usuario
   */
  updateUserProfile(userData: Partial<User>): Observable<User> {
    console.log('updateUserProfile llamado con:', userData);
    const userId = this.getUserId();
    if (!userId) {
      return throwError(() => new Error('No se pudo obtener el ID del usuario'));
    }
    
    return this.apiService.putOb(apiRouters.USERS.BY_ID(userId), userData).pipe(
      catchError(error => {
        console.log('Error actualizando perfil:', error);
        return this.handleError('Error actualizando perfil:', error);
      })
    );
  }
  

}