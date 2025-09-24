import { Component } from '@angular/core';
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
  providerType: string;
  status: 'activo' | 'inactivo' | 'suspendido';
}

@Component({
  selector: 'app-provider',
  standalone: false,
  templateUrl: './provider.html',
  styleUrls: ['./provider.scss']
})
export class ProviderComponent {
  apiUrl = 'http://localhost:3000/api/providers';

  providers: Provider[] = [];
  newProvider: Provider = this.getEmptyProvider();
  editingProvider: Provider | null = null;

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
    this.loadProviders();
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
}
