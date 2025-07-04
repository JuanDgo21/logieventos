import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { AuthService } from './auth';
import { User } from '../../shared/interfaces/user';
import { apiRouters } from '../constants/apiRouters';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // constructor(
  //   private apiService: ApiService,
  //   private authService: AuthService
  // ) {}

  // // Obtener usuario actual
  // getCurrentUser(): Promise<User> {
  //   const userData = this.authService.getCurrentUser();
  //   if (!userData?._id) {
  //     return Promise.reject('Usuario no autenticado');
  //   }
  //   return this.getUserById(userData._id);
  // }

  // // Obtener usuario por ID
  // getUserById(id: string): Promise<User> {
  //   return this.apiService.getPromise(apiRouters.USERS.BY_ID(id));
  // }

  // // Actualizar usuario
  // updateUser(id: string, userData: Partial<User>): Promise<User> {
  //   return this.apiService.putPromise(apiRouters.USERS.BY_ID(id), userData);
  // }

  // // Actualizar perfil del usuario actual
  // updateCurrentUser(profileData: {
  //   document?: number;
  //   fullname?: string;
  //   username?: string;
  //   email?: string;
  //   password?: string;
  // }): Promise<User> {
  //   return this.getCurrentUser().then(user => {
  //     return this.updateUser(user._id!, profileData);
  //   });
  // }

  // // Métodos observables (para componentes que usen observables)
  // getCurrentUserObservable(): Observable<User> {
  //   const userData = this.authService.getCurrentUser();
  //   if (!userData?._id) {
  //     return throwError(() => new Error('Usuario no autenticado'));
  //   }
  //   return this.getUserByIdObservable(userData._id);
  // }

  // getUserByIdObservable(id: string): Observable<User> {
  //   return this.apiService.getObservable(apiRouters.USERS.BY_ID(id));
  // }

  // updateUserObservable(id: string, userData: Partial<User>): Observable<User> {
  //   return this.apiService.putObservable(apiRouters.USERS.BY_ID(id), userData);
  // }
}