import { Component } from '@angular/core';
import { ContractService } from '../../../core/services/contract';

@Component({
  selector: 'app-contracts-page',
  standalone: false,
  templateUrl: './contracts-page.html',
  styleUrl: './contracts-page.scss'
})
export class ContractsPage {
contracts: any[] = [];
  statusCounts: { 
    borrador: number;
    activo: number;
    completado: number;
    cancelado: number;
  } = { 
    borrador: 0, 
    activo: 0, 
    completado: 0, 
    cancelado: 0 
  };
  isLoading = true;

  // Estados válidos para el template
  readonly statusList: Array<keyof typeof this.statusCounts> = [
    'borrador',
    'activo',
    'completado',
    'cancelado'
  ];

  constructor(private contractService: ContractService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.contractService.getContracts().subscribe({
      next: (contracts) => {
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
        // Asignación segura con validación de tipos
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

  getStatusCount(status: keyof typeof this.statusCounts): number {
    return this.statusCounts[status];
  }

  deleteContract(id: string): void {
    if (confirm('¿Estás seguro de eliminar este contrato?')) {
      this.contractService.deleteContract(id).subscribe({
        next: () => {
          this.contracts = this.contracts.filter(c => c._id !== id);
          this.loadStatusCounts(); // Actualiza los contadores
        },
        error: (err) => console.error('Error deleting contract:', err)
      });
    }
  }
}
