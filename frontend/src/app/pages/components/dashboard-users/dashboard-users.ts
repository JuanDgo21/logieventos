import { Component, OnInit } from '@angular/core';
import { User } from '../../../shared/interfaces/user';
import { UserService } from '../../../core/services/user';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal';
import { UserFormComponent } from '../../../modules/user-management/user-form/user-form';

@Component({
  selector: 'app-dashboard-users',
  standalone: false,
  templateUrl: './dashboard-users.html',
  styleUrl: './dashboard-users.scss'
})
export class DashboardUsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';
  statusFilter: string = 'all';
  loading = true;

  constructor(
    private userService: UserService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = 
        user.fullname.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.document.toString().includes(this.searchTerm);
      
      const matchesStatus = 
        this.statusFilter === 'all' || 
        (this.statusFilter === 'active' && user.active) || 
        (this.statusFilter === 'inactive' && !user.active);
      
      return matchesSearch && matchesStatus;
    });
  }

  openUserForm(user?: User): void {
    const modalRef = this.modalService.open(UserFormComponent, {
      centered: true,
      size: 'lg'
    });
    modalRef.componentInstance.user = user || null;
    
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadUsers(); // Recargar la lista después de guardar
      }
    }).catch(() => {});
  }

  confirmDelete(user: User): void {
    const modalRef = this.modalService.open(ConfirmModalComponent, {
      centered: true
    });
    modalRef.componentInstance.title = 'Confirmar eliminación';
    modalRef.componentInstance.message = `¿Estás seguro de eliminar a ${user.fullname}?`;
    modalRef.componentInstance.confirmText = 'Eliminar';
    modalRef.componentInstance.confirmClass = 'btn-danger';
    
    modalRef.result.then(() => {
      this.deleteUser(user._id!);
    }).catch(() => {});
  }

  deleteUser(id: string): void {
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.loadUsers(); // Recargar la lista después de eliminar
      },
      error: (err) => {
        console.error('Error deleting user:', err);
      }
    });
  }

  toggleUserStatus(user: User): void {
    const newStatus = !user.active;
    this.userService.updateUser(user._id!, { active: newStatus }).subscribe({
      next: () => {
        // Actualizar el estado localmente sin recargar
        const index = this.users.findIndex(u => u._id === user._id);
        if (index !== -1) {
          this.users[index].active = newStatus;
          this.applyFilters(); // Reaplicar filtros
        }
      },
      error: (err) => {
        console.error('Error updating user status:', err);
      }
    });
  }
}