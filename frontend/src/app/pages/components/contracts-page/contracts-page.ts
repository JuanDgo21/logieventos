import { Component } from '@angular/core';
import { ContractService, Contract } from '../../../core/services/contract';


type ContractStatus = 'borrador' | 'activo' | 'completado' | 'cancelado';

declare const bootstrap: any;

@Component({
  selector: 'app-contracts-page',
  standalone: false,
  templateUrl: './contracts-page.html',
  styleUrl: './contracts-page.scss'
})
export class ContractsPage {
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

  availableResources: any[] = [];
  availablePersonnel: any[] = [];
  activeProviders: any[] = [];

  selectedResources = new Set<string>();
  selectedPersonnel = new Set<string>();
  selectedProviders = new Set<string>();

  constructor(private contractService: ContractService) {}

  ngOnInit(): void {
    this.loadData(1);
    this.fetchAvailableItems();

    const today = new Date();
    this.newContract.startDate = this.formatDateOnly(today);
    this.newContract.endDate = this.formatDateOnly(today);
  }

  formatDateOnly(date: string | Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
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
        this.contracts = this.contracts.filter(c => c._id !== this.deleteId);
        this.loadStatusCounts();
        this.loadData(this.currentPage);
        this.closeConfirmModal();
      },
      error: (err) => console.error('Error eliminando contrato:', err)
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
    const modalElement = document.getElementById('contractDetailsModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  openEditModal(contract: Contract): void {
    this.selectedContract = JSON.parse(JSON.stringify(contract));
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedContract = null;
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

    this.contractService.updateContract(this.selectedContract._id, cleanedContract).subscribe({
      next: (updatedContract) => {
        const index = this.contracts.findIndex(c => c._id === updatedContract._id);
        if (index !== -1) {
          this.contracts[index] = updatedContract;
        }
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Error al guardar los cambios:', err);
      }
    });
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
    this.selectedResources.has(resource._id)
      ? this.selectedResources.delete(resource._id)
      : this.selectedResources.add(resource._id);
  }

  togglePerson(person: any) {
    this.selectedPersonnel.has(person._id)
      ? this.selectedPersonnel.delete(person._id)
      : this.selectedPersonnel.add(person._id);
  }

  toggleProvider(provider: any) {
    this.selectedProviders.has(provider._id)
      ? this.selectedProviders.delete(provider._id)
      : this.selectedProviders.add(provider._id);
  }

  isSelected(item: any, type: 'resource' | 'provider' | 'person') {
    if (type === 'resource') return this.selectedResources.has(item._id);
    if (type === 'provider') return this.selectedProviders.has(item._id);
    if (type === 'person') return this.selectedPersonnel.has(item._id);
    return false;
  }

  createContract() {

    console.log('Selected Resources IDs:', Array.from(this.selectedResources));
    console.log('Selected Providers IDs:', Array.from(this.selectedProviders));
    console.log('Selected Personnel IDs:', Array.from(this.selectedPersonnel));
    
    // Validación de fechas
    const startDate = new Date(this.newContract.startDate);
    const endDate = new Date(this.newContract.endDate);
  
    if (endDate < startDate) {
      alert('La fecha de fin no puede ser anterior a la fecha de inicio.');
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
      alert(`Faltan campos obligatorios: ${missingFields.join(', ')}`);
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
        alert('Contrato creado exitosamente');
        this.resetForm(); // Limpiar el formulario
        this.loadData(1); // Recargar lista
        this.closeModal('createContractModal'); // Cerrar modal
      },
      error: (err) => {
        console.error('Full error:', err); // ← Detalles completos
        if (err.status === 403) {
          alert('No tienes permisos para crear contratos o el presupuesto excede el límite.');
        } else {
          alert('Error al crear contrato. Verifica la consola para más detalles.');
        }
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
  }
  
  // Método para cerrar modales
  closeModal(modalId: string) {
    const modal = document.getElementById(modalId);
    if (modal) {
      const bsModal = bootstrap.Modal.getInstance(modal);
      bsModal?.hide();
    }
  }
}
