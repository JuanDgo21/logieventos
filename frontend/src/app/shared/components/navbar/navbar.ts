import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../core/services/auth';

interface NavItem {
  text: string;
  link: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: false,
  // imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  @Input() userData: any;
  isMenuOpen = false;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}