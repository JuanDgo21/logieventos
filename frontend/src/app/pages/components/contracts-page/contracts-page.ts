import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { ContractService, Contract } from '../../../core/services/contract';
import { AuthService } from '../../../core/services/auth';
import { MatSnackBar } from '@angular/material/snack-bar';

export class ContractsComponent {
  constructor(private authService: AuthService) {}

  isAdmin(): boolean {
    return this.authService.hasRole('admin');
  }

  isCoordinator(): boolean {
    return this.authService.hasRole('coordinador');
  }

  isLeader(): boolean {
    return this.authService.hasRole('lider');
  }

  canEditOrCreate(): boolean {
    return this.authService.hasAnyRole(['admin', 'coordinador']);
  }

  canDelete(): boolean {
    return this.authService.hasRole('admin');
  }

  canOnlyView(): boolean {
    return this.authService.hasRole('lider');
  }
}


type ContractStatus = 'borrador' | 'activo' | 'completado' | 'cancelado';

declare const bootstrap: any;

@Component({
  selector: 'app-contracts-page',
  standalone: false,
  templateUrl: './contracts-page.html',
  styleUrl: './contracts-page.scss'
})
export class ContractsPage {

  isAdmin(): boolean {
  return this.authService.hasRole('admin');
}

isCoordinator(): boolean {
  return this.authService.hasRole('coordinador');
}

isLeader(): boolean {
  return this.authService.hasRole('lider');
}

canEditOrCreate(): boolean {
  return this.authService.hasAnyRole(['admin', 'coordinador']);
}

canDelete(): boolean {
  return this.authService.hasRole('admin');
}

canOnlyView(): boolean {
  return this.authService.hasRole('lider');
}


  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef<HTMLInputElement>;

  // Propiedades de búsqueda
  searchTerm = '';
  isSearching = false;
  searchResults: Contract[] = [];
  showSearch = false;
  searchExecuted = false;
  createErrorMessage: string = '';


  // Método para buscar
  searchContracts(event?: Event): void {

    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!this.searchTerm.trim()) {
      this.clearSearch();
      return;
    }

    this.isSearching = true;
    this.contractService.searchContractsByName(this.searchTerm).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.searchExecuted = true; 
        this.isSearching = false;
      },
      error: (err) => {
        console.error('Error en búsqueda:', err);
        this.isSearching = false;
      }
    });
  }

  // Método para limpiar búsqueda
  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.isSearching = false;
    this.searchExecuted = false;
    this.loadData(1);
  }

  // Método para alternar la búsqueda
  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    if (this.showSearch) {
      setTimeout(() => {
        if (this.searchInput?.nativeElement) {
          this.searchInput.nativeElement.focus();
        }
      }, 100);
    } else if (!this.searchTerm) {
      this.clearSearch();
    }
  }

  

  contracts: Contract[] = [];
  selectedContract: Contract | null = null;
  showEditModal = false;

  // Paginación
  totalContracts = 0;
  currentPage = 1;
  totalPages = 1;
  limit = 2;

  get showingFrom(): number {
    return (this.currentPage - 1) * this.limit + 1;
  }

  get showingTo(): number {
    const max = this.currentPage * this.limit;
    return max > this.totalContracts ? this.totalContracts : max;
  }

  statusCounts: Record<ContractStatus, number> = {
    borrador: 0,
    activo: 0,
    completado: 0,
    cancelado: 0
  };

  readonly statusList: ContractStatus[] = ['borrador', 'activo', 'completado', 'cancelado'];

  readonly statusMeta: Record<ContractStatus, { color: string; label: string }> = {
    borrador: { color: 'secondary', label: 'Borrador' },
    activo: { color: 'success', label: 'Activo' },
    completado: { color: 'primary', label: 'Completado' },
    cancelado: { color: 'danger', label: 'Cancelado' }
  };

  isLoading = true;
  deleteId: string | null = null;

  // Datos para nuevo contrato
  newContract: Contract = {
    name: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    startDate: '',
    endDate: '',
    budget: 0,
    terms: '',
    resources: [],
    providers: [],
    personnel: [],
    status: 'borrador'
  };

  editContract: Contract = {
    name: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    startDate: '',
    endDate: '',
    budget: 0,
    status: 'borrador',
    terms: '',
    resources: [],
    providers: [],
    personnel: []
  };

  editErrorMessage: string = '';

  availableResources: any[] = [];
  availablePersonnel: any[] = [];
  activeProviders: any[] = [];

  selectedResources = new Set<string>();
  selectedPersonnel = new Set<string>();
  selectedProviders = new Set<string>();

  constructor(private contractService: ContractService, private authService: AuthService, private snackBar: MatSnackBar) {}
  private duplicateKeyError(message: string): boolean {
    return message.includes('duplicate key');
  }
  // Cierra la búsqueda al hacer clic fuera
@HostListener('document:click', ['$event'])
onClickOutside(event: Event) {
  const target = event.target as HTMLElement;
  const clickedInsideSearch = target.closest('.search-container-left');
  const clickedOnToggle = target.closest('.search-toggle');


  if (!clickedInsideSearch && !clickedOnToggle && this.showSearch) {
    this.showSearch = false;
    if (!this.searchTerm) {
      this.clearSearch();
    }
  }
}

onSearchClick(): void {
  if (!this.showSearch) {
    this.showSearch = true;
    return;
  }

  if (this.searchTerm?.trim()) {
    this.searchContracts();
  } else {
    this.toggleSearch();
  }
}



  isAdminOrCoordinator(): boolean {
  const userRole = this.authService.getUserRole();
  return userRole ? ['admin', 'coordinador'].includes(userRole) : false;
}

  ngOnInit(): void {
    this.loadData(1);
    this.fetchAvailableItems();

    const today = this.formatDateOnly(new Date());
    if (!this.newContract.startDate) this.newContract.startDate = today;
    if (!this.newContract.endDate) this.newContract.endDate = today;

  }

  formatDateOnly(date: string | Date): string {
    return new Date(date).toISOString().split('T')[0];
  }

  loadData(page: number = 1): void {
    this.isLoading = true;
    this.contractService.getContractsPaginated(page, this.limit).subscribe({
      next: (res) => {
        this.contracts = res.data;
        this.totalContracts = res.total;
        this.currentPage = res.page;
        this.totalPages = res.pages;
        this.loadStatusCounts();
      },
      error: (err) => {
        console.error('Error loading contracts:', err);
        this.isLoading = false;
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadData(page);
    }
  }

  loadStatusCounts(): void {
    this.contractService.getCountByStatus().subscribe({
      next: (counts) => {
        this.statusCounts = {
          borrador: counts.borrador || 0,
          activo: counts.activo || 0,
          completado: counts.completado || 0,
          cancelado: counts.cancelado || 0
        };
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading status counts:', err);
        this.isLoading = false;
      }
    });
  }

  getStatusCount(status: ContractStatus): number {
    return this.statusCounts[status];
  }

  get lastContract(): Contract | null {
    if (!this.contracts.length) return null;
    return this.contracts.reduce((latest, current) => {
      const latestDate = new Date(latest.createdAt ?? 0).getTime();
      const currentDate = new Date(current.createdAt ?? 0).getTime();
      return currentDate > latestDate ? current : latest;
    });
  }

  deleteContract(id: string): void {
    this.openConfirmModal(id);
  }

  openConfirmModal(id: string): void {
    this.deleteId = id;
    const modalElement = document.getElementById('confirmDeleteModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  confirmDelete(): void {
    if (!this.deleteId) return;

    this.contractService.deleteContract(this.deleteId!).subscribe({
      next: () => {
        this.snackBar.open('Contrato eliminado', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success'],
          horizontalPosition: 'right',
          verticalPosition: 'top'
      });
      this.loadData(this.currentPage);
      this.closeConfirmModal();
    },
    error: () => {
      this.snackBar.open('No se pudo eliminar el contrato', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-error'],
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    }
  });

  }

  closeConfirmModal(): void {
    const modalElement = document.getElementById('confirmDeleteModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal?.hide();
    }
    this.deleteId = null;
  }

  showDetails(contract: Contract): void {
    this.selectedContract = contract;
    console.log('[DETALLES]', this.selectedContract);
    const modalElement = document.getElementById('contractDetailsModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  openEditModal(contract: Contract): void {
    this.selectedContract = JSON.parse(JSON.stringify(contract));
    const toInputDate = (dateStr: string) => {
    const date = new Date(dateStr);
    // Ajustar al huso horario local
    const local = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return local.toISOString().split('T')[0]; // yyyy-MM-dd
    };
    this.editContract = {
      ...contract,
      startDate: this.formatDateOnly(contract.startDate),
      endDate: this.formatDateOnly(contract.endDate),
    };//JSON.parse(JSON.stringify(contract));
    this.showEditModal = true;
    this.editErrorMessage = '';

    

    // Limpiar selecciones anteriores
    this.selectedResources.clear();
    this.selectedProviders.clear();
    this.selectedPersonnel.clear();

    // Cargar recursos seleccionados con sus cantidades
    (this.selectedContract?.resources ?? []).forEach(r => {
      if (r && r.resource) {
        const resourceId = typeof r.resource === 'object' ? r.resource._id : r.resource;
        if (resourceId) {
          this.selectedResources.add(resourceId);
          const resource = this.availableResources.find(res => res._id === resourceId);
          if (resource) {
            resource.selectedQuantity = r.quantity;
          }
        }
      }
    });

    // Cargar proveedores seleccionados con sus datos
    (this.selectedContract?.providers ?? []).forEach(p => {
      if (p && p.provider) {
        const providerId = typeof p.provider === 'object' ? p.provider._id : p.provider;
        if (providerId) {
          this.selectedProviders.add(providerId);
          const provider = this.activeProviders.find(prov => prov._id === providerId);
          if (provider) {
            provider.serviceDescription = p.serviceDescription;
            provider.cost = p.cost;
          }
        }
      }
    });

    // Cargar personal seleccionado con sus datos
    (this.selectedContract?.personnel ?? []).forEach(p => {
    if (p && p.person) {
      const personId = typeof p.person === 'object' ? p.person._id : p.person;
      if (personId) {
        this.selectedPersonnel.add(personId);
        const person = this.availablePersonnel.find(per => per._id === personId);
        if (person) {
          person.role = p.role;
          person.hours = p.hours;
        }
      }
    }
  });

    const modalElement = document.getElementById('editContractModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }


  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedContract = null;
    this.cleanupAvailableItems();
  }

  cleanupAvailableItems(): void {
    // Elimina las propiedades temporales de las listas maestras
    this.availableResources.forEach(r => {
      delete r.selectedQuantity;
    });
    this.activeProviders.forEach(p => {
      delete p.serviceDescription;
      delete p.cost;
    });
    this.availablePersonnel.forEach(p => {
      delete p.role;
      delete p.hours;
    });
  }

  saveChanges(): void {
    if (!this.selectedContract || !this.selectedContract._id) return;

    const cleanedContract: Contract = {
      _id: this.selectedContract._id!,
      name: this.selectedContract.name!,
      clientName: this.selectedContract.clientName!,
      clientPhone: this.selectedContract.clientPhone!,
      clientEmail: this.selectedContract.clientEmail!,
      startDate: this.selectedContract.startDate!,
      endDate: this.selectedContract.endDate!,
      budget: this.selectedContract.budget!,
      status: this.selectedContract.status!,
      terms: this.selectedContract.terms!,
      createdAt: this.selectedContract.createdAt!,
      resources: [],
      providers: [],
      personnel: []
    };

  }
  

  fetchAvailableItems() {
    this.contractService.getResourcesByStatus('disponible').subscribe({
      next: (res) => (this.availableResources = res),
      error: (err) => console.error('Error cargando recursos:', err)
    });

    this.contractService.getPersonnelByStatus('disponible').subscribe({
      next: (res) => (this.availablePersonnel = res),
      error: (err) => console.error('Error cargando personal:', err)
    });

    this.contractService.getProvidersByStatus('activo').subscribe({
      next: (res) => (this.activeProviders = res),
      error: (err) => console.error('Error cargando proveedores:', err)
    });
  }

  toggleResource(resource: any) {
    const id = resource._id;
    if (this.selectedResources.has(id)) {
      this.selectedResources.delete(id);
      this.editContract.resources = this.editContract.resources.filter(r => 
        (typeof r.resource === 'object' ? r.resource._id : r.resource) !== id
      );
    } else {
      this.selectedResources.add(id);
      resource.selectedQuantity = resource.selectedQuantity || 1;
      this.editContract.resources.push({
        resource: id,
        quantity: resource.selectedQuantity
      });
    }
  }

  togglePerson(person: any) {
    const id = person._id;
    if (this.selectedPersonnel.has(id)) {
      this.selectedPersonnel.delete(id);
      this.editContract.personnel = this.editContract.personnel.filter(p => 
        (typeof p.person === 'object' ? p.person._id : p.person) !== id
      );
    } else {
      this.selectedPersonnel.add(id);
      person.role = person.role || '';
      person.hours = person.hours || 0;
      this.editContract.personnel.push({
        person: id,
        role: person.role,
        hours: person.hours
      });
    }
  }

  toggleProvider(provider: any) {
    const id = provider._id;
    if (this.selectedProviders.has(id)) {
      this.selectedProviders.delete(id);
      this.editContract.providers = this.editContract.providers.filter(p => 
        (typeof p.provider === 'object' ? p.provider._id : p.provider) !== id
      );
    } else {
      this.selectedProviders.add(id);
      provider.serviceDescription = provider.serviceDescription || '';
      provider.cost = provider.cost || 0;
      this.editContract.providers.push({
        provider: id,
        serviceDescription: provider.serviceDescription,
        cost: provider.cost
      });
    }
  }


  isSelected(item: any, type: 'resource' | 'person' | 'provider'): boolean {
  switch (type) {
    case 'resource':
      return this.selectedResources.has(item._id);
    case 'person':
      return this.selectedPersonnel.has(item._id);
    case 'provider':
      return this.selectedProviders.has(item._id);
    default:
      return false;
  }
}

  isSelectedForEdit(id: string, type: 'resource' | 'provider' | 'person'): boolean {
  if (type === 'resource') return this.selectedResources.has(id);
  if (type === 'provider') return this.selectedProviders.has(id);
  if (type === 'person') return this.selectedPersonnel.has(id);
  return false;
}
validateEditForm(): boolean {
  // Limpiar mensajes de error previos
  this.editErrorMessage = '';

  // Validar campos obligatorios
  if (!this.editContract.name || !this.editContract.clientName) {
    this.editErrorMessage = 'Por favor, completa todos los campos obligatorios.';
    return false;
  }

  // Validar fechas
  if (!this.editContract.startDate || !this.editContract.endDate) {
    this.editErrorMessage = 'Las fechas de inicio y fin son obligatorias.';
    return false;
  }

  const startDate = new Date(this.editContract.startDate);
  const endDate = new Date(this.editContract.endDate);
  
  if (endDate < startDate) {
    this.editErrorMessage = 'La fecha de fin no puede ser anterior a la fecha de inicio.';
    return false;
  }

  // Validar presupuesto
  if ((this.editContract.budget ?? 0) < 0) {
    this.editErrorMessage = 'El presupuesto no puede ser negativo.';
    return false;
  }

  // Validar teléfono
  const phoneRegex = /^(\+?\d{1,4}?[-.\s]?)?(\(\d{1,4}\)[-.\s]?)?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
  if (this.editContract.clientPhone && !phoneRegex.test(this.editContract.clientPhone)) {
    this.editErrorMessage = 'Número de teléfono inválido.';
    return false;
  }

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(this.editContract.clientEmail)) {
    this.editErrorMessage = 'Correo electrónico inválido.';
    return false;
  }

  return true;
}
validateResources(): boolean {
  for (const resource of this.availableResources.filter(r => this.selectedResources.has(r._id))) {
    // Validar cantidad negativa
    if (resource.selectedQuantity <= 0) {
      this.editErrorMessage = `La cantidad para el recurso ${resource.name} no puede ser negativa o cero.`;
      return false;
    }
    
    // Validar que no exceda disponibilidad (si tienes este dato)
    if (resource.availableQuantity !== undefined && resource.selectedQuantity > resource.availableQuantity) {
      this.editErrorMessage = `La cantidad para ${resource.name} excede la disponibilidad (${resource.availableQuantity}).`;
      return false;
    }
  }
  return true;
}
validateProviders(): boolean {
  let totalCost = 0;
  
  for (const provider of this.activeProviders.filter(p => this.selectedProviders.has(p._id))) {
    // Validar costo negativo
    if (provider.cost < 0) {
      this.editErrorMessage = `El costo para ${provider.name} no puede ser negativo.`;
      return false;
    }
    
    // Validar descripción de servicio
    if (!provider.serviceDescription || provider.serviceDescription.trim() === '') {
      this.editErrorMessage = `Debe especificar el servicio para ${provider.name}.`;
      return false;
    }
    
    totalCost += provider.cost || 0;
  }
  
  // Validar que no exceda el presupuesto (opinión personal: esto es buena práctica)
  if (this.editContract.budget !== undefined && totalCost > this.editContract.budget) {
    this.editErrorMessage = `El costo total de los proveedores ($${totalCost}) excede el presupuesto del contrato ($${this.editContract.budget}).`;
    return false;
  }
  
  return true;
}
validatePersonnel(): boolean {
  for (const person of this.availablePersonnel.filter(p => this.selectedPersonnel.has(p._id))) {
    // Validar horas negativas
    if (person.hours < 0) {
      this.editErrorMessage = `Las horas para ${person.firstName} ${person.lastName} no pueden ser negativas.`;
      return false;
    }
    
    // Validar rol
    if (!person.role || person.role.trim() === '') {
      this.editErrorMessage = `Debe especificar el rol para ${person.firstName} ${person.lastName}.`;
      return false;
    }
  }
  return true;
}



  createContract() {

    console.log('Selected Resources IDs:', Array.from(this.selectedResources));
    console.log('Selected Providers IDs:', Array.from(this.selectedProviders));
    console.log('Selected Personnel IDs:', Array.from(this.selectedPersonnel));
    if (!this.newContract.name || !this.newContract.clientName) {
      this.createErrorMessage = 'Por favor, completa todos los campos obligatorios.';
      return;
    }

    if (this.newContract.startDate === '' || this.newContract.endDate === '') {
      this.createErrorMessage = 'Las fechas de inicio y fin son obligatorias.';
      return;
    }

    if ((this.newContract.budget ?? 0) < 0) {
      this.createErrorMessage = 'El presupuesto no puede ser negativo.';
      return;
    }

    const phoneRegex = /^(\+?\d{1,4}?[-.\s]?)?(\(\d{1,4}\)[-.\s]?)?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
    if (this.newContract.clientPhone && !phoneRegex.test(this.newContract.clientPhone)) {
      this.createErrorMessage = 'Número de teléfono inválido.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newContract.clientEmail)) {
      this.createErrorMessage = 'Correo electrónico inválido.';
      return;
    }

    // if (this.duplicateKeyError(this.createErrorMessage)) {
    //   this.createErrorMessage = 'Ya existe un contrato con ese nombre. Intenta con otro.';
    //   return;
    // }
    


    // Limpiar mensajes de error previos
    this.createErrorMessage = '';
    
    // Validación de fechas
    const startDate = new Date(this.newContract.startDate);
    const endDate = new Date(this.newContract.endDate);
  
    if (endDate < startDate) {
      this.createErrorMessage = 'La fecha de fin no puede ser anterior a la fecha de inicio.';
      return;
    }

    if (!this.isAdminOrCoordinator() && this.newContract.status !== 'borrador') {
      this.snackBar.open('Solo administradores/coordinadores pueden crear contratos en otros estados', 'Cerrar', {
      duration: 3000,
      panelClass: ['snackbar-error'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
      });
      this.newContract.status = 'borrador';
      return;
    }

    // Mapear recursos seleccionados
  this.newContract.resources = this.availableResources
    .filter(r => this.selectedResources.has(r._id))
    .map(r => ({ 
      resource: r._id, 
      quantity: r.selectedQuantity || 1 
    }));

  // Mapear proveedores seleccionados
  this.newContract.providers = this.activeProviders
    .filter(p => this.selectedProviders.has(p._id))
    .map(p => ({
      provider: p._id,
      serviceDescription: p.serviceDescription || 'Sin descripción',
      cost: p.cost || 0
    }));

  // Mapear personal seleccionado
  this.newContract.personnel = this.availablePersonnel
    .filter(p => this.selectedPersonnel.has(p._id))
    .map(p => ({
      person: p._id,
      role: p.role || 'Sin rol definido',
      hours: p.hours || 0
    }));


    // Validación
    const requiredFields = ['name', 'clientName', 'clientEmail', 'startDate', 'endDate'];
    const missingFields = requiredFields.filter(field => !this.newContract[field as keyof Contract]);

    if (missingFields.length > 0) {
      this.snackBar.open(`Faltan campos obligatorios: ${missingFields.join(', ')}`, 'Cerrar', {
        duration: 4000,
        panelClass: ['snackbar-error'],
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    
    // Asegurar que el estado sea 'borrador' si no está definido
    if (!this.newContract.status) {
      this.newContract.status = 'borrador';
    }

    const contractToSend = {
      ...this.newContract,
      startDate: new Date(this.newContract.startDate).toISOString(),
      endDate: new Date(this.newContract.endDate).toISOString(),
      budget: this.newContract.budget || 0,
      terms: this.newContract.terms || 'Sin términos especificados',
      resources: this.newContract.resources || [], 
      providers: this.newContract.providers || [],
      personnel: this.newContract.personnel || []
    };

    console.log('Contrato a enviar:', contractToSend);

    this.contractService.createContract(contractToSend).subscribe({
      next: () => {
        this.snackBar.open('Contrato creado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success'],
          horizontalPosition: 'right',
          verticalPosition: 'top'
      });
      this.resetForm(); // Limpiar el formulario
      this.loadData(1); // Recargar lista
      this.closeModal('createContractModal'); // Cerrar modal
    },
    error: (err) => {
      console.error('Error al crear contrato:', err);
      const rawError = err.error?.error || '';

      if (typeof rawError === 'string' && rawError.includes('duplicate key')) {
        this.createErrorMessage = 'Ya existe un contrato con ese nombre. Intenta con otro.';
      } else if (err.status === 403) {
        this.createErrorMessage = 'No tienes permisos para crear contratos o el presupuesto excede el límite.';
      } else {
        this.createErrorMessage = err.error?.message || 'Error al crear contrato.';
      }
    
      this.snackBar.open(this.createErrorMessage, 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-error'],
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    
      console.error('Error details:', rawError);
    }

  });


  }

  // Método para limpiar el formulario
  resetForm() {
    this.newContract = {
      name: '',
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      startDate: this.formatDateOnly(new Date()),
      endDate: this.formatDateOnly(new Date()),
      budget: 0,
      status: 'borrador',
      terms: '',
      resources: [],
      providers: [],
      personnel: []
    };
    this.selectedResources.clear();
    this.selectedProviders.clear();
    this.selectedPersonnel.clear();
    this.cleanupAvailableItems();
  }
  
  // Método para cerrar modales
  closeModal(modalId: string) {
    const modal = document.getElementById(modalId);
    if (modal) {
      const bsModal = bootstrap.Modal.getInstance(modal);
      bsModal?.hide();
    }
    // Si se cierra el modal de creación, también limpiar
    if (modalId === 'createContractModal') {
      this.resetForm();
    }
    // Si se cierra el de edición, limpiar
    if (modalId === 'editContractModal') {
      this.closeEditModal();
    }
  }
  updateContract(): void {
    console.log('[DEBUG] Enviando a actualizar:', this.editContract);
    if (!this.editContract || !this.editContract._id) return;

    // Ejecutar todas las validaciones
    if (!this.validateEditForm()) return;
    if (!this.validateResources()) return;
    if (!this.validateProviders()) return;
    if (!this.validatePersonnel()) return;

    // Preparar los arrays actualizados
    this.editContract.resources = this.availableResources
      .filter(r => this.selectedResources.has(r._id))
      .map(r => ({ 
        resource: r._id, 
        quantity: r.selectedQuantity || 1 
      }));

    this.editContract.providers = this.activeProviders
      .filter(p => this.selectedProviders.has(p._id))
      .map(p => ({
        provider: p._id,
        serviceDescription: p.serviceDescription || 'Sin descripción',
        cost: p.cost || 0
      }));

    this.editContract.personnel = this.availablePersonnel
      .filter(p => this.selectedPersonnel.has(p._id))
      .map(p => ({
        person: p._id,
        role: p.role || 'Sin rol definido',
        hours: p.hours || 0
      }));

    this.contractService.updateContract(this.editContract._id, this.editContract).subscribe({
  next: (res) => {
    console.log('[DEBUG] Actualizado en backend:', res);
    this.snackBar.open('Contrato actualizado', 'Cerrar', {
      duration: 3000,
      panelClass: ['snackbar-success'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
    this.loadData(this.currentPage);
    this.closeModal('editContractModal');
  },
  error: (err) => {
  console.error('❌ Error al actualizar contrato:', err);
  console.log('[DEBUG] err.error:', err.error);

  const backendMessage = err.error?.message || err.error?.error || err.message;
  console.log('[DEBUG] backendMessage:', backendMessage);
  
  let message = 'Error al actualizar contrato.';

  if (typeof backendMessage === 'string') {
    if (backendMessage.includes('Ya existe un contrato con ese nombre')) {
      message = 'Ya existe un contrato con ese nombre. Intenta con otro.';
    } else {
      message = backendMessage;
    }
  }

  this.editErrorMessage = message;
  this.snackBar.open(message, 'Cerrar', {
    duration: 3000,
    panelClass: ['snackbar-error'],
    horizontalPosition: 'right',
    verticalPosition: 'top'
  });
}


});


  // Importante: no cerrar modal ni recargar nada
}
}