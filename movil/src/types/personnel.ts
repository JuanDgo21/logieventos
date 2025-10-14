export interface Personnel {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  personnelType: string; // Solo el ID
  status: 'disponible' | 'asignado' | 'vacaciones' | 'inactivo';
  skills?: string[];
  createdAt: string; // Cambiado de Date a string para compatibilidad con JSON
  updatedAt: string; // Cambiado de Date a string para compatibilidad con JSON
  typeName?: string; // Campo adicional para el nombre de categoría
}

// Tipo para crear nuevo personal (sin campos autogenerados)
export type NewPersonnel = Omit<Personnel, '_id' | 'createdAt' | 'updatedAt' | 'typeName'>;

// Tipo para actualizar personal (todos los campos opcionales excepto _id)
export type UpdatePersonnel = Partial<Omit<Personnel, '_id'>> & { _id: string };

// Respuesta de la API para operaciones con personal
export interface PersonnelApiResponse {
  success: boolean;
  message?: string;
  data?: Personnel | Personnel[];
  count?: number;
}

export interface PersonnelType {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: string; // ID del usuario que creó el registro
  updatedBy?: string; // ID del último usuario que actualizó
  createdAt: string;
  updatedAt: string; // Corregido: estaba updatedAt_
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