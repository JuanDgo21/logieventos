import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { SharedModule } from "../../../shared/shared-module";

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './events-page.html',
  styleUrls: ['./events-page.scss']
})
export class EventsPageComponent {
  // Datos de ejemplo mejorados
  events: any[] = [
    {
      id: 1,
      title: 'Conferencia de Angular Avanzado',
      description: 'Aprende técnicas avanzadas de Angular con nuestros expertos. Ideal para desarrolladores con experiencia previa en el framework.',
      date: '2023-11-15',
      time: '09:00',
      location: 'Centro de Convenciones Principal, Sala A',
      attendees: 120,
      status: 'active',
      category: 1,
      priority: 'high'
    },
    {
      id: 2,
      title: 'Taller Práctico de RxJS',
      description: 'Domina la programación reactiva con ejercicios prácticos y casos reales de aplicación.',
      date: '2023-12-05',
      time: '14:00',
      location: 'Laboratorio de Innovación',
      attendees: 30,
      status: 'upcoming',
      category: 2,
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Introducción a TypeScript',
      description: 'Fundamentos de TypeScript para principiantes. Aprende desde cero a usar este poderoso superset de JavaScript.',
      date: '2024-01-20',
      time: '10:30',
      location: 'Aula Virtual 3',
      attendees: 45,
      status: 'planned',
      category: 3,
      priority: 'low'
    }
  ];

  // Categorías de eventos
  categories = [
    { id: 1, name: 'Conferencia' },
    { id: 2, name: 'Taller' },
    { id: 3, name: 'Curso' },
    { id: 4, name: 'Networking' }
  ];

  // Opciones de estado mejoradas
  statusOptions = [
    { value: 'planned', label: 'Planificado', icon: 'far fa-calendar-plus' },
    { value: 'upcoming', label: 'Próximo', icon: 'fas fa-calendar-check' },
    { value: 'active', label: 'En curso', icon: 'fas fa-running' },
    { value: 'completed', label: 'Completado', icon: 'fas fa-check-circle' },
    { value: 'cancelled', label: 'Cancelado', icon: 'fas fa-times-circle' }
  ];

  // Variables de estado
  filteredEvents = [...this.events];
  searchTerm = '';
  selectedStatus = 'all';
  selectedCategory = 'all';
  showModal = false;
  editingEvent = false;
  currentEvent: any = {};
  showToast = false;
  toastTitle = '';
  toastMessage = '';
  toastType = 'success';

  // Inicialización
  constructor() {
    this.applyFilters();
  }

  // Aplicar filtros mejorado
  applyFilters() {
    this.filteredEvents = this.events.filter(event => {
      const matchesSearch = this.searchTerm === '' || 
        [event.title, event.description, event.location].some(
          field => field.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      
      const matchesStatus = this.selectedStatus === 'all' || event.status === this.selectedStatus;
      const matchesCategory = this.selectedCategory === 'all' || event.category == this.selectedCategory;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }

  // Abrir modal (unificado para crear/editar)
  openModal(action: 'create' | 'edit', event?: any) {
    if (action === 'edit' && event) {
      this.currentEvent = { ...event };
      this.editingEvent = true;
    } else {
      this.currentEvent = {
        title: '',
        description: '',
        date: this.formatDate(new Date()),
        time: '10:00',
        location: '',
        attendees: 0,
        status: 'planned',
        category: null,
        priority: 'medium'
      };
      this.editingEvent = false;
    }
    this.showModal = true;
  }

  // Cerrar modal
  closeModal() {
    this.showModal = false;
    this.currentEvent = {};
  }

  // Guardar evento con validación
  saveEvent() {
    if (!this.currentEvent.title || !this.currentEvent.date || !this.currentEvent.location || !this.currentEvent.status) {
      this.showNotification('Error', 'Por favor completa todos los campos requeridos', 'error');
      return;
    }

    if (this.editingEvent) {
      const index = this.events.findIndex(e => e.id === this.currentEvent.id);
      if (index !== -1) {
        this.events[index] = this.currentEvent;
        this.showNotification('Éxito', 'Evento actualizado correctamente', 'success');
      }
    } else {
      this.currentEvent.id = Math.max(...this.events.map(e => e.id), 0) + 1;
      this.events.push(this.currentEvent);
      this.showNotification('Éxito', 'Evento creado correctamente', 'success');
    }
    
    this.applyFilters();
    this.closeModal();
  }

  // Confirmar eliminación con más detalles
  confirmDelete(id: number) {
    const event = this.events.find(e => e.id === id);
    if (event) {
      const confirmDelete = confirm(`¿Estás seguro de eliminar el evento "${event.title}"?\nFecha: ${event.date}\nEsta acción no se puede deshacer.`);
      if (confirmDelete) {
        this.deleteEvent(id);
      }
    }
  }

  // Eliminar evento con feedback
  deleteEvent(id: number) {
    this.events = this.events.filter(event => event.id !== id);
    this.applyFilters();
    this.showNotification('Éxito', 'Evento eliminado correctamente', 'success');
  }

  // Mostrar notificación
  showNotification(title: string, message: string, type: 'success' | 'error') {
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.hideToast();
    }, 5000);
  }

  // Ocultar notificación
  hideToast() {
    this.showToast = false;
  }

  // Obtener nombre de categoría
  getCategoryName(categoryId: number): string {
    const category = this.categories.find(cat => cat.id === categoryId);
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

  // Obtener color de estado
  getStatusColor(status: string): string {
    switch(status) {
      case 'planned': return 'info';
      case 'upcoming': return 'primary';
      case 'active': return 'success';
      case 'completed': return 'secondary';
      case 'cancelled': return 'danger';
      default: return 'light';
    }
  }

  // Formatear fecha para input date
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }
}