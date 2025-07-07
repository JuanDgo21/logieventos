import { PersonnelType } from "./personnel-type";

export interface Personnel {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  personnelType: string; // Referencia al ID del tipo de personal
  status: 'disponible' | 'asignado' | 'vacaciones' | 'inactivo';
  skills?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Tipo para crear nuevo personal (sin campos autogenerados)
export type NewPersonnel = Omit<Personnel, '_id' | 'createdAt' | ''>;

// Tipo para actualizar personal (todos los campos opcionales excepto _id)
export type UpdatePersonnel = Partial<Omit<Personnel, '_id'>> & { _id: string };

// Respuesta de la API para operaciones con personal
export interface PersonnelApiResponse {
  success: boolean;
  message?: string;
  data?: Personnel | Personnel[];
  count?: number;
}