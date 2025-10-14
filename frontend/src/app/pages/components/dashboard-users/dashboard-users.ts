import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { User } from '../../../shared/interfaces/user';
import { UserService } from '../../../core/services/user';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal';
import { UserFormComponent } from '../../../modules/user-management/user-form/user-form';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';
// import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
// import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-dashboard-users',
  standalone: false,
  templateUrl: './dashboard-users.html',
  styleUrl: './dashboard-users.scss'
})
export class DashboardUsersComponent implements OnInit {
  userRole: string = '';
  stats = {
    activeUsers: 0,
    activePercentage: 0,
    totalUsers: 0
  };

  roleDistribution = {
    labels: ['Administradores', 'Coordinadores', 'Líderes'],
    data: [0, 0, 0],
    colors: ['bg-primary', 'bg-success', 'bg-info'],
    total: 0
  };

  recentUsers: User[] = [];
  loading = true;
  math = Math;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole() || '';
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (response: any) => {
        const users = Array.isArray(response) ? response : response.data || [];
        this.processUserData(users);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos:', err);
        this.loading = false;
      }
    });
  }

  processUserData(users: User[]): void {
    if (!Array.isArray(users)) {
      console.error('Los usuarios no son un array:', users);
      users = [];
    }

    this.stats.totalUsers = users.length;
    this.stats.activeUsers = users.filter(u => u.active).length;
    this.stats.activePercentage = this.stats.totalUsers > 0 
      ? Math.round((this.stats.activeUsers / this.stats.totalUsers) * 100)
      : 0;

    this.roleDistribution.data = [
      users.filter(u => u.role === 'admin').length,
      users.filter(u => u.role === 'coordinador').length,
      users.filter(u => u.role === 'lider').length
    ];
    this.roleDistribution.total = users.length;

    this.recentUsers = users
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }

  calculatePercentage(value: number): number {
    return this.roleDistribution.total > 0 
      ? (value / this.roleDistribution.total) * 100
      : 0;
  }

  openUserForm(): void {
    const modalRef = this.modalService.open(UserFormComponent, {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-xl'
    });
    
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadData();
      }
    }).catch(() => {});
  }

  openRoleManager(): void {
    console.log('Abrir administrador de roles');
  }

  viewReports(): void {
    console.log('Ver reportes de usuarios');
  }

  formatDate(dateString: string | Date | undefined): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  }

  getGradient(type: string): string {
    switch(type) {
      case 'activeUsers':
        return 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)';
      case 'activePercentage':
        return 'linear-gradient(135deg, #38ef7d 0%, #11998e 100%)';
      case 'totalUsers':
        return 'linear-gradient(135deg, #f46b45 0%, #eea849 100%)';
      case 'addUser':
        return 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)';
      case 'manageRoles':
        return 'linear-gradient(135deg, #38ef7d 0%, #11998e 100%)';
      case 'viewReports':
        return 'linear-gradient(135deg, #f46b45 0%, #eea849 100%)';
      default:
        return 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)';
    }
  }

  getUserRoleColor(role: string): string {
    switch(role) {
      case 'admin':
        return 'rgba(106, 17, 203, 0.2)';
      case 'coordinador':
        return 'rgba(56, 239, 125, 0.2)';
      case 'lider':
        return 'rgba(37, 117, 252, 0.2)';
      default:
        return 'rgba(255, 255, 255, 0.1)';
    }
  }

  getUserRoleIcon(role: string): string {
    switch(role) {
      case 'admin':
        return 'fas fa-user-shield';
      case 'coordinador':
        return 'fas fa-user-tie';
      case 'lider':
        return 'fas fa-user-check';
      default:
        return 'fas fa-user';
    }
  }

  getUserRoleBadge(role: string): string {
    switch(role) {
      case 'admin':
        return 'badge-primary';
      case 'coordinador':
        return 'badge-success';
      case 'lider':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  }

  getRoleColor(roleName: string): string {
    switch(roleName) {
      case 'Administradores':
        return '#6a11cb';
      case 'Coordinadores':
        return '#38ef7d';
      case 'Líderes':
        return '#2575fc';
      default:
        return '#6a11cb';
    }
  }
}