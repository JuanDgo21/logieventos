import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { Router } from '@angular/router';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { apiRouters } from '../constants/apiRouters';
import { JwtHelperService } from '@auth0/angular-jwt';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private jwtHelper = new JwtHelperService();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    // Inicializamos el BehaviorSubject con el usuario del localStorage si existe
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<any>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  // Obtener el valor actual del usuario
  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  // Método para login
  login(email: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiService.postPromise(apiRouters.AUTH.SIGNIN, { email, password })
        .then((response: any) => {
          if (response.success && response.token) {
            // Almacenar usuario y token en localStorage
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            localStorage.setItem('token', response.token);
            this.currentUserSubject.next(response.user);
            resolve(response);
          } else {
            reject(new Error('Credenciales incorrectas'));
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  // Método para registro
  register(userData: any): Promise<any> {
    return this.apiService.postPromise(apiRouters.AUTH.SIGNUP, userData);
  }

  // Método para logout
  logout(): void {
    // Remover usuario y token del localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    // Verificar que el token exista y no esté expirado
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  // Obtener el token JWT
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Obtener el rol del usuario actual
  getCurrentUserRole(): string | null {
    const user = this.currentUserValue;
    return user ? user.role : null;
  }

  // Obtener el ID del usuario actual
  getCurrentUserId(): string | null {
    const user = this.currentUserValue;
    return user ? user._id : null;
  }

  // Verificar si el usuario tiene un rol específico
  hasRole(role: string): boolean {
    const userRole = this.getCurrentUserRole();
    return userRole === role;
  }

  // Verificar si el token está expirado
  isTokenExpired(): boolean {
    const token = this.getToken();
    return token ? this.jwtHelper.isTokenExpired(token) : true;
  }
}