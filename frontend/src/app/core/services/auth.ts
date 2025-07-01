import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { Router } from '@angular/router';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { apiRouters } from '../constants/apiRouters';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser = this.currentUserSubject.asObservable();
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated = this.isAuthenticatedSubject.asObservable();

  constructor(private apiService: ApiService, private router: Router) {
    this.initializeAuthState();
  }

  /**
   * Inicializa el estado de autenticación al cargar el servicio
   */
  private initializeAuthState(): void {
    const userData = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');

    if (userData && token) {
      this.currentUserSubject.next(JSON.parse(userData));
      this.isAuthenticatedSubject.next(true);
    }
  }

  /**
   * Realiza el login del usuario
   * @param email Correo electrónico del usuario
   * @param password Contraseña del usuario
   * @returns Observable con la respuesta del servidor
   */
  login(email: string, password: string): Observable<any> {
    return this.apiService.postObservable(apiRouters.AUTH.SIGNIN, { email, password }).pipe(
      tap((response: any) => {
        if (response.success && response.token && response.user) {
          this.handleAuthenticationSuccess(response);
        }
      }),
      map((response: any) => {
        if (!response.success) {
          throw new Error(response.message || 'Error en la autenticación');
        }
        return response;
      })
    );
  }

  /**
   * Registra un nuevo usuario con rol Líder
   * @param username Nombre de usuario
   * @param email Correo electrónico
   * @param password Contraseña
   * @returns Promise con la respuesta del servidor
   */
  register(username: string, email: string, password: string): Promise<any> {
    return this.apiService.postPromise(apiRouters.AUTH.SIGNUP, {
      username,
      email,
      password,
      role: 'lider' // Rol fijo para registros desde este formulario
    }).then(response => {
      if (response.success) {
        return response;
      }
      throw new Error(response.message || 'Error en el registro');
    });
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  /**
   * Maneja el éxito en la autenticación
   * @param response Respuesta del servidor
   */
  private handleAuthenticationSuccess(response: any): void {
    const userData = {
      id: response.user._id,
      username: response.user.username,
      email: response.user.email,
      role: response.user.role
    };

    localStorage.setItem('token', response.token);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    this.currentUserSubject.next(userData);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Limpia los datos de autenticación
   */
  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Obtiene el token JWT almacenado
   * @returns Token JWT o null si no existe
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Obtiene el usuario actual
   * @returns Datos del usuario o null si no está autenticado
   */
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns boolean indicando si el usuario está autenticado
   */
  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Verifica si el usuario tiene un rol específico
   * @param role Rol a verificar
   * @returns boolean indicando si el usuario tiene el rol
   */
  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user && user.role === role;
  }
}