import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AlertModalComponent } from '../../shared/components/alert-modal/alert-modal';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  constructor(
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  showError(options: {
    type: 'create' | 'update' | 'delete' | 'auth';
    message: string;
    title?: string;
  }): void {
    //const userRole = this.authService.getPrimaryRole();
    const isTokenExpired = this.authService.isTokenExpired();
    
    const data = {
      title: options.title || this.getDefaultTitle(options.type),
      message: options.message,
      type: options.type,
      //userRole: userRole,
      showReload: isTokenExpired
    };

    this.dialog.open(AlertModalComponent, {
      width: '500px',
      disableClose: true,
      data: data
    });
  }

  private getDefaultTitle(type: string): string {
    switch(type) {
      case 'create': return 'Error al crear';
      case 'update': return 'Error al actualizar';
      case 'delete': return 'Error al eliminar';
      case 'auth': return 'Error de autenticación';
      default: return 'Error';
    }
  }
}