export interface PersonnelType {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: string; // ID del usuario que creó el registro
  updatedBy?: string; // ID del último usuario que actualizó
  createdAt: string;
  updatedAt_: string;
}

// Tipo para crear nuevo tipo de personal
export type NewPersonnelType = Omit<PersonnelType, '_id' | 'createdAt' | 'updatedAt'>;

// Tipo para actualizar tipo de personal
export type UpdatePersonnelType = Partial<Omit<PersonnelType, '_id'>> & { _id: string };

// Respuesta de la API para operaciones con tipos
export interface PersonnelTypeApiResponse {
  success: boolean;
  message?: string;
  data?: PersonnelType | PersonnelType[];
  count?: number;
}