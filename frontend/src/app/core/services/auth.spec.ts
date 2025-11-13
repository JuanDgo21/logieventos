import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

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

  // Mock para jwt-decode
  let mockJwtDecode: jasmine.Spy;

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
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiY29vcmRpbmFkb3IiLCJpYXQiOjE3MTIzNDU2NzgsImV4cCI6MTcxMjM0OTI3OH0.mock-signature',
    user: {
      _id: 'user123',
      email: 'test@example.com',
      active: true
    }
  };

  const mockDecodedToken: DecodedToken = {
    id: 'user123',
    email: 'test@example.com',
    role: 'coordinador',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  const mockRefreshResponse = {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiY29vcmRpbmFkb3IiLCJpYXQiOjE3MTIzNDU2NzgsImV4cCI6MTcxMjM0OTI3OH0.new-mock-signature'
  };

  beforeEach(() => {
    // Crear mock para jwtDecode
    mockJwtDecode = jasmine.createSpy('jwtDecode').and.returnValue(mockDecodedToken);

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

    // Limpiar localStorage antes de cada test
    localStorage.clear();
    
    // Mockear jwt-decode directamente en el servicio
    spyOn(service as any, 'decodeToken').and.callFake((token?: string) => {
      const tokenToDecode = token || localStorage.getItem('token');
      if (!tokenToDecode) {
        return null;
      }
      try {
        return mockJwtDecode(tokenToDecode);
      } catch (error) {
        return null;
      }
    });

    // Resetear todos los spies
    mockJwtDecode.calls.reset();
    apiService.postOb.calls.reset();
    apiService.getOb.calls.reset();
    apiService.putOb.calls.reset();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  // ============ PRUEBAS BÁSICAS ============
  describe('Creación del servicio', () => {
    it('debería crearse correctamente', () => {
      expect(service).toBeTruthy();
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
      localStorage.setItem('token', 'valid.token');
      
      mockJwtDecode.and.returnValue({
        ...mockDecodedToken,
        exp: (Date.now() / 1000) + 3600
      });

      expect(service.isLoggedIn()).toBe(true);
    });

    it('debería retornar false cuando no hay token', () => {
      localStorage.removeItem('token');
      expect(service.isLoggedIn()).toBe(false);
    });

    it('debería retornar false cuando el token está expirado', () => {
      localStorage.setItem('token', 'expired.token');
      
      mockJwtDecode.and.returnValue({
        ...mockDecodedToken,
        exp: (Date.now() / 1000) - 3600
      });

      expect(service.isLoggedIn()).toBe(false);
    });

    it('debería retornar false cuando hay error decodificando el token', () => {
      localStorage.setItem('token', 'invalid.token');
      mockJwtDecode.and.throwError('Token inválido');
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  // ============ PRUEBAS DE TOKEN EXPIRADO ============
  describe('Verificación de token expirado', () => {
    it('debería retornar false cuando el token no está expirado', () => {
      localStorage.setItem('token', 'valid.token');
      mockJwtDecode.and.returnValue({
        ...mockDecodedToken,
        exp: (Date.now() / 1000) + 3600
      });

      expect(service.isTokenExpired()).toBe(false);
    });

    it('debería retornar true cuando el token está expirado', () => {
      localStorage.setItem('token', 'expired.token');
      mockJwtDecode.and.returnValue({
        ...mockDecodedToken,
        exp: (Date.now() / 1000) - 3600
      });

      expect(service.isTokenExpired()).toBe(true);
    });

    it('debería retornar true cuando no hay token', () => {
      localStorage.removeItem('token');
      expect(service.isTokenExpired()).toBe(true);
    });
  });

  // ============ PRUEBAS DE MÉTODOS UTILITARIOS ============
  describe('Métodos utilitarios', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test.token');
      mockJwtDecode.and.returnValue(mockDecodedToken);
    });

    it('debería obtener el token del localStorage', () => {
      expect(service.getToken()).toBe('test.token');
    });

    it('debería hacer logout correctamente', () => {
      service.logout();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('debería decodificar el token', () => {
      const decoded = service.decodeToken();
      expect(decoded).toEqual(mockDecodedToken);
    });

    it('debería decodificar un token específico', () => {
      const specificToken = 'specific.token';
      const specificDecoded = { ...mockDecodedToken, id: 'specific-user' };
      mockJwtDecode.and.returnValue(specificDecoded);

      const decoded = service.decodeToken(specificToken);
      expect(decoded).toEqual(specificDecoded);
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
      localStorage.setItem('token', 'test.token');
      
      mockJwtDecode.and.returnValue({
        ...mockDecodedToken,
        exp: (Date.now() / 1000) + 240 // Expira en 4 minutos
      });

      expect(service.shouldRefreshToken(5)).toBe(true);
    });

    it('debería indicar que NO debe refrescar el token cuando no está cerca de expirar', () => {
      localStorage.setItem('token', 'test.token');
      
      mockJwtDecode.and.returnValue({
        ...mockDecodedToken,
        exp: (Date.now() / 1000) + 360 // Expira en 6 minutos
      });

      expect(service.shouldRefreshToken(5)).toBe(false);
    });

    it('debería retornar false para shouldRefreshToken cuando no hay token', () => {
      localStorage.removeItem('token');
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
      localStorage.setItem('token', 'test.token');
      mockJwtDecode.and.returnValue(mockDecodedToken);
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
    it('debería manejar error en shouldRefreshToken', () => {
      localStorage.setItem('token', 'invalid.token');
      mockJwtDecode.and.throwError('Error decodificando');

      expect(service.shouldRefreshToken(5)).toBe(false);
    });

    it('debería manejar error en isTokenExpired', () => {
      localStorage.setItem('token', 'invalid.token');
      mockJwtDecode.and.throwError('Token inválido');

      expect(service.isTokenExpired()).toBe(true);
    });

    it('debería manejar error en decodeToken', () => {
      localStorage.setItem('token', 'invalid.token');
      mockJwtDecode.and.throwError('Token inválido');

      const decoded = service.decodeToken();
      expect(decoded).toBeNull();
    });

    it('debería manejar error en getCurrentUserData', () => {
      localStorage.setItem('token', 'invalid.token');
      mockJwtDecode.and.throwError('Token inválido');

      const userData = service.getCurrentUserData();
      expect(userData).toBeNull();
    });
  });
});