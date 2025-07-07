import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';
import { ApiService } from './api';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private sidebarCollapsed = new BehaviorSubject<boolean>(false);
  private activeModule = new BehaviorSubject<string>('dashboard');
  private mobileView = new BehaviorSubject<boolean>(false);

  sidebarCollapsed$ = this.sidebarCollapsed.asObservable();
  activeModule$ = this.activeModule.asObservable();
  mobileView$ = this.mobileView.asObservable();

  constructor() {
    this.checkViewport();
    window.addEventListener('resize', () => this.checkViewport());
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.next(!this.sidebarCollapsed.value);
  }

  setActiveModule(module: string): void {
    this.activeModule.next(module);
    if (this.mobileView.value) {
      this.sidebarCollapsed.next(true);
    }
  }

  private checkViewport(): void {
    this.mobileView.next(window.innerWidth < 992);
    if (window.innerWidth < 992) {
      this.sidebarCollapsed.next(true);
    }
  }

  getModulesForRole(role: string): any[] {
    const modules = {
      admin: [
        { name: 'Dashboard', icon: 'tachometer-alt', path: 'pages/dashboard' },
        { name: 'Eventos', icon: 'calendar', path: 'pages/events' },
        { name: 'Personal', icon: 'users', path: '/pages/personal' ,
          children: [
            { name: 'Listado', icon: 'list', path: '/staff/list-staff' },
            { name: 'Listados', icon: 'list', path: '/staff/list-staff-type' }
          ]
        },
        { name: 'Proveedores', icon: 'truck', path: 'pages/providers' },
        { name: 'Recursos', icon: 'box-open', path: 'pages/resources' },
        { name: 'Contratos', icon: 'file-contract', path: 'contracts-page' },
        { name: 'Usuarios', icon: 'user-cog', path: '/pages/usuarios',
          children: [
            { name: 'Listado', icon: 'list', path: '/users/list' }
          ]
        }
      ],
      coordinador: [
        { name: 'Dashboard', icon: 'tachometer-alt', path: 'pages/dashboard' },
        { name: 'Eventos', icon: 'calendar', path: 'pages/events' },
        { name: 'Personal', icon: 'users', path: 'pages/staff' ,
          children: [
            { name: '', icon: '', path: '' }
          ]
        },
        { name: 'Recursos', icon: 'box-open', path: 'pages/resources' },
        { name: 'Contratos', icon: 'file-contract', path: 'contracts-page' }
      ],
      lider: [
        { name: 'Mis Eventos', icon: 'calendar-check', path: 'pages/my-events' },
        { name: 'Asistencia', icon: 'clipboard-list', path: 'pages/attendance' },
        { name: 'Recursos', icon: 'box-open', path: 'pages/resources' }
      ]
    };
    return modules[role as keyof typeof modules] || [];
  }
}