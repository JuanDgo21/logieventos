import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

interface Notification {
  icon: string;
  message: string;
  time: Date;
}

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
}) 
export class SidebarComponent implements OnInit {
  menuItems: any[] = [];
  showNotifications = false;
  notifications: Notification[] = [
    {
      icon: 'bell',
      message: 'Nuevo evento asignado',
      time: new Date()
    },
    {
      icon: 'exclamation-circle',
      message: 'Recordatorio: reunión hoy',
      time: new Date(Date.now() - 3600000)
    }
  ];

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.generateMenuBasedOnRole();
  }

  closeNotifications(): void {
    this.showNotifications = false;
  }

  private generateMenuBasedOnRole(): void {
    const role = this.authService.getPrimaryRole();
    
    if (!role) {
      this.menuItems = [];
      return;
    }
    
    const menuConfig: any = {
      admin: [
        { label: 'Gestión de Usuarios', icon: 'user-cog', route: '/users', submenu: [
          { label: 'Todos los Usuarios', route: '/users/list' },
          { label: 'Crear Usuario', route: '/users/create' },
          { label: 'Asignar Roles', route: '/users/roles' }
        ]},
        { label: 'Eventos', icon: 'calendar', route: '/events' },
        { label: 'Inventario', icon: 'box', route: '/inventory' },
        { label: 'Contratos', icon: 'file-contract', route: '/contracts' },
        { label: 'Reportes', icon: 'chart-bar', route: '/reports' }
      ],
      coordinador: [
        { label: 'Eventos', icon: 'calendar', route: '/events', submenu: [
          { label: 'Calendario', route: '/events/calendar' },
          { label: 'Crear Evento', route: '/events/create' },
          { label: 'Mis Eventos', route: '/events/my-events' }
        ]},
        { label: 'Personal', icon: 'users', route: '/personnel' },
        { label: 'Reportes', icon: 'chart-bar', route: '/reports' }
      ],
      lider: [
        { label: 'Mis Eventos', icon: 'calendar', route: '/my-events' },
        { label: 'Asistencia', icon: 'clipboard-check', route: '/attendance' },
        { label: 'Recursos', icon: 'box-open', route: '/assigned-resources' }
      ]
    };

    this.menuItems = menuConfig[role] || [];
  }
}