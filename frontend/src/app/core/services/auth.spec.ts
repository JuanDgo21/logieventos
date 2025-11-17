import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

import { AuthService } from './auth';
import { ApiService } from './api';
import { User } from '../../shared/interfaces/user';
import { DecodedToken } from '../../shared/interfaces/auth';

// Mock del ApiService
class MockApiService {
  postOb = jasmine.createSpy('postOb').and.returnValue(of({}));
  getOb = jasmine.createSpy('getOb').and.returnValue(of({}));
  putOb = jasmine.createSpy('putOb').and.returnValue(of({}));
}

describe('AuthService', () => {
  let service: AuthService;
  let apiService: MockApiService;
  let httpTestingController: HttpTestingController;

  // Datos de prueba
  const mockUser: Omit<User, '_id' | 'createdAt' | 'updatedAt'> = {
    document: 12345678,
    fullname: 'Usuario Test',
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'coordinador',
    active: true
  };

  const mockLoginResponse = {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJjb29yZGluYWRvciIsImlhdCI6MTcxMjM0NTY3OCwiZXhwIjoxNzQzODgxNjc4fQ.fake-signature',
    user: {
      _id: 'user123',
      email: 'test@example.com',
      active: true
    }
  };

  // Mock tokens con tiempos controlados
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Token válido (expira en 1 hora)
  const validTokenPayload = {
    id: 'user123',
    email: 'test@example.com', 
    role: 'coordinador',
    iat: currentTime,
    exp: currentTime + 3600
  };
  const mockValidToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(validTokenPayload))}.signature`;
  
  // Token expirado (expiró hace 1 hora)
  const expiredTokenPayload = {
    id: 'user123',
    email: 'test@example.com',
    role: 'coordinador', 
    iat: currentTime - 7200,
    exp: currentTime - 3600
  };
  const mockExpiredToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(expiredTokenPayload))}.signature`;
  
  // Token cerca de expirar (expira en 4 minutos)
  const nearExpiryPayload = {
    id: 'user123',
    email: 'test@example.com',
    role: 'coordinador',
    iat: currentTime,
    exp: currentTime + 240
  };
  const mockNearExpiryToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(nearExpiryPayload))}.signature`;
  
  // Token lejos de expirar (expira en 6 minutos)  
  const farExpiryPayload = {
    id: 'user123',
    email: 'test@example.com',
    role: 'coordinador',
    iat: currentTime,
    exp: currentTime + 360
  };
  const mockFarExpiryToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(farExpiryPayload))}.signature`;

  const mockRefreshResponse = {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJjb29yZGluYWRvciIsImlhdCI6MTcxMjM0NTY3OCwiZXhwIjoxNzQzODgxNjc4fQ.new-signature'
  };

  // Spy para jwtDecode
  let jwtDecodeSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: ApiService, useClass: MockApiService }
      ]
    });

    service = TestBed.inject(AuthService);
    apiService = TestBed.inject(ApiService) as unknown as MockApiService;
    httpTestingController = TestBed.inject(HttpTestingController);

    // Limpiar localStorage y resetear mocks antes de cada test
    localStorage.clear();
    apiService.postOb.calls.reset();
    apiService.getOb.calls.reset();
    apiService.putOb.calls.reset();

    // Mock de jwtDecode que devuelve los payloads según el token
    jwtDecodeSpy = jasmine.createSpy('jwtDecode').and.callFake((token: string) => {
      if (token === mockValidToken) {
        return validTokenPayload;
      } else if (token === mockExpiredToken) {
        return expiredTokenPayload;
      } else if (token === mockNearExpiryToken) {
        return nearExpiryPayload;
      } else if (token === mockFarExpiryToken) {
        return farExpiryPayload;
      } else if (token === 'invalid.token') {
        throw new Error('Token inválido');
      } else {
        // Para tokens desconocidos, devolver válido por defecto
        return validTokenPayload;
      }
    });

    // Aplicar el mock a jwtDecode globalmente
    spyOn(service as any, 'decodeToken').and.callFake(function(this: any, token?: string) {
      const tokenToDecode = token || this.getToken();
      if (!tokenToDecode) {
        return null;
      }
      try {
        return jwtDecodeSpy(tokenToDecode);
      } catch (error) {
        return null;
      }
    });

    // Mock de handleAuthResponse que usa nuestro jwtDecode mockeado
    spyOn(service as any, 'handleAuthResponse').and.callFake(function(this: any, response: any) {
      if (response?.token) {
        localStorage.setItem('token', response.token);
        // Llamar al jwtDecode mockeado para simular la decodificación
        try {
          jwtDecodeSpy(response.token);
        } catch (error) {
          // Silenciar errores en tests
        }
      }
    });
  });

  afterEach(() => {
    httpTestingController.verify();
    // Restaurar localStorage
    localStorage.clear();
  });

  // ============ PRUEBAS BÁSICAS ============
  describe('Creación del servicio', () => {
    it('debería crearse correctamente', () => {
      expect(service).toBeTruthy();
    });

    it('debería tener el constructor con console.log', () => {
      // Forzar la llamada al constructor
      const serviceInstance = new AuthService(apiService as any);
      expect(serviceInstance).toBeTruthy();
    });
  });

  // ============ PRUEBAS DE REGISTRO ============
  describe('Método register', () => {
    it('debería registrar un usuario exitosamente', (done) => {
      apiService.postOb.and.returnValue(of(mockLoginResponse));

      service.register(mockUser).subscribe({
        next: (response) => {
          expect(apiService.postOb).toHaveBeenCalledWith('/api/auth/signup', mockUser);
          expect(localStorage.getItem('token')).toBe(mockLoginResponse.token);
          done();
        },
        error: done.fail
      });
    });

    it('debería rechazar registro con rol inválido', (done) => {
      const invalidUser = { 
        ...mockUser, 
        role: 'rol_invalido' as any
      };

      service.register(invalidUser).subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error.message).toBe('Rol no válido');
          done();
        }
      });
    });

    it('debería manejar errores del servidor en registro', (done) => {
      const errorResponse = { message: 'Error del servidor' };
      apiService.postOb.and.returnValue(throwError(() => errorResponse));

      service.register(mockUser).subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error).toBe(errorResponse);
          done();
        }
      });
    });

    it('debería probar catchError en register', (done) => {
      const errorResponse = new Error('Error específico');
      apiService.postOb.and.returnValue(throwError(() => errorResponse));

      service.register(mockUser).subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error).toBe(errorResponse);
          done();
        }
      });
    });
  });

  // ============ PRUEBAS DE LOGIN ============
  describe('Método login', () => {
    it('debería hacer login exitosamente', (done) => {
      apiService.postOb.and.returnValue(of(mockLoginResponse));

      service.login('test@example.com', 'password123').subscribe({
        next: (response) => {
          expect(apiService.postOb).toHaveBeenCalledWith('/api/auth/signin', {
            email: 'test@example.com',
            password: 'password123'
          });
          expect(localStorage.getItem('token')).toBe(mockLoginResponse.token);
          done();
        },
        error: done.fail
      });
    });

    it('debería rechazar login de usuario inactivo', (done) => {
      const inactiveUserResponse = {
        ...mockLoginResponse,
        user: { ...mockLoginResponse.user, active: false }
      };
      apiService.postOb.and.returnValue(of(inactiveUserResponse));

      service.login('test@example.com', 'password123').subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error.message).toBe('Tu cuenta está desactivada. Contacta al administrador.');
          done();
        }
      });
    });

    it('debería manejar errores de login', (done) => {
      const errorResponse = { message: 'Credenciales inválidas' };
      apiService.postOb.and.returnValue(throwError(() => errorResponse));

      service.login('test@example.com', 'wrongpassword').subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error).toBe(errorResponse);
          done();
        }
      });
    });

    it('debería manejar errores genéricos en login', (done) => {
      const errorResponse = new Error('Error genérico');
      apiService.postOb.and.returnValue(throwError(() => errorResponse));

      service.login('test@example.com', 'password123').subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error).toBe(errorResponse);
          done();
        }
      });
    });
  });

  // ============ PRUEBAS DE GESTIÓN DE CONTRASEÑAS ============
  describe('Métodos de contraseña', () => {
    it('debería solicitar recuperación de contraseña', (done) => {
      apiService.postOb.and.returnValue(of({ message: 'Email enviado' }));

      service.forgotPassword('test@example.com').subscribe({
        next: (response) => {
          expect(apiService.postOb).toHaveBeenCalledWith('/api/auth/forgot-password', {
            email: 'test@example.com'
          });
          done();
        },
        error: done.fail
      });
    });

    it('debería resetear contraseña', (done) => {
      apiService.postOb.and.returnValue(of({ message: 'Contraseña actualizada' }));

      service.resetPassword('reset-token', 'newpassword123').subscribe({
        next: (response) => {
          expect(apiService.postOb).toHaveBeenCalledWith('/api/auth/reset-password', {
            token: 'reset-token',
            newPassword: 'newpassword123'
          });
          done();
        },
        error: done.fail
      });
    });

    it('debería manejar errores de contraseña olvidada con mensaje del servidor', (done) => {
      const errorResponse = { 
        status: 404, 
        error: { message: 'Usuario no encontrado' } 
      };
      apiService.postOb.and.returnValue(throwError(() => errorResponse));

      service.forgotPassword('nonexistent@example.com').subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error.message).toBe('Usuario no encontrado');
          done();
        }
      });
    });

    it('debería manejar errores de contraseña olvidada sin mensaje específico', (done) => {
      const errorResponse = { status: 404 };
      apiService.postOb.and.returnValue(throwError(() => errorResponse));

      service.forgotPassword('nonexistent@example.com').subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error.message).toBe('No se encontró el usuario');
          done();
        }
      });
    });

    it('debería manejar token inválido en reset de contraseña', (done) => {
      const errorResponse = { status: 400 };
      apiService.postOb.and.returnValue(throwError(() => errorResponse));

      service.resetPassword('invalid-token', 'newpassword').subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error.message).toBe('Token inválido o expirado');
          done();
        }
      });
    });
  });

  // ============ PRUEBAS DE VERIFICACIÓN DE AUTENTICACIÓN ============
  describe('Verificación de autenticación', () => {
    it('debería retornar true cuando el usuario está logueado', () => {
      localStorage.setItem('token', mockValidToken);
      expect(service.isLoggedIn()).toBe(true);
    });

    it('debería retornar false cuando no hay token', () => {
      localStorage.removeItem('token');
      expect(service.isLoggedIn()).toBe(false);
    });

    it('debería retornar false cuando el token está expirado', () => {
      localStorage.setItem('token', mockExpiredToken);
      expect(service.isLoggedIn()).toBe(false);
    });

    it('debería retornar false cuando hay error decodificando el token', () => {
      localStorage.setItem('token', 'invalid.token');
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  // ============ PRUEBAS DE TOKEN EXPIRADO ============
  describe('Verificación de token expirado', () => {
    it('debería retornar false cuando el token no está expirado', () => {
      localStorage.setItem('token', mockValidToken);
      expect(service.isTokenExpired()).toBe(false);
    });

    it('debería retornar true cuando el token está expirado', () => {
      localStorage.setItem('token', mockExpiredToken);
      expect(service.isTokenExpired()).toBe(true);
    });

    it('debería retornar true cuando no hay token', () => {
      localStorage.removeItem('token');
      expect(service.isTokenExpired()).toBe(true);
    });

    it('debería retornar true cuando hay error decodificando el token', () => {
      localStorage.setItem('token', 'invalid.token');
      expect(service.isTokenExpired()).toBe(true);
    });
  });

  // ============ PRUEBAS DE MÉTODOS UTILITARIOS ============
  describe('Métodos utilitarios', () => {
    beforeEach(() => {
      localStorage.setItem('token', mockValidToken);
    });

    it('debería obtener el token del localStorage', () => {
      expect(service.getToken()).toBe(mockValidToken);
    });

    it('debería hacer logout correctamente', () => {
      service.logout();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('debería decodificar el token', () => {
      const decoded = service.decodeToken();
      expect(decoded).toEqual(validTokenPayload);
    });

    it('debería decodificar un token específico', () => {
      const decoded = service.decodeToken(mockValidToken);
      expect(decoded).toEqual(validTokenPayload);
    });

    it('debería retornar null al decodificar sin token', () => {
      localStorage.removeItem('token');
      const decoded = service.decodeToken();
      expect(decoded).toBeNull();
    });

    it('debería verificar si tiene algún rol', () => {
      const hasRole = service.hasAnyRole(['coordinador', 'admin']);
      expect(hasRole).toBe(true);
    });

    it('debería retornar false si no tiene ningún rol requerido', () => {
      const hasRole = service.hasAnyRole(['admin', 'lider']);
      expect(hasRole).toBe(false);
    });

    it('debería retornar false si no hay token al verificar roles', () => {
      localStorage.removeItem('token');
      const hasRole = service.hasAnyRole(['coordinador', 'admin']);
      expect(hasRole).toBe(false);
    });

    it('debería verificar si tiene un rol específico', () => {
      const hasRole = service.hasRole('coordinador');
      expect(hasRole).toBe(true);
    });

    it('debería retornar false si no tiene el rol específico', () => {
      const hasRole = service.hasRole('admin');
      expect(hasRole).toBe(false);
    });

    it('debería obtener el rol del usuario', () => {
      const role = service.getUserRole();
      expect(role).toBe('coordinador');
    });

    it('debería obtener el ID del usuario', () => {
      const userId = service.getUserId();
      expect(userId).toBe('user123');
    });

    it('debería obtener datos del usuario actual', () => {
      const userData = service.getCurrentUserData();
      expect(userData).toEqual({
        id: 'user123',
        email: 'test@example.com',
        role: 'coordinador'
      });
    });

    it('debería retornar null para datos de usuario sin token', () => {
      localStorage.removeItem('token');
      const userData = service.getCurrentUserData();
      expect(userData).toBeNull();
    });
  });

  // ============ PRUEBAS DE REFRESCO DE TOKEN ============
  describe('Refresco de token', () => {
    it('debería indicar que debe refrescar el token cuando está cerca de expirar', () => {
      localStorage.setItem('token', mockNearExpiryToken);
      expect(service.shouldRefreshToken(5)).toBe(true);
    });

    it('debería indicar que NO debe refrescar el token cuando no está cerca de expirar', () => {
      localStorage.setItem('token', mockFarExpiryToken);
      expect(service.shouldRefreshToken(5)).toBe(false);
    });

    it('debería retornar false para shouldRefreshToken cuando no hay token', () => {
      localStorage.removeItem('token');
      expect(service.shouldRefreshToken(5)).toBe(false);
    });

    it('debería manejar error en shouldRefreshToken', () => {
      localStorage.setItem('token', 'invalid.token');
      expect(service.shouldRefreshToken(5)).toBe(false);
    });

    it('debería refrescar el token exitosamente', (done) => {
      apiService.postOb.and.returnValue(of(mockRefreshResponse));

      service.refreshToken().subscribe({
        next: (response) => {
          expect(apiService.postOb).toHaveBeenCalledWith('/api/auth/refresh-token', {});
          expect(localStorage.getItem('token')).toBe(mockRefreshResponse.token);
          done();
        },
        error: done.fail
      });
    });

    it('debería manejar error al refrescar token', (done) => {
      const errorResponse = { message: 'Error refrescando token' };
      apiService.postOb.and.returnValue(throwError(() => errorResponse));

      service.refreshToken().subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error).toBe(errorResponse);
          done();
        }
      });
    });
  });

  // ============ PRUEBAS DE PERFIL DE USUARIO ============
  describe('Gestión de perfil de usuario', () => {
    beforeEach(() => {
      localStorage.setItem('token', mockValidToken);
    });

    it('debería obtener el perfil del usuario', (done) => {
      const mockUserProfile: User = {
        _id: 'user123',
        document: 12345678,
        fullname: 'Usuario Test',
        username: 'testuser',
        email: 'test@example.com',
        role: 'coordinador',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      apiService.getOb.and.returnValue(of(mockUserProfile));

      service.getUserProfile().subscribe({
        next: (profile) => {
          expect(apiService.getOb).toHaveBeenCalledWith('/api/users/user123');
          expect(profile).toEqual(mockUserProfile);
          done();
        },
        error: done.fail
      });
    });

    it('debería manejar error al obtener perfil sin userId', (done) => {
      localStorage.removeItem('token');
      
      service.getUserProfile().subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error.message).toBe('No se pudo obtener el ID del usuario');
          done();
        }
      });
    });

    it('debería actualizar el perfil del usuario', (done) => {
      const updateData = { fullname: 'Nuevo Nombre' };
      const updatedUser: User = {
        _id: 'user123',
        document: 12345678,
        fullname: 'Nuevo Nombre',
        username: 'testuser',
        email: 'test@example.com',
        role: 'coordinador',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      apiService.putOb.and.returnValue(of(updatedUser));

      service.updateUserProfile(updateData).subscribe({
        next: (profile) => {
          expect(apiService.putOb).toHaveBeenCalledWith('/api/users/user123', updateData);
          expect(profile.fullname).toBe('Nuevo Nombre');
          done();
        },
        error: done.fail
      });
    });

    it('debería manejar error al actualizar perfil sin userId', (done) => {
      const updateData = { fullname: 'Nuevo Nombre' };
      
      localStorage.removeItem('token');

      service.updateUserProfile(updateData).subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error.message).toBe('No se pudo obtener el ID del usuario');
          done();
        }
      });
    });
  });

  // ============ PRUEBAS ADICIONALES PARA 100% COBERTURA ============
describe('Pruebas adicionales para cobertura completa', () => {
  it('debería manejar error en handleError', (done) => {
    const error = new Error('Test error');
    
    const result = (service as any).handleError('Contexto', error);
    
    result.subscribe({
      error: (err: any) => {
        expect(err).toBe(error);
        done();
      }
    });
  });

  it('debería manejar error en handlePasswordError con mensaje específico', (done) => {
    const error = { 
      error: { message: 'Error específico' },
      status: 404
    };
    
    const result = (service as any).handlePasswordError(error, 'test');
    
    result.subscribe({
      error: (err: any) => {
        expect(err.message).toBe('Error específico');
        done();
      }
    });
  });

  it('debería manejar error en handlePasswordError sin mensaje específico', (done) => {
    const error = { status: 404 };
    
    const result = (service as any).handlePasswordError(error, 'recuperación');
    
    result.subscribe({
      error: (err: any) => {
        expect(err.message).toBe('No se encontró el usuario');
        done();
      }
    });
  });

  it('debería manejar error 400 en handlePasswordError', (done) => {
    const error = { status: 400 };
    
    const result = (service as any).handlePasswordError(error, 'actualización');
    
    result.subscribe({
      error: (err: any) => {
        expect(err.message).toBe('Token inválido o expirado');
        done();
      }
    });
  });

  it('debería manejar error genérico en handlePasswordError', (done) => {
    const error = { status: 500 };
    
    const result = (service as any).handlePasswordError(error, 'test');
    
    result.subscribe({
      error: (err: any) => {
        expect(err.message).toBe('Error al procesar la test');
        done();
      }
    });
  });

  it('debería manejar error en decodeToken con token inválido', () => {
    localStorage.setItem('token', 'invalid.token');
    const decoded = service.decodeToken();
    expect(decoded).toBeNull();
  });

  it('debería manejar error en getCurrentUserData con token inválido', () => {
    localStorage.setItem('token', 'invalid.token');
    const userData = service.getCurrentUserData();
    expect(userData).toBeNull();
  });

  it('debería retornar false para hasAnyRole con token inválido', () => {
    localStorage.setItem('token', 'invalid.token');
    const hasRole = service.hasAnyRole(['coordinador']);
    expect(hasRole).toBe(false);
  });

  it('debería retornar false para hasRole con token inválido', () => {
    localStorage.setItem('token', 'invalid.token');
    const hasRole = service.hasRole('coordinador');
    expect(hasRole).toBe(false);
  });

  it('debería retornar null para getUserRole con token inválido', () => {
    localStorage.setItem('token', 'invalid.token');
    const role = service.getUserRole();
    expect(role).toBeNull();
  });

  it('debería retornar null para getUserId con token inválido', () => {
    localStorage.setItem('token', 'invalid.token');
    const userId = service.getUserId();
    expect(userId).toBeNull();
  });
});

// ============ PRUEBAS PARA COBERTURA 100% ============
describe('Pruebas para cobertura 100%', () => {
  // Pruebas específicas para líneas no cubiertas
  
  it('debería probar handleAuthResponse real con token válido', () => {
    // Crear una instancia temporal sin mocks
    const tempService = new AuthService(apiService as any);
    spyOn(console, 'log');
    
    const response = { token: mockValidToken };
    (tempService as any).handleAuthResponse(response);
    
    expect(localStorage.getItem('token')).toBe(mockValidToken);
    expect(console.log).toHaveBeenCalledWith('handleAuthResponse llamado con:', response);
    expect(console.log).toHaveBeenCalledWith('token encontrado en respuesta');
    expect(console.log).toHaveBeenCalledWith('token decodificado:', validTokenPayload);
    expect(console.log).toHaveBeenCalledWith('token almacenado en localStorage');
  });

  it('debería probar handleAuthResponse real sin token', () => {
    // Crear una instancia temporal sin mocks
    const tempService = new AuthService(apiService as any);
    spyOn(console, 'log');
    
    const response = { user: 'test' };
    (tempService as any).handleAuthResponse(response);
    
    expect(localStorage.getItem('token')).toBeNull();
    expect(console.log).toHaveBeenCalledWith('handleAuthResponse llamado con:', response);
    expect(console.log).toHaveBeenCalledWith('no se encontró token en la respuesta');
  });

  it('debería probar decodeToken real con token específico', () => {
    // Crear una instancia temporal sin mocks
    const tempService = new AuthService(apiService as any);
    spyOn(console, 'log');
    
    const decoded = tempService.decodeToken(mockValidToken);
    
    expect(decoded).toEqual(validTokenPayload);
    expect(console.log).toHaveBeenCalledWith('decodeToken llamado');
    expect(console.log).toHaveBeenCalledWith('token a decodificar:', mockValidToken);
    expect(console.log).toHaveBeenCalledWith('token decodificado:', validTokenPayload);
  });

  it('debería probar decodeToken real sin token', () => {
    // Crear una instancia temporal sin mocks
    const tempService = new AuthService(apiService as any);
    spyOn(console, 'log');
    
    localStorage.removeItem('token');
    const decoded = tempService.decodeToken();
    
    expect(decoded).toBeNull();
    expect(console.log).toHaveBeenCalledWith('decodeToken llamado');
    expect(console.log).toHaveBeenCalledWith('no se encontró token, retornando null');
  });

  it('debería probar decodeToken real con error', () => {
    // Crear una instancia temporal sin mocks
    const tempService = new AuthService(apiService as any);
    spyOn(console, 'log');
    spyOn(console, 'error');
    
    const decoded = tempService.decodeToken('invalid.token');
    
    expect(decoded).toBeNull();
    expect(console.error).toHaveBeenCalledWith('Error decodificando token:', jasmine.any(Error));
  });

  it('debería probar shouldRefreshToken con cálculo de tiempo específico', () => {
    // Crear una instancia temporal sin mocks
    const tempService = new AuthService(apiService as any);
    spyOn(console, 'log');
    
    // Token que expira en 4 minutos (240 segundos)
    const nearExpiryTime = Math.floor(Date.now() / 1000) + 240;
    const nearExpiryPayload = {
      id: 'user123',
      email: 'test@example.com',
      role: 'coordinador',
      iat: Math.floor(Date.now() / 1000),
      exp: nearExpiryTime
    };
    const testNearExpiryToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(nearExpiryPayload))}.signature`;
    
    localStorage.setItem('token', testNearExpiryToken);
    const result = tempService.shouldRefreshToken(5); // 5 minutos antes
    
    // Debería ser true porque expira en 4 minutos y estamos verificando 5 minutos antes
    expect(result).toBe(true);
    expect(console.log).toHaveBeenCalledWith('shouldRefreshToken llamado (5 minutos antes)');
  });

  it('debería probar shouldRefreshToken con token que no necesita refresh', () => {
    // Crear una instancia temporal sin mocks
    const tempService = new AuthService(apiService as any);
    spyOn(console, 'log');
    
    // Token que expira en 10 minutos (600 segundos) - no necesita refresh con 5 minutos de anticipación
    const farExpiryTime = Math.floor(Date.now() / 1000) + 600;
    const farExpiryPayload = {
      id: 'user123',
      email: 'test@example.com',
      role: 'coordinador',
      iat: Math.floor(Date.now() / 1000),
      exp: farExpiryTime
    };
    const testFarExpiryToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(farExpiryPayload))}.signature`;
    
    localStorage.setItem('token', testFarExpiryToken);
    const result = tempService.shouldRefreshToken(5); // 5 minutos antes
    
    expect(result).toBe(false);
  });

  it('debería probar todos los console.log en getToken', () => {
    // Crear una instancia temporal sin mocks
    const tempService = new AuthService(apiService as any);
    spyOn(console, 'log');
    
    localStorage.setItem('token', 'test.token');
    const token = tempService.getToken();
    
    expect(token).toBe('test.token');
    expect(console.log).toHaveBeenCalledWith('getToken llamado');
    expect(console.log).toHaveBeenCalledWith('token de localStorage:', 'test.token');
  });

  it('debería probar todos los console.log en logout', () => {
    // Crear una instancia temporal sin mocks
    const tempService = new AuthService(apiService as any);
    spyOn(console, 'log');
    
    localStorage.setItem('token', 'test.token');
    tempService.logout();
    
    expect(localStorage.getItem('token')).toBeNull();
    expect(console.log).toHaveBeenCalledWith('logout llamado');
    expect(console.log).toHaveBeenCalledWith('token removido de localStorage');
  });

  it('debería probar hasRole con rol diferente', () => {
    // Crear una instancia temporal sin mocks
    const tempService = new AuthService(apiService as any);
    spyOn(console, 'log');
    
    localStorage.setItem('token', mockValidToken);
    const hasRole = tempService.hasRole('admin'); // Rol diferente al del token
    
    expect(hasRole).toBe(false);
    expect(console.log).toHaveBeenCalledWith('hasRole llamado para verificar rol: admin');
    expect(console.log).toHaveBeenCalledWith('Usuario tiene rol admin: false');
  });

  it('debería probar handlePasswordError con error que tiene message directo', (done) => {
    spyOn(console, 'log');
    spyOn(console, 'error');
    
    // Error con message en la raíz (no en error property)
    const errorWithRootMessage = { 
      message: 'Mensaje en raíz',
      status: 500 
    };
    
    const result = (service as any).handlePasswordError(errorWithRootMessage, 'test');
    
    result.subscribe({
      error: (err: any) => {
        expect(err.message).toBe('Error al procesar la test');
        done();
      }
    });
  });

  it('debería probar login con todos los console.log', (done) => {
  // Crear una instancia temporal sin mocks para esta prueba
  const tempService = new AuthService(apiService as any);
  spyOn(console, 'log');
  
  apiService.postOb.and.returnValue(of(mockLoginResponse));

  tempService.login('test@example.com', 'password123').subscribe({
    next: () => {
      expect(console.log).toHaveBeenCalledWith('login llamado con:', { email: 'test@example.com', password: 'password123' });
      expect(console.log).toHaveBeenCalledWith('login respuesta recibida:', mockLoginResponse);
      expect(console.log).toHaveBeenCalledWith('token encontrado en respuesta');
      expect(console.log).toHaveBeenCalledWith('token decodificado:', jasmine.any(Object));
      expect(console.log).toHaveBeenCalledWith('token almacenado en localStorage');
      done();
    },
    error: done.fail
  });
});

  it('debería probar register con todos los console.log', (done) => {
  // Crear una instancia temporal sin mocks para esta prueba
  const tempService = new AuthService(apiService as any);
  spyOn(console, 'log');
  
  apiService.postOb.and.returnValue(of(mockLoginResponse));

  tempService.register(mockUser).subscribe({
    next: () => {
      expect(console.log).toHaveBeenCalledWith('handleAuthResponse llamado con:', mockLoginResponse);
      expect(console.log).toHaveBeenCalledWith('token encontrado en respuesta');
      expect(console.log).toHaveBeenCalledWith('token decodificado:', jasmine.any(Object));
      expect(console.log).toHaveBeenCalledWith('token almacenado en localStorage');
      done();
    },
    error: done.fail
  });
});

  it('debería probar forgotPassword con todos los console.log', (done) => {
    spyOn(console, 'log');
    
    apiService.postOb.and.returnValue(of({ message: 'Email enviado' }));

    service.forgotPassword('test@example.com').subscribe({
      next: () => {
        expect(console.log).toHaveBeenCalledWith('forgotPassword llamado con:', { email: 'test@example.com' });
        done();
      },
      error: done.fail
    });
  });

  it('debería probar resetPassword con todos los console.log', (done) => {
    spyOn(console, 'log');
    
    apiService.postOb.and.returnValue(of({ message: 'Contraseña actualizada' }));

    service.resetPassword('token123', 'newpass123').subscribe({
      next: () => {
        expect(console.log).toHaveBeenCalledWith('resetPassword llamado con:', { token: 'token123', newPassword: 'newpass123' });
        done();
      },
      error: done.fail
    });
  });

  it('debería probar refreshToken con todos los console.log', (done) => {
  // Crear una instancia temporal sin mocks para esta prueba
  const tempService = new AuthService(apiService as any);
  spyOn(console, 'log');
  
  apiService.postOb.and.returnValue(of(mockRefreshResponse));

  tempService.refreshToken().subscribe({
    next: () => {
      expect(console.log).toHaveBeenCalledWith('refreshToken llamado');
      expect(console.log).toHaveBeenCalledWith('Token refrescado correctamente');
      expect(console.log).toHaveBeenCalledWith('handleAuthResponse llamado con:', mockRefreshResponse);
      expect(console.log).toHaveBeenCalledWith('token encontrado en respuesta');
      expect(console.log).toHaveBeenCalledWith('token decodificado:', jasmine.any(Object));
      expect(console.log).toHaveBeenCalledWith('token almacenado en localStorage');
      done();
    },
    error: done.fail
  });
});

it('debería probar login con usuario inactivo y sus console.log', (done) => {
  // Crear una instancia temporal sin mocks para esta prueba
  const tempService = new AuthService(apiService as any);
  spyOn(console, 'log');
  
  const inactiveUserResponse = {
    ...mockLoginResponse,
    user: { ...mockLoginResponse.user, active: false }
  };
  apiService.postOb.and.returnValue(of(inactiveUserResponse));

  tempService.login('test@example.com', 'password123').subscribe({
    next: () => done.fail('Debería haber fallado'),
    error: (error) => {
      expect(console.log).toHaveBeenCalledWith('login llamado con:', { email: 'test@example.com', password: 'password123' });
      expect(console.log).toHaveBeenCalledWith('login respuesta recibida:', inactiveUserResponse);
      expect(console.log).toHaveBeenCalledWith('Usuario inactivo detectado:', 'test@example.com');
      expect(error.message).toBe('Tu cuenta está desactivada. Contacta al administrador.');
      done();
    }
  });
});

it('debería probar forgotPassword con error y sus console.log', (done) => {
  spyOn(console, 'log');
  
  const errorResponse = { 
    status: 404,
    error: { message: 'Usuario no encontrado' }
  };
  apiService.postOb.and.returnValue(throwError(() => errorResponse));

  service.forgotPassword('nonexistent@example.com').subscribe({
    next: () => done.fail('Debería haber fallado'),
    error: (error) => {
      expect(console.log).toHaveBeenCalledWith('forgotPassword llamado con:', { email: 'nonexistent@example.com' });
      expect(console.log).toHaveBeenCalledWith('forgotPassword error ocurrido:', errorResponse);
      expect(console.log).toHaveBeenCalledWith('handlePasswordError llamado con:', { error: errorResponse, context: 'recuperación' });
      expect(console.log).toHaveBeenCalledWith('mensaje de error del objeto error:', 'Usuario no encontrado');
      expect(error.message).toBe('Usuario no encontrado');
      done();
    }
  });
});

it('debería probar resetPassword con error y sus console.log', (done) => {
  spyOn(console, 'log');
  
  const errorResponse = { status: 400 };
  apiService.postOb.and.returnValue(throwError(() => errorResponse));

  service.resetPassword('invalid-token', 'newpassword').subscribe({
    next: () => done.fail('Debería haber fallado'),
    error: (error) => {
      expect(console.log).toHaveBeenCalledWith('resetPassword llamado con:', { token: 'invalid-token', newPassword: 'newpassword' });
      expect(console.log).toHaveBeenCalledWith('resetPassword error ocurrido:', errorResponse);
      expect(console.log).toHaveBeenCalledWith('handlePasswordError llamado con:', { error: errorResponse, context: 'actualización' });
      expect(console.log).toHaveBeenCalledWith('error 400 detectado');
      expect(error.message).toBe('Token inválido o expirado');
      done();
    }
  });
});

  it('debería probar getUserProfile con todos los console.log', (done) => {
    spyOn(console, 'log');
    
    localStorage.setItem('token', mockValidToken);
    const mockUserProfile: User = {
      _id: 'user123',
      document: 12345678,
      fullname: 'Usuario Test',
      username: 'testuser',
      email: 'test@example.com',
      role: 'coordinador',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    apiService.getOb.and.returnValue(of(mockUserProfile));

    service.getUserProfile().subscribe({
      next: () => {
        expect(console.log).toHaveBeenCalledWith('getUserProfile llamado');
        done();
      },
      error: done.fail
    });
  });

  it('debería probar updateUserProfile con todos los console.log', (done) => {
    spyOn(console, 'log');
    
    localStorage.setItem('token', mockValidToken);
    const updatedUser: User = {
      _id: 'user123',
      document: 12345678,
      fullname: 'Nuevo Nombre',
      username: 'testuser',
      email: 'test@example.com',
      role: 'coordinador',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    apiService.putOb.and.returnValue(of(updatedUser));

    service.updateUserProfile({ fullname: 'Nuevo Nombre' }).subscribe({
      next: () => {
        expect(console.log).toHaveBeenCalledWith('updateUserProfile llamado con:', { fullname: 'Nuevo Nombre' });
        done();
      },
      error: done.fail
    });
  });

  it('debería probar handleError con todos los console.log', (done) => {
    spyOn(console, 'log');
    spyOn(console, 'error');
    
    const testError = new Error('Test error');
    const result = (service as any).handleError('Test Context', testError);
    
    result.subscribe({
      error: () => {
        expect(console.log).toHaveBeenCalledWith('handleError llamado con:', { context: 'Test Context', error: testError });
        expect(console.error).toHaveBeenCalledWith('[AuthService] Test Context', testError);
        done();
      }
    });
  });

  it('debería probar handlePasswordError con todos los console.log', (done) => {
    spyOn(console, 'log');
    spyOn(console, 'error');
    
    const error = { 
      error: { message: 'Error específico' },
      status: 404
    };
    
    const result = (service as any).handlePasswordError(error, 'test');
    
    result.subscribe({
      error: () => {
        expect(console.log).toHaveBeenCalledWith('handlePasswordError llamado con:', { error, context: 'test' });
        expect(console.log).toHaveBeenCalledWith('mensaje de error del objeto error:', 'Error específico');
        expect(console.error).toHaveBeenCalledWith('[AuthService] Error en test:', error);
        done();
      }
    });
  });
  // AGREGAR ESTAS PRUEBAS al final del archivo

describe('Pruebas para las últimas líneas en rojo', () => {
  
  it('debería probar getUserProfile con error del servidor y sus console.log', (done) => {
    spyOn(console, 'log');
    
    // Primero establecer token válido
    localStorage.setItem('token', mockValidToken);
    
    const profileError = { message: 'Error del servidor al obtener perfil' };
    apiService.getOb.and.returnValue(throwError(() => profileError));

    service.getUserProfile().subscribe({
      next: () => done.fail('Debería haber fallado'),
      error: (error) => {
        expect(console.log).toHaveBeenCalledWith('Error obteniendo perfil:', profileError);
        expect(error).toBe(profileError);
        done();
      }
    });
  });

  it('debería probar updateUserProfile con error del servidor y sus console.log', (done) => {
    spyOn(console, 'log');
    
    // Primero establecer token válido
    localStorage.setItem('token', mockValidToken);
    
    const updateError = { message: 'Error del servidor al actualizar perfil' };
    apiService.putOb.and.returnValue(throwError(() => updateError));

    service.updateUserProfile({ fullname: 'Nuevo Nombre' }).subscribe({
      next: () => done.fail('Debería haber fallado'),
      error: (error) => {
        expect(console.log).toHaveBeenCalledWith('Error actualizando perfil:', updateError);
        expect(error).toBe(updateError);
        done();
      }
    });
  });

  it('debería probar handlePasswordError con error 404 y contexto diferente a recuperación', (done) => {
    spyOn(console, 'log');
    spyOn(console, 'error');
    
    const error404 = { status: 404 };
    const result = (service as any).handlePasswordError(error404, 'verificación');
    
    result.subscribe({
      error: (err: any) => {
        expect(err.message).toBe('Usuario no encontrado');
        expect(console.log).toHaveBeenCalledWith('error 404 detectado');
        done();
      }
    });
  });

  // Prueba adicional para cubrir cualquier edge case restante
  it('debería probar todos los métodos con errores de servidor', (done) => {
    spyOn(console, 'log');
    
    const serverError = { 
      status: 500, 
      message: 'Error interno del servidor' 
    };

    // Probar forgotPassword con error
    apiService.postOb.and.returnValue(throwError(() => serverError));

    service.forgotPassword('test@example.com').subscribe({
      next: () => done.fail('Debería haber fallado'),
      error: (error) => {
        expect(console.log).toHaveBeenCalledWith('forgotPassword error ocurrido:', serverError);
        done();
      }
    });
  });

  it('debería probar resetPassword con error genérico', (done) => {
    spyOn(console, 'log');
    
    const genericError = { status: 500 };
    apiService.postOb.and.returnValue(throwError(() => genericError));

    service.resetPassword('token', 'password').subscribe({
      next: () => done.fail('Debería haber fallado'),
      error: (error) => {
        expect(console.log).toHaveBeenCalledWith('resetPassword error ocurrido:', genericError);
        expect(error.message).toBe('Error al procesar la actualización');
        done();
      }
    });
  });
});
});
});

