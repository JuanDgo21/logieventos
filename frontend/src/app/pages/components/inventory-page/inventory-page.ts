import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarStateService } from '../../../core/services/sidebar-state';

@Component({
  selector: 'app-inventory-page',
  standalone: false, // NOSONAR (typescript:S7648)
  // imports: [],
  templateUrl: './inventory-page.html',
  styleUrl: './inventory-page.scss'
})
export class InventoryPageComponent {
  hoverState: string = '';

  constructor(private router: Router, public sidebarState: SidebarStateService) {}

  navigateTo(path: string): void {
    this.router.navigate([`/inventory/${path}`]);
  }
  toggleHover(card: string): void {
    this.hoverState = card;
  }
}