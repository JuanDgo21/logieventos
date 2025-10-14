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
        { name: 'Dashboard', icon: 'tachometer-alt', path: 'principal' },
        { name: 'Eventos', icon: 'calendar', path: 'events-page' },
        { name: 'Personal', icon: 'users-cog', 
          path: '/pages/personal', // Ruta padre
          children: [
            { name: 'Dashboard', icon: 'tachometer-alt', path: '/pages/personal' }, //Ruta hija
            { name: 'Tipos de Personal', icon: 'tags', path: '/staff/personnel-types' },
            { name: 'Listado de Personal', icon: 'id-badge', path: '/staff/personnel' }
          ]
        },
         { name: 'Proveedor', icon: 'users-cog', 
          path: 'home-providers', // Ruta padre
        },
        { name: 'Recursos', icon: 'box-open', path: 'inventory-page' },
        { name: 'Contratos', icon: 'file-contract', path: 'contracts-page' },
        
        { 
          name: 'Usuarios', 
          icon: 'users', 
          path: '/pages/users', // Esta es la ruta padre
          children: [
            { name: 'Dashboard', icon: 'tachometer-alt', path: '/pages/usuarios' }, // Ruta hija
            { name: 'Lista de Usuarios', icon: 'list', path: '/users/list' },
          ]
        }

      ],
      coordinador: [
        { name: 'Dashboard', icon: 'tachometer-alt', path: '/pages/principal' },
        { name: 'Eventos', icon: 'calendar', path: 'events-page' },
        { name: 'Personal', icon: 'users-cog', 
          path: '/pages/personal', // Ruta padre
          children: [
            { name: 'Dashboard', icon: 'tachometer-alt', path: '/pages/personal' }, //Ruta hija
            { name: 'Listado de Personal', icon: 'id-badge', path: '/staff/personnel' }
          ]
        },
        { name: 'Recursos', icon: 'box-open', path: 'inventory-page' },
        { name: 'Contratos', icon: 'file-contract', path: 'contracts-page' }
      ],
      lider: [
        { name: 'Eventos', icon: 'calendar', path: 'events-page' },
        { name: 'Personal', icon: 'users-cog', 
          path: '/pages/personal', // Ruta padre
          children: [
            { name: 'Dashboard', icon: 'tachometer-alt', path: '/pages/personal' }, //Ruta hija
            { name: 'Listado de Personal', icon: 'id-badge', path: '/staff/personnel' }
          ]
        },
        { name: 'Asistencia', icon: 'clipboard-list', path: 'pages/attendance' },
        { name: 'Recursos', icon: 'box-open', path: '/inventory-page' }
      ]
    };
    return modules[role as keyof typeof modules] || [];
  }
}