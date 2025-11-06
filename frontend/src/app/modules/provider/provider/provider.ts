import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';
import { AlertService } from '../../../core/services/alert';
import { SidebarStateService } from '../../../core/services/sidebar-state';

interface Provider {
  _id?: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  providerType: string; // puede ser _id o nombre según cómo se creó
  status: 'activo' | 'inactivo' | 'suspendido';
}

interface ProviderType {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

@Component({
  selector: 'app-provider',
  standalone: false,
  templateUrl: './provider.html',
  styleUrls: ['./provider.scss']
})
export class ProviderComponent implements OnInit {
  apiUrl = 'http://localhost:3000/api/providers';
  apiTypesUrl = 'http://localhost:3000/api/provider-types';

  providers: Provider[] = [];
  providerTypes: ProviderType[] = [];

  newProvider: Provider = this.getEmptyProvider();
  editingProvider: Provider | null = null;

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly alertService: AlertService,
    public sidebarState: SidebarStateService
  ) {
    this.sidebarState.isOpen = true;
  }

  ngOnInit(): void {
    this.loadProviders();
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

  private getEmptyProvider(): Provider {
    return {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      providerType: '',
      status: 'activo'
    };
  }

  private resetNewProvider(): void {
    this.newProvider = this.getEmptyProvider();
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 3000);
  }

  /** ===========================
   *  CRUD
   *  =========================== */
  loadProviders(): void {
    this.isLoading = true;
    this.http.get<{ data: Provider[] }>(this.apiUrl, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (res) => {
          this.providers = res.data || [];
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = 'Error al cargar proveedores';
          console.error(err);
          this.isLoading = false;
        }
      });
  }

  loadProviderTypes(): void {
    this.http.get<{ data: ProviderType[] }>(this.apiTypesUrl, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (res) => {
          this.providerTypes = res.data.filter(type => type.isActive);
        },
        error: (err) => {
          console.error('Error al cargar tipos de proveedor', err);
        }
      });
  }

  createProvider(): void {
    this.isLoading = true;
    this.http.post<Provider>(this.apiUrl, this.newProvider, { headers: this.getAuthHeaders() })
      .subscribe({
        next: () => {
          this.loadProviders();
          this.resetNewProvider();
          this.showSuccess('Proveedor creado exitosamente');
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.alertService.showError({
            type: 'create',
            message: 'Error al crear proveedor: ' + (err.error?.message || '')
          });
        }
      });
  }

  updateProvider(): void {
    if (!this.editingProvider) return;
    this.isLoading = true;

    const url = `${this.apiUrl}/${this.editingProvider._id}`;
    this.http.put<Provider>(url, this.editingProvider, { headers: this.getAuthHeaders() })
      .subscribe({
        next: () => {
          this.loadProviders();
          this.editingProvider = null;
          this.showSuccess('Proveedor actualizado exitosamente');
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

  deleteProvider(id: string): void {
    if (!confirm('¿Eliminar proveedor?')) return;
    this.isLoading = true;

    this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: () => {
          this.loadProviders();
          this.showSuccess('Proveedor eliminado exitosamente');
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.alertService.showError({
            type: 'delete',
            message: 'Error al eliminar proveedor: ' + (err.error?.message || '')
          });
        }
      });
  }

  /** ===========================
   *  Edit Helpers
   *  =========================== */
  editProvider(provider: Provider): void {
    this.editingProvider = { ...provider };
  }

  cancelEdit(): void {
    this.editingProvider = null;
  }

  /** ===========================
   *  Mostrar nombre de tipo
   *  =========================== */
 getProviderTypeName(providerType: any): string {
  if (!providerType) return '---';

  // 🔹 Si es un objeto con nombre (caso viejo que guarda todos el objeto)
  if (typeof providerType === 'object' && providerType.name) {
    return providerType.name;
  }

  // 🔹 Si es un string (id en Mongo)
  if (typeof providerType === 'string') {
    const byId = this.providerTypes.find(t => t._id === providerType);
    if (byId) return byId.name;

    // Si no es un id válido pero es un texto
    const byName = this.providerTypes.find(
      t => t.name.toLowerCase() === providerType.toLowerCase()
    );
    if (byName) return byName.name;

    return providerType; // mostrar tal cual
  }

  // 🔹 Caso raro (número, booleano, etc.)
  return String(providerType);
}

}