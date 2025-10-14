// Constante base para la API
const API = 'api';

// Objeto que contiene todas las rutas de la API organizadas por módulos
export const apiRouters = {
  // Rutas relacionadas con autenticación
  AUTH: {
    SIGNIN: `/${API}/auth/signin`,               // Ruta para inicio de sesión
    SIGNUP: `/${API}/auth/signup`,              // Ruta para registro de usuarios
    FORGOT_PASSWORD: `/${API}/auth/forgot-password`,  // Ruta para solicitar recuperación de contraseña
    RESET_PASSWORD: `/${API}/auth/reset-password`     // Ruta para restablecer contraseña
  },

  // Rutas para gestión de usuarios
  USERS: {
    BASE: `/${API}/users`,                       // Ruta base para usuarios
    BY_ID: (id: string) => `/${API}/users/${id}` // Ruta para un usuario específico por ID
  },

  // Rutas para gestión de eventos
  EVENTS: {
    BASE: `/${API}/events`,                      // Ruta base para eventos
    BY_ID: (id: string) => `/${API}/events/${id}` // Ruta para un evento específico por ID
  },

  // Rutas para gestión de contratos
  CONTRACTS: {
    BASE: `/${API}/contracts`,                   // Ruta base para contratos
    BY_ID: (id: string) => `/${API}/contracts/${id}`, // Ruta para un contrato específico por ID
    REPORT: (id: string) => `/${API}/contracts/${id}/report` // Ruta para reportes de contrato
  },

  // Rutas para gestión de recursos
  RESOURCES: {
    BASE: `/${API}/resources`,                   // Ruta base para recursos
    SEARCH: `/${API}/resources/search`,          // Ruta para búsqueda de recursos
    BY_ID: (id: string) => `/${API}/resources/${id}` // Ruta para un recurso específico por ID
  },

  // Rutas para gestión de proveedores
  PROVIDERS: {
    BASE: `/${API}/providers`,                   // Ruta base para proveedores
    BY_ID: (id: string) => `/${API}/providers/${id}` // Ruta para un proveedor específico por ID
  },

  // Rutas para gestión de personal
  PERSONNEL: {
    BASE: `/${API}/personnel`,                   // Ruta base para personal
    BY_ID: (id: string) => `/${API}/personnel/${id}` // Ruta para un miembro del personal específico por ID
  },

  // Rutas para gestión de tipos/categorías
  TYPES: {
    // Tipos de eventos
    EVENT: {
      BASE: `/${API}/event-types`,               // Ruta base para tipos de eventos
      BY_ID: (id: string) => `/${API}/event-types/${id}` // Ruta para un tipo de evento específico por ID
    },
    
    // Tipos de proveedores
    PROVIDER: {
      BASE: `/${API}/provider-types`,            // Ruta base para tipos de proveedores
      BY_ID: (id: string) => `/${API}/provider-types/${id}` // Ruta para un tipo de proveedor específico por ID
    },
    
    // Tipos de personal
    PERSONNEL: {
      BASE: `/${API}/personnel-types`,           // Ruta base para tipos de personal
      BY_ID: (id: string) => `/${API}/personnel-types/${id}` // Ruta para un tipo de personal específico por ID
    },
    
    // Tipos de recursos
    RESOURCE: {
      BASE: `/${API}/resource-types`,            // Ruta base para tipos de recursos
      BY_ID: (id: string) => `/${API}/resource-types/${id}` // Ruta para un tipo de recurso específico por ID
    }
  }
};