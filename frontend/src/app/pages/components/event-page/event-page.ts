  // event-page.ts

  import { Component, OnDestroy, OnInit } from '@angular/core';
  import { Event, NewEvent, UpdateEvent } from '../../../shared/interfaces/event';
  import { EventType } from '../../../shared/interfaces/event-type';
  import { Subscription } from 'rxjs';

  // --- NUEVO: Importaciones para Reactive Forms y los nuevos datos ---
  import { FormBuilder, FormGroup, Validators } from '@angular/forms';
  import { EventService, User, Contract } from '../../../core/services/event';


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
    
    // --- NUEVO: Listados para los selects del formulario ---
    users: User[] = [];
    contracts: Contract[] = [];
    
    searchTerm = '';
    selectedStatus = 'all';
    selectedCategory = 'all';
    showModal = false;
    editingEvent = false;
    
    // --- NUEVO: Propiedad para el Formulario Reactivo ---
    eventForm!: FormGroup;
    currentEventId: string | null = null; // Para saber qué evento estamos editando
    
    // Suscripciones para manejar la memoria
    private subscriptions: Subscription = new Subscription();

    // Opciones de estado
    statusOptions = [
      { value: 'planificado', label: 'Planificado', icon: 'far fa-calendar-plus' },
      { value: 'en_progreso', label: 'En progreso', icon: 'fas fa-running' },
      { value: 'completado', label: 'Completado', icon: 'fas fa-check-circle' },
      { value: 'cancelado', label: 'Cancelado', icon: 'fas fa-times-circle' }
    ];

    // --- ACTUALIZADO: Inyectar FormBuilder ---
    constructor(
      private eventService: EventService,
      private fb: FormBuilder
    ) {}

    ngOnInit(): void {
      this.initializeForm();
      this.loadData();
    }

    ngOnDestroy(): void {
      this.subscriptions.unsubscribe();
    }
    
    // --- NUEVO: Método para inicializar el formulario reactivo ---
    initializeForm(): void {
      this.eventForm = this.fb.group({
        name: ['', Validators.required],
        description: ['', Validators.required],
        location: ['', Validators.required],
        eventType: [null, Validators.required],
        contract: [null, Validators.required],
        responsable: [null, Validators.required],
        startDate: [new Date().toISOString().split('T')[0], Validators.required],
        endDate: [new Date().toISOString().split('T')[0], Validators.required],
        status: ['planificado', Validators.required]
      });
    }

    loadData(): void {
      this.isLoading = true;
      
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

      const eventTypesSub = this.eventService.eventTypes$.subscribe({
        next: (eventTypes) => this.eventTypes = eventTypes,
        error: (error) => console.error('Error cargando tipos de eventos:', error)
      });

      // --- NUEVO: Suscribirse a usuarios y contratos ---
      const usersSub = this.eventService.users$.subscribe({
        next: (users) => this.users = users,
        error: (error) => console.error('Error cargando usuarios:', error)
      });

      const contractsSub = this.eventService.contracts$.subscribe({
        next: (contracts) => this.contracts = contracts,
        error: (error) => console.error('Error cargando contratos:', error)
      });

      this.subscriptions.add(eventsSub);
      this.subscriptions.add(eventTypesSub);
      this.subscriptions.add(usersSub);
      this.subscriptions.add(contractsSub);

      // Los datos se cargan automáticamente al iniciar el servicio,
      // pero si necesitas forzar una recarga, puedes llamar a:
      // this.eventService.refreshEvents();
    }

    // Aplicar filtros (sin cambios)
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

    // --- ACTUALIZADO: Abrir modal adaptado a Reactive Forms ---
    openModal(action: 'create' | 'edit', event?: Event): void {
      if (action === 'edit' && event) {
        this.editingEvent = true;
        this.currentEventId = event._id;
        this.eventForm.patchValue({
          ...event,
          eventType: typeof event.eventType === 'object' ? (event.eventType as EventType)._id : event.eventType,
          contract: typeof event.contract === 'object' ? (event.contract as any)._id : event.contract,
          responsable: typeof event.responsable === 'object' ? (event.responsable as any)._id : event.responsable,
          startDate: new Date(event.startDate).toISOString().split('T')[0],
          endDate: new Date(event.endDate).toISOString().split('T')[0],
        });
      } else {
        this.editingEvent = false;
        this.currentEventId = null;
        this.eventForm.reset({
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          status: 'planificado'
        });
      }
      this.showModal = true;
    }

    // --- ACTUALIZADO: Cerrar modal ---
    closeModal(): void {
      this.showModal = false;
      this.eventForm.reset();
      this.currentEventId = null;
    }

    // --- ACTUALIZADO: Guardar evento con validación de Reactive Forms ---
    saveEvent(): void {
      if (this.eventForm.invalid) {
        // Marcar todos los campos como "tocados" para mostrar errores de validación
        this.eventForm.markAllAsTouched();
        alert('Por favor completa todos los campos requeridos (*)');
        return;
      }

      const formData = this.eventForm.value;

      if (this.editingEvent && this.currentEventId) {
        const updateData: UpdateEvent = {
          _id: this.currentEventId,
          ...formData
        };
        
        this.eventService.updateEvent(this.currentEventId, updateData).subscribe({
          next: () => {
            alert('Evento actualizado correctamente');
            this.closeModal();
          },
          error: (error) => alert('Error al actualizar el evento: ' + error.message)
        });
      } else {
        const newEvent: NewEvent = { ...formData };
        
        this.eventService.createEvent(newEvent).subscribe({
          next: () => {
            alert('Evento creado correctamente');
            this.closeModal();
          },
          error: (error) => alert('Error al crear el evento: ' + error.message)
        });
      }
    }

    // Confirmar eliminación (sin cambios)
    confirmDelete(id: string): void {
      const event = this.events.find(e => e._id === id);
      if (event) {
        const confirmDelete = confirm(`¿Estás seguro de eliminar el evento "${event.name}"?\nEsta acción no se puede deshacer.`);
        if (confirmDelete) {
          this.deleteEvent(id);
        }
      }
    }

    // Eliminar evento (sin cambios)
    deleteEvent(id: string): void {
      this.eventService.deleteEvent(id).subscribe({
        next: () => alert('Evento eliminado correctamente'),
        error: (error) => alert('Error al eliminar el evento: ' + error.message)
      });
    }

    // Funciones de ayuda (sin cambios)
    getCategoryName(eventType: string | EventType): string {
      if (typeof eventType === 'object') return eventType.name;
      const category = this.eventTypes.find(cat => cat._id === eventType);
      return category ? category.name : 'Sin categoría';
    }

    getStatusLabel(status: string): string {
      const statusObj = this.statusOptions.find(s => s.value === status);
      return statusObj ? statusObj.label : 'Desconocido';
    }

    getStatusIcon(status: string): string {
      const statusObj = this.statusOptions.find(s => s.value === status);
      return statusObj ? statusObj.icon : 'fas fa-question-circle';
    }

    formatDisplayDate(dateString: string | Date): string {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  }