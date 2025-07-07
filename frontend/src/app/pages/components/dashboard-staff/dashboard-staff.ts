import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard-staff',
  standalone: false,
  templateUrl: './dashboard-staff.html',
  styleUrl: './dashboard-staff.scss'
})
export class DashboardStaffComponent  {
  // // Iconos de FontAwesome
  // faPlus = faPlus;
  // faEdit = faEdit;
  // faTrash = faTrash;
  // faToggleOn = faToggleOn;
  // faToggleOff = faToggleOff;

  // personnelList: Personnel[] = [];
  // personnelTypes: PersonnelType[] = [];
  // filteredPersonnel: Personnel[] = [];
  // selectedType: string = 'all';
  // searchQuery: string = '';
  // canEdit: boolean = false;
  // isLoading: boolean = true;

  // constructor(
  //   private personnelService: PersonnelService,
  //   private authService: AuthService,
  //   private modalService: NgbModal
  // ) {
  //   console.log('[DashboardStaff] Constructor inicializado');
  // }

  // ngOnInit(): void {
  //   console.log('[DashboardStaff] ngOnInit iniciado');
  //   this.checkPermissions();
  //   this.loadData();
  // }

  // checkPermissions(): void {
  //   console.log('[DashboardStaff] Verificando permisos...');
  //   this.canEdit = this.authService.hasAnyRole(['admin', 'coordinador']);
  //   console.log(`[DashboardStaff] Usuario puede editar: ${this.canEdit}`);
  // }

  // loadData(): void {
  //   console.log('[DashboardStaff] Iniciando carga de datos...');
  //   this.isLoading = true;
    
  //   // Cargar tipos de personal primero
  //   console.log('[DashboardStaff] Suscribiéndose a personnelTypes$');
  //   this.personnelService.personnelTypes$.subscribe({
  //     next: (types) => {
  //       console.log('[DashboardStaff] Types data received:', types);
  //       this.personnelTypes = types;
  //       this.loadPersonnel();
  //     },
  //     error: (err) => {
  //       console.error('[DashboardStaff] Error al obtener tipos de personal:', err);
  //       this.isLoading = false;
  //     }
  //   });

  //   console.log('[DashboardStaff] Llamando a getAllPersonnelTypes()');
  //   this.personnelService.getAllPersonnelTypes().subscribe({
  //     next: () => console.log('[DashboardStaff] getAllPersonnelTypes completado'),
  //     error: (err) => console.error('[DashboardStaff] Error en getAllPersonnelTypes:', err)
  //   });
  // }

  // loadPersonnel(): void {
  //   console.log('[DashboardStaff] Suscribiéndose a personnelList$');
  //   this.personnelService.personnelList$.subscribe({
  //     next: (list) => {
  //       console.log('[DashboardStaff] Personnel data received:', list);
  //       this.personnelList = list;
  //       this.filterData();
  //       this.isLoading = false;
  //     },
  //     error: (err) => {
  //       console.error('[DashboardStaff] Error al obtener personal:', err);
  //       this.isLoading = false;
  //     }
  //   });

  //   console.log('[DashboardStaff] Llamando a getAllPersonnel()');
  //   this.personnelService.getAllPersonnel().subscribe({
  //     next: () => console.log('[DashboardStaff] getAllPersonnel completado'),
  //     error: (err) => console.error('[DashboardStaff] Error en getAllPersonnel:', err)
  //   });
  // }

  // filterData(): void {
  //   this.filteredPersonnel = this.personnelList.filter(person => {
  //     const matchesType = this.selectedType === 'all' || 
  //                        person.personnelType === this.selectedType;
  //     const matchesSearch = person.firstName.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
  //                         person.lastName.toLowerCase().includes(this.searchQuery.toLowerCase());
  //     return matchesType && matchesSearch;
  //   });
  // }

  // getTypeName(typeId: string): string {
  //   if (!typeId) return 'Sin tipo';
  //   const type = this.personnelTypes.find(t => t._id === typeId);
  //   return type ? type.name : 'Desconocido';
  // }

  // openPersonnelForm(personnel?: Personnel): void {
  //   const modalRef = this.modalService.open(PersonnelFormComponent, { 
  //     size: 'lg',
  //     backdrop: 'static'
  //   });
  //   modalRef.componentInstance.personnel = personnel;
  //   modalRef.componentInstance.personnelTypes = this.personnelTypes;
    
  //   modalRef.result.then((result) => {
  //     if (result) {
  //       this.loadData();
  //     }
  //   }).catch(() => {});
  // }

  // toggleStatus(personnel: Personnel): void {
  //   const newStatus = personnel.status === 'inactivo' ? 'disponible' : 'inactivo';
  //   const update = {
  //     _id: personnel._id,
  //     status: (personnel.status === 'inactivo' ? 'disponible' : 'inactivo') as 'disponible' | 'asignado' | 'vacaciones' | 'inactivo'
  //   };

    
  //   this.personnelService.updatePersonnel(personnel._id, update).subscribe({
  //     next: () => {
  //       personnel.status = newStatus; // Actualización inmediata en la vista
  //     },
  //     error: (err) => {
  //       console.error('Error al actualizar estado:', err);
  //       // Revertir visualmente si hay error
  //       personnel.status = personnel.status === 'inactivo' ? 'disponible' : 'inactivo';
  //     }
  //   });
  // }

  // confirmDelete(personnel: Personnel): void {
  //   const modalRef = this.modalService.open(ConfirmModalComponent);
  //   modalRef.componentInstance.title = 'Confirmar eliminación';
  //   modalRef.componentInstance.message = `¿Estás seguro de eliminar a ${personnel.firstName} ${personnel.lastName}?`;
    
  //   modalRef.result.then((result) => {
  //     if (result) {
  //       this.deletePersonnel(personnel._id);
  //     }
  //   }).catch(() => {});
  // }

  // private deletePersonnel(id: string): void {
  //   this.personnelService.deletePersonnel(id).subscribe({
  //     next: () => {
  //       // Eliminación optimista
  //       this.personnelList = this.personnelList.filter(p => p._id !== id);
  //       this.filterData();
  //     },
  //     error: (err) => {
  //       console.error('Error al eliminar personal:', err);
  //       this.loadData(); // Recargar datos si hay error
  //     }
  //   });
  // }
}