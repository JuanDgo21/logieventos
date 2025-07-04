import { Component } from '@angular/core';
import { ContractService, Contract } from '../../../core/services/contract';

type ContractStatus = 'borrador' | 'activo' | 'completado' | 'cancelado';

// Esto permite usar Bootstrap Modals con TypeScript
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

  constructor(private contractService: ContractService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.contractService.getContracts().subscribe({
      next: (contracts: Contract[]) => {
        this.contracts = contracts;
        this.loadStatusCounts();
      },
      error: (err) => {
        console.error('Error loading contracts:', err);
        this.isLoading = false;
      }
    });
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
    if (confirm('¿Estás seguro de eliminar este contrato?')) {
      this.contractService.deleteContract(id).subscribe({
        next: () => {
          this.contracts = this.contracts.filter(c => c._id !== id);
          this.loadStatusCounts();
        },
        error: (err) => console.error('Error deleting contract:', err)
      });
    }
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
  createdAt: this.selectedContract.createdAt!, // o Date.now() si no está
  // Si no vas a usar recursos/proveedores/personal por ahora:
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
