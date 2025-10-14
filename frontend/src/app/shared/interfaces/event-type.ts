import { PersonnelType } from "./personnel-type";

export interface DefaultResource {
  resourceType: 'sonido' | 'mobiliario' | 'catering' | 'iluminacion' | 'otros';
  description: string;
  defaultQuantity: number;
}

export interface EventType {
  _id: string;
  name: string;
  description?: string;
  defaultResources: DefaultResource[];
  requiredPersonnelType: string | PersonnelType;
  estimatedDuration: number;
  category: 'corporativo' | 'social' | 'cultural' | 'deportivo' | 'academico';
  additionalRequirements?: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipo para crear nuevo tipo de evento (sin campos autogenerados)
export type NewEventType = Omit<EventType, '_id' | 'createdAt' | 'updatedAt'>;

// Tipo para actualizar tipo de evento (todos los campos opcionales excepto _id)
export type UpdateEventType = Partial<Omit<EventType, '_id'>> & { _id: string };

// Respuesta de la API para operaciones con tipos de evento
export interface EventTypeApiResponse {
  success: boolean;
  message?: string;
  data?: EventType | EventType[];
  count?: number;
}