import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-dashboard-staff',
  standalone: false,
  templateUrl: './dashboard-staff.html',
  styleUrl: './dashboard-staff.scss'
})
export class DashboardStaffComponent  implements OnInit {
  currentSubtitle: number = 0;
  
  // Datos estáticos para el dashboard
  stats = {
    totalEmployees: 125,
    activeEmployees: 118,
    onVacation: 7,
    newHires: 5
  };

  departmentDistribution = {
    labels: ['TI', 'RRHH', 'Ventas', 'Operaciones', 'Marketing'],
    data: [15, 8, 42, 45, 15],
    colors: ['bg-primary', 'bg-success', 'bg-info', 'bg-warning', 'bg-danger'],
    total: 125
  };

  quickActions = [
    {
      title: 'Agregar Empleado',
      icon: 'fas fa-user-plus',
      color: 'bg-primary',
      action: () => this.showAlert('Agregar empleado')
    },
    {
      title: 'Gestionar Vacaciones',
      icon: 'fas fa-umbrella-beach',
      color: 'bg-success',
      action: () => this.showAlert('Gestionar vacaciones')
    },
    {
      title: 'Generar Reporte',
      icon: 'fas fa-file-alt',
      color: 'bg-info',
      action: () => this.showAlert('Generar reporte')
    }
  ];

  ngOnInit(): void {
    this.startSubtitleRotation();
  }

  startSubtitleRotation(): void {
    setInterval(() => {
      this.currentSubtitle = (this.currentSubtitle + 1) % 3;
    }, 4000);
  }

  calculatePercentage(value: number): number {
    return (value / this.departmentDistribution.total) * 100;
  }

  showAlert(action: string): void {
    alert(`Acción: ${action} (simulada)`);
  }
}