import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface SocialLink {
  icon: string;
  url: string;
  class: string;
}

interface FooterLink {
  text: string;
  route: string;
}

interface Contact {
  icon: string;
  text: string;
}

interface LegalLink {
  text: string;
  route: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class FooterComponent {
  currentYear: number = new Date().getFullYear();
  
  socialLinks: SocialLink[] = [
    { icon: 'fab fa-facebook-f', url: '#', class: 'facebook' },
    { icon: 'fab fa-twitter', url: '#', class: 'twitter' },
    { icon: 'fab fa-linkedin-in', url: '#', class: 'linkedin' },
    { icon: 'fab fa-instagram', url: '#', class: 'instagram' },
    { icon: 'fab fa-youtube', url: '#', class: 'youtube' }
  ];
  
  footerLinks: FooterLink[] = [
    { text: 'Inicio', route: '/' },
    { text: 'Características', route: '/features' },
    { text: 'Precios', route: '/pricing' },
    { text: 'FAQ', route: '/faq' },
    { text: 'Contacto', route: '/contact' }
  ];
  
  modules: FooterLink[] = [
    { text: 'Gestión de Usuarios', route: '/modules/users' },
    { text: 'Calendario', route: '/modules/calendar' },
    { text: 'Inventario', route: '/modules/inventory' },
    { text: 'Personal', route: '/modules/staff' },
    { text: 'Reportes', route: '/modules/reports' }
  ];
  
  contacts: Contact[] = [
    { icon: 'fas fa-map-marker-alt', text: 'Av. Principal 123<br>Ciudad, País' },
    { icon: 'fas fa-phone', text: '+1 234 567 890' },
    { icon: 'fas fa-envelope', text: 'info@logieventos.com' },
    { icon: 'fas fa-clock', text: 'Lun-Vie: 9am-6pm' }
  ];
  
  legalLinks: LegalLink[] = [
    { text: 'Política de Privacidad', route: '/privacy' },
    { text: 'Términos de Servicio', route: '/terms' },
    { text: 'Cookies', route: '/cookies' }
  ];

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}