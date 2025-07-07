import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { AuthService } from './auth';
import { ApiResponse, User } from '../../shared/interfaces/user';
import { apiRouters } from '../constants/apiRouters';
import { BehaviorSubject, catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { DecodedToken } from '../../shared/interfaces/auth';
import { jwtDecode } from 'jwt-decode';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  getUsers() {
    throw new Error('Method not implemented.');
  }
  updateUserStatus(arg0: string, newStatus: boolean) {
    throw new Error('Method not implemented.');
  }

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private apiService: ApiService) {
    console.log('[UserService] Inicializado');
    this.loadInitialUser();
  }
 
  // ============ MÉTODOS PRIVADOS UTILITARIOS ============
  private loadInitialUser(): void {
    console.log('[UserService] Cargando usuario inicial');
    const userId = this.getCurrentUserId();
    if (userId) {
      this.getUserById(userId).subscribe({
        next: user => this.currentUserSubject.next(user),
        error: () => this.clearUserData()
      });
    }
  }

  private getCurrentUserId(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const decoded: DecodedToken = jwtDecode(token);
      return decoded.id;
    } catch (error) {
      console.error('[UserService] Error decodificando token:', error);
      return null;
    }
  }

  // ============ OPERACIONES CRUD BÁSICAS ============
  createUser(userData: Omit<User, '_id'>): Observable<User> {
    console.log('[UserService] Creando usuario:', userData);
    return this.apiService.postOb(apiRouters.USERS.BASE, userData).pipe(
      tap(newUser => console.log('[UserService] Usuario creado:', newUser)),
      catchError(error => {
        console.error('[UserService] Error creando usuario:', error);
        return throwError(() => new Error('No se pudo crear el usuario'));
      })
    );
  }

  getAllUsers(): Observable<User[]> {
    console.log('[UserService] Obteniendo todos los usuarios');
    return this.apiService.getOb(apiRouters.USERS.BASE).pipe(
      tap(users => console.log(`[UserService] Obtenidos ${users.length} usuarios`)),
      catchError(error => {
        console.error('[UserService] Error obteniendo usuarios:', error);
        return throwError(() => new Error('No se pudieron obtener los usuarios'));
      })
    );
  }

  getUserById(id: string): Observable<User> {
    console.log(`[UserService] Obteniendo usuario con ID: ${id}`);
    return this.apiService.getOb(apiRouters.USERS.BY_ID(id)).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data as User;
        }
        throw new Error('Formato de respuesta inválido');
      }),
      tap(user => console.log('[UserService] Usuario obtenido:', user)),
      catchError(error => {
        console.error(`[UserService] Error obteniendo usuario ${id}:`, error);
        return throwError(() => new Error('No se pudo obtener el usuario'));
      })
    );
  }

  updateUser(id: string, userData: Partial<User>): Observable<any> {
    console.log(`[UserService] Actualizando usuario ${id} con:`, userData);
    
    return this.apiService.putOb(apiRouters.USERS.BY_ID(id), userData).pipe(
      tap(response => console.log('[UserService] Respuesta cruda:', response)),
      map(response => {
        // Intenta parsear si viene como texto
        if (typeof response === 'string') {
          try {
            return JSON.parse(response);
          } catch (e) {
            console.warn('No se pudo parsear la respuesta:', response);
            return response;
          }
        }
        return response;
      }),
      catchError(error => {
        console.error('[UserService] Error al actualizar:', error);
        
        // Maneja errores de parseo
        if (error.error && typeof error.error.text === 'string') {
          try {
            const parsed = JSON.parse(error.error.text);
            return of(parsed); // Convierte en observable
          } catch (e) {
            console.warn('Error parseando error response:', e);
          }
        }
        
        return throwError(() => error);
      })
    );
  }

  deleteUser(id: string): Observable<void> {
    console.log(`[UserService] Eliminando usuario con ID: ${id}`);
    return this.apiService.deleteOb(apiRouters.USERS.BY_ID(id)).pipe(
      tap(() => {
        console.log(`[UserService] Usuario ${id} eliminado`);
        if (id === this.getCurrentUserId()) {
          this.clearUserData();
        }
      }),
      catchError(error => {
        console.error(`[UserService] Error eliminando usuario ${id}:`, error);
        return throwError(() => new Error('No se pudo eliminar el usuario'));
      })
    );
  }

  // ============ OPERACIONES DE PERFIL ============
  getProfile(): Observable<User> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Usuario no autenticado'));
    }
    
    return this.apiService.getOb(apiRouters.USERS.BY_ID(userId)).pipe(
      map((response: any) => {
        // Si la respuesta ya es el objeto de usuario (sin estructura success/data)
        if (response._id) {
          return response;
        }
        // Si viene con estructura {success, data}
        return response.data || response;
      }),
      catchError(error => {
        console.error('Error obteniendo perfil:', error);
        return throwError(() => error);
      })
    );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Usuario no autenticado'));
    }
    
    return this.apiService.postOb(`${apiRouters.USERS.BASE}/change-password`, {
      oldPassword,
      newPassword
    }).pipe(
      catchError(error => {
        console.error('[UserService] Error cambiando contraseña:', error);
        return throwError(() => error);
      })
    );
  }

  // ============ MÉTODOS DE VERIFICACIÓN ============
  checkCurrentUserRole(role: User['role']): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const decoded: DecodedToken = jwtDecode(token);
      return decoded.role === role;
    } catch (error) {
      console.error('[UserService] Error decodificando token:', error);
      return false;
    }
  }

  hasRole(role: string): boolean {
    return this.checkCurrentUserRole(role as User['role']);
  }

  // ============ MANEJO DE ESTADO ============
  clearUserData(): void {
    console.log('[UserService] Limpiando datos de usuario');
    this.currentUserSubject.next(null);
  }

  refreshUserData(): void {
    console.log('[UserService] Refrescando datos de usuario');
    const userId = this.getCurrentUserId();
    if (userId) {
      this.getUserById(userId).subscribe({
        next: user => this.currentUserSubject.next(user),
        error: () => this.clearUserData()
      });
    }
  }
}