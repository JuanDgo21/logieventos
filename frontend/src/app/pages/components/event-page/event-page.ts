import { Component, OnDestroy, OnInit } from '@angular/core';
import { Event, NewEvent, UpdateEvent } from '../../../shared/interfaces/event';
import { EventType } from '../../../shared/interfaces/event-type';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventService, User, Contract } from '../../../core/services/event';
import { AuthService } from '../../../../app/core/services/auth';

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
  availableEventTypes: EventType[] = [];
  filteredEvents: Event[] = [];
  isLoading: boolean = true;
  users: User[] = [];
  contracts: Contract[] = [];
  searchTerm = '';
  selectedStatus = 'all';
  selectedCategory = 'all';
  
  // Control del modal de Edición/Creación
  showModal = false;
  editingEvent = false;
  eventForm!: FormGroup;
  currentEventId: string | null = null;
  
  // Propiedades para Gestión de Roles y Modal de Vista
  showViewModal = false;
  eventToView: Event | null = null;
  currentUserRole: string = '';
  canCreate: boolean = false;
  canEdit: boolean = false;
  canDelete: boolean = false;
  
  private subscriptions: Subscription = new Subscription();

  statusOptions = [
    { value: 'planificado', label: 'Planificado', icon: 'far fa-calendar-plus' },
    { value: 'en_progreso', label: 'En progreso', icon: 'fas fa-running' },
    { value: 'completado', label: 'Completado', icon: 'fas fa-check-circle' },
    { value: 'cancelado', label: 'Cancelado', icon: 'fas fa-times-circle' }
  ];

  constructor(
    private eventService: EventService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUserPermissions();
    this.initializeForm();
    this.loadData();
    
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  loadUserPermissions(): void {
    this.canCreate = this.authService.hasAnyRole(['admin', 'coordinador']);
    this.canEdit = this.authService.hasAnyRole(['admin', 'coordinador']);
    this.canDelete = this.authService.hasRole('admin');
    this.currentUserRole = this.authService.getUserRole() || 'usuario';
  }
  
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
      next: (events) => { this.events = events; this.applyFilters(); this.isLoading = false; },

      complete: () => {
        // 1. Obtenemos los IDs únicos de los tipos de evento que están en uso.
        const usedEventTypeIds = new Set(
          this.events.map(event => typeof event.eventType === 'object' ? (event.eventType as EventType)._id : event.eventType)
        );

        // 2. Filtramos la lista completa de eventTypes para quedarnos solo con los que se están usando.
        this.availableEventTypes = this.eventTypes.filter(type => usedEventTypeIds.has(type._id));
      },

      error: (error) => { console.error('Error cargando eventos:', error); this.isLoading = false; }
    });

    const eventTypesSub = this.eventService.eventTypes$.subscribe({
      next: (eventTypes) => this.eventTypes = eventTypes,
      error: (error) => console.error('Error cargando tipos de eventos:', error)
    });

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
  }

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

  openModal(action: 'create' | 'edit', event?: Event): void {
    if (action === 'create' && this.canCreate) {
      this.editingEvent = false;
      this.currentEventId = null;
      this.eventForm.reset({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        status: 'planificado'
      });
      this.showModal = true;
    } else if (action === 'edit' && this.canEdit && event) {
      try {
        this.editingEvent = true;
        this.currentEventId = event._id;
        this.eventForm.patchValue({
          ...event,
          eventType: event.eventType && typeof event.eventType === 'object' ? (event.eventType as EventType)._id : event.eventType,
          contract: event.contract && typeof event.contract === 'object' ? (event.contract as any)._id : event.contract,
          responsable: event.responsable && typeof event.responsable === 'object' ? (event.responsable as any)._id : event.responsable,
          startDate: this.formatDateForInput(event.startDate),
          endDate: this.formatDateForInput(event.endDate),
        });
        this.showModal = true;
      } catch (error) {
        console.error("Error al procesar los datos del evento para editar:", error);
        alert("No se pudo abrir el modal de edición. Revisa la consola para más detalles.");
      }
    }
  }

  private formatDateForInput(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      console.warn(`Se encontró una fecha inválida en los datos del evento: ${date}`);
      return null;
    }
    return d.toISOString().split('T')[0];
  }

  closeModal(): void {
    this.showModal = false;
    this.eventForm.reset();
    this.currentEventId = null;
  }

  saveEvent(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      alert('Por favor completa todos los campos requeridos (*)');
      return;
    }
    const formData = this.eventForm.value;
    if (this.editingEvent && this.currentEventId) {
      const updateData: UpdateEvent = { _id: this.currentEventId, ...formData };
      this.eventService.updateEvent(this.currentEventId, updateData).subscribe({
        next: () => { alert('Evento actualizado correctamente'); this.closeModal(); },
        error: (error) => alert('Error al actualizar el evento: ' + error.message)
      });
    } else {
      const newEvent: NewEvent = { ...formData };
      this.eventService.createEvent(newEvent).subscribe({
        next: () => { alert('Evento creado correctamente'); this.closeModal(); },
        error: (error) => alert('Error al crear el evento: ' + error.message)
      });
    }
  }

  confirmDelete(id: string): void {
    const event = this.events.find(e => e._id === id);
    if (event && confirm(`¿Estás seguro de eliminar el evento "${event.name}"?`)) {
      this.deleteEvent(id);
    }
  }

  deleteEvent(id: string): void {
    this.eventService.deleteEvent(id).subscribe({
      next: () => alert('Evento eliminado correctamente'),
      error: (error) => alert('Error al eliminar el evento: ' + error.message)
    });
  }

  getCategoryName(eventType: any): string {
    if (!eventType) return 'Sin categoría';
    if (typeof eventType === 'object') return eventType.name;
    const category = this.eventTypes.find(cat => cat._id === eventType);
    return category ? category.name : 'Sin categoría';
  }

  getStatusLabel(status: string): string {
    return this.statusOptions.find(s => s.value === status)?.label || 'Desconocido';
  }

  getStatusIcon(status: string): string {
    return this.statusOptions.find(s => s.value === status)?.icon || 'fas fa-question-circle';
  }

  formatDisplayDate(dateString: string | Date): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  
  canOnlyView(): boolean { 
    return this.authService.hasRole('lider'); 
  }

  viewEventDetails(event: Event): void {
    this.eventToView = event;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.eventToView = null;
  }

  getContractName(contractData: any): string {
    if (!contractData) return 'No asignado';
    if (typeof contractData === 'object' && contractData.name) return contractData.name;
    const contractId = typeof contractData === 'object' ? contractData._id : contractData;
    const contract = this.contracts.find(c => c._id === contractId);
    return contract ? contract.name : `ID: ${contractId}`;
  }

  getResponsableName(responsableData: any): string {
    if (!responsableData) return 'No asignado';
    if (typeof responsableData === 'object' && responsableData.fullname) return responsableData.fullname;
    const responsableId = typeof responsableData === 'object' ? responsableData._id : responsableData;
    const user = this.users.find(u => u._id === responsableId);
    return user ? user.fullname : `ID: ${responsableId}`;
  }
}