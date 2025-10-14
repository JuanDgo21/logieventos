import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarStateService } from '../../../core/services/sidebar-state';

@Component({
  selector: 'app-providers-page',
  standalone: false, // 👈 igual que tu compa
  templateUrl: './providers.html',
  styleUrls: ['./providers.scss']
})
export class ProvidersPageComponent {
  hoverState: string = '';

  constructor(private router: Router, public sidebarState: SidebarStateService) {}

  navigateTo(path: string): void {
    this.router.navigate([`/providers/${path}`]);
  }

  toggleHover(card: string): void {
    this.hoverState = card;
  }
}
