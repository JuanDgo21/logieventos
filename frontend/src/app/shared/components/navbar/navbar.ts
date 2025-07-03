import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../core/services/auth';
import { User } from '../../interfaces/user';
import { LayoutService } from '../../../core/services/layout';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent implements OnInit {
  user: any;
  isMenuOpen = false;
  notifications = [
    { icon: 'calendar-check', message: 'Evento confirmado', time: '10 min' },
    { icon: 'exclamation-circle', message: 'Alerta de recurso', time: '1 h' }
  ];

  constructor(
    public authService: AuthService,
    public layoutService: LayoutService
  ) {}

  ngOnInit(): void {
    this.user = {
      name: this.authService.getCurrentUsername() || 'Usuario',
      role: this.authService.getPrimaryRole() || 'guest'
    };
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout(): void {
    this.authService.logout();
  }
}

//subido 