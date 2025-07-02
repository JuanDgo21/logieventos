import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
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
  constructor(private apiService: ApiService) { 
    console.log('AuthService initialized');
  }

  // Método para registro de usuarios con rol dinámico
  register(username: string, email: string, password: string, role: string): Observable<any> {
    console.log('Register method called with:', {username, email, role});
    
    // Validar que el rol sea uno de los permitidos
    const allowedRoles = ['admin', 'coordinador', 'lider'];
    if (!allowedRoles.includes(role)) {
      console.error('Invalid role provided:', role);
      throw new Error('Rol no válido. Los roles permitidos son: admin, coordinador, lider');
    }

    return this.apiService.postObservable(apiRouters.AUTH.SIGNUP, {
      username,
      email,
      password,
      role // Usamos el rol proporcionado
    }).pipe(
      tap((response: any) => {
        console.log('Register response:', response);
        if (response?.token) {
          console.log('Token received, saving user data');
          this.saveUserData(response);
        }
      }),
      catchError(error => {
        console.error('Error in register:', error);
        return throwError(() => error);
      })
    );
  }

  login(email: string, password: string): Observable<any> {
    console.log('Login method called with:', {email});
    return this.apiService.postObservable(apiRouters.AUTH.SIGNIN, {
      email,
      password
    }).pipe(
      tap((response: any) => {
        console.log('Login response:', response);
        if (response?.token) {
          console.log('Token received, saving user data');
          this.saveUserData(response);
        }
      }),
      catchError(error => {
        console.error('Error in login:', error);
        return throwError(() => error);
      })
    );
  }

  private saveUserData(authResult: any): void {
    console.log('Saving user data to localStorage');
    const decodedToken: DecodedToken = jwtDecode(authResult.token);
    console.log('Decoded token:', decodedToken);
    
    localStorage.setItem('token', authResult.token);
    localStorage.setItem('user', JSON.stringify({
      email: authResult.user?.email || decodedToken.id,
      username: authResult.user?.username,
      roles: [decodedToken.role]
    }));
    console.log('User data saved successfully');
  }

  logout(): void {
    console.log('Logout called, clearing localStorage');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('User logged out successfully');
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    console.log('Checking if user is logged in. Token exists:', !!token);
    
    if (!token) return false;

    try {
      const decoded: DecodedToken = jwtDecode(token);
      const isExpired = Date.now() >= decoded.exp * 1000;
      console.log('Token expiration status:', isExpired ? 'EXPIRED' : 'VALID');
      return !isExpired;
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  }

  getCurrentUserEmail(): string | null {
    const user = this.getUserData();
    console.log('Getting current user email:', user?.email);
    return user?.email || null;
  }

  getCurrentUsername(): string | null {
    const user = this.getUserData();
    console.log('Getting current username:', user?.username);
    return user?.username || null;
  }

  getUserRoles(): string[] {
    const user = this.getUserData();
    console.log('Getting user roles:', user?.roles);
    return user?.roles || [];
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    console.log('Getting token from storage:', !!token);
    return token;
  }

  private getUserData(): UserData | null {
    const user = localStorage.getItem('user');
    const parsedUser = user ? JSON.parse(user) : null;
    console.log('Getting user data from storage:', parsedUser);
    return parsedUser;
  }

  getPrimaryRole(): string | null {
    const roles = this.getUserRoles();
    const primaryRole = roles.length > 0 ? roles[0] : null;
    console.log('Getting primary role:', primaryRole);
    return primaryRole;
  }

  hasRole(role: string): boolean {
    const hasRole = this.getUserRoles().includes(role);
    console.log(`Checking if user has role '${role}':`, hasRole);
    return hasRole;
  }

  hasAnyRole(roles: string[]): boolean {
    const hasAny = this.getUserRoles().some(userRole => roles.includes(userRole));
    console.log(`Checking if user has any of roles '${roles.join(', ')}':`, hasAny);
    return hasAny;
  }

  forgotPassword(email: string): Observable<any> {
    console.log('Solicitando reseteo de contraseña para:', email);
    return this.apiService.postObservable(apiRouters.AUTH.FORGOT_PASSWORD, { email }).pipe(
      tap((response: any) => {
        console.log('Respuesta de forgotPassword:', response);
        if (response?.token) {
          // Aquí podrías guardar temporalmente el token si es necesario
        }
      }),
      catchError(error => {
        console.error('Error en forgotPassword:', error);
        let errorMessage = 'Error desconocido';
        
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  } 

  resetPassword(token: string, newPassword: string): Observable<any> {
    console.log('Reseteando contraseña con token:', token);
    return this.apiService.putObservable(apiRouters.AUTH.RESET_PASSWORD, {
      token: token,
      newPassword: newPassword
    }).pipe(
      catchError(error => {
        console.error('Error en resetPassword:', error);
        let errorMessage = 'Error desconocido al resetear la contraseña';
        
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

}