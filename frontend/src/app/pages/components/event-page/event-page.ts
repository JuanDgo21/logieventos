import { Component, OnDestroy, OnInit } from '@angular/core';
import { Event, NewEvent, UpdateEvent } from '../../../shared/interfaces/event';
import { EventType } from '../../../shared/interfaces/event-type';
import { EventService } from '../../../core/services/event';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-event-page',
  standalone: false,
  templateUrl: './event-page.html',
  styleUrl: './event-page.scss'
})
export class EventPageComponent implements OnInit, OnDestroy {
  // Variables de estado
  events: Event[] = [];
  eventTypes: EventType[] = [];
  filteredEvents: Event[] = [];
  isLoading: boolean = true;
  
  searchTerm = '';
  selectedStatus = 'all';
  selectedCategory = 'all';
  showModal = false;
  editingEvent = false;
  currentEvent: Partial<Event> = {};
  
  // Suscripciones para manejar la memoria
  private subscriptions: Subscription = new Subscription();

  // Opciones de estado
  statusOptions = [
    { value: 'planificado', label: 'Planificado', icon: 'far fa-calendar-plus' },
    { value: 'en_progreso', label: 'En progreso', icon: 'fas fa-running' },
    { value: 'completado', label: 'Completado', icon: 'fas fa-check-circle' },
    { value: 'cancelado', label: 'Cancelado', icon: 'fas fa-times-circle' }
  ];

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadData(): void {
    this.isLoading = true;
    
    // Suscribirse a los eventos
    const eventsSub = this.eventService.events$.subscribe({
      next: (events) => {
        this.events = events;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando eventos:', error);
        this.isLoading = false;
      }
    });

    // Suscribirse a los tipos de eventos
    const eventTypesSub = this.eventService.eventTypes$.subscribe({
      next: (eventTypes) => {
        this.eventTypes = eventTypes;
      },
      error: (error) => {
        console.error('Error cargando tipos de eventos:', error);
      }
    });

    this.subscriptions.add(eventsSub);
    this.subscriptions.add(eventTypesSub);

    // Forzar carga inicial
    this.eventService.getAllEvents().subscribe();
    this.eventService.getAllEventTypes().subscribe();
  }

  // Aplicar filtros
  applyFilters(): void {
    this.filteredEvents = this.events.filter(event => {
      const matchesSearch = this.searchTerm === '' || 
        [event.name, event.description, event.location].some(
          field => field && field.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      
      const matchesStatus = this.selectedStatus === 'all' || event.status === this.selectedStatus;
      
      const matchesCategory = this.selectedCategory === 'all' || 
        (typeof event.eventType === 'object' ? 
          (event.eventType as EventType)._id === this.selectedCategory : 
          event.eventType === this.selectedCategory);
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }

  // Abrir modal (unificado para crear/editar)
  openModal(action: 'create' | 'edit', event?: Event): void {
    if (action === 'edit' && event) {
      this.currentEvent = { ...event };
      this.editingEvent = true;
    } else {
      this.currentEvent = {
        name: '',
        description: '',
        location: '',
        eventType: '', // Cambiado de null a string vacío
        startDate: new Date(),
        endDate: new Date(),
        status: 'planificado'
      };
      this.editingEvent = false;
    }
    this.showModal = true;
  }

  // Cerrar modal
  closeModal(): void {
    this.showModal = false;
    this.currentEvent = {};
  }

  // Guardar evento con validación
  saveEvent(): void {
    if (!this.currentEvent.name || !this.currentEvent.startDate || 
        !this.currentEvent.location || !this.currentEvent.status) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    if (this.editingEvent && this.currentEvent._id) {
      const updateData: UpdateEvent = {
        _id: this.currentEvent._id,
        name: this.currentEvent.name,
        description: this.currentEvent.description,
        location: this.currentEvent.location,
        eventType: this.currentEvent.eventType,
        startDate: this.currentEvent.startDate,
        endDate: this.currentEvent.endDate,
        status: this.currentEvent.status
      };

      this.eventService.updateEvent(this.currentEvent._id, updateData).subscribe({
        next: () => {
          alert('Evento actualizado correctamente');
          this.closeModal();
        },
        error: (error) => {
          alert('Error al actualizar el evento: ' + error.message);
        }
      });
    } else {
      const newEvent: NewEvent = {
        name: this.currentEvent.name!,
        description: this.currentEvent.description || '',
        location: this.currentEvent.location!,
        eventType: this.currentEvent.eventType || '',
        startDate: this.currentEvent.startDate!,
        endDate: this.currentEvent.endDate!,
        status: this.currentEvent.status as 'planificado' | 'en_progreso' | 'completado' | 'cancelado',
        contract: '', // Ajusta según tu lógica
        responsable: '' // Ajusta según tu lógica
      };

      this.eventService.createEvent(newEvent).subscribe({
        next: () => {
          alert('Evento creado correctamente');
          this.closeModal();
        },
        error: (error) => {
          alert('Error al crear el evento: ' + error.message);
        }
      });
    }
  }

  // Confirmar eliminación
  confirmDelete(id: string): void {
    const event = this.events.find(e => e._id === id);
    if (event) {
      const confirmDelete = confirm(`¿Estás seguro de eliminar el evento "${event.name}"?\nEsta acción no se puede deshacer.`);
      if (confirmDelete) {
        this.deleteEvent(id);
      }
    }
  }

  // Eliminar evento
  deleteEvent(id: string): void {
    this.eventService.deleteEvent(id).subscribe({
      next: () => {
        alert('Evento eliminado correctamente');
      },
      error: (error) => {
        alert('Error al eliminar el evento: ' + error.message);
      }
    });
  }

  // Obtener nombre de categoría
  getCategoryName(eventType: string | EventType): string {
    if (typeof eventType === 'object') {
      return eventType.name;
    }
    
    const category = this.eventTypes.find(cat => cat._id === eventType);
    return category ? category.name : 'Sin categoría';
  }

  // Obtener etiqueta de estado
  getStatusLabel(status: string): string {
    const statusObj = this.statusOptions.find(s => s.value === status);
    return statusObj ? statusObj.label : 'Desconocido';
  }

  // Obtener ícono de estado
  getStatusIcon(status: string): string {
    const statusObj = this.statusOptions.find(s => s.value === status);
    return statusObj ? statusObj.icon : 'fas fa-question-circle';
  }

  // Formatear fecha para mostrar
  formatDisplayDate(dateString: string | Date): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}