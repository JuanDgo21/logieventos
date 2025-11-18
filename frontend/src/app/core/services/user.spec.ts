// Importamos las herramientas necesarias para testing en Angular
import { TestBed } from '@angular/core/testing';
// Importamos el servicio que vamos a probar
import { UserService } from './user';
// Importamos el servicio de API que UserService usa internamente
import { ApiService } from './api';
// Importamos operadores de RxJS para crear observables de éxito y error
import { of, throwError } from 'rxjs';
// Importamos la interfaz de Usuario para tener tipos correctos
import { User } from '../../shared/interfaces/user';
// Importamos las rutas de la API para verificar URLs correctas
import { apiRouters } from '../constants/apiRouters';

// Helper de tu auth.spec.ts para crear tokens falsos que jwt-decode pueda leer
// Esto simula tokens JWT reales pero con datos controlados para pruebas
const createMockToken = (payload: any): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })); // Header codificado en base64
  const body = btoa(JSON.stringify(payload)); // Payload (datos) codificado en base64
  const signature = 'mockSignature'; // Firma simulada
  return `${header}.${body}.${signature}`; // Formato JWT estándar: header.payload.signature
};

// ==========================================
// DATOS DE PRUEBA (MOCKS) PARA SIMULAR USUARIOS Y TOKENS
// ==========================================

// Mock de un usuario típico del sistema
const mockUser: User = {
  _id: 'user-123',
  document: 12345,
  fullname: 'Test User',
  username: 'testuser',
  email: 'test@mail.com',
  role: 'admin',
  active: true,
};

// Payload de administrador para el token JWT
const mockAdminPayload = { id: 'admin-id', role: 'admin', exp: Date.now() / 1000 + 3600 }; // Expira en 1 hora
// Token JWT simulado con datos de administrador
const mockAdminToken = createMockToken(mockAdminPayload);

// ===================================================================
// 1. PRUEBAS DEL CONSTRUCTOR (loadInitialUser)
// Estas pruebas verifican el comportamiento del servicio al crearse
// ===================================================================

// Suite de pruebas para cuando NO hay token en el localStorage
describe('UserService (Constructor - Sin Token)', () => {
  let apiServiceSpy: jasmine.SpyObj<ApiService>; // Spy para espiar llamadas al ApiService

  beforeEach(() => {
    // Creamos un spy del ApiService que solo tiene el método getOb
    const spy = jasmine.createSpyObj('ApiService', ['getOb']);
    
    // Configuramos el módulo de testing
    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: ApiService, useValue: spy } // Usamos el spy en lugar del servicio real
      ]
    });
    
    // Obtenemos la instancia del spy del ApiService
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    
    // Simulamos que NO hay token en el localStorage
    spyOn(localStorage, 'getItem').and.returnValue(null);
    // Espiamos console.log y console.error para verificar mensajes sin mostrarlos
    spyOn(console, 'log');
    spyOn(console, 'error');
  });

  // Prueba: El servicio no debe llamar a la API si no hay token al inicializarse
  it('should NOT call API if no token is present on init', () => {
    // El servicio se inyecta y el constructor se ejecuta automáticamente
    const service = TestBed.inject(UserService);
    expect(service).toBeTruthy(); // Verificamos que el servicio se creó
    
    // Verificamos que, como no había token, no se hizo ninguna llamada a la API
    // Esto es importante para rendimiento - evita llamadas innecesarias
    expect(apiServiceSpy.getOb).not.toHaveBeenCalled();
  });
});

// Suite de pruebas para cuando SÍ hay token y la API responde correctamente
describe('UserService (Constructor - Con Token - API OK)', () => {
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let service: UserService;

  beforeEach(() => {
    // Creamos un spy del ApiService que simula una respuesta exitosa
    const spy = jasmine.createSpyObj('ApiService', ['getOb']);
    // Configuramos getOb para que devuelva un usuario mock
    spy.getOb.and.returnValue(of({ success: true, data: mockUser }));

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: ApiService, useValue: spy }
      ]
    });
    
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    // Simulamos que SÍ hay token en el localStorage
    spyOn(localStorage, 'getItem').and.returnValue(mockAdminToken);
    spyOn(console, 'log');
    spyOn(console, 'error');
    
    // El servicio se inyecta y el constructor se ejecuta automáticamente
    // Esto dispara loadInitialUser() que hace la llamada a la API
    service = TestBed.inject(UserService);
  });

  // Prueba: El servicio debe llamar a la API y establecer el usuario si hay token
  it('should call API and set user if token is present', (done) => {
    // Verificamos que se llamó al endpoint correcto con el ID del usuario del token
    expect(apiServiceSpy.getOb).toHaveBeenCalledWith(apiRouters.USERS.BY_ID(mockAdminPayload.id));
    
    // Verificamos que el BehaviorSubject fue actualizado con el usuario
    // Usamos currentUser$ que es un Observable del usuario actual
    service.currentUser$.subscribe(user => {
      if (user) { // Ignora el valor inicial 'null' del BehaviorSubject
        expect(user).toEqual(mockUser); // Debe ser el usuario mock que devolvió la API
        done(); // Indicamos que la prueba asíncrona terminó
      }
    });
  });
});

// Suite de pruebas para cuando SÍ hay token pero la API falla
describe('UserService (Constructor - Con Token - API Error)', () => {
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let service: UserService;

  beforeEach(() => {
    // Creamos un spy del ApiService que simula un error
    const spy = jasmine.createSpyObj('ApiService', ['getOb']);
    // Configuramos getOb para que devuelva un error
    spy.getOb.and.returnValue(throwError(() => new Error('API Fail')));

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: ApiService, useValue: spy }
      ]
    });
    
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    // Simulamos que SÍ hay token en el localStorage
    spyOn(localStorage, 'getItem').and.returnValue(mockAdminToken);
    spyOn(console, 'log');
    spyOn(console, 'error');
    
    // El servicio se inyecta y el constructor se ejecuta automáticamente
    service = TestBed.inject(UserService);
  });

  // Prueba: El servicio debe manejar errores de API limpiando los datos del usuario
  it('should call API and clear user data if API fails', (done) => {
    // Verificamos que se intentó llamar a la API
    expect(apiServiceSpy.getOb).toHaveBeenCalled();
    
    // El BehaviorSubject debe permanecer como 'null' (o ser establecido a 'null' por clearUserData)
    // Esto asegura que el estado de la aplicación sea consistente incluso cuando la API falle
    service.currentUser$.subscribe(user => {
      expect(user).toBeNull(); // No debe haber usuario porque la API falló
      done(); // Indicamos que la prueba asíncrona terminó
    });
  });
});


// ===================================================================
// 2. PRUEBAS DE MÉTODOS (Post-Constructor)
// Estas pruebas verifican los métodos individuales del servicio
// ===================================================================

describe('UserService (Methods)', () => {
  let service: UserService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let localStorageGetItemSpy: jasmine.Spy;

  // Configuración común para todas las pruebas de métodos
  beforeEach(() => {
    // Creamos un spy completo del ApiService con todos los métodos HTTP
    const spy = jasmine.createSpyObj('ApiService', ['getOb', 'postOb', 'putOb', 'deleteOb']);

    // Configuramos el módulo de testing
    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: ApiService, useValue: spy }
      ]
    });

    // Limpiamos localStorage antes de cada prueba
    localStorage.clear();
    // Por defecto, simulamos que NO hay token (se puede cambiar en cada prueba)
    localStorageGetItemSpy = spyOn(localStorage, 'getItem').and.returnValue(null);
    
    // Espiamos los métodos de console para verificar mensajes sin mostrarlos
    spyOn(console, 'log');
    spyOn(console, 'error');
    spyOn(console, 'warn'); // Para warnings específicos

    // Inyectamos el servicio después de configurar los spies
    // En estas pruebas, el comportamiento del constructor no es relevante
    service = TestBed.inject(UserService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  // Prueba básica de creación del servicio
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ==========================================
  // 3. OPERACIONES CRUD (Create, Read, Update, Delete)
  // ==========================================
  describe('CRUD Operations', () => {
    // Prueba: Crear usuario exitosamente
    it('#createUser success', (done) => {
      // Configuramos el ApiService para simular creación exitosa
      apiServiceSpy.postOb.and.returnValue(of(mockUser));
      // Creamos un nuevo usuario sin ID (el ID lo genera el backend)
      const newUser = { ...mockUser };
      delete newUser._id;

      // Llamamos al método y verificamos el resultado
      service.createUser(newUser).subscribe(res => {
        expect(res).toEqual(mockUser); // Debe recibir el usuario creado
        // Verificamos que se llamó al endpoint correcto con los datos correctos
        expect(apiServiceSpy.postOb).toHaveBeenCalledWith(apiRouters.USERS.BASE, newUser);
        done();
      });
    });

    // Prueba: Manejo de errores al crear usuario
    it('#createUser handles API error', (done) => {
      // Configuramos el ApiService para simular un error
      apiServiceSpy.postOb.and.returnValue(throwError(() => new Error('API Fail')));
      service.createUser({} as any).subscribe({
        error: (err) => {
          // Verificamos que se transformó el error en un mensaje amigable
          expect(err.message).toBe('No se pudo crear el usuario');
          done();
        }
      });
    });

    // Prueba: Obtener todos los usuarios exitosamente
    it('#getAllUsers success', (done) => {
      // Simulamos que la API devuelve un array con dos usuarios
      apiServiceSpy.getOb.and.returnValue(of([mockUser, mockUser]));
      service.getAllUsers().subscribe(res => {
        expect(res.length).toBe(2); // Debe recibir 2 usuarios
        // Verificamos que se llamó al endpoint correcto
        expect(apiServiceSpy.getOb).toHaveBeenCalledWith(apiRouters.USERS.BASE);
        done();
      });
    });

    // Prueba: Manejo de errores al obtener usuarios
    it('#getAllUsers handles API error', (done) => {
      apiServiceSpy.getOb.and.returnValue(throwError(() => new Error('API Fail')));
      service.getAllUsers().subscribe({
        error: (err) => {
          expect(err.message).toBe('No se pudieron obtener los usuarios');
          done();
        }
      });
    });

    // Prueba: Obtener usuario por ID exitosamente (respuesta envuelta)
    it('#getUserById success (wrapped response)', (done) => {
      // Simulamos una respuesta con formato {success: true, data: user}
      const wrappedResponse = { success: true, data: mockUser };
      apiServiceSpy.getOb.and.returnValue(of(wrappedResponse));

      service.getUserById('user-123').subscribe(res => {
        // El servicio debe extraer el usuario del campo 'data'
        expect(res).toEqual(mockUser);
        // Verificamos que se llamó al endpoint correcto
        expect(apiServiceSpy.getOb).toHaveBeenCalledWith(apiRouters.USERS.BY_ID('user-123'));
        done();
      });
    });

    // Prueba: Error cuando la respuesta tiene formato inválido
    it('#getUserById throws on invalid format', (done) => {
      // Simulamos una respuesta con formato inválido (success: false)
      const invalidResponse = { success: false, data: null };
      apiServiceSpy.getOb.and.returnValue(of(invalidResponse));

      service.getUserById('user-123').subscribe({
        error: (err) => {
          expect(err.message).toBe('No se pudo obtener el usuario');
          done();
        }
      });
    });
    
    // Prueba: Manejo de errores de API al obtener usuario por ID
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
  // Estas pruebas son complejas porque updateUser maneja diferentes formatos de respuesta
  // ==========================================
  describe('#updateUser', () => {
    // Prueba: Actualización exitosa con respuesta como objeto
    it('success with object response', (done) => {
      // La API responde directamente con un objeto
      apiServiceSpy.putOb.and.returnValue(of({ message: 'OK' }));
      service.updateUser('1', {}).subscribe(res => {
        expect(res).toEqual({ message: 'OK' }); // Recibe el objeto directamente
        done();
      });
    });

    // Prueba: Actualización exitosa con respuesta como string JSON
    it('success with string response (needs parsing)', (done) => {
      // La API responde con un string JSON que necesita ser parseado
      const stringResponse = JSON.stringify({ message: 'Parsed' });
      apiServiceSpy.putOb.and.returnValue(of(stringResponse));
      service.updateUser('1', {}).subscribe(res => {
        // El servicio debe parsear el string a objeto automáticamente
        expect(res).toEqual({ message: 'Parsed' });
        done();
      });
    });

    // Prueba: Respuesta como string JSON inválido (no se puede parsear)
    it('success with string response (parsing fails)', (done) => {
      // Simulamos un string JSON malformado
      const badString = '{ "message": "Unclosed';
      apiServiceSpy.putOb.and.returnValue(of(badString));
      service.updateUser('1', {}).subscribe(res => {
        // Cuando el parsing falla, el servicio devuelve el string original
        expect(res).toEqual(badString);
        // Y debe mostrar un warning en consola
        expect(console.warn).toHaveBeenCalled();
        done();
      });
    });

    // Prueba: Error de API con respuesta como string JSON parseable
    it('handles API error (string error needs parsing)', (done) => {
      // Simulamos un error que contiene un string JSON en error.text
      const errorResponse = { error: { text: JSON.stringify({ msg: 'Error Parsed' }) } };
      apiServiceSpy.putOb.and.returnValue(throwError(() => errorResponse));

      service.updateUser('1', {}).subscribe(res => {
        // El servicio debe parsear el error y devolver el objeto
        expect(res).toEqual({ msg: 'Error Parsed' });
        done();
      });
    });
    
    // Prueba: Error de API con string JSON inválido
    it('handles API error (string error, parsing fails)', (done) => {
      // Simulamos un error con string JSON malformado
      const errorResponse = { error: { text: '{ "msg": "Bad' } };
      apiServiceSpy.putOb.and.returnValue(throwError(() => errorResponse));

      service.updateUser('1', {}).subscribe({
        error: (err) => {
          // Cuando el parsing del error falla, se lanza un error con mensaje genérico
          expect(err.message).toBe('Error procesando la respuesta del servidor');
          // Y debe mostrar un warning en consola
          expect(console.warn).toHaveBeenCalled();
          done();
        }
      });
    });

    // Prueba: Error genérico de API (objeto Error normal)
    it('handles generic API error (object)', (done) => {
      const errorResponse = new Error('Generic Fail');
      apiServiceSpy.putOb.and.returnValue(throwError(() => errorResponse));

      service.updateUser('1', {}).subscribe({
        error: (err) => {
          // El error original se propaga sin modificaciones
          expect(err).toBe(errorResponse);
          done();
        }
      });
    });
  });

  // ==========================================
  // 5. DELETE USER
  // Pruebas para eliminar usuarios, incluyendo el caso especial de auto-eliminación
  // ==========================================
  describe('#deleteUser', () => {
    // Prueba: Eliminar a otro usuario (no a uno mismo)
    it('success (not deleting self)', (done) => {
      // Configuramos el token para que el usuario actual sea 'admin-id'
      localStorageGetItemSpy.and.returnValue(mockAdminToken);
      apiServiceSpy.deleteOb.and.returnValue(of(null)); // Eliminación exitosa
      const clearSpy = spyOn(service, 'clearUserData'); // Espiamos clearUserData
      
      service.deleteUser('other-user-id').subscribe(() => {
        expect(apiServiceSpy.deleteOb).toHaveBeenCalled(); // Se llamó a la API
        // No se debe limpiar los datos porque no es auto-eliminación
        expect(clearSpy).not.toHaveBeenCalled();
        done();
      });
    });

    // Prueba: Auto-eliminación (usuario eliminándose a sí mismo)
    it('success (deleting self)', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken); // Usuario actual: 'admin-id'
      apiServiceSpy.deleteOb.and.returnValue(of(null));
      const clearSpy = spyOn(service, 'clearUserData').and.callThrough(); // Espiamos y permitimos ejecución real

      service.deleteUser('admin-id').subscribe(() => { // Elimina al usuario actual
        expect(apiServiceSpy.deleteOb).toHaveBeenCalled();
        // Debe limpiar los datos porque el usuario se eliminó a sí mismo
        expect(clearSpy).toHaveBeenCalled();
        done();
      });
    });

    // Prueba: Manejo de errores al eliminar usuario
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
  // Pruebas para operaciones relacionadas con el perfil del usuario actual
  // ==========================================
  describe('Profile Operations', () => {
    
    // Prueba: Error cuando no hay usuario autenticado
    it('#getProfile throws if not authenticated', (done) => {
      localStorageGetItemSpy.and.returnValue(null); // No hay token
      service.getProfile().subscribe({
        error: (err) => {
          expect(err.message).toBe('Usuario no autenticado');
          done();
        }
      });
    });
    
    // Prueba: Error cuando el token es inválido (no se puede decodificar)
    it('#getProfile handles token decode error', (done) => {
      localStorageGetItemSpy.and.returnValue('token-basura'); // Token inválido
      service.getProfile().subscribe({
        error: (err) => {
          expect(err.message).toBe('Usuario no autenticado');
          // Debe registrar el error en consola
          expect(console.error).toHaveBeenCalledWith(
            '[UserService] Error decodificando token:', jasmine.any(Error)
          );
          done();
        }
      });
    });

    // Prueba: Obtener perfil exitosamente (respuesta directa)
    it('#getProfile success (raw response)', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken); // Token válido
      apiServiceSpy.getOb.and.returnValue(of(mockUser)); // API devuelve usuario directamente
      service.getProfile().subscribe(res => {
        expect(res).toEqual(mockUser);
        done();
      });
    });

    // Prueba: Obtener perfil exitosamente (respuesta envuelta)
    it('#getProfile success (wrapped response)', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken);
      // API devuelve respuesta con formato {success: true, data: user}
      const wrappedResponse = { success: true, data: mockUser };
      apiServiceSpy.getOb.and.returnValue(of(wrappedResponse));
      service.getProfile().subscribe(res => {
        // El servicio debe extraer el usuario del campo 'data'
        expect(res).toEqual(mockUser);
        done();
      });
    });
    
    // Prueba: Obtener perfil con respuesta envuelta pero sin datos de usuario
    it('#getProfile success (wrapped response, no data)', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken);
      // Respuesta sin campo 'data' y sin '_id' (formato diferente)
      const wrappedResponse = { success: true, message: 'OK' };
      apiServiceSpy.getOb.and.returnValue(of(wrappedResponse));
      
      service.getProfile().subscribe(res => {
        // Cuando no hay datos de usuario, devuelve la respuesta completa
        expect(res as any).toEqual(wrappedResponse);
        done();
      });
    });
    
    // Prueba: Manejo de errores de API al obtener perfil
    it('#getProfile handles API error', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken);
      const err = new Error('API Fail');
      apiServiceSpy.getOb.and.returnValue(throwError(() => err));
      service.getProfile().subscribe({
        error: (e) => {
          // El error original se propaga
          expect(e).toBe(err);
          // Y se registra en consola
          expect(console.error).toHaveBeenCalledWith('Error obteniendo perfil:', err);
          done();
        }
      });
    });

    // Prueba: Cambiar contraseña sin autenticación
    it('#changePassword throws if not authenticated', (done) => {
      localStorageGetItemSpy.and.returnValue(null); // No hay token
      service.changePassword('1', '2').subscribe({
        error: (err) => {
          expect(err.message).toBe('Usuario no autenticado');
          done();
        }
      });
    });

    // Prueba: Cambiar contraseña exitosamente
    it('#changePassword success', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken); // Token válido
      apiServiceSpy.postOb.and.returnValue(of({ success: true }));
      service.changePassword('1', '2').subscribe(res => {
        expect(res).toEqual({ success: true });
        expect(apiServiceSpy.postOb).toHaveBeenCalled(); // Verificamos llamada a API
        done();
      });
    });

    // Prueba: Manejo de errores al cambiar contraseña
    it('#changePassword handles API error', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken);
      const err = new Error('API Fail');
      apiServiceSpy.postOb.and.returnValue(throwError(() => err));
      service.changePassword('1', '2').subscribe({
        error: (e) => {
          expect(e).toBe(err); // Error original
          expect(console.error).toHaveBeenCalledWith('[UserService] Error cambiando contraseña:', err);
          done();
        }
      });
    });
  });

  // ==========================================
  // 7. MÉTODOS DE VERIFICACIÓN
  // Pruebas para verificar roles y permisos del usuario actual
  // ==========================================
  describe('Role Verification', () => {
    
    // Prueba: Verificar rol sin token (debe devolver false)
    it('#checkCurrentUserRole returns false if no token', () => {
      localStorageGetItemSpy.and.returnValue(null); // No hay token
      expect(service.checkCurrentUserRole('admin')).toBeFalse();
    });

    // Prueba: Verificar rol correcto (debe devolver true)
    it('#checkCurrentUserRole returns true for correct role', () => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken); // Token con rol 'admin'
      expect(service.checkCurrentUserRole('admin')).toBeTrue(); // Verificamos rol 'admin'
    });

    // Prueba: Verificar rol incorrecto (debe devolver false)
    it('#checkCurrentUserRole returns false for incorrect role', () => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken); // Token con rol 'admin'
      expect(service.checkCurrentUserRole('lider')).toBeFalse(); // Verificamos rol 'lider'
    });

    // Prueba: Verificar rol con token inválido (debe devolver false)
    it('#checkCurrentUserRole returns false on decode error', () => {
      localStorageGetItemSpy.and.returnValue('token-basura'); // Token inválido
      expect(service.checkCurrentUserRole('admin')).toBeFalse();
      // Debe registrar el error en consola
      expect(console.error).toHaveBeenCalledWith(
        '[UserService] Error decodificando token:', jasmine.any(Error)
      );
    });

    // Prueba: hasRole simplemente llama a checkCurrentUserRole
    it('#hasRole calls checkCurrentUserRole', () => {
      // Espiamos checkCurrentUserRole para verificar que se llama
      const spy = spyOn(service, 'checkCurrentUserRole').and.returnValue(true);
      service.hasRole('admin');
      // Verificamos que se llamó con el rol correcto
      expect(spy).toHaveBeenCalledWith('admin');
    });
  });

  // ==========================================
  // 8. MANEJO DE ESTADO
  // Pruebas para métodos que gestionan el estado del usuario en la aplicación
  // ==========================================
  describe('State Management', () => {
    
    // Prueba: Limpiar datos del usuario (logout programático)
    it('#clearUserData emits null', (done) => {
      // Establecemos un usuario actual primero
      (service as any).currentUserSubject.next(mockUser);
      // Llamamos a clearUserData (como cuando hace logout)
      service.clearUserData();
      // Verificamos que el Observable emite null
      service.currentUser$.subscribe(user => {
        expect(user).toBeNull();
        done();
      });
    });

    // Prueba: Refrescar datos sin ID de usuario (no debe hacer nada)
    it('#refreshUserData does nothing if no user ID', () => {
      localStorageGetItemSpy.and.returnValue(null); // No hay token, por tanto no hay ID
      service.refreshUserData();
      // No debe llamar a la API porque no hay ID de usuario
      expect(apiServiceSpy.getOb).not.toHaveBeenCalled();
    });
    
    // Prueba: Refrescar datos con ID de usuario existente
    it('#refreshUserData calls API if user ID exists', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken); // Token con ID 'admin-id'
      apiServiceSpy.getOb.and.returnValue(of({ success: true, data: mockUser }));
      
      service.refreshUserData(); // Dispara la actualización
      
      expect(apiServiceSpy.getOb).toHaveBeenCalled(); // Debe llamar a la API
      // Verificamos que el usuario se actualizó correctamente
      service.currentUser$.subscribe(user => {
        if (user) { // Ignorar el valor inicial null
          expect(user).toEqual(mockUser);
          done();
        }
      });
    });

    // Prueba: Refrescar datos con error de API
    it('#refreshUserData clears data on API error', (done) => {
      localStorageGetItemSpy.and.returnValue(mockAdminToken);
      apiServiceSpy.getOb.and.returnValue(throwError(() => new Error('API Fail')));
      const clearSpy = spyOn(service, 'clearUserData').and.callThrough(); // Espiamos clearUserData

      service.refreshUserData();
      
      service.currentUser$.subscribe(user => {
        expect(user).toBeNull(); // Los datos deben estar limpios
        if (clearSpy.calls.any()) {
          // Verificamos que se llamó a clearUserData
          expect(clearSpy).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  // ==========================================
  // 9. MÉTODOS NO IMPLEMENTADOS (Cobertura)
  // Pruebas para métodos que están declarados pero no implementados
  // ==========================================
  describe('Not Implemented Methods', () => {
    // Prueba: getUsers debe lanzar error (no implementado)
    it('getUsers should throw', () => {
      // Verificamos que al llamar al método se lance el error esperado
      expect(() => service.getUsers()).toThrowError('Method not implemented.');
    });
    
    // Prueba: updateUserStatus debe lanzar error (no implementado)
    it('updateUserStatus should throw', () => {
      expect(() => service.updateUserStatus('1', true)).toThrowError('Method not implemented.');
    });
  });

});