import { PersonnelType } from "./personnel-type";

export interface DefaultResource {
  resourceType: 'sonido' | 'mobiliario' | 'catering' | 'iluminacion' | 'otros';
  description: string;
  defaultQuantity: number;
}

export interface EventType {
  _id?: string;
  name: string;
  description?: string;
  defaultResources: DefaultResource[];
  requiredPersonnelType: string | PersonnelType;
  estimatedDuration: number;
  category: 'corporativo' | 'social' | 'cultural' | 'deportivo' | 'academico';
  additionalRequirements?: string[];
  active: boolean;
}