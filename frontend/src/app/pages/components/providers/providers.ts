import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { ProviderService } from '../../../core/services/provider';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-providers',
  standalone: false,
  // imports: [
  //   CommonModule,
  //   RouterModule,
  //   FormsModule,
  //   RouterModule,
  //   ReactiveFormsModule
  // ],
  templateUrl: './providers.html',
  styleUrls: ['./providers.scss']
})
export class ProvidersPage implements OnInit {
  providers: any[] = [];
  filteredProviders: any[] = [];
  searchTerm: string = '';
  selectedFilter: string = '';
  selectedProvider: any = null;
  currentPage = 1;
  itemsPerPage = 10;
  isLoading = false;
  errorMessage: string | null = null;

  // Filtros simplificados
  filters = [
    { label: 'Todos', value: '' },
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' }
  ];

  constructor(
    private providerService: ProviderService,
    private authService: AuthService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadProviders();
  }

  // Permisos básicos
  get canCreateProvider(): boolean {
    return this.authService.hasAnyRole(['admin', 'coordinator']);
  }

  loadProviders(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.providerService.getProviders().subscribe({
      next: (response) => {
        this.providers = Array.isArray(response) ? response : response.data || [];
        this.filteredProviders = [...this.providers];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar los proveedores';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.providers];

    // Filtro por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name?.toLowerCase().includes(term)) || 
        (p.serviceType?.toLowerCase().includes(term))
      );
    }

    // Filtro por estado
    if (this.selectedFilter) {
      filtered = filtered.filter(p => p.status === this.selectedFilter);
    }

    this.filteredProviders = filtered;
  }

  confirmDelete(provider: any, modal: any): void {
    this.selectedProvider = provider;
    this.modalService.open(modal);
  }

  deleteProvider(): void {
    if (!this.selectedProvider) return;

    this.isLoading = true;
    this.providerService.deleteProvider(this.selectedProvider.id).subscribe({
      next: () => {
        this.loadProviders();
        this.modalService.dismissAll();
      },
      error: (err) => {
        this.errorMessage = 'Error al eliminar el proveedor';
        this.isLoading = false;
      }
    });
  }

  // Paginación básica
  get visibleProviders(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProviders.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProviders.length / this.itemsPerPage);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.selectedFilter = '';
    this.applyFilters();
  }

}