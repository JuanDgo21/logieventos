import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/notification';

interface NavItem {
  text: string;
  link: string;
  icon: string;
  exact?: boolean;
}

interface Notification {
  id: number;
  message: string;
  icon: string;
  time: Date;
  read: boolean;
}



@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent implements OnInit {
  currentUser: any = {};
  showNotifications = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    public notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    const userData = localStorage.getItem('user');
    this.currentUser = userData ? JSON.parse(userData) : {};
  }

  toggleNotifications(): void {
    this.notificationService.togglePanel();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-panel') && !target.closest('.notification-icon')) {
      this.notificationService.closePanel();
    }
  }
}