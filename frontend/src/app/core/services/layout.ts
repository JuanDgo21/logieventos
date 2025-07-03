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

  // Módulos por rol (rutas actualizadas)
  getModulesForRole(role: string): any[] {
    const modules = {
      admin: [
        { name: 'Dashboard', icon: 'tachometer-alt', path: 'pages/dashboard' },
        { name: 'Eventos', icon: 'calendar', path: 'pages/events' },
        { name: 'Personal', icon: 'users', path: 'pages/staff' },
        { name: 'Proveedores', icon: 'truck', path: 'pages/providers' },
        { name: 'Recursos', icon: 'box-open', path: 'pages/resources' },
        { name: 'Contratos', icon: 'file-contract', path: 'pages/contracts' },
        { name: 'Usuarios', icon: 'user-cog', path: 'pages/users' }
      ],
      coordinador: [
        { name: 'Dashboard', icon: 'tachometer-alt', path: 'pages/dashboard' },
        { name: 'Eventos', icon: 'calendar', path: 'pages/events' },
        { name: 'Personal', icon: 'users', path: 'pages/staff' },
        { name: 'Recursos', icon: 'box-open', path: 'pages/resources' },
        { name: 'Contratos', icon: 'file-contract', path: 'pages/contracts' }
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