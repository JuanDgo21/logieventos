import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';

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
export class NavbarComponent  implements OnInit {
  isMenuCollapsed = true;
  isScrolled = false;
  
  navItems: NavItem[] = [
    { text: 'Inicio', link: '/', icon: 'fas fa-home', exact: true },
    { text: 'Características', link: '/features', icon: 'fas fa-star' },
    { text: 'Módulos', link: '/modules', icon: 'fas fa-cubes' },
    { text: 'Precios', link: '/pricing', icon: 'fas fa-tag' },
    { text: 'Contacto', link: '/contact', icon: 'fas fa-envelope' }
  ];

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  ngOnInit() {
    this.onWindowScroll();
  }

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  closeMenu() {
    this.isMenuCollapsed = true;
  }
}
