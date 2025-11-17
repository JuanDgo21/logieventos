import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth';
import { ApiService } from './api';
import { of, throwError } from 'rxjs';

// Helper para simular JWT válidos y evitar errores de decodificación
const createMockToken = (payload: any): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = 'mockSignature';
  return `${header}.${body}.${signature}`;
};

describe('AuthService', () => {
  let service: AuthService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  // Tokens de ayuda para las pruebas
  const expFuture = Math.floor(Date.now() / 1000) + 3600;
  const expPast = Math.floor(Date.now() / 1000) - 3600;
  const validToken = createMockToken({ exp: expFuture, id: '1', email: 'a', role: 'admin' });
  const expiredToken = createMockToken({ exp: expPast, id: '2', email: 'b', role: 'user' });

  beforeEach(() => {
    spyOn(console, 'log');
    spyOn(console, 'error');
    
    const spy = jasmine.createSpyObj('ApiService', ['postOb', 'getOb', 'putOb']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(AuthService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    // Limpieza y espías de LocalStorage. Usamos callThrough para
    // que los spies no impidan la funcionalidad real,
    // excepto getItem que controlaremos en cada test.
    localStorage.clear();
    spyOn(localStorage, 'setItem').and.callThrough();
    spyOn(localStorage, 'getItem').and.callThrough(); // [CORRECCIÓN] Lo espiamos, pero lo sobre-escribiremos
    spyOn(localStorage, 'removeItem').and.callThrough();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should log constructor message on creation', () => {
    expect(console.log).toHaveBeenCalledWith('AuthService constructor llamado');
  });

  // ==========================================
  // 1. REGISTER TESTS
  // ==========================================
  describe('#register', () => {
    const mockUserReg = {
      document: 123456,
      fullname: 'Test User',
      username: 'testuser',
      email: 'test@mail.com',
      role: 'admin' as const,
      active: true
    };

    it('should register successfully', (done) => {
      const mockResponse = { token: validToken };
      apiServiceSpy.postOb.and.returnValue(of(mockResponse));

      service.register(mockUserReg).subscribe({
        next: (res) => {
          expect(res).toEqual(mockResponse);
          expect(localStorage.setItem).toHaveBeenCalledWith('token', validToken);
          done();
        }
      });
    });

    it('should throw error immediately if role is invalid', (done) => {
      const invalidUser = { ...mockUserReg, role: 'invitado' as any };
      service.register(invalidUser).subscribe({
        error: (err) => {
          expect(err.message).toBe('Rol no válido');
          expect(apiServiceSpy.postOb).not.toHaveBeenCalled();
          done();
        }
      });
    });

    it('should handle API error', (done) => {
      const error = new Error('API Error');
      apiServiceSpy.postOb.and.returnValue(throwError(() => error));
      service.register(mockUserReg).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // ==========================================
  // 2. LOGIN TESTS
  // ==========================================
  describe('#login', () => {
    const credentials = { email: 't@t.com', password: '123' };

    it('should login successfully', (done) => {
      const mockResponse = { token: validToken, user: { active: true } };
      apiServiceSpy.postOb.and.returnValue(of(mockResponse));

      service.login(credentials.email, credentials.password).subscribe({
        next: () => {
          expect(localStorage.setItem).toHaveBeenCalledWith('token', validToken);
          done();
        }
      });
    });
    
    it('should login successfully even if response.user is missing', (done) => {
      const mockResponse = { token: validToken }; // Sin propiedad 'user'
      apiServiceSpy.postOb.and.returnValue(of(mockResponse));

      service.login(credentials.email, credentials.password).subscribe({
        next: () => {
          expect(localStorage.setItem).toHaveBeenCalledWith('token', validToken);
          done();
        }
      });
    });

    it('should throw specific error if user is inactive', (done) => {
      const mockResponse = { token: 'x', user: { active: false } };
      apiServiceSpy.postOb.and.returnValue(of(mockResponse));

      service.login(credentials.email, credentials.password).subscribe({
        error: (err) => {
          expect(err.message).toContain('Tu cuenta está desactivada');
          done();
        }
      });
    });

    it('should catch USER_INACTIVE error manually thrown', (done) => {
      const error = new Error('USER_INACTIVE');
      apiServiceSpy.postOb.and.returnValue(throwError(() => error));

      service.login(credentials.email, credentials.password).subscribe({
        error: (err) => {
          expect(err.message).toBe('Tu cuenta está desactivada. Contacta al administrador.');
          done();
        }
      });
    });

    it('should handle generic login errors', (done) => {
      const error = { message: 'Bad credentials' };
      apiServiceSpy.postOb.and.returnValue(throwError(() => error));
      service.login(credentials.email, credentials.password).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        }
      });
    });

    it('should handle response without token (handleAuthResponse else branch)', (done) => {
      const mockResponse = { message: 'Success but no token' };
      apiServiceSpy.postOb.and.returnValue(of(mockResponse));

      service.login(credentials.email, credentials.password).subscribe({
        next: () => {
          expect(localStorage.setItem).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });

  // ==========================================
  // 3. PASSWORD METHODS
  // ==========================================
  describe('Password Methods', () => {
    it('#forgotPassword success', (done) => {
      apiServiceSpy.postOb.and.returnValue(of({}));
      service.forgotPassword('e@e.com').subscribe({
        next: () => done()
      });
    });

    it('#forgotPassword handles 404 (Custom Message)', (done) => {
      const err404 = { status: 404, error: {} };
      apiServiceSpy.postOb.and.returnValue(throwError(() => err404));
      service.forgotPassword('e@e.com').subscribe({
        error: (e) => {
          expect(e.message).toBe('No se encontró el usuario');
          done();
        }
      });
    });
    
    it('#forgotPassword handles backend message', (done) => {
      const errMsg = { error: { message: 'Msg Backend' } };
      apiServiceSpy.postOb.and.returnValue(throwError(() => errMsg));
      service.forgotPassword('e@e.com').subscribe({
        error: (e) => {
          expect(e.message).toBe('Msg Backend');
          done();
        }
      });
    });

    it('#resetPassword handles 404', (done) => {
      const err404 = { status: 404, error: {} };
      apiServiceSpy.postOb.and.returnValue(throwError(() => err404));
      service.resetPassword('tok', 'new').subscribe({
        error: (e) => {
          expect(e.message).toBe('Usuario no encontrado');
          done();
        }
      });
    });

    it('#resetPassword handles 400', (done) => {
      const err400 = { status: 400, error: {} };
      apiServiceSpy.postOb.and.returnValue(throwError(() => err400));
      service.resetPassword('tok', 'new').subscribe({
        error: (e) => {
          expect(e.message).toBe('Token inválido o expirado');
          done();
        }
      });
    });

    it('#resetPassword handles generic error', (done) => {
      const err500 = { status: 500, error: {} };
      apiServiceSpy.postOb.and.returnValue(throwError(() => err500));
      service.resetPassword('tok', 'new').subscribe({
        error: (e) => {
          expect(e.message).toBe('Error al procesar la actualización');
          done();
        }
      });
    });
  });

  // ==========================================
  // 4. TOKEN UTILS [REFACTORIZADO]
  // ==========================================
  describe('Token Utils', () => {
    // [NUEVO] Cubre la función 'getToken' (image_2a4305)
    it('#getToken should get token from localStorage', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue('my-token');
      expect(service.getToken()).toBe('my-token');
      expect(localStorage.getItem).toHaveBeenCalledWith('token');
    });

    it('#decodeToken should use the provided token argument', () => {
      const decoded = service.decodeToken(validToken);
      expect(decoded).toEqual(jasmine.objectContaining({ role: 'admin' }));
    });

    it('#decodeToken should use localStorage token if no argument', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(validToken);
      const decoded = service.decodeToken(); // Sin argumento
      expect(decoded).toEqual(jasmine.objectContaining({ role: 'admin' }));
    });

    it('#decodeToken should return null if no token anywhere', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);
      expect(service.decodeToken()).toBeNull();
    });

    // [NUEVO] Cubre el catch block de 'decodeToken' (image_2a4309)
    it('#decodeToken should return null on decode error', () => {
      const badToken = 'invalid-base64-string';
      expect(service.decodeToken(badToken)).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error decodificando token:',
        jasmine.any(Error)
      );
    });

    // --- isLoggedIn ---
    it('#isLoggedIn returns true for valid token', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(validToken);
      expect(service.isLoggedIn()).toBeTrue();
    });

    it('#isLoggedIn returns false for expired token', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(expiredToken);
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('#isLoggedIn returns false if no token', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);
      expect(service.isLoggedIn()).toBeFalse();
    });
    
    it('#isLoggedIn handles decode errors gracefully', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue('invalid-base64');
      expect(service.isLoggedIn()).toBeFalse();
    });

    // --- isTokenExpired [NUEVO] ---
    // [NUEVO] Cubre el 'try' block de 'isTokenExpired' (image_2a4302)
    it('#isTokenExpired returns true for expired token', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(expiredToken);
      expect(service.isTokenExpired()).toBeTrue();
    });
    
    // [NUEVO] Cubre el 'try' block de 'isTokenExpired' (image_2a4302)
    it('#isTokenExpired returns false for valid token', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(validToken);
      expect(service.isTokenExpired()).toBeFalse();
    });
    
    // [NUEVO] Cubre el 'if' path de 'isTokenExpired' (image_2a42e6)
    it('#isTokenExpired returns true if no token', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);
      expect(service.isTokenExpired()).toBeTrue();
    });

    // [NUEVO] Cubre el 'catch' block de 'isTokenExpired'
    it('#isTokenExpired returns true on decode error', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue('invalid-base64');
      expect(service.isTokenExpired()).toBeTrue();
      expect(console.error).toHaveBeenCalledWith(
        'Error decodificando token:',
        jasmine.any(Error)
      );
    });
  });

  // ==========================================
  // 5. ROLE & USER HELPERS [REFACTORIZADO]
  // ==========================================
  describe('Role Helpers', () => {
    it('#hasAnyRole checks array correctly', () => {
      spyOn(service, 'decodeToken').and.returnValue({ role: 'admin' } as any);
      expect(service.hasAnyRole(['admin', 'lider'])).toBeTrue();
      expect(service.hasAnyRole(['user'])).toBeFalse();
    });

    it('#hasAnyRole returns false if decode fails', () => {
      spyOn(service, 'decodeToken').and.returnValue(null);
      expect(service.hasAnyRole(['admin'])).toBeFalse();
    });

    it('#hasRole checks exact match', () => {
      spyOn(service, 'getUserRole').and.returnValue('admin');
      expect(service.hasRole('admin')).toBeTrue();
      expect(service.hasRole('other')).toBeFalse();
    });

    // [NUEVO] Cubre el success path de 'getUserRole' (image_2a4321)
    it('#getUserRole returns role from token', () => {
      spyOn(service, 'decodeToken').and.returnValue({ role: 'admin' } as any);
      expect(service.getUserRole()).toBe('admin');
    });

    it('#getUserRole returns null if token invalid', () => {
      spyOn(service, 'decodeToken').and.returnValue(null);
      expect(service.getUserRole()).toBeNull();
    });

    it('#getUserId returns null if token invalid', () => {
      spyOn(service, 'decodeToken').and.returnValue(null);
      expect(service.getUserId()).toBeNull();
    });

    it('#getUserId returns id', () => {
      spyOn(service, 'decodeToken').and.returnValue({ id: 'uid-123' } as any);
      expect(service.getUserId()).toBe('uid-123');
    });
    
    it('#getCurrentUserData returns null if no token', () => {
        spyOn(service, 'decodeToken').and.returnValue(null);
        expect(service.getCurrentUserData()).toBeNull();
    });
    
    it('#getCurrentUserData returns mapped object', () => {
        const payload = { id: '1', email: 'a', role: 'b' };
        spyOn(service, 'decodeToken').and.returnValue(payload as any);
        expect(service.getCurrentUserData()).toEqual(payload);
    });
  });

  // ==========================================
  // 6. REFRESH TOKEN
  // ==========================================
  describe('#shouldRefreshToken', () => {
    it('should return true if close to expiration', () => {
      const expSoon = Math.floor(Date.now() / 1000) + 60; 
      const token = createMockToken({ exp: expSoon });
      (localStorage.getItem as jasmine.Spy).and.returnValue(token);
      expect(service.shouldRefreshToken()).toBeTrue();
    });

    it('should return false if far from expiration', () => {
      const expFar = Math.floor(Date.now() / 1000) + 3600;
      const token = createMockToken({ exp: expFar });
      (localStorage.getItem as jasmine.Spy).and.returnValue(token);
      expect(service.shouldRefreshToken()).toBeFalse();
    });

    it('should return false if no token exists', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);
      expect(service.shouldRefreshToken()).toBeFalse();
    });

    it('should return false on error', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue('bad');
      expect(service.shouldRefreshToken()).toBeFalse();
    });
  });

  describe('#refreshToken', () => {
    it('success updates token', (done) => {
      const newToken = createMockToken({ iat: Date.now() });
      apiServiceSpy.postOb.and.returnValue(of({ token: newToken }));
      
      service.refreshToken().subscribe({
        next: () => {
          expect(localStorage.setItem).toHaveBeenCalledWith('token', newToken);
          done();
        }
      });
    });

    it('error handles gracefully', (done) => {
      const err = new Error('Fail');
      apiServiceSpy.postOb.and.returnValue(throwError(() => err));
      service.refreshToken().subscribe({
        error: (e) => {
          expect(e).toBe(err);
          done();
        }
      });
    });
  });

  // ==========================================
  // 7. USER PROFILE (UserService Logic)
  // ==========================================
  describe('User Profile Methods', () => {
    it('#getUserProfile throws if no userId', (done) => {
      spyOn(service, 'getUserId').and.returnValue(null);
      service.getUserProfile().subscribe({
        error: (e) => {
          expect(e.message).toContain('No se pudo obtener el ID');
          done();
        }
      });
    });

    it('#getUserProfile calls API', (done) => {
      spyOn(service, 'getUserId').and.returnValue('123');
      apiServiceSpy.getOb.and.returnValue(of({}));
      service.getUserProfile().subscribe({
        next: () => {
          expect(apiServiceSpy.getOb).toHaveBeenCalled();
          done();
        }
      });
    });
    
    it('#getUserProfile handles API error', (done) => {
      spyOn(service, 'getUserId').and.returnValue('123');
      const err = new Error('Profile fetch failed');
      apiServiceSpy.getOb.and.returnValue(throwError(() => err));
      
      service.getUserProfile().subscribe({
        error: (e) => {
          expect(e).toBe(err);
          expect(console.error).toHaveBeenCalled();
          done();
        }
      });
    });

    it('#updateUserProfile throws if no userId', (done) => {
      spyOn(service, 'getUserId').and.returnValue(null);
      service.updateUserProfile({}).subscribe({
        error: (e) => {
          expect(e.message).toContain('No se pudo obtener el ID');
          done();
        }
      });
    });

    it('#updateUserProfile calls API', (done) => {
      spyOn(service, 'getUserId').and.returnValue('123');
      apiServiceSpy.putOb.and.returnValue(of({}));
      service.updateUserProfile({}).subscribe({
        next: () => {
          expect(apiServiceSpy.putOb).toHaveBeenCalled();
          done();
        }
      });
    });
    
    it('#updateUserProfile handles API error', (done) => {
        spyOn(service, 'getUserId').and.returnValue('123');
        const err = new Error('Upd Fail');
        apiServiceSpy.putOb.and.returnValue(throwError(() => err));
        service.updateUserProfile({}).subscribe({
            error: (e) => {
                expect(e).toBe(err);
                done();
            }
        });
    });
  });

  it('#logout removes token', () => {
    service.logout();
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
  });
});