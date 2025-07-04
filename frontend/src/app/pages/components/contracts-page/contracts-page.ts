import { Component } from '@angular/core';
import { ContractService, Contract } from '../../../core/services/contract';

type ContractStatus = 'borrador' | 'activo' | 'completado' | 'cancelado';

@Component({
  selector: 'app-contracts-page',
  standalone: false,
  templateUrl: './contracts-page.html',
  styleUrl: './contracts-page.scss'
})
export class ContractsPage {
  contracts: Contract[] = [];

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
}
