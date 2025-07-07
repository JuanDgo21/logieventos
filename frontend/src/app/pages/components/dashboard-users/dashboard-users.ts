import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { User } from '../../../shared/interfaces/user';
import { UserService } from '../../../core/services/user';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal';
import { UserFormComponent } from '../../../modules/user-management/user-form/user-form';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-dashboard-users',
  standalone: false,
  templateUrl: './dashboard-users.html',
  styleUrl: './dashboard-users.scss'
})
export class DashboardUsersComponent implements OnInit {
  
  userRole: string = '';
  currentSubtitle: number = 0;
  stats = {
    activeUsers: 0,
    activePercentage: 0,
    totalUsers: 0
  };

  roleDistribution = {
    labels: ['Administradores', 'Coordinadores', 'Líderes'],
    data: [0, 0, 0], // Inicializar en 0
    colors: ['bg-primary', 'bg-success', 'bg-info'],
    total: 0
  };

  quickActions = [
    {
      title: 'Agregar Usuario',
      icon: 'fas fa-user-plus',
      color: 'bg-primary',
      action: () => this.openUserForm()
    },
    {
      title: 'Administrar Roles',
      icon: 'fas fa-user-shield',
      color: 'bg-success',
      action: () => this.openRoleManager()
    },
    {
      title: 'Ver Reportes',
      icon: 'fas fa-chart-bar',
      color: 'bg-info',
      action: () => this.viewReports()
    }
  ];

  recentUsers: User[] = [];
  loading = true;
  // Añade esto en la clase DashboardUsersComponent
  public math = Math;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private modalService: NgbModal,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole() || '';
    this.loadData();
    this.startSubtitleRotation();
  }

  loadData(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (response: any) => {
        // Asegúrate de trabajar con un array
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

    // Estadísticas básicas
    this.stats.totalUsers = users.length;
    this.stats.activeUsers = users.filter(u => u.active).length;
    this.stats.activePercentage = this.stats.totalUsers > 0 
      ? Math.round((this.stats.activeUsers / this.stats.totalUsers) * 100)
      : 0;

    // Distribución de roles
    this.roleDistribution.data = [
      users.filter(u => u.role === 'admin').length,
      users.filter(u => u.role === 'coordinador').length,
      users.filter(u => u.role === 'lider').length
    ];
    this.roleDistribution.total = users.length;

    // Usuarios recientes (últimos 5)
    this.recentUsers = users
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }

  startSubtitleRotation(): void {
    setInterval(() => {
      this.currentSubtitle = (this.currentSubtitle + 1) % 3;
    }, 4000);
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
        this.loadData(); // Recargar datos después de guardar
      }
    }).catch(() => {});
  }

  openRoleManager(): void {
    // Implementación para administrar roles
    console.log('Abrir administrador de roles');
    // this.router.navigate(['/admin/roles']);
  }

  viewReports(): void {
    // Implementación para ver reportes
    console.log('Ver reportes de usuarios');
    // this.router.navigate(['/admin/reports/users']);
  }

  // Método para formatear fechas
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
}