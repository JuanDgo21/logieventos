import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { EventService, PersonnelType } from '../../../core/services/event';
import { EventType, NewEventType, UpdateEventType } from '../../../shared/interfaces/event-type';

@Component({
  selector: 'app-event-type', // <-- CORREGIDO
  standalone: false,
  templateUrl: './event-type.html', // <-- CORREGIDO
  styleUrls: ['./event-type.scss'] // <-- CORREGIDO
})
export class EventTypeComponent implements OnInit, OnDestroy {
  eventTypes: EventType[] = [];
  filteredEventTypes: EventType[] = [];
  isLoading = true;
  
  searchTerm = '';
  selectedCategory = 'all';
  showModal = false;
  isEditing = false;
  
  eventTypeForm!: FormGroup;
  currentEventTypeId: string | null = null;

  personnelTypes: PersonnelType[] = [];
  
  private subscriptions = new Subscription();

  categoryOptions = ['corporativo', 'social', 'cultural', 'deportivo', 'academico'];
  resourceTypeOptions = ['sonido', 'mobiliario', 'catering', 'iluminacion', 'otros'];

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
  
  initializeForm(): void {
    this.eventTypeForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      defaultResources: this.fb.array([]),
      requiredPersonnelType: [null, Validators.required],
      estimatedDuration: [1, [Validators.min(1), Validators.max(24)]],
      category: [null, Validators.required],
      additionalRequirements: this.fb.array([]),
      active: [true]
    });
  }

  get defaultResources() {
    return this.eventTypeForm.get('defaultResources') as FormArray;
  }

  addResource() {
    const resourceForm = this.fb.group({
      resourceType: ['otros', Validators.required],
      description: ['', Validators.required],
      defaultQuantity: [1, [Validators.required, Validators.min(1)]]
    });
    this.defaultResources.push(resourceForm);
  }

  removeResource(index: number) {
    this.defaultResources.removeAt(index);
  }

  get additionalRequirements() {
    return this.eventTypeForm.get('additionalRequirements') as FormArray;
  }

  addRequirement() {
    this.additionalRequirements.push(this.fb.control('', Validators.required));
  }

  removeRequirement(index: number) {
    this.additionalRequirements.removeAt(index);
  }

  loadData(): void {
    this.isLoading = true;
    const eventTypesSub = this.eventService.eventTypes$.subscribe({
      next: (types) => {
        this.eventTypes = types;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar los tipos de evento', err);
        this.isLoading = false;
      }
    });
    const personnelTypesSub = this.eventService.personnelTypes$.subscribe(pTypes => {
      this.personnelTypes = pTypes;
    });
    this.subscriptions.add(eventTypesSub);
    this.subscriptions.add(personnelTypesSub);
    
    this.eventService.getAllEventTypes().subscribe();
    this.eventService.getAllPersonnelTypes().subscribe();
  }

  applyFilters(): void {
    this.filteredEventTypes = this.eventTypes.filter(type => {
      const matchesSearch = this.searchTerm === '' ||
        type.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (type.description && type.description.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesCategory = this.selectedCategory === 'all' || type.category === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }

  openModal(mode: 'create' | 'edit', eventType?: EventType): void {
    this.isEditing = mode === 'edit';
    this.eventTypeForm.reset({ active: true, estimatedDuration: 1 }); 
    this.defaultResources.clear();
    this.additionalRequirements.clear();

    if (this.isEditing && eventType) {
      this.currentEventTypeId = eventType._id;
      this.eventTypeForm.patchValue(eventType);
      
      eventType.defaultResources?.forEach(res => {
        this.defaultResources.push(this.fb.group(res));
      });
      eventType.additionalRequirements?.forEach(req => {
        this.additionalRequirements.push(this.fb.control(req));
      });

    } else {
      this.currentEventTypeId = null;
      this.addResource();
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.eventTypeForm.reset();
    this.currentEventTypeId = null;
  }

  saveEventType(): void {
    if (this.eventTypeForm.invalid) {
      this.eventTypeForm.markAllAsTouched();
      alert('Por favor completa todos los campos requeridos (*)');
      return;
    }

    const formData = this.eventTypeForm.value;

    if (this.isEditing && this.currentEventTypeId) {
      const updateData: UpdateEventType = { _id: this.currentEventTypeId, ...formData };
      this.eventService.updateEventType(this.currentEventTypeId, updateData).subscribe({
        next: () => {
          alert('Tipo de evento actualizado correctamente');
          this.closeModal();
        },
        error: (err) => alert(`Error al actualizar: ${err.message}`)
      });
    } else {
      const newData: NewEventType = formData;
      this.eventService.createEventType(newData).subscribe({
        next: () => {
          alert('Tipo de evento creado correctamente');
          this.closeModal();
        },
        error: (err) => alert(`Error al crear: ${err.message}`)
      });
    }
  }

  confirmDelete(eventType: EventType): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el tipo de evento "${eventType.name}"?`)) {
      this.eventService.deleteEventType(eventType._id).subscribe({
        next: () => alert('Tipo de evento eliminado correctamente'),
        error: (err) => alert(`Error al eliminar: ${err.message}`)
      });
    }
  }

  onStatusChange(eventType: EventType): void {
    const newStatus = !eventType.active;
    
    const updatePayload: UpdateEventType = {
      _id: eventType._id,
      active: newStatus
    };

    this.eventService.updateEventType(eventType._id, updatePayload).subscribe({
      next: updatedEventType => {
        const index = this.eventTypes.findIndex(et => et._id === updatedEventType._id);
        if (index !== -1) {
          this.eventTypes[index] = updatedEventType;
          this.applyFilters();
        }
      },
      error: err => {
        alert(`Error al actualizar el estado: ${err.message}`);
        this.applyFilters();
      }
    });
  }
}