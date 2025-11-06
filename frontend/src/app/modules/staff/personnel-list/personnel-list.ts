import { Component, OnInit } from '@angular/core';
import { PersonnelService } from '../../../core/services/personnel';
import { Personnel } from '../../../shared/interfaces/personnel';
import { PersonnelType } from '../../../shared/interfaces/personnel-type';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PersonnelFormComponent } from '../personnel-form/personnel-form';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-personnel-list',
  standalone: false,
  templateUrl: './personnel-list.html',
  styleUrl: './personnel-list.scss'
})
export class PersonnelListComponent implements OnInit {
  personnelList: Personnel[] = [];
  filteredList: Personnel[] = [];
  personnelTypes: PersonnelType[] = [];
  searchTerm: string = '';
  statusFilter: string = 'all';
  typeFilter: string = 'all';
  isLoading: boolean = true;
  alertMessage: string = '';
  alertType: string = '';

  statusOptions = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'asignado', label: 'Asignado' },
    { value: 'vacaciones', label: 'Vacaciones' },
    { value: 'inactivo', label: 'Inactivo' }
  ];

  constructor(
    private readonly personnelService: PersonnelService, // CORREGIDO: Añadido 'readonly'
    private readonly modalService: NgbModal, // CORREGIDO: Añadido 'readonly'
    private readonly authService: AuthService // CORREGIDO: Añadido 'readonly'
  ) {}

  ngOnInit(): void {
    this.loadData();
    
    this.personnelService.personnelList$.subscribe(list => {
      this.personnelList = list;
      this.filterData();
      this.isLoading = false;
    });

    this.personnelService.personnelTypes$.subscribe(types => {
      this.personnelTypes = types;
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.personnelService.getAllPersonnel().subscribe({
      error: () => this.showAlert('Error al cargar el personal', 'danger')
    });
    this.personnelService.getAllPersonnelTypes().subscribe({
      error: () => this.showAlert('Error al cargar las categorías', 'danger')
    });
  }

  filterData(): void {
    this.filteredList = this.personnelList.filter(personnel => {
      const fullName = `${personnel.firstName} ${personnel.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(this.searchTerm.toLowerCase()) || 
                          personnel.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' || 
                          personnel.status === this.statusFilter;
      const matchesType = this.typeFilter === 'all' || 
                         personnel.personnelType === this.typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.typeFilter = 'all';
    this.filterData();
  }

  openPersonnelForm(personnel?: Personnel): void {
    const modalRef = this.modalService.open(PersonnelFormComponent, { size: 'lg' });
    modalRef.componentInstance.personnel = personnel;
    modalRef.componentInstance.personnelTypes = this.personnelTypes;
    
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.showAlert(personnel ? 'Personal actualizado' : 'Personal creado', 'success');
        this.loadData();
      }
    }).catch(() => {});
  }

  toggleStatus(personnel: Personnel): void {
    const newStatus = personnel.status === 'disponible' ? 'inactivo' : 'disponible';
    this.personnelService.updatePersonnel(personnel._id, { ...personnel, status: newStatus })
      .subscribe({
        next: () => {
          this.showAlert('Estado actualizado', 'success');
          this.loadData();
        },
        error: () => this.showAlert('Error al actualizar estado', 'danger')
      });
  }

  confirmDelete(id: string): void {
    const modalRef = this.modalService.open(ConfirmModalComponent);
    modalRef.componentInstance.title = 'Confirmar eliminación';
    modalRef.componentInstance.message = '¿Estás seguro de eliminar este miembro del personal?';
    modalRef.componentInstance.confirmText = 'Eliminar';
    modalRef.componentInstance.confirmClass = 'btn-danger';
    
    modalRef.result.then((result) => {
      if (result) {
        this.personnelService.deletePersonnel(id).subscribe({
          next: () => {
            this.showAlert('Personal eliminado', 'success');
            this.loadData();
          },
          error: () => this.showAlert('Error al eliminar', 'danger')
        });
      }
    }).catch(() => {});
  }

  getStatusLabel(status: string): string {
    const statusOption = this.statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : 'Desconocido';
  }

  getTypeName(typeId: string): string {
    const type = this.personnelTypes.find(t => t._id === typeId);
    return type ? type.name : 'Sin categoría';
  }

  private showAlert(message: string, type: string): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => this.alertMessage = '', 5000);
  }

  // Métodos para verificar permisos:
  canCreate(): boolean {
    return this.authService.hasAnyRole(['admin', 'coordinador']);
  }

  canEdit(personnel: Personnel): boolean {
    return this.authService.hasAnyRole(['admin', 'coordinador']);
  }

  canDelete(): boolean {
    return this.authService.hasRole('admin');
  }

  canToggleStatus(): boolean {
    return this.authService.hasAnyRole(['admin', 'coordinador']);
  }
}