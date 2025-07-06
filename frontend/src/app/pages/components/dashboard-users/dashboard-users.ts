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

  // Datos para la distribución de roles
  roleDistribution = {
    labels: ['Administradores', 'Coordinadores', 'Líderes'],
    data: [3, 7, 15],
    colors: ['bg-primary', 'bg-success', 'bg-info'],
    total: 25
  };

  // Definición de las acciones rápidas
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

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole() || '';
    this.loadStats();
    this.startSubtitleRotation();
  }

  loadStats(): void {
    this.userService.getAllUsers().subscribe({
      next: (users: User[]) => {
        this.stats.totalUsers = users.length;
        this.stats.activeUsers = users.filter(u => u.active).length;
        this.stats.activePercentage = this.stats.totalUsers > 0 
          ? Math.round((this.stats.activeUsers / this.stats.totalUsers) * 100)
          : 0;
      },
      error: (err) => console.error('Error al cargar estadísticas:', err)
    });
  }

  startSubtitleRotation(): void {
    setInterval(() => {
      this.currentSubtitle = (this.currentSubtitle + 1) % 3;
    }, 4000);
  }

  calculatePercentage(value: number): number {
    return (value / this.roleDistribution.total) * 100;
  }

  openUserForm(): void {
    console.log('Abrir formulario de usuario');
    // Implementación real aquí
  }

  openRoleManager(): void {
    console.log('Abrir administrador de roles');
    // Implementación real aquí
  }

  viewReports(): void {
    console.log('Ver reportes de usuarios');
    // Implementación real aquí
  }
}