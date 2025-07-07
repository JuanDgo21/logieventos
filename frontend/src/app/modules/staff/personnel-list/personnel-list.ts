import { Component, OnInit } from '@angular/core';
import { PersonnelService } from '../../../core/services/personnel';
import { Personnel } from '../../../shared/interfaces/personnel';
import { PersonnelType } from '../../../shared/interfaces/personnel-type';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PersonnelFormComponent } from '../personnel-form/personnel-form';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal';

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
    private personnelService: PersonnelService,
    private modalService: NgbModal
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

  getStatusLabel(status: string): string {
    const statusOption = this.statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : 'Desconocido';
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

  getStatusClass(status: string): string {
    switch(status) {
      case 'disponible': return 'bg-success';
      case 'asignado': return 'bg-primary';
      case 'vacaciones': return 'bg-warning text-dark';
      case 'inactivo': return 'bg-secondary';
      default: return 'bg-light text-dark';
    }
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
          next: () => this.showAlert('Personal eliminado', 'success'),
          error: () => this.showAlert('Error al eliminar', 'danger')
        });
      }
    }).catch(() => {});
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
}