import { apiRouters } from './apiRouters';

// Definimos un prefijo base para todas las rutas de la API
// Esto nos permite mantener consistencia y facilita cambios futuros
const API_PREFIX = '/api';

// Suite de pruebas para el objeto apiRouters
// Describe agrupa pruebas relacionadas bajo un mismo contexto
describe('apiRouters', () => {

  // Prueba básica para verificar que el objeto apiRouters existe
  // Esto asegura que el módulo se importó correctamente
  it('should be defined', () => {
    expect(apiRouters).toBeTruthy();
  });

  // --- Bloque de pruebas para rutas de AUTENTICACIÓN ---
  describe('AUTH routes', () => {
    // Prefijo específico para rutas de autenticación
    const authPrefix = `${API_PREFIX}/auth`;

    // Prueba individual para la ruta de inicio de sesión
    it('should have correct SIGNIN route', () => {
      // Verifica que la ruta SIGNIN coincide con el formato esperado
      expect(apiRouters.AUTH.SIGNIN).toBe(`${authPrefix}/signin`);
    });

    // Prueba para la ruta de registro de usuario
    it('should have correct SIGNUP route', () => {
      expect(apiRouters.AUTH.SIGNUP).toBe(`${authPrefix}/signup`);
    });

    // Prueba para la ruta de recuperación de contraseña
    it('should have correct FORGOT_PASSWORD route', () => {
      expect(apiRouters.AUTH.FORGOT_PASSWORD).toBe(`${authPrefix}/forgot-password`);
    });

    // Prueba para la ruta de restablecimiento de contraseña
    it('should have correct RESET_PASSWORD route', () => {
      expect(apiRouters.AUTH.RESET_PASSWORD).toBe(`${authPrefix}/reset-password`);
    });
  });

  // --- Bloque de pruebas para rutas de USUARIOS ---
  describe('USERS routes', () => {
    const usersPrefix = `${API_PREFIX}/users`;

    // Prueba para la ruta base de usuarios
    it('should have correct BASE route', () => {
      expect(apiRouters.USERS.BASE).toBe(usersPrefix);
    });

    // Prueba para la función que genera rutas dinámicas con ID
    // BY_ID es una función que recibe un parámetro y construye la ruta
    it('should build BY_ID correctly', () => {
      const id = 'user-123'; // ID de ejemplo para la prueba
      expect(apiRouters.USERS.BY_ID(id)).toBe(`${usersPrefix}/${id}`);
    });
  });

  // --- Bloque de pruebas para rutas de EVENTOS ---
  describe('EVENTS routes', () => {
    const eventsPrefix = `${API_PREFIX}/events`;

    it('should have correct BASE route', () => {
      expect(apiRouters.EVENTS.BASE).toBe(eventsPrefix);
    });

    it('should build BY_ID correctly', () => {
      const id = 'event-abc';
      expect(apiRouters.EVENTS.BY_ID(id)).toBe(`${eventsPrefix}/${id}`);
    });
  });

  // --- Bloque de pruebas para rutas de CONTRATOS ---
  describe('CONTRACTS routes', () => {
    const contractsPrefix = `${API_PREFIX}/contracts`;

    it('should have correct BASE route', () => {
      expect(apiRouters.CONTRACTS.BASE).toBe(contractsPrefix);
    });

    it('should build BY_ID correctly', () => {
      const id = 'contract-001';
      expect(apiRouters.CONTRACTS.BY_ID(id)).toBe(`${contractsPrefix}/${id}`);
    });

    // Prueba para ruta especial de reportes dentro de contratos
    it('should build REPORT correctly', () => {
      const id = 'report-456';
      expect(apiRouters.CONTRACTS.REPORT(id)).toBe(`${contractsPrefix}/${id}/report`);
    });
  });

  // --- Bloque de pruebas para rutas de RECURSOS ---
  describe('RESOURCES routes', () => {
    const resourcesPrefix = `${API_PREFIX}/resources`;

    it('should have correct BASE route', () => {
      expect(apiRouters.RESOURCES.BASE).toBe(resourcesPrefix);
    });

    // Prueba para ruta especial de búsqueda (endpoint fijo, no dinámico)
    it('should have correct SEARCH route', () => {
      expect(apiRouters.RESOURCES.SEARCH).toBe(`${resourcesPrefix}/search`);
    });

    it('should build BY_ID correctly', () => {
      const id = 'resource-xyz';
      expect(apiRouters.RESOURCES.BY_ID(id)).toBe(`${resourcesPrefix}/${id}`);
    });
  });

  // --- Bloque de pruebas para rutas de PROVEEDORES ---
  describe('PROVIDERS routes', () => {
    const providersPrefix = `${API_PREFIX}/providers`;

    it('should have correct BASE route', () => {
      expect(apiRouters.PROVIDERS.BASE).toBe(providersPrefix);
    });

    it('should build BY_ID correctly', () => {
      const id = 'provider-88';
      expect(apiRouters.PROVIDERS.BY_ID(id)).toBe(`${providersPrefix}/${id}`);
    });
  });

  // --- Bloque de pruebas para rutas de PERSONAL ---
  describe('PERSONNEL routes', () => {
    const personnelPrefix = `${API_PREFIX}/personnel`;

    it('should have correct BASE route', () => {
      expect(apiRouters.PERSONNEL.BASE).toBe(personnelPrefix);
    });

    it('should build BY_ID correctly', () => {
      const id = 'person-99';
      expect(apiRouters.PERSONNEL.BY_ID(id)).toBe(`${personnelPrefix}/${id}`);
    });
  });

  // --- Bloque de pruebas para rutas de TIPOS (estructura anidada) ---
  describe('TYPES routes', () => {

    // Sub-bloque para tipos de Eventos
    describe('EVENT types', () => {
      const prefix = `${API_PREFIX}/event-types`;
      
      it('should have correct BASE route', () => {
        expect(apiRouters.TYPES.EVENT.BASE).toBe(prefix);
      });
      
      it('should build BY_ID correctly', () => {
        const id = 'evt-type-1';
        expect(apiRouters.TYPES.EVENT.BY_ID(id)).toBe(`${prefix}/${id}`);
      });
    });

    // Sub-bloque para tipos de Proveedores
    describe('PROVIDER types', () => {
      const prefix = `${API_PREFIX}/provider-types`;
      
      it('should have correct BASE route', () => {
        expect(apiRouters.TYPES.PROVIDER.BASE).toBe(prefix);
      });
      
      it('should build BY_ID correctly', () => {
        const id = 'prv-type-2';
        expect(apiRouters.TYPES.PROVIDER.BY_ID(id)).toBe(`${prefix}/${id}`);
      });
    });

    // Sub-bloque para tipos de Personal
    describe('PERSONNEL types', () => {
      const prefix = `${API_PREFIX}/personnel-types`;
      
      it('should have correct BASE route', () => {
        expect(apiRouters.TYPES.PERSONNEL.BASE).toBe(prefix);
      });
      
      it('should build BY_ID correctly', () => {
        const id = 'per-type-3';
        expect(apiRouters.TYPES.PERSONNEL.BY_ID(id)).toBe(`${prefix}/${id}`);
      });
    });

    // Sub-bloque para tipos de Recursos
    describe('RESOURCE types', () => {
      const prefix = `${API_PREFIX}/resource-types`;
      
      it('should have correct BASE route', () => {
        expect(apiRouters.TYPES.RESOURCE.BASE).toBe(prefix);
      });
      
      it('should build BY_ID correctly', () => {
        const id = 'res-type-4';
        expect(apiRouters.TYPES.RESOURCE.BY_ID(id)).toBe(`${prefix}/${id}`);
      });
    });
  });
});