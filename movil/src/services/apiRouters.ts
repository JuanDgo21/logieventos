// Constante base para la API (adaptada para React Native)
export const apiRouters = {
  AUTH: {
    SIGNIN: `/auth/signin`,
    SIGNUP: `/auth/signup`,
    FORGOT_PASSWORD: `/auth/forgot-password`,
    RESET_PASSWORD: `/auth/reset-password`
  },

  USERS: {
    BASE: `/users`,
    BY_ID: (id: string) => `/users/${id}`
  },

  EVENTS: {
    BASE: `/events`,
    BY_ID: (id: string) => `/events/${id}`
  },

  CONTRACTS: {
    BASE: `/contracts`,
    BY_ID: (id: string) => `/contracts/${id}`,
    REPORT: (id: string) => `/contracts/${id}/report`
  },

  RESOURCES: {
    BASE: `/resources`,
    SEARCH: `/resources/search`,
    BY_ID: (id: string) => `/resources/${id}`
  },

  PROVIDERS: {
    BASE: `/providers`,
    BY_ID: (id: string) => `/providers/${id}`
  },

  PERSONNEL: {
    BASE: `/personnel`,
    BY_ID: (id: string) => `/personnel/${id}`,
    SEARCH: `/personnel/search`
  },

  TYPES: {
    EVENT: {
      BASE: `/event-types`,
      BY_ID: (id: string) => `/event-types/${id}`
    },
    
    PROVIDER: {
      BASE: `/provider-types`,
      BY_ID: (id: string) => `/provider-types/${id}`
    },
    
    PERSONNEL: {
      BASE: `/personnel-types`,
      BY_ID: (id: string) => `/personnel-types/${id}`,
      SEARCH: `/personnel-types/search`
    },
    
    RESOURCE: {
      BASE: `/resource-types`,
      BY_ID: (id: string) => `/resource-types/${id}`
    }
  }
};