import { EventType } from "@angular/router";
import { Contract } from "./contract";
import { User } from "./user";

export interface Event {
    _id?: string;
    name: string;
    description: string;
    location: string;
    eventType: string | EventType;
    contract: string | Contract;
    responsable: string | User;
    startDate: Date;
    endDate: Date;
    status: 'planificado' | 'en_progreso' | 'completado' | 'cancelado';
}