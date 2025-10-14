  import { Component } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms'; 
  import { HttpClient, HttpHeaders } from '@angular/common/http';
  import { AuthService } from '../../../core/services/auth';
  import { Router } from '@angular/router';
  import { AlertService } from '../../../core/services/alert';
  import { SidebarStateService } from '../../../core/services/sidebar-state';
  import { SidebarInventoryComponent } from '../../../shared/components/sidebar-inventory/sidebar-inventory';

  interface ResourceType {
    _id?: string;
    name: string;
    description: string;
    active: boolean;
    createdBy?: string;
  }

  @Component({
    selector: 'app-resource-types',
    standalone: false,
    templateUrl: './resource-types.html',
    styleUrl: './resource-types.scss'
  })
  export class ResourceTypesComponent {
    resourceTypes: ResourceType[] = [];
    newResourceType: ResourceType = { name: '', description: '', active: true };
    editingResourceType: ResourceType | null = null;
    apiUrl = 'http://localhost:3000/api/resource-types';
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
      this.loadResourceTypes();
      this.sidebarState.isOpen = true;
    }

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

    loadResourceTypes(): void {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.http.get<{data: ResourceType[]}>(this.apiUrl, { headers: this.getAuthHeaders() }).subscribe({
        next: (response) => {
          this.resourceTypes = response.data || [];
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = 'Error al cargar los tipos de recurso';
          console.error('Error loading resource types:', err);
          this.isLoading = false;
          if (err.status === 401 || err.status === 403) {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      });
    }

    createResourceType(): void {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.http.post<ResourceType>(this.apiUrl, this.newResourceType, { headers: this.getAuthHeaders() }).subscribe({
        next: () => {
          this.loadResourceTypes();
          this.newResourceType = { name: '', description: '', active: true };
          this.showSuccess('Tipo de recurso creado exitosamente');
          this.isLoading = false;
        },
        error: (err) => {
        this.isLoading = false;
        
        if (err.status === 401 || err.status === 403) {
          this.alertService.showError({
            type: 'auth',
            message: err.status === 401 
              ? 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
              : 'No tienes permisos suficientes para esta acción.'
          });
        } else {
          this.alertService.showError({
            type: 'create',
            message: 'Error al crear el tipo recurso: ' + (err.error?.message || '')
          });
        }
      }
      });
    }

    updateResourceType(): void {
      if (!this.editingResourceType) return;
      
      this.isLoading = true;
      this.errorMessage = '';
      const url = `${this.apiUrl}/${this.editingResourceType._id}`;
      
      this.http.put<ResourceType>(url, this.editingResourceType, { headers: this.getAuthHeaders() }).subscribe({
        next: () => {
          this.loadResourceTypes();
          this.editingResourceType = null;
          this.showSuccess('Tipo de recurso actualizado exitosamente');
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.alertService.showError({
            type: 'update',
            message: 'Error al actualizar: ' + (err.error?.message || '')
          });
        }
      });
    }

    deleteResourceType(id: string): void {
      if (!confirm('¿Estás seguro de eliminar este tipo de recurso?')) return;
      
      this.isLoading = true;
      this.errorMessage = '';
      const url = `${this.apiUrl}/${id}`;
      
      this.http.delete(url, { headers: this.getAuthHeaders() }).subscribe({
        next: () => {
          this.loadResourceTypes();
          this.showSuccess('Tipo de recurso eliminado exitosamente');
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.alertService.showError({
            type: 'delete',
            message: 'Error al eliminar: ' + (err.error?.message || '')
          });
        }
      });
    }

    // Métodos para manejar los cambios en los campos
    onNameChange(value: string): void {
      if (this.editingResourceType) {
        this.editingResourceType.name = value;
      } else {
        this.newResourceType.name = value;
      }
    }

    onDescriptionChange(value: string): void {
      if (this.editingResourceType) {
        this.editingResourceType.description = value;
      } else {
        this.newResourceType.description = value;
      }
    }

    onActiveChange(value: boolean): void {
      if (this.editingResourceType) {
        this.editingResourceType.active = value;
      }
    }

    editResourceType(resourceType: ResourceType): void {
      this.editingResourceType = { ...resourceType };
    }

    cancelEdit(): void {
      this.editingResourceType = null;
    }

    toggleStatus(resourceType: ResourceType): void {
      const updatedResourceType = { ...resourceType, active: !resourceType.active };
      this.http.put<ResourceType>(
        `${this.apiUrl}/${resourceType._id}`,
        { active: updatedResourceType.active },
        { headers: this.getAuthHeaders() }
      ).subscribe({
        next: () => {
          this.loadResourceTypes();
          this.showSuccess(`Tipo de recurso ${updatedResourceType.active ? 'activado' : 'desactivado'} exitosamente`);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Error al cambiar el estado';
          console.error('Error toggling status:', err);
        }
      });
    }

    private showSuccess(message: string): void {
      this.successMessage = message;
      setTimeout(() => this.successMessage = '', 3000);
    }
  }