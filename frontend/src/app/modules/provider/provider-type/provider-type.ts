  import { Component } from '@angular/core';
  import { HttpClient, HttpHeaders } from '@angular/common/http';
  import { AuthService } from '../../../core/services/auth';
  import { Router } from '@angular/router';
  import { AlertService } from '../../../core/services/alert';
  import { SidebarStateService } from '../../../core/services/sidebar-state';

  // ✅ Exporta la interfaz
  export interface ProviderType {
    _id?: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }

  @Component({
    selector: 'app-provider-type',
    standalone: false,
    templateUrl: './provider-type.html',
    styleUrl: './provider-type.scss'
  })
  // ✅ Cambia el nombre de la clase para evitar conflicto
  export class ProviderTypeComponent {
    apiUrl = 'http://localhost:3000/api/provider-types';

    providerTypes: ProviderType[] = [];
    newProviderType: ProviderType = this.getEmptyProviderType();
    editingProviderType: ProviderType | null = null;

    isLoading = false;
    errorMessage = '';
    successMessage = '';

    constructor(
      private http: HttpClient,
      private authService: AuthService,
      private router: Router,
      private alertService: AlertService,
      public sidebarState: SidebarStateService
    ) {
      this.sidebarState.isOpen = true;
      this.loadProviderTypes();
    }

    /** ===========================
     *  Helpers
     *  =========================== */
    private getAuthHeaders(): HttpHeaders {
      const token = this.authService.getToken();
      if (!token) {
        this.router.navigate(['/login']);
        throw new Error('No authentication token found');
      }
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
    }

    private getEmptyProviderType(): ProviderType {
      return {
        name: '',
        description: '',
        isActive: true
      };
    }

    private resetNewProviderType(): void {
      this.newProviderType = this.getEmptyProviderType();
    }

    private showSuccess(message: string): void {
      this.successMessage = message;
      setTimeout(() => this.successMessage = '', 3000);
    }

    /** ===========================
     *  CRUD Operations
     *  =========================== */
    loadProviderTypes(): void {
      this.isLoading = true;
      this.http.get<{ data: ProviderType[] }>(this.apiUrl, { headers: this.getAuthHeaders() })
        .subscribe({
          next: (res) => {
            this.providerTypes = res.data || [];
            this.isLoading = false;
          },
          error: (err) => {
            this.errorMessage = 'Error al cargar tipos de proveedor';
            console.error(err);
            this.isLoading = false;
          }
        });
    }

    createProviderType(): void {
      this.isLoading = true;
      this.http.post<ProviderType>(this.apiUrl, this.newProviderType, { headers: this.getAuthHeaders() })
        .subscribe({
          next: () => {
            this.loadProviderTypes();
            this.resetNewProviderType();
            this.showSuccess('Tipo de proveedor creado exitosamente');
            this.isLoading = false;
          },
          error: (err) => {
            this.isLoading = false;
            // Manejo específico para errores de duplicado
            const errorMessage = err.error?.message || 'Error al crear tipo de proveedor';
            this.alertService.showError({
              type: 'create',
              message: errorMessage
            });
          }
        });
    }

    updateProviderType(): void {
      if (!this.editingProviderType || !this.editingProviderType._id) return;
      this.isLoading = true;

      const url = `${this.apiUrl}/${this.editingProviderType._id}`;
      this.http.put<ProviderType>(url, this.editingProviderType, { headers: this.getAuthHeaders() })
        .subscribe({
          next: () => {
            this.loadProviderTypes();
            this.editingProviderType = null;
            this.showSuccess('Tipo de proveedor actualizado exitosamente');
            this.isLoading = false;
          },
          error: (err) => {
            this.isLoading = false;
            const errorMessage = err.error?.message || 'Error al actualizar tipo de proveedor';
            this.alertService.showError({
              type: 'update',
              message: errorMessage
            });
          }
        });
    }

    deleteProviderType(id: string): void {
      if (!id || !confirm('¿Eliminar tipo de proveedor?')) return;
      this.isLoading = true;

      this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
        .subscribe({
          next: () => {
            this.loadProviderTypes();
            this.showSuccess('Tipo de proveedor eliminado exitosamente');
            this.isLoading = false;
          },
          error: (err) => {
            this.isLoading = false;
            const errorMessage = err.error?.message || 'Error al eliminar tipo de proveedor';
            this.alertService.showError({
              type: 'delete',
              message: errorMessage
            });
          }
        });
    }

    /** ===========================
     *  Edit Helpers
     *  =========================== */
    editProviderType(providerType: ProviderType): void {
      this.editingProviderType = { ...providerType };
    }

    cancelEdit(): void {
      this.editingProviderType = null;
    }

    /** ===========================
     *  Status Management
     *  =========================== */
    toggleStatus(providerType: ProviderType): void {
      if (!providerType._id) return;
      
      const updatedProviderType = { 
        ...providerType, 
        isActive: !providerType.isActive 
      };
      
      this.http.put<ProviderType>(
        `${this.apiUrl}/${providerType._id}`, 
        updatedProviderType, 
        { headers: this.getAuthHeaders() }
      ).subscribe({
        next: () => {
          this.loadProviderTypes();
          this.showSuccess(
            `Tipo de proveedor ${updatedProviderType.isActive ? 'activado' : 'desactivado'} exitosamente`
          );
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Error al cambiar estado';
          this.alertService.showError({
            type: 'update',
            message: errorMessage
          });
        }
      });
    }

    /** ===========================
     *  Validation Helpers (Para usar en el template)
     *  =========================== */
    isValidProviderType(providerType: ProviderType): boolean {
      return providerType.name.length >= 3 && providerType.name.length <= 50;
    }

    getStatusText(isActive: boolean): string {
      return isActive ? 'Activo' : 'Inactivo';
    }

    getStatusClass(isActive: boolean): string {
      return isActive ? 'badge-success' : 'badge-secondary';
    }
  }