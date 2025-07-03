import { PersonnelType } from "./personnel-type";

export interface Personnel {
    _id?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    personnelType: string | PersonnelType;
    status: 'disponible' | 'asignado' | 'vacaciones' | 'inactivo';
    skills?: string[];

}
