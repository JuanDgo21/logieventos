import { apiRouters } from './apiRouters';

// Definimos el prefijo base esperado para mantener las pruebas consistentes (DRY)
const API_PREFIX = '/api';

describe('apiRouters', () => {

  it('should be defined', () => {
    expect(apiRouters).toBeTruthy();
  });

  // --- Pruebas para AUTH ---
  describe('AUTH routes', () => {
    const authPrefix = `${API_PREFIX}/auth`;

    it('should have correct SIGNIN route', () => {
      expect(apiRouters.AUTH.SIGNIN).toBe(`${authPrefix}/signin`);
    });

    it('should have correct SIGNUP route', () => {
      expect(apiRouters.AUTH.SIGNUP).toBe(`${authPrefix}/signup`);
    });

    it('should have correct FORGOT_PASSWORD route', () => {
      expect(apiRouters.AUTH.FORGOT_PASSWORD).toBe(`${authPrefix}/forgot-password`);
    });

    it('should have correct RESET_PASSWORD route', () => {
      expect(apiRouters.AUTH.RESET_PASSWORD).toBe(`${authPrefix}/reset-password`);
    });
  });

  // --- Pruebas para USERS ---
  describe('USERS routes', () => {
    const usersPrefix = `${API_PREFIX}/users`;

    it('should have correct BASE route', () => {
      expect(apiRouters.USERS.BASE).toBe(usersPrefix);
    });

    it('should build BY_ID correctly', () => {
      const id = 'user-123';
      expect(apiRouters.USERS.BY_ID(id)).toBe(`${usersPrefix}/${id}`);
    });
  });

  // --- Pruebas para EVENTS ---
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

  // --- Pruebas para CONTRACTS ---
  describe('CONTRACTS routes', () => {
    const contractsPrefix = `${API_PREFIX}/contracts`;

    it('should have correct BASE route', () => {
      expect(apiRouters.CONTRACTS.BASE).toBe(contractsPrefix);
    });

    it('should build BY_ID correctly', () => {
      const id = 'contract-001';
      expect(apiRouters.CONTRACTS.BY_ID(id)).toBe(`${contractsPrefix}/${id}`);
    });

    it('should build REPORT correctly', () => {
      const id = 'report-456';
      expect(apiRouters.CONTRACTS.REPORT(id)).toBe(`${contractsPrefix}/${id}/report`);
    });
  });

  // --- Pruebas para RESOURCES ---
  describe('RESOURCES routes', () => {
    const resourcesPrefix = `${API_PREFIX}/resources`;

    it('should have correct BASE route', () => {
      expect(apiRouters.RESOURCES.BASE).toBe(resourcesPrefix);
    });

    it('should have correct SEARCH route', () => {
      expect(apiRouters.RESOURCES.SEARCH).toBe(`${resourcesPrefix}/search`);
    });

    it('should build BY_ID correctly', () => {
      const id = 'resource-xyz';
      expect(apiRouters.RESOURCES.BY_ID(id)).toBe(`${resourcesPrefix}/${id}`);
    });
  });

  // --- Pruebas para PROVIDERS ---
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

  // --- Pruebas para PERSONNEL ---
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

  // --- Pruebas para TYPES (anidadas) ---
  describe('TYPES routes', () => {

    // Tipos de Eventos
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

    // Tipos de Proveedores
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

    // Tipos de Personal
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

    // Tipos de Recursos
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