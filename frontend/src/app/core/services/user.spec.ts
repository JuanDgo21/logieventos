import { TestBed } from '@angular/core/testing';
import { UserService } from './user';
import { ApiService } from './api';
import { of, throwError } from 'rxjs';
import { User } from '../../shared/interfaces/user';
import { apiRouters } from '../constants/apiRouters';

// Helper de tu auth.spec.ts para crear tokens falsos que jwt-decode pueda leer
const createMockToken = (payload: any): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = 'mockSignature';
  return `${header}.${body}.${signature}`;
};

// --- Datos de Prueba ---
const mockUser: User = {
  _id: 'user-123',
  document: 12345,
  fullname: 'Test User',
  username: 'testuser',
  email: 'test@mail.com',
  role: 'admin',
  active: true,
};

const mockAdminPayload = { id: 'admin-id', role: 'admin', exp: Date.now() / 1000 + 3600 };
const mockAdminToken = createMockToken(mockAdminPayload);

// ===================================================================
// 1. PRUEBAS DEL CONSTRUCTOR (loadInitialUser)
// ===================================================================

describe('UserService (Constructor - Sin Token)', () => {
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['getOb']);
    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: ApiService, useValue: spy }
      ]
    });
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    
    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(console, 'log');
    spyOn(console, 'error');
  });

  it('should NOT call API if no token is present on init', () => {
    // El servicio se inyecta y el constructor se ejecuta
    const service = TestBed.inject(UserService);
    expect(service).toBeTruthy();
    // Verificamos que, como no había token, no se hizo ninguna llamada a la API
    expect(apiServiceSpy.getOb).not.toHaveBeenCalled();
  });
});

describe('UserService (Constructor - Con Token - API OK)', () => {
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let service: UserService;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['getOb']);
    spy.getOb.and.returnValue(of({ success: true, data: mockUser }));

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: ApiService, useValue: spy }
      ]
    });
    
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    spyOn(localStorage, 'getItem').and.returnValue(mockAdminToken);
    spyOn(console, 'log');
    spyOn(console, 'error');
    
    // El servicio se inyecta y el constructor se ejecuta
    service = TestBed.inject(UserService);
  });

  it('should call API and set user if token is present', (done) => {
    expect(apiServiceSpy.getOb).toHaveBeenCalledWith(apiRouters.USERS.BY_ID(mockAdminPayload.id));
    
    // Verificamos que el BehaviorSubject fue actualizado
    service.currentUser$.subscribe(user => {
      if (user) { // Ignora el 'null' inicial
        expect(user).toEqual(mockUser);
        done();
      }
    });
  });
});

describe('UserService (Constructor - Con Token - API Error)', () => {
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let service: UserService;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['getOb']);
    spy.getOb.and.returnValue(throwError(() => new Error('API Fail')));

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: ApiService, useValue: spy }
      ]
    });
    
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    spyOn(localStorage, 'getItem').and.returnValue(mockAdminToken);
    spyOn(console, 'log');
    spyOn(console, 'error');
    
    // El servicio se inyecta y el constructor se ejecuta
    service = TestBed.inject(UserService);
  });

  it('should call API and clear user data if API fails', (done) => {
    expect(apiServiceSpy.getOb).toHaveBeenCalled();
    
    // El subject debe permanecer 'null' (o ser seteado a 'null' por clearUserData)
    service.currentUser$.subscribe(user => {
      expect(user).toBeNull();
      done();
    });
  });
});


// ===================================================================
// 2. PRUEBAS DE MÉTODOS (Post-Constructor)
// ===================================================================

describe('UserService (Methods)', () => {
  let service: UserService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let localStorageGetItemSpy: jasmine.Spy;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['getOb', 'postOb', 'putOb', 'deleteOb']);

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: ApiService, useValue: spy }
      ]
    });

    localStorage.clear();
    localStorageGetItemSpy = spyOn(localStorage, 'getItem').and.returnValue(null); // Default a no-token
    
    spyOn(console, 'log');
    spyOn(console, 'error');
    spyOn(console, 'warn'); 

    // Inyectamos después de que la configuración del constructor no es relevante
    service = TestBed.inject(UserService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ==========================================
  // 3. OPERACIONES CRUD
  // ==========================================
  describe('CRUD Operations', () => {
    it('#createUser success', (done) => {
      apiServiceSpy.postOb.and.returnValue(of(mockUser));
      const newUser = { ...mockUser };
      delete newUser._id;

      service.createUser(newUser).subscribe(res => {
        expect(res).toEqual(mockUser);
        expect(apiServiceSpy.postOb).toHaveBeenCalledWith(apiRouters.USERS.BASE, newUser);
        done();
      });
    });

    it('#createUser handles API error', (done) => {
      apiServiceSpy.postOb.and.returnValue(throwError(() => new Error('API Fail')));
      service.createUser({} as any).subscribe({
        error: (err) => {
          expect(err.message).toBe('No se pudo crear el usuario');
          done();
        }
      });
    });

    it('#getAllUsers success', (done) => {
      apiServiceSpy.getOb.and.returnValue(of([mockUser, mockUser]));
      service.getAllUsers().subscribe(res => {
        expect(res.length).toBe(2);
        expect(apiServiceSpy.getOb).toHaveBeenCalledWith(apiRouters.USERS.BASE);
        done();
      });
    });

    it('#getAllUsers handles API error', (done) => {
      apiServiceSpy.getOb.and.returnValue(throwError(() => new Error('API Fail')));
      service.getAllUsers().subscribe({
        error: (err) => {
          expect(err.message).toBe('No se pudieron obtener los usuarios');
          done();
        }
      });
    });

    it('#getUserById success (wrapped response)', (done) => {
      const wrappedResponse = { success: true, data: mockUser };
      apiServiceSpy.getOb.and.returnValue(of(wrappedResponse));

      service.getUserById('user-123').subscribe(res => {
        expect(res).toEqual(mockUser);
        expect(apiServiceSpy.getOb).toHaveBeenCalledWith(apiRouters.USERS.BY_ID('user-123'));
        done();
      });
    });

    it('#getUserById throws on invalid format', (done) => {
      const invalidResponse = { success: false, data: null };
      apiServiceSpy.getOb.and.returnValue(of(invalidResponse));

      service.getUserById('user-123').subscribe({
        error: (err) => {
          expect(err.message).toBe('No se pudo obtener el usuario');
          done();
        }
      });
    });
    
    it('#getUserById handles API error', (done) => {
      apiServiceSpy.getOb.and.returnValue(throwError(() => new Error('API Fail')));
      service.getUserById('user-123').subscribe({
        error: (err) => {
          expect(err.message).toBe('No se pudo obtener el usuario');
          done();
        }
      });
    });
  });

  // ==========================================
  // 4. UPDATE USER (Casos complejos de parseo)
  // ==========================================
  describe('#updateUser', () => {
    it('success with object response', (done) => {
      apiServiceSpy.putOb.and.returnValue(of({ message: 'OK' }));
      service.updateUser('1', {}).subscribe(res => {
        expect(res).toEqual({ message: 'OK' });
        done();
      });
    });

    it('success with string response (needs parsing)', (done) => {
      const stringResponse = JSON.stringify({ message: 'Parsed' });
      apiServiceSpy.putOb.and.returnValue(of(stringResponse));
      service.updateUser('1', {}).subscribe(res => {
        expect(res).toEqual({ message: 'Parsed' });
        done();
      });
    });

    it('success with string response (parsing fails)', (done) => {
      const badString = '{ "message": "Unclosed';
      apiServiceSpy.putOb.and.returnValue(of(badString));
      service.updateUser('1', {}).subscribe(res => {
        expect(res).toEqual(badString);
        expect(console.warn).toHaveBeenCalled(); // Verificamos el 'warn'
        done();
      });
    });

    it('handles API error (string error needs parsing)', (done) => {
      const errorResponse = { error: { text: JSON.stringify({ msg: 'Error Parsed' }) } };
      apiServiceSpy.putOb.and.returnValue(throwError(() => errorResponse));

      service.updateUser('1', {}).subscribe(res => {
        expect(res).toEqual({ msg: 'Error Parsed' });
        done();
      });
    });
    
    it('handles API error (string error, parsing fails)', (done) => {
      const errorResponse = { error: { text: '{ "msg": "Bad' } };
      apiServiceSpy.putOb.and.returnValue(throwError(() => errorResponse));

      service.updateUser('1', {}).subscribe({
        error: (err) => {
          expect(err.message).toBe('Error procesando la respuesta del servidor');
          expect(console.warn).toHaveBeenCalled(); // Verificamos el 'warn'
          done();
        }
      });
    });

    it('handles generic API error (object)', (done) => {
      const errorResponse = new Error('Generic Fail');
      apiServiceSpy.putOb.and.returnValue(throwError(() => errorResponse));

      service.updateUser('1', {}).subscribe({
        error: (err) => {
          expect(err).toBe(errorResponse);
          done();
        }
      });
    });
  });

  // ==========================================
  // 5. DELETE USER
  // ==========================================
  describe('#deleteUser', () => {
    it('success (not deleting self)', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken); // Self is 'admin-id'
      apiServiceSpy.deleteOb.and.returnValue(of(null));
      const clearSpy = spyOn(service, 'clearUserData');
      
      service.deleteUser('other-user-id').subscribe(() => {
        expect(apiServiceSpy.deleteOb).toHaveBeenCalled();
        expect(clearSpy).not.toHaveBeenCalled();
        done();
      });
    });

    it('success (deleting self)', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken); // Self is 'admin-id'
      apiServiceSpy.deleteOb.and.returnValue(of(null));
      const clearSpy = spyOn(service, 'clearUserData').and.callThrough();

      service.deleteUser('admin-id').subscribe(() => {
        expect(apiServiceSpy.deleteOb).toHaveBeenCalled();
        expect(clearSpy).toHaveBeenCalled();
        done();
      });
    });

    it('handles API error', (done) => {
      apiServiceSpy.deleteOb.and.returnValue(throwError(() => new Error('API Fail')));
      service.deleteUser('1').subscribe({
        error: (err) => {
          expect(err.message).toBe('No se pudo eliminar el usuario');
          done();
        }
      });
    });
  });

  // ==========================================
  // 6. OPERACIONES DE PERFIL
  // ==========================================
  describe('Profile Operations', () => {
    
    it('#getProfile throws if not authenticated', (done) => {
      localStorageGetItemSpy.and.returnValue(null);
      service.getProfile().subscribe({
        error: (err) => {
          expect(err.message).toBe('Usuario no autenticado');
          done();
        }
      });
    });
    
    it('#getProfile handles token decode error', (done) => {
      localStorageGetItemSpy.and.returnValue('token-basura');
      service.getProfile().subscribe({
        error: (err) => {
          expect(err.message).toBe('Usuario no autenticado');
          expect(console.error).toHaveBeenCalledWith(
            '[UserService] Error decodificando token:', jasmine.any(Error)
          );
          done();
        }
      });
    });

    it('#getProfile success (raw response)', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken);
      apiServiceSpy.getOb.and.returnValue(of(mockUser));
      service.getProfile().subscribe(res => {
        expect(res).toEqual(mockUser);
        done();
      });
    });

    it('#getProfile success (wrapped response)', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken);
      const wrappedResponse = { success: true, data: mockUser };
      apiServiceSpy.getOb.and.returnValue(of(wrappedResponse));
      service.getProfile().subscribe(res => {
        expect(res).toEqual(mockUser);
        done();
      });
    });
    
    it('#getProfile success (wrapped response, no data)', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken);
      const wrappedResponse = { success: true, message: 'OK' }; // No _id, No data
      apiServiceSpy.getOb.and.returnValue(of(wrappedResponse));
      
      service.getProfile().subscribe(res => {
        // [CORRECCIÓN] Le decimos a TypeScript que 'res' puede ser 'any'
        // para que permita la comparación con 'wrappedResponse'.
        expect(res as any).toEqual(wrappedResponse);
        done();
      });
    });
    
    it('#getProfile handles API error', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken);
      const err = new Error('API Fail');
      apiServiceSpy.getOb.and.returnValue(throwError(() => err));
      service.getProfile().subscribe({
        error: (e) => {
          expect(e).toBe(err);
          expect(console.error).toHaveBeenCalledWith('Error obteniendo perfil:', err);
          done();
        }
      });
    });

    it('#changePassword throws if not authenticated', (done) => {
      localStorageGetItemSpy.and.returnValue(null);
      service.changePassword('1', '2').subscribe({
        error: (err) => {
          expect(err.message).toBe('Usuario no autenticado');
          done();
        }
      });
    });

    it('#changePassword success', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken);
      apiServiceSpy.postOb.and.returnValue(of({ success: true }));
      service.changePassword('1', '2').subscribe(res => {
        expect(res).toEqual({ success: true });
        expect(apiServiceSpy.postOb).toHaveBeenCalled();
        done();
      });
    });

    it('#changePassword handles API error', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken);
      const err = new Error('API Fail');
      apiServiceSpy.postOb.and.returnValue(throwError(() => err));
      service.changePassword('1', '2').subscribe({
        error: (e) => {
          expect(e).toBe(err);
          expect(console.error).toHaveBeenCalledWith('[UserService] Error cambiando contraseña:', err);
          done();
        }
      });
    });
  });

  // ==========================================
  // 7. MÉTODOS DE VERIFICACIÓN
  // ==========================================
  describe('Role Verification', () => {
    
    it('#checkCurrentUserRole returns false if no token', () => {
      localStorageGetItemSpy.and.returnValue(null);
      expect(service.checkCurrentUserRole('admin')).toBeFalse();
    });

    it('#checkCurrentUserRole returns true for correct role', () => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken);
      expect(service.checkCurrentUserRole('admin')).toBeTrue();
    });

    it('#checkCurrentUserRole returns false for incorrect role', () => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken);
      expect(service.checkCurrentUserRole('lider')).toBeFalse();
    });

    it('#checkCurrentUserRole returns false on decode error', () => {
      localStorageGetItemSpy.and.returnValue('token-basura');
      expect(service.checkCurrentUserRole('admin')).toBeFalse();
      expect(console.error).toHaveBeenCalledWith(
        '[UserService] Error decodificando token:', jasmine.any(Error)
      );
    });

    it('#hasRole calls checkCurrentUserRole', () => {
      const spy = spyOn(service, 'checkCurrentUserRole').and.returnValue(true);
      service.hasRole('admin');
      expect(spy).toHaveBeenCalledWith('admin');
    });
  });

  // ==========================================
  // 8. MANEJO DE ESTADO
  // ==========================================
  describe('State Management', () => {
    
    it('#clearUserData emits null', (done) => {
      (service as any).currentUserSubject.next(mockUser);
      service.clearUserData();
      service.currentUser$.subscribe(user => {
        expect(user).toBeNull();
        done();
      });
    });

    it('#refreshUserData does nothing if no user ID', () => {
      localStorageGetItemSpy.and.returnValue(null);
      service.refreshUserData();
      expect(apiServiceSpy.getOb).not.toHaveBeenCalled();
    });
    
    it('#refreshUserData calls API if user ID exists', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken);
      apiServiceSpy.getOb.and.returnValue(of({ success: true, data: mockUser }));
      
      service.refreshUserData();
      
      expect(apiServiceSpy.getOb).toHaveBeenCalled();
      service.currentUser$.subscribe(user => {
        if (user) {
          expect(user).toEqual(mockUser);
          done();
        }
      });
    });

    it('#refreshUserData clears data on API error', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken);
      apiServiceSpy.getOb.and.returnValue(throwError(() => new Error('API Fail')));
      const clearSpy = spyOn(service, 'clearUserData').and.callThrough();

      service.refreshUserData();
      
      service.currentUser$.subscribe(user => {
        expect(user).toBeNull();
        if (clearSpy.calls.any()) {
          expect(clearSpy).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  // ==========================================
  // 9. MÉTODOS NO IMPLEMENTADOS (Cobertura)
  // ==========================================
  describe('Not Implemented Methods', () => {
    it('getUsers should throw', () => {
      expect(() => service.getUsers()).toThrowError('Method not implemented.');
    });
    
    it('updateUserStatus should throw', () => {
      expect(() => service.updateUserStatus('1', true)).toThrowError('Method not implemented.');
    });
  });

});