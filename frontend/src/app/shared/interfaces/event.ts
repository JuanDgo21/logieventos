import { EventType } from "./event-type";
import { Contract } from "./contract";
import { User } from "./user";

export interface Event {
    _id: string;
    name: string;
    description: string;
    location: string;
    eventType: string | EventType;
    contract: string | Contract;
    responsable: string | User;
    startDate: Date;
    endDate: Date;
    status: 'planificado' | 'en_progreso' | 'completado' | 'cancelado';
    createdAt: Date;
    updatedAt: Date;
}

// Tipo para crear nuevo evento (sin campos autogenerados)
export type NewEvent = Omit<Event, '_id' | 'createdAt' | 'updatedAt'>;

// Tipo para actualizar evento (todos los campos opcionales excepto _id)
export type UpdateEvent = Partial<Omit<Event, '_id'>> & { _id: string };

// Respuesta de la API para operaciones con eventos
export interface EventApiResponse {
    success: boolean;
    message?: string;
    data?: Event | Event[];
    count?: number;
}