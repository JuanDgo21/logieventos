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

  // Para eliminar con modal
  deleteId: string | null = null;

  constructor(private contractService: ContractService) {}

  ngOnInit(): void {
    this.loadData(1);
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
    this.selectedContract = JSON.parse(JSON.stringify(contract)); // Copia para edición segura
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedContract = null;
  }

  saveChanges(): void {
    if (!this.selectedContract || !this.selectedContract._id) {
      console.warn('No hay contrato seleccionado para guardar.');
      return;
    }

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
}
