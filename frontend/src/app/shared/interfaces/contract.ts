import { Personnel } from "./personnel";
import { Provider } from "./provider";
import { Resource } from "./resource";

export interface ContractResource {
  resource: string | Resource;
  quantity: number;
}

export interface ContractProvider {
  provider: string | Provider;
  serviceDescription?: string;
  cost: number;
}

export interface ContractPersonnel {
  person: string | Personnel;
  role?: string;
  hours: number;
}

export interface Contract {
  _id?: string;
  name: string;
  clientName: string;
  clientPhone?: string;
  clientEmail: string;
  startDate: Date;
  endDate: Date;
  budget?: number;
  status: 'borrador' | 'activo' | 'completado' | 'cancelado';
  terms?: string;
  resources: ContractResource[];
  providers: ContractProvider[];
  personnel: ContractPersonnel[];
}