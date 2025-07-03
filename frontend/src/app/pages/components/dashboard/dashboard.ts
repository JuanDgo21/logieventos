import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  infoCards: any[] = [];
  quickActions: any[] = [];
  recentActivities: any[] = [];
  currentUser: any = {};
  
  // Propiedades para notificaciones
  unreadNotificationsCount: number = 0;

  constructor(
    public authService: AuthService,
    private router: Router,
    private notificationService: NotificationService 
  ) {}

  ngOnInit(): void {
    // Ejemplo: Añadir notificación de bienvenida
    if (this.authService.isLoggedIn()) {
      this.notificationService.addNotification({
        title: 'Bienvenido',
        message: `Has iniciado sesión como ${this.authService.getCurrentUsername()}`,
        type: 'info',
        icon: 'user'
      });
    }
  }

  private loadUserData(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  }

  private generateDashboardContent(): void {
    const role = this.authService.getPrimaryRole();
    
    // Tarjetas informativas
    this.infoCards = [
      { title: 'Eventos asignados', icon: 'calendar', value: '12', type: 'primary' },
      { title: 'Recursos disponibles', icon: 'box-open', value: '24', type: 'success' },
      { title: 'Alertas activas', icon: 'bell', value: '3', type: 'warning' }
    ];

    // Acciones rápidas
    this.quickActions = [
      { label: 'Ver agenda', icon: 'calendar-day', route: '/agenda', type: 'primary' }
    ];

    if (role === 'admin' || role === 'coordinador') {
      this.quickActions.push(
        { label: 'Crear evento', icon: 'plus-circle', route: '/events/new', type: 'success' }
      );
    }

    if (role === 'admin') {
      this.quickActions.push(
        { label: 'Generar reporte', icon: 'file-export', route: '/reports', type: 'primary' }
      );
    }

    // Actividad reciente
    this.recentActivities = [
      { message: 'Evento X programado para el 5 de julio', icon: 'calendar-plus', type: 'info', time: new Date() },
      { message: '3 asistentes faltaron al evento Z', icon: 'user-times', type: 'warning', time: new Date(Date.now() - 3600000) }
    ];
  }

  toggleNotifications(): void {
    this.notificationService.togglePanel();
  

  // Ejemplo de añadir notificación
  // this.notificationService.addNotification({
  //   title: 'Evento creado',
  //   message: 'El evento se ha creado correctamente',
  //   type: 'success',
  //   icon: 'check-circle'
  // });

  // // Ejemplo de marcar como leída
  // this.notificationService.markAsRead(notificationId);

  // // Suscribirse a cambios
  // this.notificationService.unreadCount$.subscribe(count => {
  //   console.log('Notificaciones no leídas:', count);
  // });
}
}