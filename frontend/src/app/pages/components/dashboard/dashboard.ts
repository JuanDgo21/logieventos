import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth';
import { LayoutService } from '../../../core/services/layout';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  summaryData = [
    { icon: 'calendar', value: 12, label: 'Eventos Activos', key: 'activeEvents' },
    { icon: 'file-contract', value: 5, label: 'Contratos', key: 'contracts' },
    { icon: 'box-open', value: 24, label: 'Recursos', key: 'resources' },
    { icon: 'users', value: 8, label: 'Personal', key: 'staff' }
  ];

  quickActions = [
    { icon: 'plus-circle', label: 'Nuevo Evento', action: 'newEvent', roles: ['admin', 'coordinador'], key: 'activeEvents' },
    { icon: 'calendar-day', label: 'Agenda Diaria', action: 'dailyAgenda', key: 'activeEvents' },
    { icon: 'exclamation-triangle', label: 'Reportar Incidente', action: 'reportIssue', key: 'resources' },
    { icon: 'file-contract', label: 'Contratos', action: 'viewContracts', key: 'contracts' },
    { icon: 'users', label: 'Personal', action: 'viewStaff', key: 'staff' },
    { icon: 'truck', label: 'Proveedores', action: 'viewProviders', key: 'resources' },
    { icon: 'file-export', label: 'Reportes', action: 'generateReports', roles: ['admin', 'coordinador'], key: 'contracts' }
  ];

  recentActivities = [
    { icon: 'calendar-check', message: 'Nuevo evento "Conferencia Tech" creado', time: 'hace 5 min' },
    { icon: 'user-plus', message: 'Juan Pérez ha sido añadido al equipo', time: 'hace 30 min' },
    { icon: 'exclamation-triangle', message: 'Problema reportado en el Auditorio', time: 'hace 2 h' }
  ];

  constructor(
    public authService: AuthService,
    private layoutService: LayoutService
  ) {}

  ngOnInit(): void {
    this.layoutService.setActiveModule('dashboard');
  }

  getGradient(type: string): string {
    const gradients = {
      activeEvents: 'linear-gradient(135deg, #6a11cb, #2575fc)',
      contracts: 'linear-gradient(135deg, #8E2DE2, #4A00E0)',
      resources: 'linear-gradient(135deg, #11998E, #38EF7D)',
      staff: 'linear-gradient(135deg, #FDC830, #F37335)'
    };
    return gradients[type as keyof typeof gradients] || gradients.activeEvents;
  }

  filteredQuickActions(): any[] {
    return this.quickActions.filter(action =>
      !action.roles || this.authService.hasAnyRole(action.roles)
    );
  }

  getCurrentUsername(): string {
    const decodedToken = this.authService.decodeToken();
    return decodedToken?.username || 'Usuario';
  }

  getPrimaryRole(): string {
    const decodedToken = this.authService.decodeToken();
    return decodedToken?.role || 'guest';
  }

  getDailyMessage(): string {
  const messages = [
    "¡Hoy es un gran día para organizar eventos!",
    "Tu productividad hoy está al 100% 💪",
    "¿Qué evento planearemos hoy?",
    "¡Tu último evento fue un éxito! 🎉"
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
}