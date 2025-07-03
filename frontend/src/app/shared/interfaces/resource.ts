import { ResourceType } from "./resource-type";

export interface Resource {
    _id?: string;
  name: string;
  description?: string;
  quantity: number;
  cost: number;
  resourceType: string | ResourceType; // Puede ser ID o el objeto completo
  status: 'disponible' | 'en_uso' | 'mantenimiento' | 'descartado';

}
