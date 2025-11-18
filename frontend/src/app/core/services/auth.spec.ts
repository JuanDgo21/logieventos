import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth';
import { ApiService } from './api';
import { of, throwError } from 'rxjs';

// Helper para simular JWT válidos y evitar errores de decodificación
// Este código crea un token JWT simulado con una estructura válida (header.payload.signature)
// que contiene los datos que necesitamos para las pruebas sin depender de un servidor real
const createMockToken = (payload: any): string => {
  // Codificamos el header en base64 (normalmente contendría el algoritmo y tipo)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  // Codificamos el cuerpo (payload) en base64 con los datos que queremos simular
  const body = btoa(JSON.stringify(payload));
  // Creamos una firma simulada (en un JWT real esto sería una firma criptográfica)
  const signature = 'mockSignature';
  // Unimos las tres partes con puntos como en un JWT real
  return `${header}.${body}.${signature}`;
};

// Suite de pruebas para el AuthService
describe('AuthService', () => {
  let service: AuthService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  // Tokens de ayuda para las pruebas:
  // - expFuture: fecha de expiración futura (1 hora en el futuro)
  // - expPast: fecha de expiración pasada (1 hora en el pasado)
  // - validToken: token válido con rol admin
  // - expiredToken: token expirado con rol user
  const expFuture = Math.floor(Date.now() / 1000) + 3600;
  const expPast = Math.floor(Date.now() / 1000) - 3600;
  const validToken = createMockToken({ exp: expFuture, id: '1', email: 'a', role: 'admin' });
  const expiredToken = createMockToken({ exp: expPast, id: '2', email: 'b', role: 'user' });

  // Configuración antes de cada prueba
  beforeEach(() => {
    // Espiamos console.log y console.error para verificar que se llamen correctamente
    // sin mostrar mensajes en la consola real durante las pruebas
    spyOn(console, 'log');
    spyOn(console, 'error');
    
    // Creamos un spy del ApiService con los métodos que necesitamos simular
    const spy = jasmine.createSpyObj('ApiService', ['postOb', 'getOb', 'putOb']);

    // Configuramos el módulo de testing de Angular
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: spy } // Usamos el spy en lugar del servicio real
      ]
    });

    // Obtenemos la instancia del servicio y el spy del ApiService
    service = TestBed.inject(AuthService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    // Limpiamos localStorage antes de cada prueba
    localStorage.clear();
    
    // Espiamos los métodos de localStorage pero permitimos que funcionen normalmente
    // (callThrough) para que las operaciones de almacenamiento sigan funcionando
    spyOn(localStorage, 'setItem').and.callThrough();
    spyOn(localStorage, 'getItem').and.callThrough(); // [CORRECCIÓN] Lo espiamos, pero lo sobre-escribiremos
    spyOn(localStorage, 'removeItem').and.callThrough();
  });

  // Prueba básica: verificar que el servicio se crea correctamente
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Prueba que verifica que el constructor muestra un mensaje en consola
  it('should log constructor message on creation', () => {
    expect(console.log).toHaveBeenCalledWith('AuthService constructor llamado');
  });

  // ==========================================
  // 1. PRUEBAS DE REGISTRO (REGISTER)
  // ==========================================
  describe('#register', () => {
    // Datos de usuario mock para las pruebas de registro
    const mockUserReg = {
      document: 123456,
      fullname: 'Test User',
      username: 'testuser',
      email: 'test@mail.com',
      role: 'admin' as const,
      active: true
    };

    // Prueba: registro exitoso
    it('should register successfully', (done) => {
      // Configuramos el ApiService para que devuelva una respuesta exitosa con token
      const mockResponse = { token: validToken };
      apiServiceSpy.postOb.and.returnValue(of(mockResponse));

      // Llamamos al método register y verificamos el comportamiento
      service.register(mockUserReg).subscribe({
        next: (res) => {
          // Verificamos que la respuesta sea la esperada
          expect(res).toEqual(mockResponse);
          // Verificamos que el token se guardó en localStorage
          expect(localStorage.setItem).toHaveBeenCalledWith('token', validToken);
          done(); // Indicamos que la prueba async finalizó
        }
      });
    });

    // Prueba: error cuando el rol es inválido
    it('should throw error immediately if role is invalid', (done) => {
      // Creamos un usuario con rol inválido
      const invalidUser = { ...mockUserReg, role: 'invitado' as any };
      
      service.register(invalidUser).subscribe({
        error: (err) => {
          // Verificamos que se lance el error esperado
          expect(err.message).toBe('Rol no válido');
          // Verificamos que NO se llamó al API (porque falló la validación inicial)
          expect(apiServiceSpy.postOb).not.toHaveBeenCalled();
          done();
        }
      });
    });

    // Prueba: manejo de errores del API
    it('should handle API error', (done) => {
      const error = new Error('API Error');
      // Configuramos el ApiService para que devuelva un error
      apiServiceSpy.postOb.and.returnValue(throwError(() => error));
      
      service.register(mockUserReg).subscribe({
        error: (err) => {
          // Verificamos que recibimos el error del API
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // ==========================================
  // 2. PRUEBAS DE INICIO DE SESIÓN (LOGIN)
  // ==========================================
  describe('#login', () => {
    // Credenciales mock para las pruebas de login
    const credentials = { email: 't@t.com', password: '123' };

    // Prueba: login exitoso
    it('should login successfully', (done) => {
      const mockResponse = { token: validToken, user: { active: true } };
      apiServiceSpy.postOb.and.returnValue(of(mockResponse));

      service.login(credentials.email, credentials.password).subscribe({
        next: () => {
          // Verificamos que el token se guardó en localStorage
          expect(localStorage.setItem).toHaveBeenCalledWith('token', validToken);
          done();
        }
      });
    });
    
    // Prueba: login exitoso incluso cuando la respuesta no incluye datos de usuario
    it('should login successfully even if response.user is missing', (done) => {
      const mockResponse = { token: validToken }; // Sin propiedad 'user'
      apiServiceSpy.postOb.and.returnValue(of(mockResponse));

      service.login(credentials.email, credentials.password).subscribe({
        next: () => {
          // Verificamos que el token se guardó correctamente
          expect(localStorage.setItem).toHaveBeenCalledWith('token', validToken);
          done();
        }
      });
    });

    // Prueba: error cuando el usuario está inactivo
    it('should throw specific error if user is inactive', (done) => {
      const mockResponse = { token: 'x', user: { active: false } };
      apiServiceSpy.postOb.and.returnValue(of(mockResponse));

      service.login(credentials.email, credentials.password).subscribe({
        error: (err) => {
          // Verificamos el mensaje de error específico para usuario inactivo
          expect(err.message).toContain('Tu cuenta está desactivada');
          done();
        }
      });
    });

    // Prueba: manejo de error USER_INACTIVE del API
    it('should catch USER_INACTIVE error manually thrown', (done) => {
      const error = new Error('USER_INACTIVE');
      apiServiceSpy.postOb.and.returnValue(throwError(() => error));

      service.login(credentials.email, credentials.password).subscribe({
        error: (err) => {
          // Verificamos que se transforma el error del API a un mensaje amigable
          expect(err.message).toBe('Tu cuenta está desactivada. Contacta al administrador.');
          done();
        }
      });
    });

    // Prueba: manejo de errores genéricos de login
    it('should handle generic login errors', (done) => {
      const error = { message: 'Bad credentials' };
      apiServiceSpy.postOb.and.returnValue(throwError(() => error));
      
      service.login(credentials.email, credentials.password).subscribe({
        error: (err) => {
          // Verificamos que se propaga el error original
          expect(err).toEqual(error);
          done();
        }
      });
    });

    // Prueba: caso donde la respuesta no tiene token (rama else de handleAuthResponse)
    it('should handle response without token (handleAuthResponse else branch)', (done) => {
      const mockResponse = { message: 'Success but no token' };
      apiServiceSpy.postOb.and.returnValue(of(mockResponse));

      service.login(credentials.email, credentials.password).subscribe({
        next: () => {
          // Verificamos que NO se guardó ningún token en localStorage
          expect(localStorage.setItem).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });

  // ==========================================
  // 3. MÉTODOS DE CONTRASEÑA
  // ==========================================
  describe('Password Methods', () => {
    // Prueba: recuperación de contraseña exitosa
    it('#forgotPassword success', (done) => {
      apiServiceSpy.postOb.and.returnValue(of({}));
      service.forgotPassword('e@e.com').subscribe({
        next: () => done()
      });
    });

    // Prueba: manejo de error 404 (usuario no encontrado)
    it('#forgotPassword handles 404 (Custom Message)', (done) => {
      const err404 = { status: 404, error: {} };
      apiServiceSpy.postOb.and.returnValue(throwError(() => err404));
      
      service.forgotPassword('e@e.com').subscribe({
        error: (e) => {
          // Verificamos el mensaje personalizado para usuario no encontrado
          expect(e.message).toBe('No se encontró el usuario');
          done();
        }
      });
    });
    
    // Prueba: manejo de mensajes de error del backend
    it('#forgotPassword handles backend message', (done) => {
      const errMsg = { error: { message: 'Msg Backend' } };
      apiServiceSpy.postOb.and.returnValue(throwError(() => errMsg));
      
      service.forgotPassword('e@e.com').subscribe({
        error: (e) => {
          // Verificamos que se usa el mensaje del backend
          expect(e.message).toBe('Msg Backend');
          done();
        }
      });
    });

    // Prueba: reset de contraseña con error 404
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

    // Prueba: reset de contraseña con error 400 (token inválido)
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

    // Prueba: reset de contraseña con error genérico
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
  // 4. UTILIDADES DE TOKEN [REFACTORIZADO]
  // ==========================================
  describe('Token Utils', () => {
    // Prueba: obtener token desde localStorage
    it('#getToken should get token from localStorage', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue('my-token');
      expect(service.getToken()).toBe('my-token');
      expect(localStorage.getItem).toHaveBeenCalledWith('token');
    });

    // Prueba: decodificar token proporcionado como argumento
    it('#decodeToken should use the provided token argument', () => {
      const decoded = service.decodeToken(validToken);
      expect(decoded).toEqual(jasmine.objectContaining({ role: 'admin' }));
    });

    // Prueba: decodificar token desde localStorage cuando no hay argumento
    it('#decodeToken should use localStorage token if no argument', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(validToken);
      const decoded = service.decodeToken(); // Sin argumento
      expect(decoded).toEqual(jasmine.objectContaining({ role: 'admin' }));
    });

    // Prueba: decodificar cuando no hay token disponible
    it('#decodeToken should return null if no token anywhere', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);
      expect(service.decodeToken()).toBeNull();
    });

    // Prueba: manejo de errores al decodificar token inválido
    it('#decodeToken should return null on decode error', () => {
      const badToken = 'invalid-base64-string';
      expect(service.decodeToken(badToken)).toBeNull();
      // Verificamos que se registró el error en consola
      expect(console.error).toHaveBeenCalledWith(
        'Error decodificando token:',
        jasmine.any(Error)
      );
    });

    // --- Pruebas de isLoggedIn ---
    
    // Prueba: usuario autenticado con token válido
    it('#isLoggedIn returns true for valid token', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(validToken);
      expect(service.isLoggedIn()).toBeTrue();
    });

    // Prueba: usuario no autenticado con token expirado
    it('#isLoggedIn returns false for expired token', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(expiredToken);
      expect(service.isLoggedIn()).toBeFalse();
    });

    // Prueba: usuario no autenticado cuando no hay token
    it('#isLoggedIn returns false if no token', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);
      expect(service.isLoggedIn()).toBeFalse();
    });
    
    // Prueba: manejo elegante de errores de decodificación
    it('#isLoggedIn handles decode errors gracefully', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue('invalid-base64');
      expect(service.isLoggedIn()).toBeFalse();
    });

    // --- Pruebas de isTokenExpired [NUEVO] ---
    
    // Prueba: token expirado devuelve true
    it('#isTokenExpired returns true for expired token', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(expiredToken);
      expect(service.isTokenExpired()).toBeTrue();
    });
    
    // Prueba: token válido devuelve false
    it('#isTokenExpired returns false for valid token', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(validToken);
      expect(service.isTokenExpired()).toBeFalse();
    });
    
    // Prueba: sin token se considera expirado
    it('#isTokenExpired returns true if no token', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);
      expect(service.isTokenExpired()).toBeTrue();
    });

    // Prueba: error de decodificación se considera expirado
    it('#isTokenExpired returns true on decode error', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue('invalid-base64');
      expect(service.isTokenExpired()).toBeTrue();
      // Verificamos que se registró el error
      expect(console.error).toHaveBeenCalledWith(
        'Error decodificando token:',
        jasmine.any(Error)
      );
    });
  });

  // ==========================================
  // 5. HELPERS DE ROLES Y USUARIO [REFACTORIZADO]
  // ==========================================
  describe('Role Helpers', () => {
    // Prueba: verificar múltiples roles
    it('#hasAnyRole checks array correctly', () => {
      // Simulamos que el token decodificado tiene rol 'admin'
      spyOn(service, 'decodeToken').and.returnValue({ role: 'admin' } as any);
      
      // Verificamos que tiene al menos uno de los roles
      expect(service.hasAnyRole(['admin', 'lider'])).toBeTrue();
      // Verificamos que no tiene ninguno de los roles
      expect(service.hasAnyRole(['user'])).toBeFalse();
    });

    // Prueba: sin token decodificable no tiene roles
    it('#hasAnyRole returns false if decode fails', () => {
      spyOn(service, 'decodeToken').and.returnValue(null);
      expect(service.hasAnyRole(['admin'])).toBeFalse();
    });

    // Prueba: verificar rol específico
    it('#hasRole checks exact match', () => {
      spyOn(service, 'getUserRole').and.returnValue('admin');
      expect(service.hasRole('admin')).toBeTrue();
      expect(service.hasRole('other')).toBeFalse();
    });

    // Prueba: obtener rol del usuario desde el token
    it('#getUserRole returns role from token', () => {
      spyOn(service, 'decodeToken').and.returnValue({ role: 'admin' } as any);
      expect(service.getUserRole()).toBe('admin');
    });

    // Prueba: no se puede obtener rol si el token es inválido
    it('#getUserRole returns null if token invalid', () => {
      spyOn(service, 'decodeToken').and.returnValue(null);
      expect(service.getUserRole()).toBeNull();
    });

    // Prueba: no se puede obtener ID si el token es inválido
    it('#getUserId returns null if token invalid', () => {
      spyOn(service, 'decodeToken').and.returnValue(null);
      expect(service.getUserId()).toBeNull();
    });

    // Prueba: obtener ID del usuario desde el token
    it('#getUserId returns id', () => {
      spyOn(service, 'decodeToken').and.returnValue({ id: 'uid-123' } as any);
      expect(service.getUserId()).toBe('uid-123');
    });
    
    // Prueba: no se pueden obtener datos si no hay token
    it('#getCurrentUserData returns null if no token', () => {
        spyOn(service, 'decodeToken').and.returnValue(null);
        expect(service.getCurrentUserData()).toBeNull();
    });
    
    // Prueba: obtener datos completos del usuario desde el token
    it('#getCurrentUserData returns mapped object', () => {
        const payload = { id: '1', email: 'a', role: 'b' };
        spyOn(service, 'decodeToken').and.returnValue(payload as any);
        expect(service.getCurrentUserData()).toEqual(payload);
    });
  });

  // ==========================================
  // 6. REFRESCO DE TOKEN
  // ==========================================
  describe('#shouldRefreshToken', () => {
    // Prueba: debe refrescar cuando el token está cerca de expirar
    it('should return true if close to expiration', () => {
      // Token que expira en 60 segundos (dentro del margen de refresco)
      const expSoon = Math.floor(Date.now() / 1000) + 60; 
      const token = createMockToken({ exp: expSoon });
      (localStorage.getItem as jasmine.Spy).and.returnValue(token);
      expect(service.shouldRefreshToken()).toBeTrue();
    });

    // Prueba: no debe refrescar cuando el token es válido por mucho tiempo
    it('should return false if far from expiration', () => {
      // Token que expira en 1 hora (fuera del margen de refresco)
      const expFar = Math.floor(Date.now() / 1000) + 3600;
      const token = createMockToken({ exp: expFar });
      (localStorage.getItem as jasmine.Spy).and.returnValue(token);
      expect(service.shouldRefreshToken()).toBeFalse();
    });

    // Prueba: no debe refrescar cuando no hay token
    it('should return false if no token exists', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);
      expect(service.shouldRefreshToken()).toBeFalse();
    });

    // Prueba: no debe refrescar cuando hay error al decodificar
    it('should return false on error', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue('bad');
      expect(service.shouldRefreshToken()).toBeFalse();
    });
  });

  describe('#refreshToken', () => {
    // Prueba: refresco exitoso del token
    it('success updates token', (done) => {
      const newToken = createMockToken({ iat: Date.now() });
      apiServiceSpy.postOb.and.returnValue(of({ token: newToken }));
      
      service.refreshToken().subscribe({
        next: () => {
          // Verificamos que se guardó el nuevo token
          expect(localStorage.setItem).toHaveBeenCalledWith('token', newToken);
          done();
        }
      });
    });

    // Prueba: manejo de errores durante el refresco
    it('error handles gracefully', (done) => {
      const err = new Error('Fail');
      apiServiceSpy.postOb.and.returnValue(throwError(() => err));
      
      service.refreshToken().subscribe({
        error: (e) => {
          // Verificamos que se propaga el error
          expect(e).toBe(err);
          done();
        }
      });
    });
  });

  // ==========================================
  // 7. PERFIL DE USUARIO (Lógica de UserService)
  // ==========================================
  describe('User Profile Methods', () => {
    // Prueba: error al obtener perfil sin ID de usuario
    it('#getUserProfile throws if no userId', (done) => {
      spyOn(service, 'getUserId').and.returnValue(null);
      
      service.getUserProfile().subscribe({
        error: (e) => {
          expect(e.message).toContain('No se pudo obtener el ID');
          done();
        }
      });
    });

    // Prueba: obtener perfil exitosamente
    it('#getUserProfile calls API', (done) => {
      spyOn(service, 'getUserId').and.returnValue('123');
      apiServiceSpy.getOb.and.returnValue(of({}));
      
      service.getUserProfile().subscribe({
        next: () => {
          // Verificamos que se llamó al API
          expect(apiServiceSpy.getOb).toHaveBeenCalled();
          done();
        }
      });
    });
    
    // Prueba: manejo de errores al obtener perfil
    it('#getUserProfile handles API error', (done) => {
      spyOn(service, 'getUserId').and.returnValue('123');
      const err = new Error('Profile fetch failed');
      apiServiceSpy.getOb.and.returnValue(throwError(() => err));
      
      service.getUserProfile().subscribe({
        error: (e) => {
          // Verificamos que se propaga el error y se registra en consola
          expect(e).toBe(err);
          expect(console.error).toHaveBeenCalled();
          done();
        }
      });
    });

    // Prueba: error al actualizar perfil sin ID de usuario
    it('#updateUserProfile throws if no userId', (done) => {
      spyOn(service, 'getUserId').and.returnValue(null);
      
      service.updateUserProfile({}).subscribe({
        error: (e) => {
          expect(e.message).toContain('No se pudo obtener el ID');
          done();
        }
      });
    });

    // Prueba: actualizar perfil exitosamente
    it('#updateUserProfile calls API', (done) => {
      spyOn(service, 'getUserId').and.returnValue('123');
      apiServiceSpy.putOb.and.returnValue(of({}));
      
      service.updateUserProfile({}).subscribe({
        next: () => {
          // Verificamos que se llamó al API
          expect(apiServiceSpy.putOb).toHaveBeenCalled();
          done();
        }
      });
    });
    
    // Prueba: manejo de errores al actualizar perfil
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

  // Prueba: cierre de sesión elimina el token
  it('#logout removes token', () => {
    service.logout();
    // Verificamos que se eliminó el token del almacenamiento
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
  });
});