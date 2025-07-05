import { Component, Input } from '@angular/core';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true
})

export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 100, trail = '...'): string {
    if (!value) return '';
    return value.length > limit ? value.substring(0, limit) + trail : value;
  }
}

@Component({
  selector: 'app-eventcard',
  standalone: false,
  templateUrl: './eventcard.html',
  styleUrl: './eventcard.scss'
})
export class Eventcard {
  @Input() event: any; // Tipar con interfaz Evento luego

  isExpanded: boolean = false;

  toggleDescription() {
    this.isExpanded = !this.isExpanded;
  }

  onView() {
    console.log('Ver evento:', this.event.id);
  }

  // Acciones CRUD
  onEdit() {
    console.log('Editar evento:', this.event.id);
  }
  
  onDelete() {
    console.log('Eliminar evento:', this.event.id);
  }

  getStatusColor(status: string): string {
  switch (status) {
    case 'activo':
      return 'success';    // Bootstrap: bg-success
    case 'borrador':
      return 'secondary';  // bg-secondary
    case 'completado':
      return 'info';       // bg-info
    case 'cancelado':
      return 'danger';     // bg-danger
    default:
      return 'dark';       // bg-dark
  }
}

}
export const EVENT_CARD_COMPONENTS = [Eventcard, TruncatePipe];