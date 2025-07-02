const API = 'api';
export const apiRouters = {

    AUTH: {
    SIGNIN: `/${API}/auth/signin`,
    SIGNUP: `/${API}/auth/signup`,
    FORGOT_PASSWORD: `/${API}/auth/forgot-password`, // Nuevo endpoint
    RESET_PASSWORD: `/${API}/auth/reset-password` // Nuevo endpoint
  },
  USERS: {
    BASE: `/${API}/users`,
    BY_ID: (id: string) => `/${API}/users/${id}`
  },
  EVENTS: {
    BASE: `/${API}/events`,
    BY_ID: (id: string) => `/${API}/events/${id}`
  },
  CONTRACTS: {
    BASE: `/${API}/contracts`,
    BY_ID: (id: string) => `/${API}/contracts/${id}`,
    REPORT: (id: string) => `/${API}/contracts/${id}/report`
  },
  RESOURCES: {
    BASE: `/${API}/resources`,
    SEARCH: `/${API}/resources/search`,
    BY_ID: (id: string) => `/${API}/resources/${id}`
  },
  PROVIDERS: {
    BASE: `/${API}/providers`,
    BY_ID: (id: string) => `/${API}/providers/${id}`
  },
  PERSONNEL: {
    BASE: `/${API}/personnel`,
    BY_ID: (id: string) => `/${API}/personnel/${id}`
  },
  TYPES: {
    EVENT: {
      BASE: `/${API}/event-types`,
      BY_ID: (id: string) => `/${API}/event-types/${id}`
    },
    PROVIDER: {
      BASE: `/${API}/provider-types`,
      BY_ID: (id: string) => `/${API}/provider-types/${id}`
    },
    PERSONNEL: {
      BASE: `/${API}/personnel-types`,
      BY_ID: (id: string) => `/${API}/personnel-types/${id}`
    },
    RESOURCE: {
      BASE: `/${API}/resource-types`,
      BY_ID: (id: string) => `/${API}/resource-types/${id}`
    }
  }
};