import { Component, Input, OnInit } from '@angular/core';
import { NewPersonnelType, PersonnelType, UpdatePersonnelType } from '../../../shared/interfaces/personnel-type';
import { PersonnelTypeFormComponent } from '../personnel-type-form/personnel-type-form';
import { PersonnelService } from '../../../core/services/personnel';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-personnel-type-list',
  standalone: false,
  templateUrl: './personnel-type-list.html',
  styleUrl: './personnel-type-list.scss'
})
export class PersonnelTypeListComponent implements OnInit {
  personnelTypes: PersonnelType[] = [];
  filteredTypes: PersonnelType[] = [];
  searchTerm: string = '';
  statusFilter: string = 'all';
  isLoading: boolean = true;
  alertMessage: string = '';
  alertType: string = '';

  constructor(
    private personnelService: PersonnelService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadData();
    
    this.personnelService.personnelTypes$.subscribe(types => {
      this.personnelTypes = types;
      this.filterData();
      this.isLoading = false;
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.personnelService.getAllPersonnelTypes().subscribe({
      error: () => this.showAlert('Error al cargar las categorías', 'danger')
    });
  }

  filterData(): void {
    this.filteredTypes = this.personnelTypes.filter(type => {
      const matchesSearch = type.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' || 
                          (this.statusFilter === 'active' && type.isActive) || 
                          (this.statusFilter === 'inactive' && !type.isActive);
      
      return matchesSearch && matchesStatus;
    });
  }

  openTypeForm(type?: PersonnelType): void {
    const modalRef = this.modalService.open(PersonnelTypeFormComponent, { 
      size: 'md',
      backdrop: 'static'
    });
    modalRef.componentInstance.type = type || null;
    
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.showAlert(type ? 'Categoría actualizada' : 'Categoría creada', 'success');
        this.loadData();
      }
    }).catch(() => {});
  }

  toggleStatus(type: PersonnelType): void {
    const newStatus = !type.isActive;
    this.personnelService.updatePersonnelType(type._id, {
      isActive: newStatus,
      _id: ''
    })
      .subscribe({
        next: () => this.showAlert(
          `Categoría ${newStatus ? 'activada' : 'desactivada'}`, 
          newStatus ? 'success' : 'warning'
        ),
        error: () => this.showAlert('Error al cambiar estado', 'danger')
      });
  }

  confirmDelete(id: string): void {
    const modalRef = this.modalService.open(ConfirmModalComponent);
    modalRef.componentInstance.title = 'Confirmar eliminación';
    modalRef.componentInstance.message = '¿Estás seguro de eliminar esta categoría?';
    modalRef.componentInstance.confirmText = 'Eliminar';
    modalRef.componentInstance.confirmClass = 'btn-danger';
    
    modalRef.result.then((result) => {
      if (result) {
        this.deleteType(id);
      }
    }).catch(() => {});
  }

  private deleteType(id: string): void {
    this.personnelService.deletePersonnelType(id).subscribe({
      next: () => this.showAlert('Categoría eliminada', 'success'),
      error: () => this.showAlert('Error al eliminar', 'danger')
    });
  }

  private showAlert(message: string, type: string): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => this.alertMessage = '', 5000);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.filterData();
  }
}