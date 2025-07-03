import { ProviderType } from "./provider-type";

export interface Provider {
    _id?: string;
  name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    providerType: string | ProviderType;
    status: 'activo' | 'inactivo' | 'suspendido';

}
