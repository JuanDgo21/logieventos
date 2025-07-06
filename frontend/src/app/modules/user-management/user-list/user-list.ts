import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { User } from '../../../shared/interfaces/user';
import { UserService } from '../../../core/services/user';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserFormComponent } from '../user-form/user-form';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal';

@Component({
  selector: 'app-user-list',
  standalone: false,
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss'
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';
  statusFilter: string = 'all';
  roleFilter: string = 'all';
  loading = true;

  constructor(
    private userService: UserService,
    private modalService: NgbModal
  ) {
    console.log('UserListComponent initialized');
  }

  ngOnInit(): void {
    console.log('Loading users...');
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (response: any) => {
        console.log('Users response:', response);
        
        // Asegurándonos de que trabajamos con un array
        this.users = Array.isArray(response) ? response : response.data || [];
        console.log('Users loaded:', this.users.length);
        
        this.filteredUsers = [...this.users];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.loading = false;
        this.users = [];
        this.filteredUsers = [];
      }
    });
  }

  applyFilters(): void {
    console.log('Applying filters...', {
      searchTerm: this.searchTerm,
      statusFilter: this.statusFilter,
      roleFilter: this.roleFilter
    });

    if (!Array.isArray(this.users)) {
      console.error('Users is not an array:', this.users);
      this.filteredUsers = [];
      return;
    }

    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = 
        user.fullname?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.document?.toString().includes(this.searchTerm);
      
      const matchesStatus = 
        this.statusFilter === 'all' || 
        (this.statusFilter === 'active' && user.active) || 
        (this.statusFilter === 'inactive' && !user.active);
      
      const matchesRole = 
        this.roleFilter === 'all' || 
        user.role === this.roleFilter;
      
      return matchesSearch && matchesStatus && matchesRole;
    });

    console.log('Filtered users:', this.filteredUsers.length);
  }

  resetFilters(): void {
    console.log('Resetting filters');
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.roleFilter = 'all';
    this.applyFilters();
  }

  openUserForm(user?: User): void {
    console.log('Opening form for user:', user?._id);
    const modalRef = this.modalService.open(UserFormComponent, {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-xl'
    });
    modalRef.componentInstance.user = user || null;
    
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadUsers();
      }
    }).catch(() => {});
  }

  confirmDelete(user: User): void {
    console.log('Confirming delete for user:', user._id);
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
    console.log('Deleting user:', id);
    this.userService.deleteUser(id).subscribe({
      next: () => {
        console.log('User deleted successfully');
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error deleting user:', err);
      }
    });
  }

  toggleUserStatus(user: User): void {
    const newStatus = !user.active;
    console.log(`Toggling user ${user._id} status to: ${newStatus}`);
    
    this.userService.updateUser(user._id!, { active: newStatus }).subscribe({
      next: () => {
        console.log('User status updated successfully');
        user.active = newStatus;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error updating user status:', err);
      }
    });
  }

  handleButtonClick(action: string, user: User, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    console.log(`Action: ${action} on user: ${user._id}`);

    switch(action) {
      case 'edit':
        this.openUserForm(user);
        break;
      case 'delete':
        this.confirmDelete(user);
        break;
      case 'toggle':
        this.toggleUserStatus(user);
        break;
    }
  }
}