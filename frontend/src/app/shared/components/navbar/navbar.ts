import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../core/services/auth';
import { User } from '../../interfaces/user';
import { LayoutService } from '../../../core/services/layout';
import { DecodedToken } from '../../interfaces/auth';
import { UserService } from '../../../core/services/user';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  decodedToken: DecodedToken | null = null;
  isMenuOpen = false;

  notifications = [
    { icon: 'calendar-check', message: 'Evento confirmado', time: '10 min' },
    { icon: 'exclamation-circle', message: 'Alerta de recurso', time: '1 h' }
  ];

  constructor(
    public authService: AuthService,
    private userService: UserService,
    public layoutService: LayoutService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.decodedToken = this.authService.decodeToken();
    console.log('[Navbar] Token decodificado:', this.decodedToken);

    if (this.decodedToken?.id) {
      this.userService.getUserById(this.decodedToken.id).subscribe({
        next: user => {
          console.log('[Navbar] Usuario obtenido:', user);
          this.currentUser = user;
        },
        error: err => {
          console.error('[Navbar] Error cargando usuario:', err);
          this.currentUser = null;
        }
      });
    } else {
      console.warn('[Navbar] No se encontró ID en token');
    }
  }


  get displayName(): string {
    return this.currentUser?.fullname ||
           this.currentUser?.username ||
           this.decodedToken?.username ||
           this.decodedToken?.email?.split('@')[0] ||
           'Usuario';
  }

  get userRole(): string {
    return this.decodedToken?.role || 'Invitado';
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  
}