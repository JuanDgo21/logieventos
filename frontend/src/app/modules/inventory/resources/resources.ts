import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- Añade esta importación
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';

interface Resource {
  _id?: string;
  name: string;
  description: string;
  quantity: number;
  cost: number;
  resourceType: {
    _id: string;
    name: string;
    description?: string;
  } | string; // Puede ser el objeto completo o solo el ID
  status: string;
}

interface ResourceType {
  _id: string;
  name: string;
  description?: string;
  active: boolean;
  createdBy?: {
    username: string;
    role: string;
  };
}

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, FormsModule], // <-- Añade FormsModule aquí
  templateUrl: './resources.html',
  styleUrls: ['./resources.scss']
})

export class ResourcesComponent implements OnInit {
  resources: Resource[] = [];
  resourceTypes: ResourceType[] = [];
  newResource: Resource = { 
    name: '', 
    description: '', 
    quantity: 0,
    cost: 0,
    resourceType: '',
    status: 'disponible'
  };
  editingResource: Resource | null = null;
  apiUrl = 'http://localhost:3000/api/resources';
  apiResourceTypesUrl = 'http://localhost:3000/api/resource-types/active';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  statusOptions = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'en_uso', label: 'En Uso' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'descartado', label: 'Descartado' }
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadResources();
    this.loadActiveResourceTypes();
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

  loadResources(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders() }).subscribe({
      next: (response) => {
        // Asegúrate de que la respuesta sea un array
        this.resources = Array.isArray(response) ? response : 
                        response.data ? response.data : 
                        response.resources ? response.resources : [];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar los recursos';
        console.error('Error loading resources:', err);
        this.isLoading = false;
        if (err.status === 401 || err.status === 403) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  private parseApiResponse(response: any): Resource[] {
    if (Array.isArray(response)) {
      return response;
    } else if (response?.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response?.resources && Array.isArray(response.resources)) {
      return response.resources;
    } else if (response?.items && Array.isArray(response.items)) {
      return response.items;
    }
    console.warn('Unexpected API response structure:', response);
    return [];
  }

  loadActiveResourceTypes(): void {
    this.http.get<{data: ResourceType[]}>(`http://localhost:3000/api/resource-types/active`, { 
      headers: this.getAuthHeaders() 
    }).subscribe({
      next: (response) => {
        this.resourceTypes = response.data || [];
      },
      error: (err) => {
        console.error('Error loading active resource types:', err);
        this.errorMessage = 'Error al cargar tipos de recursos activos';
      }
    });
  }

  createResource(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.http.post(this.apiUrl, this.newResource, { headers: this.getAuthHeaders() }).subscribe({
      next: () => {
        this.loadResources();
      },
      error: (err) => {
        this.errorMessage = 'Error al crear el recurso';
        console.error('Error creating resource:', err);
        this.isLoading = false;      }
    });
  }

  updateResource(): void {
    if (!this.editingResource) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.put<Resource>(
      `${this.apiUrl}/${this.editingResource._id}`,
      this.editingResource,
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: () => {
        this.loadResources();
        this.editingResource = null;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Error al actualizar el recurso';
        console.error('Error updating resource:', err);
        this.isLoading = false;
      }
    });
  }

  deleteResource(id: string): void {
    if (!confirm('¿Estás seguro de eliminar este recurso?')) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() }).subscribe({
      next: () => {
        this.loadResources();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Error al eliminar el recurso';
        console.error('Error deleting resource:', err);
        this.isLoading = false;
      }
    });
  }

  onNameChange(value: string): void {
    if (this.editingResource) {
      this.editingResource.name = value;
    } else {
      this.newResource.name = value;
    }
  }

  onDescriptionChange(value: string): void {
    if (this.editingResource) {
      this.editingResource.description = value;
    } else {
      this.newResource.description = value;
    }
  }

  onQuantityChange(value: string): void {
    const numValue = Number(value);
    if (this.editingResource) {
      this.editingResource.quantity = numValue;
    } else {
      this.newResource.quantity = numValue;
    }
  }

  onCostChange(value: string): void {
    const numValue = Number(value);
    if (this.editingResource) {
      this.editingResource.cost = numValue;
    } else {
      this.newResource.cost = numValue;
    }
  }

  onFieldChange(field: string, value: any): void {
    if (this.editingResource) {
      (this.editingResource as any)[field] = value;
    } else {
      (this.newResource as any)[field] = value;
    }
  }

  getResourceTypeName(resource: Resource): string {
    if (!resource.resourceType) return 'Sin tipo';
    
    // Si es string (solo el ID)
    if (typeof resource.resourceType === 'string') {
      const type = this.resourceTypes.find(t => t._id === resource.resourceType);
      return type ? type.name : 'Desconocido';
    }
    
    // Si es objeto completo
    return resource.resourceType.name || 'Desconocido';
  }

  // getResourceDescription(resource: Resource): string | null {
  //   if (!resource.resourceType) return null;
    
  //   if (typeof resource.resourceType === 'string') {
  //     const type = this.resourceTypes.find(t => t._id === resource.resourceType);
  //     return type?.description || null;
  //   }
    
  //   return resource.resourceType.description || null;
  // }

  getStatusLabel(status: string): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  }

  editResource(resource: Resource): void {
    this.editingResource = { ...resource };
  }

  cancelEdit(): void {
    this.editingResource = null;
  } 
}
