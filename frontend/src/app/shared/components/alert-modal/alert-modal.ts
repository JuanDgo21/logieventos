import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface AlertData {
  title: string;
  message: string;
  type: 'create' | 'update' | 'delete' | 'auth';
  showReload?: boolean;
  userRole?: string;
}

@Component({
  selector: 'app-alert-modal',
  templateUrl: './alert-modal.html',
  styleUrls: ['./alert-modal.scss']
})
export class AlertModalComponent {
  constructor(
    public dialogRef: MatDialogRef<AlertModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlertData
  ) {}

  get bgColor(): string {
    switch(this.data.type) {
      case 'create': return 'bg-orange-500';
      case 'update': return 'bg-blue-500';
      case 'delete': return 'bg-red-500';
      case 'auth': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  redirectToLogin(): void {
    window.location.href = '/login';
  }
}